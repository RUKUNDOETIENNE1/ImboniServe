import NextAuth, { type NextAuthOptions, type Session, type User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import type { JWT } from 'next-auth/jwt'

import { prisma } from '@/lib/prisma'
import { AuthOTPService } from '@/lib/services/auth-otp.service'
import { SecurityEventService } from '@/lib/services/security-event.service'
import { logAuthDebug, redactedEmail } from '@/lib/utils/auth-debug'

type AppUser = User & { roles: string[]; role?: string; businessId: string | null; debugRequestId?: string | null }
type AppJWT = JWT & { roles?: string[]; role?: string; businessId?: string | null; debugRequestId?: string | null }
type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null } }

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60,  // Refresh token every hour
  },
  providers: (() => {
    const providers: any[] = [
    /**
     * MFA Provider — Step 2: confirmToken flow
     * Called after OTP verification with { email, confirmToken }.
     */
    CredentialsProvider({
      id: 'mfa-confirm',
      name: 'MFA Confirm',
      credentials: {
        email: { label: 'Email', type: 'email' },
        confirmToken: { label: 'Confirm Token', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const confirmToken = credentials?.confirmToken
        const requestId = (credentials as any)?.debugRequestId ?? null

        logAuthDebug(requestId, 'nextauth_authorize_start', 'start', {
          provider: 'mfa-confirm',
          email: redactedEmail(email),
        })

        if (!email || !confirmToken) {
          logAuthDebug(requestId, 'nextauth_authorize_start', 'fail', { reason: 'missing_credentials' })
          return null
        }

        // Consume the one-time confirm token issued after OTP verification
        const userId = await AuthOTPService.consumeConfirmToken(confirmToken, { requestId })
        if (!userId) {
          logAuthDebug(requestId, 'nextauth_confirm_token', 'fail', { reason: 'token_invalid' })
          return null
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, roles: true, businessId: true, isActive: true },
        })

        if (!user || !user.isActive || user.email !== email) {
          logAuthDebug(requestId, 'nextauth_authorize_user_check', 'fail', {
            userFound: !!user,
            isActive: user?.isActive ?? false,
            emailMatch: user?.email === email,
          })
          return null
        }

        logAuthDebug(requestId, 'nextauth_authorize_user_check', 'success', {
          userId: user.id,
        })

        await SecurityEventService.log({ userId: user.id, eventType: 'LOGIN_SUCCESS', metadata: { via: 'mfa_confirm' } })

        const roles = (user.roles as string[]) || []
        const authUser: AppUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          role: roles[0],
          businessId: user.businessId ?? null,
          debugRequestId: requestId,
        }
        logAuthDebug(requestId, 'nextauth_authorize_complete', 'success', { userId: user.id })
        return authUser
      },
    })
    ]

    // Enable legacy credentials only when explicitly allowed and not in production
    if (process.env.ALLOW_LEGACY_CREDENTIALS === 'true' && process.env.NODE_ENV !== 'production') {
      providers.push(
        CredentialsProvider({
          id: 'credentials',
          name: 'Credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          async authorize(credentials) {
            const email = credentials?.email?.toLowerCase().trim()
            const password = credentials?.password

            if (!email || !password) return null

            const user = await prisma.user.findUnique({
              where: { email },
            })

            if (!user || !user.isActive) return null

            const ok = await bcrypt.compare(password, user.password)
            if (!ok) return null

            const roles = (user as any).roles || []
            const primaryRole = roles && roles.length > 0 ? roles[0] : undefined
            const authUser: AppUser = {
              id: user.id,
              name: user.name,
              email: user.email,
              roles,
              role: primaryRole,
              businessId: (user as any).businessId ?? null,
            }

            return authUser
          },
        })
      )
    }
    return providers
  })(),
  callbacks: {
    async jwt({ token, user }): Promise<AppJWT> {
      const t = token as AppJWT
      if (user) {
        const u = user as AppUser
        t.sub = u.id
        t.roles = u.roles
        t.role = u.role
        t.businessId = u.businessId
        t.debugRequestId = u.debugRequestId ?? t.debugRequestId ?? null
        logAuthDebug(t.debugRequestId, 'nextauth_jwt_callback', 'success', { userId: u.id })
      }
      return t
    },
    async session({ session, token }): Promise<AppSession> {
      const s = session as AppSession
      const t = token as AppJWT
      if (s.user) {
        ;(s.user as any).id = t.sub
        s.user.roles = t.roles
        s.user.role = t.role // backward-compat
        s.user.businessId = t.businessId
        logAuthDebug(t.debugRequestId, 'nextauth_session_callback', 'success', { userId: t.sub })
      }
      return s
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect admins to /admin, others to /dashboard
      if (url === baseUrl || url.startsWith(baseUrl)) {
        logAuthDebug(null, 'nextauth_redirect', 'success', { destination: baseUrl + '/dashboard' })
        return baseUrl + '/dashboard'
      }
      // Allow callback URLs
      if (url.startsWith(baseUrl)) {
        logAuthDebug(null, 'nextauth_redirect', 'success', { destination: url })
        return url
      }
      logAuthDebug(null, 'nextauth_redirect', 'success', { destination: baseUrl + '/dashboard', reason: 'fallback' })
      return baseUrl + '/dashboard'
    },
  },
  pages: {
    signIn: '/login',
  },
  logger: {
    error: (...args) => console.error('[next-auth][error]', ...args),
    warn: (...args) => console.warn('[next-auth][warn]', ...args),
    debug: (...args) => console.debug('[next-auth][debug]', ...args),
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd) {
      if (!secret) {
        throw new Error('NEXTAUTH_SECRET is required but not set in environment variables')
      }
      if (secret.length < 32) {
        throw new Error('NEXTAUTH_SECRET must be at least 32 characters long for security')
      }
      return secret
    }
    if (secret && secret.length >= 32) return secret
    return 'dev-secret-placeholder-value-with-min-length-xxxxxxxxxxxxxxxx'
  })(),
}

export default NextAuth(authOptions)

export const config = {
  runtime: 'nodejs',
}
