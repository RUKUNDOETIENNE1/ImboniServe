import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { SecurityEventService } from '@/lib/services/security-event.service'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/reset-password
 * Resets user password using a valid reset token
 * Rate limited to 5 requests per 10 minutes
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { email, token, newPassword } = req.body

  // Validate inputs
  if (!email || !token || !newPassword) {
    return res.status(400).json(errorResponse('Email, token, and new password are required'))
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json(errorResponse('Password must be at least 8 characters long'))
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Hash the token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  // Find the reset token
  const resetToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: `password-reset:${normalizedEmail}`,
        token: hashedToken,
      },
    },
  })

  if (!resetToken) {
    return res.status(400).json(errorResponse('Invalid or expired reset token'))
  }

  // Check if token has expired
  if (resetToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `password-reset:${normalizedEmail}`,
          token: hashedToken,
        },
      },
    })
    return res.status(400).json(errorResponse('Reset token has expired. Please request a new one.'))
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, isActive: true },
  })

  if (!user || !user.isActive) {
    return res.status(400).json(errorResponse('User not found or inactive'))
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update password and delete reset token in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `password-reset:${normalizedEmail}`,
          token: hashedToken,
        },
      },
    }),
    // Revoke all existing sessions for security
    prisma.session.deleteMany({
      where: { userId: user.id },
    }),
  ])

  // Log security event
  await SecurityEventService.log({
    userId: user.id,
    eventType: 'LOGIN_SUCCESS', // We'll use this for password reset
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    metadata: { action: 'password_reset' },
  })

  return res.status(200).json(
    successResponse({
      message: 'Password reset successful. Please log in with your new password.',
    })
  )
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
})
