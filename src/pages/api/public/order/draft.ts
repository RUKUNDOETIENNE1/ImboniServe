import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { validateAccessToken, markTokenUsed } from '@/lib/services/qr-token.service';
import { calculateOrderPricing, createDraftOrder, checkSlotCapacity } from '@/lib/services/qr-order.service';
import { IremboPayService } from '@/lib/services/irembopay.service';
import type { InvoiceResponse } from '@/lib/services/irembopay.service';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { Prisma } from '@prisma/client';
import { formatDateTimeRW } from '@/utils/datetimeRW';
import { z } from 'zod';
import { logger } from '@/lib/logger';

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const p = phone.trim();
  if (p.startsWith('+')) return p;
  if (p.startsWith('07')) return `+250${p.slice(1)}`;
  if (p.startsWith('2507')) return `+${p}`;
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}`;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body with Zod
    const draftOrderSchema = z.object({
      accessToken: z.string().min(10),
      items: z.array(z.object({
        menuItemId: z.string().cuid(),
        quantity: z.number().int().positive().max(100),
        notes: z.string().max(500).optional(),
        instructionTags: z.array(z.string()).max(10).optional()
      })).min(1).max(50),
      mode: z.enum(['dine-in', 'preorder', 'pickup']).optional(),
      scheduledAt: z.string().datetime().optional(),
      phone: z.string().optional(),
      customerName: z.string().max(100).optional(),
      postId: z.string().cuid().optional(),
      tableSessionId: z.string().cuid().optional(),
      participantId: z.string().cuid().optional(),
      branchId: z.string().cuid().optional(),
      paymentMethod: z.enum(['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'WEB', 'OTHER']).optional(),
      sessionToken: z.string().optional()
    });

    const validatedBody = draftOrderSchema.parse(req.body);
    const { accessToken, items, mode, scheduledAt, phone, customerName, postId, tableSessionId, participantId, paymentMethod, sessionToken } = validatedBody;

    // Validate access token
    const claims = await validateAccessToken(accessToken, req.body.branchId || '');
    
    // Get business configuration
    const business = await prisma.business.findUnique({
      where: { id: claims.branchId },
      select: {
        id: true,
        name: true,
        enableQRInVenue: true,
        enableQRRemote: true,
        requireDepositRemote: true,
        defaultDepositPercent: true,
        maxRemoteOrdersPerSlot: true,
        slotDurationMinutes: true,
        taxMode: true,
        taxRate: true,
        currency: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Validate order source
    const isRemote = mode === 'preorder' || mode === 'pickup';
    if (isRemote && !business.enableQRRemote) {
      return res.status(403).json({ error: 'Remote ordering not enabled' });
    }
    if (!isRemote && !business.enableQRInVenue) {
      return res.status(403).json({ error: 'In-venue QR ordering not enabled' });
    }

    const phoneE164 = normalizePhone(phone);
    if (isRemote) {
      if (!phoneE164) {
        return res.status(400).json({ error: 'Phone is required for remote orders' });
      }
      const customer = await prisma.customer.findUnique({
        where: { businessId_phone: { businessId: business.id, phone: phoneE164 } },
        select: { phoneVerified: true }
      });
      if (!customer || !customer.phoneVerified) {
        return res.status(403).json({ error: 'Phone not verified. Please complete OTP verification.' });
      }
    }

    // Calculate pricing (outside transaction)
    const pricing = await calculateOrderPricing(
      business.id,
      items,
      'DIGITAL', // Always digital for QR orders
      isRemote,
      business.requireDepositRemote,
      business.defaultDepositPercent,
      business.taxMode,
      business.taxRate
    );
    // Transactional slot locking + sale & transaction creation
    const amountToCharge = pricing.depositCents > 0 ? pricing.depositCents : pricing.totalCents;
    let saleId: string, orderNumber: string, paymentTransactionId: string;

    const runOnce = async () => {
      return await prisma.$transaction(async (tx) => {
        // Capacity enforcement within transaction for scheduled remote orders
        if (scheduledAt && isRemote) {
          const scheduledDate = new Date(scheduledAt);
          const capacity = await checkSlotCapacity(
            business.id,
            scheduledDate,
            business.slotDurationMinutes,
            business.maxRemoteOrdersPerSlot,
            tx
          );
          if (!capacity.available) {
            throw new Error('SLOT_FULL');
          }
        }

        const selectedPaymentMethod = paymentMethod || 'WEB';
        
        const created = await createDraftOrder(
          {
            branchId: business.id,
            tableId: claims.tableId,
            tableSessionId: tableSessionId || undefined,
            participantId: participantId || undefined,
            items,
            orderSource: isRemote ? 'QR_REMOTE' : 'QR_IN_VENUE',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            customerPhone: phoneE164,
            customerName,
            paymentMethod: selectedPaymentMethod
          },
          pricing,
          tx
        );

        // Handle seat session if provided
        if (sessionToken) {
          const seatSession = await tx.seatSession.findUnique({
            where: { sessionToken }
          });

          if (!seatSession) {
            throw new Error('INVALID_SEAT_SESSION');
          }

          if (seatSession.state !== 'locked') {
            throw new Error('SEAT_NOT_LOCKED');
          }

          if (seatSession.lockExpiresAt < new Date()) {
            throw new Error('SEAT_LOCK_EXPIRED');
          }

          // Transition seat to occupied
          await tx.seatSession.update({
            where: { id: seatSession.id },
            data: {
              state: 'occupied',
              occupiedAt: new Date(),
              participantId: participantId || null,
              tableSessionId: tableSessionId || null
            }
          });

          // Link sale to seat
          await tx.sale.update({
            where: { id: created.saleId },
            data: { seatId: seatSession.seatId }
          });
        }

        const isManualPayment = ['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'OTHER'].includes(selectedPaymentMethod);
        const gateway = isManualPayment 
          ? (selectedPaymentMethod === 'CASH' ? 'CASH' : selectedPaymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN_MONEY' : selectedPaymentMethod === 'AIRTEL_MONEY' ? 'AIRTEL_MONEY' : 'BANK_TRANSFER')
          : 'IREMBO_PAY';
        
        const pt = await tx.paymentTransaction.create({
          data: {
            businessId: business.id,
            invoiceNumber: `INV-${created.orderNumber}`,
            transactionId: `TXN-${Date.now()}`,
            gateway: gateway as any,
            paymentMethod: selectedPaymentMethod as any,
            status: 'PENDING',
            amountCents: amountToCharge,
            currency: 'RWF',
            vatAmountCents: pricing.vatCents,
            exVatAmountCents: pricing.subtotalCents,
            gatewayFeeEstimatedCents: isManualPayment ? 0 : Math.round(amountToCharge * 0.0342),
            platformFeeCents: 0,
            netToBusinessCents: isManualPayment ? amountToCharge : amountToCharge - Math.round(amountToCharge * 0.0342),
            payerPhone: phoneE164,
            payerName: customerName
          }
        });

        await tx.sale.update({ where: { id: created.saleId }, data: { paymentTransactionId: pt.id } });

        return { saleId: created.saleId, orderNumber: created.orderNumber, paymentTransactionId: pt.id };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    };

    try {
      const result = await runOnce();
      saleId = result.saleId;
      orderNumber = result.orderNumber;
      paymentTransactionId = result.paymentTransactionId;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('could not serialize') || msg.includes('deadlock') || msg.includes('P2034')) {
        console.warn('[SlotLock] serialization failure; retrying once');
        try {
          const result = await runOnce();
          saleId = result.saleId;
          orderNumber = result.orderNumber;
          paymentTransactionId = result.paymentTransactionId;
        } catch (err2: any) {
          if (String(err2?.message).includes('SLOT_FULL')) {
            return res.status(409).json({ error: 'Time slot full' });
          }
          console.warn('[SlotLock] retry failed; returning slot filled');
          return res.status(409).json({ error: 'Slot just filled, please choose another time' });
        }
      } else if (msg.includes('SLOT_FULL')) {
        return res.status(409).json({ error: 'Time slot full' });
      } else if (msg.includes('INVALID_SEAT_SESSION')) {
        return res.status(400).json({ error: 'Invalid seat session' });
      } else if (msg.includes('SEAT_NOT_LOCKED')) {
        return res.status(400).json({ error: 'Seat is not locked' });
      } else if (msg.includes('SEAT_LOCK_EXPIRED')) {
        return res.status(400).json({ error: 'Your seat reservation has expired. Please select a seat again.', code: 'SEAT_LOCK_EXPIRED' });
      } else {
        throw err;
      }
    }

    // Create IremboPay invoice only for online payment method
    let invoice: InvoiceResponse | null = null;
    const selectedPaymentMethod = paymentMethod || 'WEB';
    const requiresOnlinePayment = selectedPaymentMethod === 'WEB';
    
    if (requiresOnlinePayment) {
      try {
        invoice = await IremboPayService.createInvoice({
          businessId: business.id,
          subscriptionId: 'QR_ORDER',
          amountCents: amountToCharge,
          description: `Order ${orderNumber} - ${business.name}`,
          customer: {
            name: customerName || 'Customer',
            phoneNumber: phoneE164
          },
          language: 'EN'
        });

        // Update payment transaction with payment link
        await prisma.paymentTransaction.update({
          where: { id: paymentTransactionId },
          data: {
            invoiceNumber: invoice.invoiceNumber,
            paymentLinkUrl: invoice.paymentLinkUrl,
            expiryAt: invoice.expiryAt ? new Date(invoice.expiryAt) : null
          }
        });
      } catch (e) {
        console.warn('Irembo invoice creation skipped/fallback (likely missing sandbox credentials):', e);
      }
    }

    // Post attribution — if order came from a feed post CTA
    if (postId && typeof postId === 'string') {
      try {
        await (prisma as any).postAttribution.create({
          data: {
            postId,
            businessId: business.id,
            orderId: saleId,
            channel: 'WEB',
            attributedAt: new Date()
          }
        });
      } catch (attrErr) {
        logger.warn('Failed to record post-order attribution', { error: attrErr, saleId, businessId: business.id });
      }
    }

    // Referral tracking — award welcome bonus and track commission
    if (phoneE164) {
      try {
        const { ReferralTrackingTierService } = await import('@/lib/services/referral-tracking-tier.service')
        
        // Get customer
        const customer = await prisma.customer.findUnique({
          where: { businessId_phone: { businessId: business.id, phone: phoneE164 } }
        })

        if (customer) {
          // Check for referral cookie
          const referralCode = req.cookies['referral_code']
          
          // Check if this is customer's first order
          const previousOrders = await prisma.sale.count({
            where: {
              customerId: customer.id,
              id: { not: saleId }
            }
          })

          const isFirstOrder = previousOrders === 0

          // Award welcome bonus on first order
          if (isFirstOrder && referralCode) {
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress
            const deviceId = req.cookies['device_id']

            await ReferralTrackingTierService.awardWelcomeBonus({
              customerId: customer.id,
              phone: phoneE164,
              referralCode,
              ipAddress,
              deviceId
            })
          }

        }
      } catch (refErr) {
        logger.warn('Failed to process referral tracking', { error: refErr, saleId, businessId: business.id, phone: phoneE164 })
        // Don't fail the order if referral tracking fails
      }
    }

    // Mark token as used
    await markTokenUsed(claims.jti);

    // Calculate ETA
    const eta = isRemote && scheduledAt 
      ? formatDateTimeRW(scheduledAt, 'en')
      : '15-20 minutes';

    return res.status(201).json({
      orderId: saleId,
      orderNumber,
      paymentTransactionId,
      paymentMethod: selectedPaymentMethod,
      paymentLinkUrl: invoice ? invoice.paymentLinkUrl : null,
      requiresManualConfirmation: ['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'OTHER'].includes(selectedPaymentMethod),
      momoInitiationUrl: ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY'].includes(selectedPaymentMethod) ? '/api/payments/momo/initiate' : null,
      summary: {
        subtotalCents: pricing.subtotalCents,
        platformFeeCents: pricing.platformFeeCents,
        vatCents: pricing.vatCents,
        totalCents: pricing.totalCents,
        depositCents: pricing.depositCents,
        remainingCents: pricing.remainingCents,
        taxMode: pricing.taxMode,
        taxRate: pricing.taxRate,
        currency: business.currency,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes
        }))
      },
      eta,
      scheduledAt: scheduledAt || null,
      slotAvailable: true
    });
  } catch (error: any) {
    console.error('Error creating draft order:', error);
    
    if (error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.message.includes('not found') || error.message.includes('unavailable')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withRateLimit(handler, { windowMs: 60 * 1000, maxRequests: 5 });
