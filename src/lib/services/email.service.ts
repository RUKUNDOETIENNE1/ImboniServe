/**
 * Email Service — SMTP-based transactional email
 * Used for MFA OTPs, invoice delivery, and security notifications.
 * Reads SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM from env.
 */

import nodemailer from 'nodemailer'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

  if (!host || !user || !pass) {
    console.warn('[EmailService] SMTP not configured — emails will be logged only')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

interface OrderItem {
  productName: string
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

interface OrderConfirmationOpts {
  to: string
  customerName: string
  orderId: string
  supplierName: string
  items: OrderItem[]
  totalCents: number
  deliveryAddress: string
  deliveryPhone: string
  paymentMethod: string
}

export class EmailService {
  static async sendOrderConfirmation(opts: OrderConfirmationOpts): Promise<{ success: boolean; error?: string }> {
    const { to, customerName, orderId, supplierName, items, totalCents, deliveryAddress, deliveryPhone, paymentMethod } = opts
    const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

    const subject = `Order Confirmation #${orderId.slice(0, 8).toUpperCase()} - Imboni Serve`
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;color:#1e293b;">${item.productName}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;color:#64748b;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;color:#1e293b;text-align:right;">${(item.subtotalCents / 100).toLocaleString()} RWF</td>
      </tr>
    `).join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#1e3a5f;margin:0 0 8px;">Order Confirmed!</h1>
          <p style="color:#64748b;margin:0;">Thank you for your order</p>
        </div>
        
        <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${customerName}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Your order has been confirmed and will be processed by <strong>${supplierName}</strong>.</p>
          
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#64748b;margin:0 0 4px;font-size:14px;">Order ID</p>
            <p style="color:#1e293b;margin:0;font-size:18px;font-weight:bold;">#${orderId.slice(0, 8).toUpperCase()}</p>
          </div>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">Order Items</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px 8px;text-align:left;color:#64748b;font-size:14px;border-bottom:2px solid #e2e8f0;">Product</th>
                <th style="padding:12px 8px;text-align:center;color:#64748b;font-size:14px;border-bottom:2px solid #e2e8f0;">Qty</th>
                <th style="padding:12px 8px;text-align:right;color:#64748b;font-size:14px;border-bottom:2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:16px 8px 0;text-align:right;color:#1e293b;font-weight:bold;font-size:16px;">Total</td>
                <td style="padding:16px 8px 0;text-align:right;color:#f97316;font-weight:bold;font-size:18px;">${(totalCents / 100).toLocaleString()} RWF</td>
              </tr>
            </tfoot>
          </table>

          <h3 style="color:#1e3a5f;margin:0 0 16px;font-size:16px;">Delivery Details</h3>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="color:#64748b;margin:0 0 8px;font-size:14px;">📍 Address</p>
            <p style="color:#1e293b;margin:0 0 16px;">${deliveryAddress}</p>
            <p style="color:#64748b;margin:0 0 8px;font-size:14px;">📞 Phone</p>
            <p style="color:#1e293b;margin:0 0 16px;">${deliveryPhone}</p>
            <p style="color:#64748b;margin:0 0 8px;font-size:14px;">💳 Payment Method</p>
            <p style="color:#1e293b;margin:0;">${paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash on Delivery'}</p>
          </div>
        </div>

        <div style="background:#dbeafe;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="color:#1e40af;margin:0;font-size:14px;"><strong>What's Next?</strong></p>
          <ol style="color:#1e40af;margin:8px 0 0;padding-left:20px;font-size:14px;">
            <li>The supplier will review and confirm your order</li>
            <li>You'll receive SMS updates on order status</li>
            <li>Delivery will be made to your specified address</li>
            <li>Payment will be collected upon delivery</li>
          </ol>
        </div>

        <div style="text-align:center;color:#64748b;font-size:12px;">
          <p style="margin:0 0 8px;">Questions? Contact us at support@imboni.serve</p>
          <p style="margin:0;">© 2026 Imboni Serve. All rights reserved.</p>
        </div>
      </div>
    `

    const transport = createTransport()
    if (!transport) {
      console.log('[EmailService] Order confirmation email (SMTP not configured):', { to, orderId })
      return { success: true }
    }

    try {
      await transport.sendMail({ from, to, subject, html })
      console.log('[EmailService] Order confirmation sent:', { to, orderId })
      return { success: true }
    } catch (err: any) {
      console.error('[EmailService] Order confirmation failed:', err.message)
      return { success: false, error: err.message }
    }
  }

  static async sendLoginOTP(opts: {
    to: string
    name: string
    otp: string
    ip?: string
    expiresMinutes?: number
  }): Promise<{ success: boolean; error?: string }> {
    const { to, name, otp, ip, expiresMinutes = 10 } = opts
    const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

    const subject = `Your Imboni Serve Login Code: ${otp}`
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#1e3a5f;margin:0;">Imboni Serve</h2>
          <p style="color:#64748b;margin:4px 0 0;">Secure Login Verification</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color:#475569;margin:0 0 24px;">Your one-time login code is:</p>
          <div style="text-align:center;background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e3a5f;">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 8px;">⏱ This code expires in <strong>${expiresMinutes} minutes</strong>.</p>
          ${ip ? `<p style="color:#64748b;font-size:13px;margin:0 0 8px;">📍 Login request from IP: <code>${ip}</code></p>` : ''}
          <p style="color:#ef4444;font-size:13px;margin:16px 0 0;padding:12px;background:#fef2f2;border-radius:6px;">
            🔒 Never share this code. Imboni Serve staff will never ask for it.
          </p>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
          If you did not request this, your account may be under attack — 
          <a href="${process.env.APP_URL}/dashboard/security" style="color:#3b82f6;">review your security settings</a>.
        </p>
      </div>
    `

    const text = `Your Imboni Serve login code is: ${otp}\n\nExpires in ${expiresMinutes} minutes.\n\nDo NOT share this code with anyone.`

    const transport = createTransport()
    if (!transport) {
      console.info(`[EmailService] OTP for ${to}: ${otp}`)
      return { success: true }
    }

    try {
      await transport.sendMail({ from, to, subject, html, text })
      return { success: true }
    } catch (err: any) {
      console.error('[EmailService] sendLoginOTP failed:', err?.message)
      return { success: false, error: err?.message }
    }
  }

  static async sendSecurityAlert(opts: {
    to: string
    name: string
    event: string
    detail: string
  }): Promise<void> {
    const { to, name, event, detail } = opts
    const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff8f0;border-radius:12px;border:2px solid #f97316;">
        <h2 style="color:#c2410c;margin:0 0 16px;">⚠️ Security Alert</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We detected a security event on your Imboni Serve account:</p>
        <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #fed7aa;margin:16px 0;">
          <strong>${event}</strong><br>
          <span style="color:#64748b;font-size:13px;">${detail}</span>
        </div>
        <p>If this was not you, <a href="${process.env.APP_URL}/dashboard/security">revoke access immediately</a>.</p>
      </div>
    `

    const transport = createTransport()
    if (!transport) return
    try {
      await transport.sendMail({ from, to, subject: `Security Alert — ${event}`, html })
    } catch (err) {
      console.error('[EmailService] sendSecurityAlert failed:', err)
    }
  }

  static async sendInvoice(opts: {
    to: string
    name: string
    invoiceNumber: string
    planName: string
    amountFormatted: string
    paidAt: string
    downloadUrl: string
  }): Promise<void> {
    const { to, name, invoiceNumber, planName, amountFormatted, paidAt, downloadUrl } = opts
    const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e3a5f;">🧾 Invoice Confirmation</h2>
        <p>Hello <strong>${name}</strong>, your payment has been received.</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:16px 0;">
          <tr style="background:#1e3a5f;color:#fff;">
            <td style="padding:12px;">Invoice</td><td style="padding:12px;">${invoiceNumber}</td>
          </tr>
          <tr><td style="padding:12px;color:#64748b;">Plan</td><td style="padding:12px;">${planName}</td></tr>
          <tr><td style="padding:12px;color:#64748b;">Amount</td><td style="padding:12px;font-weight:700;">${amountFormatted}</td></tr>
          <tr><td style="padding:12px;color:#64748b;">Paid At</td><td style="padding:12px;">${paidAt}</td></tr>
        </table>
        <a href="${downloadUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Download Invoice PDF
        </a>
      </div>
    `

    const transport = createTransport()
    if (!transport) return
    try {
      await transport.sendMail({ from, to, subject: `Invoice ${invoiceNumber} — Imboni Serve`, html })
    } catch (err) {
      console.error('[EmailService] sendInvoice failed:', err)
    }
  }

  static async sendPasswordReset(
    to: string,
    name: string,
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const from = process.env.SMTP_FROM || 'Imboni Serve <noreply@imboni.serve>'

    const subject = 'Reset Your Imboni Serve Password'
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#1e3a5f;margin:0;">Imboni Serve</h2>
          <p style="color:#64748b;margin:4px 0 0;">Password Reset Request</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#1e293b;margin:0 0 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color:#475569;margin:0 0 16px;">
            We received a request to reset your password for your Imboni Serve account.
          </p>
          <p style="color:#475569;margin:0 0 24px;">
            Click the button below to create a new password:
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" 
               style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              Reset Password
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
            ⏱ This link expires in <strong>1 hour</strong>.
          </p>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color:#3b82f6;font-size:12px;word-break:break-all;background:#f1f5f9;padding:12px;border-radius:6px;margin:0 0 16px;">
            ${resetUrl}
          </p>
          <p style="color:#ef4444;font-size:13px;margin:16px 0 0;padding:12px;background:#fef2f2;border-radius:6px;">
            🔒 If you didn't request this, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
          For security reasons, all your active sessions will be logged out after password reset.
        </p>
      </div>
    `

    const text = `Hello ${name},\n\nWe received a request to reset your Imboni Serve password.\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`

    const transport = createTransport()
    if (!transport) {
      console.info(`[EmailService] Password reset link for ${to}: ${resetUrl}`)
      return { success: true }
    }

    try {
      await transport.sendMail({ from, to, subject, html, text })
      return { success: true }
    } catch (err: any) {
      console.error('[EmailService] sendPasswordReset failed:', err?.message)
      return { success: false, error: err?.message }
    }
  }
}
