import { NextApiRequest, NextApiResponse } from 'next'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'
import { buffer } from 'micro'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { BusinessInviteService } from '@/lib/services/business-invite.service'
import { logBillingEvent } from '@/lib/services/billing-ledger.service'
import { BillingEventType } from '@prisma/client'
import { PaymentCompletionService } from '@/lib/services/payment-completion.service'
import { FounderCommissionService } from '@/lib/services/founder-commission.service'
import { MarketerCommissionService } from '@/lib/services/marketer-commission.service'

export const config = {
  api: {
    bodyParser: false // Need raw body for HMAC verification
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req)
    const bodyString = rawBody.toString('utf8')
    
    // Verify HMAC signature
    const signature = req.headers['irembopay-signature'] as string
    const isValid = IremboPayService.verifyWebhookSignature(signature, bodyString)
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const payload = JSON.parse(bodyString)
    const { invoiceNumber, paymentStatus, paidAt, paymentMethod, paymentReference } = payload.data

    console.log('[Webhook] Received IremboPay notification', { invoiceNumber, paymentStatus })
    // PII redacted: phone/customer data not logged

    // Fetch invoice status from IremboPay API (server-to-server verification)
    const invoiceStatus = await IremboPayService.getInvoiceStatus(invoiceNumber)

    // Find transaction
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { invoiceNumber },
      include: { 
        subscription: { 
          include: { 
            business: { 
              include: { 
                referredByAffiliate: true 
              } 
            } 
          } 
        } 
      }
    })

    if (!transaction) {
      console.error('Transaction not found:', invoiceNumber)
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Compute final status from verified invoice status
    const finalStatus = invoiceStatus.paymentStatus === 'PAID' ? 'SUCCESS' : 
                        invoiceStatus.paymentStatus === 'EXPIRED' ? 'CANCELLED' : 'FAILED'

    // Idempotency + invariants: update transaction only if not already SUCCESS
    const txUpdate: any = {
      status: finalStatus,
      webhookSignature: signature,
      webhookTimestamp: BigInt(Date.now()),
      webhookVerified: true,
      rawCallback: payload,
      rawStatus: invoiceStatus,
      updatedAt: new Date(),
    }
    if (finalStatus === 'SUCCESS') {
      txUpdate.paidAt = new Date(paidAt || invoiceStatus.updatedAt)
    }

    const updatedTx = await prisma.paymentTransaction.updateMany({
      where: { id: transaction.id, status: { not: 'SUCCESS' } },
      data: txUpdate
    })

    const firstProcess = updatedTx.count > 0 && finalStatus === 'SUCCESS'
    if (!firstProcess && transaction.status === 'SUCCESS') {
      // Already processed by a prior call
      console.log('[Webhook] Idempotent replay; transaction already SUCCESS', { invoiceNumber })
      return res.status(200).json({ success: true, message: 'Already processed' })
    }

    // If became PAID in this call, cascade to Sale and downstream effects
    if (firstProcess) {
      // Note: logBillingEvent and AuditLogService.log for PAYMENT_SUCCESS are handled
      // by PaymentCompletionService.onPaymentSuccess below — do not duplicate here.
      // Update subscription if applicable
      if (transaction.subscriptionId) {
        await prisma.subscription.update({
          where: { id: transaction.subscriptionId },
          data: {
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        })
        // Trigger invite qualification on first subscription payment
        try {
          await BusinessInviteService.processPaymentQualification(transaction.businessId)
        } catch (e) {
          console.error('[Invite] processPaymentQualification error:', e)
        }
      }

      const sale = await prisma.sale.findFirst({
        where: { paymentTransactionId: transaction.id },
        include: { business: true }
      })

      if (sale) {
        // Delegate all post-payment side effects to canonical PaymentCompletionService
        // This handles: sale status update, dining slip, guest recognition, notification,
        // broadcast, ledger entry, audit log, order token
        try {
          await PaymentCompletionService.onPaymentSuccess(
            transaction.id,
            sale.id,
            { source: 'irembopay-webhook' }
          )
        } catch (error) {
          console.error('Error in PaymentCompletionService:', error)
        }
      }

      // Create affiliate commissions if applicable
      await createAffiliateCommissions(transaction)

      // Create Founder Partner commissions if applicable
      await createFounderCommissions(transaction)

      // Create Professional Marketer commissions if applicable
      await createMarketerCommissions(transaction)
    }

    // For non-SUCCESS statuses or if already processed, we updated raw data above; finish
    if (updatedTx.count > 0 && finalStatus !== 'SUCCESS') {
      await logBillingEvent({
        businessId: transaction.businessId,
        paymentTransactionId: transaction.id,
        eventType: finalStatus === 'CANCELLED' ? BillingEventType.PAYMENT_CANCELLED : BillingEventType.PAYMENT_FAILED,
        metadata: { source: 'payments/irembo/webhook', invoiceNumber, finalStatus },
      })
      const action = finalStatus === 'CANCELLED' ? 'PAYMENT_EXPIRED' : 'PAYMENT_FAILED'
      await AuditLogService.log({
        action,
        entityType: 'PaymentTransaction',
        entityId: transaction.id,
        metadata: {
          invoiceNumber,
          finalStatus,
          businessId: transaction.businessId,
        },
      })
    }
    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function createAffiliateCommissions(transaction: any) {
  try {
    const subscription = transaction.subscription
    if (!subscription || !subscription.business) {
      return
    }

    const restaurant = subscription.business
    
    // Check if restaurant was referred by an affiliate
    if (!restaurant.referredByAffiliateId) {
      return
    }

    const affiliate = restaurant.referredByAffiliate
    if (!affiliate || !affiliate.userId) {
      return
    }

    // Anti-fraud: Check for self-referral (same user owns restaurant and is affiliate)
    if (restaurant.ownerId === affiliate.userId) {
      console.log('Self-referral detected - no commission')
      return
    }

    // Check if this is within the 12-month commission window
    const restaurantCreatedAt = new Date(restaurant.createdAt)
    const twelveMonthsAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
    
    if (restaurantCreatedAt < twelveMonthsAgo) {
      console.log('Restaurant outside 12-month commission window')
      return
    }

    // Count existing PAID recurring commissions for this restaurant (cap at 12)
    const paidRecurringCount = await prisma.affiliateCommissionNew.count({
      where: {
        businessId: restaurant.id,
        affiliateId: affiliate.userId,
        commissionType: 'RECURRING',
        status: { in: ['PAID', 'AVAILABLE', 'LOCKED'] }
      }
    })

    // 14-day lock period
    const lockUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Create recurring commission if under 12-invoice cap
    if (paidRecurringCount < 12) {
      const commissionRate = 0.15
      const baseAmountCents = transaction.exVatAmountCents
      const commissionAmountCents = Math.round(baseAmountCents * commissionRate)
      
      await prisma.affiliateCommissionNew.create({
        data: {
          affiliateId: affiliate.userId,
          businessId: restaurant.id,
          subscriptionId: subscription.id,
          paymentTransactionId: transaction.id,
          commissionType: 'RECURRING',
          commissionRate,
          baseAmountCents,
          commissionAmountCents,
          status: 'LOCKED',
          lockUntil
        }
      })
    } else {
      console.log('Recurring commission cap (12 invoices) reached for restaurant:', restaurant.id)
    }

    // Check if this is the first PAID invoice (welcome bonus eligibility)
    const existingWelcomeBonuses = await prisma.affiliateCommissionNew.count({
      where: {
        businessId: restaurant.id,
        commissionType: 'WELCOME_RECRUITER'
      }
    })

    if (existingWelcomeBonuses === 0) {
      // Fetch plan to determine bonus amount
      const plan = await prisma.plan.findUnique({
        where: { id: subscription.planId }
      })

      if (plan) {
        // Recruiter welcome bonus: 5,000 RWF for non-base, 2,000 RWF for base plan (STARTER)
        const isBasePlan = plan.code === 'STARTER'
        const bonusAmountCents = isBasePlan ? 200000 : 500000
        
        await prisma.affiliateCommissionNew.create({
          data: {
            affiliateId: affiliate.userId,
            businessId: restaurant.id,
            subscriptionId: subscription.id,
            paymentTransactionId: transaction.id,
            commissionType: 'WELCOME_RECRUITER',
            commissionRate: 0,
            baseAmountCents: 0,
            commissionAmountCents: bonusAmountCents,
            status: 'LOCKED',
            lockUntil
          }
        })

        console.log(`Welcome bonus created: ${bonusAmountCents / 100} RWF for plan ${plan.code}`)
      }
    }

    console.log('Affiliate commissions created successfully')
  } catch (error) {
    console.error('Error creating affiliate commissions:', error)
    // Don't throw - we don't want to fail the webhook if commission creation fails
  }
}

async function createFounderCommissions(transaction: any) {
  try {
    const businessId = transaction.businessId
    if (!businessId) return

    const amountCents = transaction.exVatAmountCents || transaction.amountCents || 0
    if (amountCents <= 0) return

    await FounderCommissionService.createCommissionForPayment({
      businessId,
      paymentTransactionId: transaction.id,
      amountCents,
    })

    console.log('Founder commissions processed')
  } catch (error) {
    console.error('Error creating founder commissions:', error)
  }
}

async function createMarketerCommissions(transaction: any) {
  try {
    const subscription = transaction.subscription
    if (!subscription || !subscription.business) return

    const businessId = subscription.business.id
    const amountCents = transaction.exVatAmountCents || transaction.amountCents || 0
    if (amountCents <= 0) return

    // Check if business has a marketer attribution
    const attribution = await prisma.acquisitionAttribution.findUnique({
      where: { businessId },
    })

    if (!attribution || attribution.sourceType !== 'PROFESSIONAL_MARKETER') return

    const marketerId = attribution.sourceId
    if (!marketerId) return

    const marketer = await prisma.professionalMarketer.findUnique({
      where: { id: marketerId },
    })

    if (!marketer || marketer.status !== 'ACTIVE') return

    // Anti-fraud: self-referral check
    if (subscription.business.ownerId === marketer.userId) {
      console.log('Marketer self-referral detected - no commission')
      return
    }

    // Create signup bonus on first payment
    const existingBonus = await prisma.marketerCommission.findFirst({
      where: {
        marketerId,
        businessId,
        type: 'SIGNUP_BONUS',
      },
    })

    if (!existingBonus) {
      await MarketerCommissionService.createSignupBonus({
        marketerId,
        businessId,
        description: 'Signup bonus for first referred payment',
      })
    }

    // Create recurring commission
    await MarketerCommissionService.createRecurringCommission({
      marketerId,
      businessId,
      invoiceId: transaction.id,
      invoiceAmountCents: amountCents,
    })

    console.log('Marketer commissions processed')
  } catch (error) {
    console.error('Error creating marketer commissions:', error)
  }
}
