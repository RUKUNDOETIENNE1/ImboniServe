import { SmartDiningSlip, SlipLineItem } from '@prisma/client'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import { formatCurrency } from '@/lib/utils/currency'
import QRCode from 'qrcode'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export type SlipWithItems = SmartDiningSlip & {
  lineItems: SlipLineItem[]
  currency?: string
  referralLink?: {
    id: string
    code: string
  } | null
}

export class SlipPDFGeneratorService {
  static async generateHTML(slip: SlipWithItems, templateType: string): Promise<string> {
    switch (templateType) {
      case 'PREMIUM':
        return await this.generatePremiumTemplate(slip)
      case 'LOCAL':
        return await this.generateLocalTemplate(slip)
      case 'MINIMAL':
      default:
        return await this.generateMinimalTemplate(slip)
    }
  }

  private static async generateReferralQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, { 
        width: 140, 
        margin: 1,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      })
    } catch (error) {
      console.error('QR code generation error:', error)
      return ''
    }
  }

  private static async generateMinimalTemplate(slip: SlipWithItems): Promise<string> {
    const referralQR = slip.referralLink ? await this.generateReferralQRCode(`${APP_URL}/r/${slip.referralLink.code}`) : null
    const itemsHTML = slip.lineItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${item.itemName}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${(item.unitPriceCents / 100).toLocaleString()}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600;">${(item.totalPriceCents / 100).toLocaleString()}</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: white; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: left; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #000; }
          .logo { max-width: 80px; margin-bottom: 10px; }
          .restaurant-name { font-size: 24px; font-weight: 700; color: #000; margin: 0; }
          .branch { font-size: 14px; color: #666; margin: 5px 0 0 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: left; padding: 10px 0; border-bottom: 2px solid #000; font-weight: 600; }
          .totals { margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { font-size: 20px; font-weight: 700; padding: 12px 0; border-top: 2px solid #000; margin-top: 10px; }
          .meta { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999; }
          .slip-id { font-size: 11px; color: #999; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${slip.businessLogo ? `<img src="${slip.businessLogo}" class="logo" alt="Logo" />` : ''}
            <h1 class="restaurant-name">${slip.businessName}</h1>
            ${slip.branch ? `<p class="branch">${slip.branch}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(slip.subtotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row">
              <span>VAT (${slip.vatRate}%)</span>
              <span>${formatCurrency(slip.vatCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${formatCurrency(slip.grandTotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
          </div>

          <div class="meta">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Order Time:</span>
              <span>${formatDateTimeRW(slip.orderStartTime, 'en')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Payment Time:</span>
              <span>${formatDateTimeRW(slip.paymentTime, 'en')}</span>
            </div>
            ${slip.tableNumber ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Table:</span><span>${slip.tableNumber}</span></div>` : ''}
            ${slip.servedBy ? `<div style="display: flex; justify-content: space-between;"><span>Served by:</span><span>${slip.servedBy}</span></div>` : ''}
            <div class="slip-id">Smart Dining Slip™ ID: ${slip.slipNumber}</div>
          </div>

          ${slip.referralLink && referralQR ? `
          <div style="margin-top:28px; padding:24px; background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border:3px solid #3b82f6; border-radius:16px; text-align:center;">
            <h3 style="margin:0 0 8px 0; color:#1e40af; font-size:20px; font-weight:700;">
              🎁 Share ${slip.businessName} & Earn 1,000 RWF
            </h3>
            <p style="margin:0 0 16px 0; color:#1e3a8a; font-size:14px; line-height:1.5;">
              Love your experience? Share this restaurant with friends.<br/>
              <strong>You both get 1,000 RWF credit</strong> when they order!
            </p>
            <div style="margin:16px 0;">
              <img src="${referralQR}" alt="Scan to share" style="width:140px; height:140px; border:3px solid #3b82f6; border-radius:12px; background:white; padding:8px;" />
            </div>
            <div style="background:white; padding:12px; border-radius:8px; margin:12px 0; border:2px dashed #3b82f6;">
              <p style="margin:0 0 4px 0; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Your Referral Link</p>
              <p style="margin:0; font-size:15px; font-weight:700; color:#1e40af; font-family:monospace;">
                ${APP_URL}/r/${slip.referralLink.code}
              </p>
            </div>
            <p style="margin:12px 0 0 0; font-size:12px; color:#475569; line-height:1.4;">
              📱 Scan QR or share the link • 💰 Earn unlimited rewards • 🎉 Help local businesses grow
            </p>
          </div>
          ` : ''}

          <div class="footer">
            <p>This restaurant uses <strong>Imboni Serve</strong> — a smart hospitality management system.</p>
            <p style="margin-top:6px; font-size:10px;">Get your slip online: ${APP_URL}/api/smart-dining-slips/${slip.id}?action=download</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static async generatePremiumTemplate(slip: SlipWithItems): Promise<string> {
    const referralQR = slip.referralLink ? await this.generateReferralQRCode(`${APP_URL}/r/${slip.referralLink.code}`) : null
    const itemsHTML = slip.lineItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">${item.itemName}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2); text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2); text-align: right;">${(item.unitPriceCents / 100).toLocaleString()}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2); text-align: right; font-weight: 600; color: #d4af37;">${(item.totalPriceCents / 100).toLocaleString()}</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Georgia', serif; margin: 0; padding: 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; }
          .container { max-width: 650px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); position: relative; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; font-size: 120px; font-weight: 900; color: #d4af37; pointer-events: none; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #d4af37; }
          .logo { max-width: 100px; margin-bottom: 15px; }
          .restaurant-name { font-size: 32px; font-weight: 700; color: #d4af37; margin: 0; letter-spacing: 2px; }
          .branch { font-size: 14px; color: #999; margin: 10px 0 0 0; letter-spacing: 1px; }
          .dining-summary { text-align: center; font-size: 14px; color: #d4af37; margin: 20px 0; letter-spacing: 3px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { text-align: left; padding: 12px 0; border-bottom: 2px solid #d4af37; font-weight: 600; color: #d4af37; letter-spacing: 1px; }
          .totals { margin-top: 30px; padding-top: 20px; border-top: 2px solid #d4af37; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; color: #ccc; }
          .grand-total { font-size: 24px; font-weight: 700; padding: 15px 0; border-top: 2px solid #d4af37; margin-top: 15px; color: #d4af37; }
          .meta { margin-top: 40px; padding-top: 20px; border-top: 1px solid #444; font-size: 13px; color: #999; }
          .footer { margin-top: 50px; padding-top: 25px; border-top: 1px solid #444; text-align: center; font-size: 10px; color: #666; }
          .slip-id { font-size: 10px; color: #666; margin-top: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">${slip.businessName.substring(0, 1)}</div>
          <div class="header">
            <h1 class="restaurant-name">${slip.businessName}</h1>
            ${slip.branch ? `<p class="branch">${slip.branch}</p>` : ''}
          </div>

          <div class="dining-summary">Dining Summary</div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(slip.subtotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row">
              <span>VAT (${slip.vatRate}%)</span>
              <span>${formatCurrency(slip.vatCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${formatCurrency(slip.grandTotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
          </div>

          <div class="meta">
            ${slip.servedBy ? `<div style="text-align: center; margin-bottom: 15px; color: #d4af37;">Served by: ${slip.servedBy}</div>` : ''}
            ${slip.tableNumber ? `<div style="text-align: center; margin-bottom: 15px;">Table: ${slip.tableNumber}</div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
              <span>${formatDateTimeRW(slip.orderStartTime, 'en')}</span>
              <span>${formatDateTimeRW(slip.paymentTime, 'en')}</span>
            </div>
            <div class="slip-id">Smart Dining Slip™ ID: ${slip.slipNumber}</div>
          </div>

          ${slip.referralLink && referralQR ? `
          <div style="margin-top:35px; padding:28px; background:linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%); border:2px solid #d4af37; border-radius:12px; text-align:center;">
            <h3 style="margin:0 0 12px 0; color:#d4af37; font-size:22px; font-weight:700; letter-spacing:2px;">
              ✨ SHARE THE EXCELLENCE
            </h3>
            <p style="margin:0 0 20px 0; color:#ccc; font-size:14px; line-height:1.6; letter-spacing:0.5px;">
              Refer this exceptional dining experience to your circle.<br/>
              <strong style="color:#d4af37;">Earn 1,000 RWF</strong> for each successful referral.
            </p>
            <div style="margin:20px 0;">
              <img src="${referralQR}" alt="Exclusive referral" style="width:140px; height:140px; border:3px solid #d4af37; border-radius:8px; background:#1a1a1a; padding:10px;" />
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:8px; margin:16px 0; border:1px solid #d4af37;">
              <p style="margin:0 0 6px 0; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:1px;">Your Exclusive Code</p>
              <p style="margin:0; font-size:16px; font-weight:700; color:#d4af37; font-family:monospace; letter-spacing:2px;">
                ${slip.referralLink.code}
              </p>
            </div>
            <p style="margin:14px 0 0 0; font-size:11px; color:#999; line-height:1.5; letter-spacing:0.5px;">
              ${APP_URL}/r/${slip.referralLink.code}
            </p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Powered by <strong>Imboni Serve</strong></p>
            <p style="margin-top:6px; font-size:10px;">Get your slip online: ${APP_URL}/api/smart-dining-slips/${slip.id}?action=download</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static async generateLocalTemplate(slip: SlipWithItems): Promise<string> {
    const referralQR = slip.referralLink ? await this.generateReferralQRCode(`${APP_URL}/r/${slip.referralLink.code}`) : null
    const itemsHTML = slip.lineItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px dashed #e0e0e0; font-size: 15px;">${item.itemName}</td>
          <td style="padding: 10px 0; border-bottom: 1px dashed #e0e0e0; text-align: center; font-size: 15px; font-weight: 600;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px dashed #e0e0e0; text-align: right; font-size: 15px;">${(item.unitPriceCents / 100).toLocaleString()}</td>
          <td style="padding: 10px 0; border-bottom: 1px dashed #e0e0e0; text-align: right; font-size: 16px; font-weight: 700; color: #ff6b35;">${(item.totalPriceCents / 100).toLocaleString()}</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%); }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 3px solid #ff6b35; }
          .header { text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #ff6b35; }
          .restaurant-name { font-size: 28px; font-weight: 900; color: #ff6b35; margin: 0; }
          .branch { font-size: 15px; color: #666; margin: 8px 0 0 0; font-weight: 600; }
          .greeting { text-align: center; font-size: 18px; color: #ff6b35; margin: 20px 0; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { text-align: left; padding: 12px 0; border-bottom: 3px solid #ff6b35; font-weight: 700; color: #333; font-size: 14px; }
          .totals { margin-top: 25px; padding-top: 20px; border-top: 3px solid #ff6b35; background: #fff5e6; padding: 20px; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 600; }
          .grand-total { font-size: 26px; font-weight: 900; padding: 15px 0; border-top: 3px solid #ff6b35; margin-top: 12px; color: #ff6b35; }
          .meta { margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e0e0e0; font-size: 14px; color: #666; font-weight: 600; }
          .footer { margin-top: 35px; padding-top: 20px; border-top: 2px dashed #e0e0e0; text-align: center; font-size: 12px; color: #999; }
          .slip-id { font-size: 11px; color: #999; margin-top: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="restaurant-name">${slip.businessName}</h1>
            ${slip.branch ? `<p class="branch">${slip.branch}</p>` : ''}
          </div>

          <div class="greeting">Murakoze kudusura 🙏</div>

          <table>
            <thead>
              <tr>
                <th>Icyariye</th>
                <th style="text-align: center;">Umubare</th>
                <th style="text-align: right;">Igiciro</th>
                <th style="text-align: right;">Igiteranyo</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Igiteranyo (Subtotal)</span>
              <span>${formatCurrency(slip.subtotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row">
              <span>VAT (${slip.vatRate}%)</span>
              <span>${formatCurrency(slip.vatCents / 100, slip.currency || 'RWF')}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${formatCurrency(slip.grandTotalCents / 100, slip.currency || 'RWF')}</span>
            </div>
          </div>

          <div class="meta">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Igihe:</span>
              <span>${formatDateTimeRW(slip.paymentTime, 'rw')}</span>
            </div>
            ${slip.tableNumber ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Ameza:</span><span>${slip.tableNumber}</span></div>` : ''}
            ${slip.servedBy ? `<div style="display: flex; justify-content: space-between;"><span>Wabakoze:</span><span>${slip.servedBy}</span></div>` : ''}
            <div class="slip-id">Smart Dining Slip™ ID: ${slip.slipNumber}</div>
          </div>

          ${slip.referralLink && referralQR ? `
          <div style="margin-top:30px; padding:24px; background:linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%); border:3px solid #ff6b35; border-radius:16px; text-align:center;">
            <h3 style="margin:0 0 10px 0; color:#ff6b35; font-size:22px; font-weight:900;">
              🎁 Sangiza Resitora & Ubone 1,000 RWF
            </h3>
            <p style="margin:0 0 18px 0; color:#78350f; font-size:15px; line-height:1.6; font-weight:600;">
              Ukunda ibyakozwe? Sangiza inshuti zawe.<br/>
              <strong>Mwembi mubone 1,000 RWF</strong> iyo batumije!
            </p>
            <div style="margin:18px 0;">
              <img src="${referralQR}" alt="Sangiza" style="width:140px; height:140px; border:3px solid #ff6b35; border-radius:12px; background:white; padding:10px;" />
            </div>
            <div style="background:white; padding:14px; border-radius:10px; margin:14px 0; border:2px dashed #ff6b35;">
              <p style="margin:0 0 6px 0; font-size:12px; color:#92400e; font-weight:700;">Kode Yawe</p>
              <p style="margin:0; font-size:18px; font-weight:900; color:#ff6b35; font-family:monospace;">
                ${slip.referralLink.code}
              </p>
            </div>
            <p style="margin:14px 0 0 0; font-size:13px; color:#78350f; line-height:1.5; font-weight:600;">
              📱 Scan QR cyangwa sangiza link • 💰 Ubone amafaranga • 🎉 Fasha resitora
            </p>
            <p style="margin:8px 0 0 0; font-size:11px; color:#92400e; font-family:monospace;">
              ${APP_URL}/r/${slip.referralLink.code}
            </p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Iyi resitora ikoresha <strong>Imboni Serve</strong></p>
            <p style="margin-top:6px; font-size:10px;">Kureba slip: ${APP_URL}/api/smart-dining-slips/${slip.id}?action=download</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  static async generatePDFBuffer(slip: SlipWithItems, templateType: string): Promise<Buffer> {
    const html = await this.generateHTML(slip, templateType)
    
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    })
    
    await browser.close()
    
    return Buffer.from(pdfBuffer)
  }
}
