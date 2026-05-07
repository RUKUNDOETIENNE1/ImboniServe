import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/email.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import crypto from 'crypto'

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email with a secure token
 * Rate limited to 3 requests per 15 minutes per email
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json(errorResponse('Email is required'))
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, isActive: true },
  })

  // Always return success to prevent email enumeration attacks
  // But only send email if user exists and is active
  if (user && user.isActive) {
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${user.email}`,
      },
    })

    // Create new reset token
    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${user.email}`,
        token: hashedToken,
        expires: expiresAt,
      },
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`

    try {
      await EmailService.sendPasswordReset(user.email, user.name, resetUrl)
    } catch (error) {
      console.error('[ForgotPassword] Failed to send email:', error)
      // Don't expose email sending errors to user
    }
  }

  // Always return success (security best practice)
  return res.status(200).json(
    successResponse({
      message: 'If an account exists with that email, a password reset link has been sent.',
    })
  )
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
})
