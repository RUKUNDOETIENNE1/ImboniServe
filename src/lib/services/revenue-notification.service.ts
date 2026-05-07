import nodemailer from 'nodemailer'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from './whatsapp.service'

/**
 * Revenue Operations Notification Service
 * Handles email and WhatsApp notifications for marketers and admins
 */

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured - emails will be logged only')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export class RevenueNotificationService {
  private static from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.rw>'

  /**
   * Send welcome email to new marketer
   */
  static async sendMarketerWelcome(params: {
    email: string
    name: string
    referralCode: string
    referralLink: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#1e40af;margin:0 0 8px;">Welcome to Imboni Marketer Program! 🎉</h1>
          <p style="color:#64748b;margin:0;">Start earning commissions today</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Your marketer account has been created! You can now start referring restaurants and earning commissions.</p>
          
          <div style="background:#dbeafe;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #1e40af;">
            <p style="color:#1e40af;margin:0 0 8px;font-weight:bold;">Your Referral Code</p>
            <p style="color:#1e293b;margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;">${params.referralCode}</p>
          </div>

          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#64748b;margin:0 0 8px;font-size:14px;">Your Referral Link</p>
            <p style="color:#1e293b;margin:0;font-size:14px;word-break:break-all;">${params.referralLink}</p>
          </div>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">💰 Commission Structure</h3>
          <ul style="color:#475569;line-height:1.8;padding-left:20px;">
            <li><strong>Signup Bonus:</strong> 50,000 RWF when a restaurant signs up</li>
            <li><strong>Recurring Commission:</strong> 15% of their subscription for 12 months</li>
            <li><strong>Validation Period:</strong> 7 days before funds become available</li>
          </ul>

          <h3 style="color:#1e3a5f;margin:24px 0 16px;font-size:16px;">🚀 Getting Started</h3>
          <ol style="color:#475569;line-height:1.8;padding-left:20px;">
            <li>Share your referral link with restaurant owners</li>
            <li>When they sign up, you earn a 50,000 RWF bonus</li>
            <li>Track your earnings in the marketer dashboard</li>
            <li>Request payouts when your balance reaches 10,000 RWF</li>
          </ol>

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/marketer" style="display:inline-block;background:#1e40af;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Dashboard</a>
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Need help? Contact us at support@imboni.rw</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: '🎉 Welcome to Imboni Marketer Program',
        html
      })

      logger.info('Marketer welcome email sent', { email: params.email })
      
      // Send WhatsApp notification (async, don't block)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendMarketerWelcome({
          phone: marketer.phone,
          name: params.name,
          referralCode: params.referralCode,
          referralLink: params.referralLink
        }).catch(err => logger.error('Failed to send welcome WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send marketer welcome email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send commission earned notification
   */
  static async sendCommissionEarned(params: {
    email: string
    name: string
    amountCents: number
    type: string
    businessName: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()
    const typeLabel = params.type === 'SIGNUP_BONUS' ? 'Signup Bonus' : 'Recurring Commission'

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#10b981;margin:0 0 8px;">💰 Commission Earned!</h1>
          <p style="color:#64748b;margin:0;">You've earned a new commission</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Great news! You've earned a commission from <strong>${params.businessName}</strong>.</p>
          
          <div style="background:#d1fae5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;border-left:4px solid #10b981;">
            <p style="color:#065f46;margin:0 0 8px;font-size:14px;font-weight:bold;">${typeLabel}</p>
            <p style="color:#047857;margin:0;font-size:36px;font-weight:bold;">${amount} RWF</p>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #f59e0b;">
            <p style="color:#92400e;margin:0;font-size:14px;">
              ⏳ <strong>Validation Period:</strong> This commission will be available for payout in 7 days after validation.
            </p>
          </div>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">📊 Your Earnings</h3>
          <p style="color:#475569;margin:0 0 16px;">Check your dashboard to see your total earnings and request payouts.</p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/marketer" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Keep referring to earn more! 🚀</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `💰 Commission Earned: ${amount} RWF`,
        html
      })

      logger.info('Commission earned email sent', { email: params.email, amountCents: params.amountCents })
      
      // Send WhatsApp notification (async)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendCommissionEarned({
          phone: marketer.phone,
          name: params.name,
          amountCents: params.amountCents,
          type: params.type,
          businessName: params.businessName
        }).catch(err => logger.error('Failed to send commission WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send commission earned email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout requested notification (to marketer)
   */
  static async sendPayoutRequested(params: {
    email: string
    name: string
    amountCents: number
    method: string
    payoutId: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#1e40af;margin:0 0 8px;">Payout Request Received</h1>
          <p style="color:#64748b;margin:0;">Your request is being reviewed</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">We've received your payout request and it's now pending admin approval.</p>
          
          <div style="background:#dbeafe;border-radius:8px;padding:20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#64748b;">Amount:</span>
              <strong style="color:#1e293b;font-size:18px;">${amount} RWF</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#64748b;">Method:</span>
              <strong style="color:#1e293b;">${params.method.replace(/_/g, ' ')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">Payout ID:</span>
              <strong style="color:#1e293b;font-size:12px;">${params.payoutId.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #f59e0b;">
            <p style="color:#92400e;margin:0;font-size:14px;">
              ⏳ <strong>Review Time:</strong> Payouts are typically reviewed within 24 hours.
            </p>
          </div>

          <p style="color:#475569;margin:0;">We'll notify you once your payout has been approved and processed.</p>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Questions? Contact us at support@imboni.rw</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `Payout Request: ${amount} RWF - Pending Approval`,
        html
      })

      logger.info('Payout requested email sent', { email: params.email, payoutId: params.payoutId })
      
      // Send WhatsApp notification (async)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendPayoutStatus({
          phone: marketer.phone,
          name: params.name,
          status: 'REQUESTED',
          amountCents: params.amountCents
        }).catch(err => logger.error('Failed to send payout requested WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send payout requested email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout approved notification
   */
  static async sendPayoutApproved(params: {
    email: string
    name: string
    amountCents: number
    method: string
    payoutId: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#10b981;margin:0 0 8px;">✅ Payout Approved!</h1>
          <p style="color:#64748b;margin:0;">Your payout is being processed</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Great news! Your payout request has been approved and is now being processed.</p>
          
          <div style="background:#d1fae5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;border-left:4px solid #10b981;">
            <p style="color:#065f46;margin:0 0 8px;font-size:14px;font-weight:bold;">Approved Amount</p>
            <p style="color:#047857;margin:0;font-size:36px;font-weight:bold;">${amount} RWF</p>
          </div>

          <div style="background:#dbeafe;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;">Payment Method:</span>
              <strong style="color:#1e293b;">${params.method.replace(/_/g, ' ')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">Payout ID:</span>
              <strong style="color:#1e293b;font-size:12px;">${params.payoutId.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #f59e0b;">
            <p style="color:#92400e;margin:0;font-size:14px;">
              ⏳ <strong>Processing Time:</strong> Funds will be transferred within 1-2 business days.
            </p>
          </div>

          <p style="color:#475569;margin:0;">You'll receive another notification once the payment has been completed.</p>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Thank you for being part of Imboni! 🎉</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `✅ Payout Approved: ${amount} RWF`,
        html
      })

      logger.info('Payout approved email sent', { email: params.email, payoutId: params.payoutId })
      
      // Send WhatsApp notification (async)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendPayoutStatus({
          phone: marketer.phone,
          name: params.name,
          status: 'APPROVED',
          amountCents: params.amountCents
        }).catch(err => logger.error('Failed to send payout approved WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send payout approved email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout rejected notification
   */
  static async sendPayoutRejected(params: {
    email: string
    name: string
    amountCents: number
    reason: string
    payoutId: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#ef4444;margin:0 0 8px;">Payout Request Declined</h1>
          <p style="color:#64748b;margin:0;">Your funds have been restored</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Unfortunately, your payout request could not be approved at this time.</p>
          
          <div style="background:#fee2e2;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
            <p style="color:#991b1b;margin:0 0 8px;font-weight:bold;">Reason for Rejection:</p>
            <p style="color:#7f1d1d;margin:0;">${params.reason}</p>
          </div>

          <div style="background:#dbeafe;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;">Amount:</span>
              <strong style="color:#1e293b;">${amount} RWF</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">Payout ID:</span>
              <strong style="color:#1e293b;font-size:12px;">${params.payoutId.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <div style="background:#d1fae5;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #10b981;">
            <p style="color:#065f46;margin:0;font-size:14px;">
              ✅ <strong>Funds Restored:</strong> The ${amount} RWF has been returned to your available balance.
            </p>
          </div>

          <p style="color:#475569;margin:0 0 16px;">If you have questions about this rejection, please contact our support team.</p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/marketer" style="display:inline-block;background:#1e40af;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Need help? Contact us at support@imboni.rw</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `Payout Request Declined - ${amount} RWF`,
        html
      })

      logger.info('Payout rejected email sent', { email: params.email, payoutId: params.payoutId })
      
      // Send WhatsApp notification (async)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendPayoutStatus({
          phone: marketer.phone,
          name: params.name,
          status: 'REJECTED',
          amountCents: params.amountCents,
          reason: params.reason
        }).catch(err => logger.error('Failed to send payout rejected WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send payout rejected email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout completed notification
   */
  static async sendPayoutCompleted(params: {
    email: string
    name: string
    amountCents: number
    method: string
    payoutId: string
    transactionId?: string
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#10b981;margin:0 0 8px;">🎉 Payment Sent!</h1>
          <p style="color:#64748b;margin:0;">Your payout has been completed</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Your payout has been successfully processed! The funds should arrive in your account shortly.</p>
          
          <div style="background:#d1fae5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;border-left:4px solid #10b981;">
            <p style="color:#065f46;margin:0 0 8px;font-size:14px;font-weight:bold;">Amount Paid</p>
            <p style="color:#047857;margin:0;font-size:36px;font-weight:bold;">${amount} RWF</p>
          </div>

          <div style="background:#dbeafe;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;">Payment Method:</span>
              <strong style="color:#1e293b;">${params.method.replace(/_/g, ' ')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;">Payout ID:</span>
              <strong style="color:#1e293b;font-size:12px;">${params.payoutId.slice(0, 8).toUpperCase()}</strong>
            </div>
            ${params.transactionId ? `
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">Transaction ID:</span>
              <strong style="color:#1e293b;font-size:12px;">${params.transactionId}</strong>
            </div>
            ` : ''}
          </div>

          <p style="color:#475569;margin:0 0 16px;">Keep up the great work! Continue referring restaurants to earn more commissions.</p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/marketer" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Thank you for being part of Imboni! 🚀</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `🎉 Payment Sent: ${amount} RWF`,
        html
      })

      logger.info('Payout completed email sent', { email: params.email, payoutId: params.payoutId })
      
      // Send WhatsApp notification (async)
      const marketer = await prisma.professionalMarketer.findFirst({ where: { email: params.email } })
      if (marketer?.phone) {
        WhatsAppService.sendPayoutStatus({
          phone: marketer.phone,
          name: params.name,
          status: 'PAID',
          amountCents: params.amountCents
        }).catch(err => logger.error('Failed to send payout completed WhatsApp', { error: err }))
      }
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send payout completed email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send weekly earnings summary
   */
  static async sendWeeklySummary(params: {
    email: string
    name: string
    weekStart: Date
    weekEnd: Date
    commissionsEarned: number
    commissionsCount: number
    payoutsReceived: number
    payoutsCount: number
    newBusinesses: number
    availableBalance: number
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const weekRange = `${params.weekStart.toLocaleDateString()} - ${params.weekEnd.toLocaleDateString()}`
    const commissionsAmount = (params.commissionsEarned / 100).toLocaleString()
    const payoutsAmount = (params.payoutsReceived / 100).toLocaleString()
    const availableAmount = (params.availableBalance / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#1e40af;margin:0 0 8px;">📊 Weekly Summary</h1>
          <p style="color:#64748b;margin:0;">${weekRange}</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Here's your weekly performance summary:</p>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
            <div style="background:#d1fae5;border-radius:8px;padding:16px;text-align:center;">
              <p style="color:#065f46;margin:0 0 4px;font-size:12px;font-weight:bold;">Commissions Earned</p>
              <p style="color:#047857;margin:0;font-size:24px;font-weight:bold;">${commissionsAmount} RWF</p>
              <p style="color:#059669;margin:4px 0 0;font-size:12px;">${params.commissionsCount} commissions</p>
            </div>
            
            <div style="background:#dbeafe;border-radius:8px;padding:16px;text-align:center;">
              <p style="color:#1e40af;margin:0 0 4px;font-size:12px;font-weight:bold;">Payouts Received</p>
              <p style="color:#1e3a8a;margin:0;font-size:24px;font-weight:bold;">${payoutsAmount} RWF</p>
              <p style="color:#1e40af;margin:4px 0 0;font-size:12px;">${params.payoutsCount} payouts</p>
            </div>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <p style="color:#92400e;margin:0 0 4px;font-size:12px;font-weight:bold;">New Businesses Referred</p>
            <p style="color:#78350f;margin:0;font-size:32px;font-weight:bold;">${params.newBusinesses}</p>
          </div>

          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">Available Balance:</span>
              <strong style="color:#1e293b;font-size:18px;">${availableAmount} RWF</strong>
            </div>
          </div>

          ${params.availableBalance >= 1000000 ? `
          <div style="background:#d1fae5;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #10b981;">
            <p style="color:#065f46;margin:0;font-size:14px;">
              ✅ You can request a payout! Your balance is above the 10,000 RWF minimum.
            </p>
          </div>
          ` : ''}

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/marketer" style="display:inline-block;background:#1e40af;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Full Dashboard</a>
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:14px;">
          <p>Keep up the great work! 🚀</p>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.email,
        subject: `📊 Weekly Summary: ${commissionsAmount} RWF Earned`,
        html
      })

      logger.info('Weekly summary email sent', { email: params.email })
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send weekly summary email', { error, email: params.email })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send admin alert for high-risk payout
   */
  static async sendAdminRiskAlert(params: {
    adminEmail: string
    marketerId: string
    marketerName: string
    payoutId: string
    amountCents: number
    riskScore: number
    riskLevel: string
    flags: string[]
  }): Promise<{ success: boolean; error?: string }> {
    const transport = createTransport()
    if (!transport) {
      logger.info('Email not sent (SMTP not configured)', params)
      return { success: true }
    }

    const amount = (params.amountCents / 100).toLocaleString()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#ef4444;margin:0 0 8px;">⚠️ High-Risk Payout Alert</h1>
          <p style="color:#64748b;margin:0;">Immediate review required</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <div style="background:#fee2e2;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
            <p style="color:#991b1b;margin:0 0 8px;font-weight:bold;">Risk Level: ${params.riskLevel}</p>
            <p style="color:#7f1d1d;margin:0;font-size:24px;font-weight:bold;">Risk Score: ${params.riskScore}/100</p>
          </div>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">Payout Details</h3>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="margin-bottom:8px;">
              <span style="color:#64748b;">Marketer:</span>
              <strong style="color:#1e293b;"> ${params.marketerName}</strong>
            </div>
            <div style="margin-bottom:8px;">
              <span style="color:#64748b;">Amount:</span>
              <strong style="color:#1e293b;"> ${amount} RWF</strong>
            </div>
            <div style="margin-bottom:8px;">
              <span style="color:#64748b;">Payout ID:</span>
              <strong style="color:#1e293b;"> ${params.payoutId.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">Risk Flags</h3>
          <ul style="color:#475569;line-height:1.8;padding-left:20px;">
            ${params.flags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>

          <div style="text-align:center;margin-top:32px;">
            <a href="${process.env.NEXTAUTH_URL}/admin/payout-control" style="display:inline-block;background:#ef4444;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Payout</a>
          </div>
        </div>
      </div>
    `

    try {
      await transport.sendMail({
        from: this.from,
        to: params.adminEmail,
        subject: `⚠️ HIGH RISK: Payout ${params.payoutId.slice(0, 8)} - ${amount} RWF`,
        html
      })

      logger.info('Admin risk alert email sent', { adminEmail: params.adminEmail, payoutId: params.payoutId })
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to send admin risk alert email', { error, adminEmail: params.adminEmail })
      return { success: false, error: error.message }
    }
  }
}
