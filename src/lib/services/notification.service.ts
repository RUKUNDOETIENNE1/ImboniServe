import twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils/currency'
import { logger } from '@/lib/logger'
import { normalizePhone } from '@/lib/utils/phone'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

export interface NotificationTemplate {
  type: string
  title: string
  message: string
  variables?: Record<string, string>
}

export class NotificationService {
  static async sendWhatsApp(phone: string, message: string) {
    const toPhone = normalizePhone(phone)
    const fromEnv = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || ''
    const from = `whatsapp:${fromEnv.replace(/^whatsapp:/, '')}`
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !fromEnv) {
      console.log('[WhatsApp] Not configured. Message:', message)
      return { success: false, message: 'WhatsApp not configured' }
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: from,
            To: `whatsapp:${toPhone}`,
            Body: message
          })
        }
      )

      if (response.ok) {
        return { success: true, data: await response.json() }
      } else {
        return { success: false, error: await response.text() }
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return { success: false, error: error.message }
    }
  }

  static async sendOrderNotification(orderId: string) {
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        business: true,
        user: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) return

    const itemsList = order.items
      .map((item: any) => `${item.quantity}× ${item.menuItem.name}`)
      .join('\n')

    const currency = order.business?.currency || 'RWF'
    const message = `🍽️ NEW ORDER #${order.orderNumber}\n\nItems:\n${itemsList}\n\nTotal: ${formatCurrency(order.totalAmountCents / 100, currency)}\n\nBusiness: ${order.business.name}`

    if (order.business.whatsappNumber) {
      await this.sendWhatsApp(order.business.whatsappNumber, message)
    }
  }

  static async sendLowStockAlert(businessId: string, items: any[]) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true }
    })

    if (!business) return

    const itemsList = items
      .map((item: any) => `• ${item.name}: ${item.currentStock} ${item.unit} (min: ${item.minStockLevel})`)
      .join('\n')

    // EGR-016: Notification language respects business.defaultLanguage
    // Currently English-only; structure supports future translation
    const message = `⚠️ LOW STOCK ALERT\n\n${business.name}\n\n${itemsList}\n\nAction required: Reorder supplies`

    if (business.owner.whatsappNumber) {
      await this.sendWhatsApp(business.owner.whatsappNumber, message)
    }
  }

  static async sendDailyReport(businessId: string, report: any) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true }
    })

    if (!business) return

    const currency = business.currency || 'RWF'
    // EGR-016: Notification language respects business.defaultLanguage
    // Currently English-only; structure supports future translation
    const message = `📊 DAILY REPORT - ${business.name}\n\n` +
      `💰 Sales: ${formatCurrency(report.totalSales / 100, currency)}\n` +
      `📈 Orders: ${report.totalOrders}\n` +
      `🎯 Profit: ${formatCurrency(report.profit / 100, currency)} (${report.profitMargin}%)\n\n` +
      `🏆 Top Item: ${report.topItem?.name || 'N/A'}\n` +
      `⚠️ Low Stock: ${report.lowStockCount} items\n\n` +
      `View details: ${process.env.APP_URL}/dashboard/reports`

    if (business.owner.whatsappNumber) {
      await this.sendWhatsApp(business.owner.whatsappNumber, message)
    }
  }

  static async sendPaymentConfirmation(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        business: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!sale) return

    const currency = sale.business?.currency || 'RWF'
    const itemsList = sale.items
      .map((item: any) => `${item.quantity}× ${item.menuItem.name} - ${formatCurrency(item.totalPriceCents / 100, currency)}`)
      .join('\n')

    const message = `✅ PAYMENT CONFIRMED\n\n` +
      `${sale.business.name}\n` +
      `Smart Dining Slip™: ${sale.orderNumber}\n\n` +
      `${itemsList}\n\n` +
      `Total: ${formatCurrency(sale.totalAmountCents / 100, currency)}\n` +
      `Method: ${sale.paymentMethod}\n\n` +
      `Thank you for your visit! 🎉`

    return message
  }

  static async sendSmartDiningSlip(
    phone: string,
    restaurantName: string,
    slipNumber: string,
    businessId: string,
    clientConsented: boolean,
    pdfBuffer?: Buffer
  ) {
    const fromEnv = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || ''
    const from = `whatsapp:${fromEnv.replace(/^whatsapp:/, '')}`
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !fromEnv) {
      console.log('[WhatsApp] Not configured. Smart Dining Slip™ not sent.')
      return { success: false, message: 'WhatsApp not configured' }
    }

    // Check business WhatsApp policy (EGR-016: renamed from restaurant to business)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        whatsappClientSlipsEnabled: true,
        whatsappDailyCapClient: true,
        timezone: true,
      }
    })

    if (!business?.whatsappClientSlipsEnabled) {
      console.log('[WhatsApp] Client slips disabled for this business')
      return { success: false, message: 'Client WhatsApp slips disabled' }
    }

    if (!clientConsented) {
      console.log('[WhatsApp] Client did not consent to WhatsApp messaging')
      return { success: false, message: 'No client consent' }
    }

    // Check daily cap — timezone-aware day boundary (EGR-016)
    const { start: today } = getBusinessDayBoundary(new Date(), business?.timezone)
    const sentToday = await prisma.smartDiningSlip.count({
      where: {
        businessId: businessId,
        sentViaWhatsApp: true,
        whatsappSentAt: { gte: today }
      }
    })

    if (sentToday >= business.whatsappDailyCapClient) {
      console.log(`[WhatsApp] Daily cap reached (${sentToday}/${business.whatsappDailyCapClient})`)
      return { success: false, message: 'Daily cap reached' }
    }

    const message = `Thank you for dining with ${restaurantName}. Here is your Smart Dining Slip™.\n\nSlip ID: ${slipNumber}\n\nLoved this experience? Help other restaurants go digital and earn rewards.`

    try {
      const formData: any = {
        From: from,
        To: `whatsapp:${phone}`,
        Body: message
      }

      if (pdfBuffer) {
        const FormData = require('form-data')
        const form = new FormData()
        form.append('From', formData.From)
        form.append('To', formData.To)
        form.append('Body', formData.Body)
        form.append('MediaUrl', pdfBuffer, {
          filename: `smart-dining-slip-${slipNumber}.pdf`,
          contentType: 'application/pdf'
        })

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
              ).toString('base64'),
              ...form.getHeaders()
            },
            body: form
          }
        )

        if (response.ok) {
          return { success: true, data: await response.json() }
        } else {
          return { success: false, error: await response.text() }
        }
      } else {
        return await this.sendWhatsApp(phone, message)
      }
    } catch (error: any) {
      console.error('Smart Dining Slip™ WhatsApp send error:', error)
      return { success: false, error: error.message }
    }
  }
}
