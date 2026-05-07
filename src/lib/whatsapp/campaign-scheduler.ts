import { prisma } from '@/lib/prisma'

export interface CampaignMetrics {
  sent: number
  delivered: number
  failed: number
  pending: number
}

export async function sendCampaignMessages(campaignId: string): Promise<CampaignMetrics> {
  const campaign = await prisma.promotion.findUnique({
    where: { id: campaignId },
    include: { business: true }
  })

  if (!campaign || campaign.type !== 'WHATSAPP_CAMPAIGN') {
    throw new Error('Invalid campaign')
  }

  const config = campaign.config as any
  const segment = config.segment || 'ALL'
  const message = config.message || ''

  const customers = await getCustomersBySegment(campaign.businessId, segment)

  const metrics: CampaignMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: customers.length
  }

  for (const customer of customers) {
    if (!customer.phone) {
      metrics.failed++
      metrics.pending--
      continue
    }

    try {
      await sendWhatsAppMessage(
        campaign.business.whatsappNumber || campaign.business.phone,
        customer.phone,
        message,
        campaign.businessId
      )
      metrics.sent++
      metrics.delivered++
      metrics.pending--
    } catch (error) {
      console.error(`Failed to send to ${customer.phone}:`, error)
      metrics.failed++
      metrics.pending--
    }
  }

  await prisma.promotion.update({
    where: { id: campaignId },
    data: {
      config: {
        ...config,
        metrics,
        lastSentAt: new Date().toISOString()
      }
    }
  })

  return metrics
}

async function getCustomersBySegment(businessId: string, segment: string) {
  const where: any = { businessId }

  switch (segment) {
    case 'ACTIVE':
      where.orders = { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      break
    case 'INACTIVE':
      where.orders = { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      break
    case 'VIP':
      where.loyaltyTier = 'VIP'
      break
    case 'ALL':
    default:
      break
  }

  return prisma.customer.findMany({
    where,
    select: { id: true, name: true, phone: true }
  })
}

async function sendWhatsAppMessage(
  fromNumber: string,
  toNumber: string,
  message: string,
  businessId: string
): Promise<void> {
  await prisma.whatsAppMessage.create({
    data: {
      fromNumber,
      toNumber,
      message,
      type: 'CAMPAIGN',
      status: 'SENT',
      direction: 'OUTBOUND',
      businessId
    }
  })

  await new Promise(resolve => setTimeout(resolve, 100))
}
