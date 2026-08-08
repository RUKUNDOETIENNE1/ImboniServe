import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { IremboPayService } from '@/lib/services/irembopay.service';
import { logger } from '@/lib/logger';
import { AlertDeliveryService } from '@/lib/services/alert-delivery.service';

const log = logger.child({ service: 'addon-renewals' });

/**
 * Daily cron job to process add-on subscription renewals
 * Should run daily at 02:00 UTC
 * 
 * Vercel Cron: 0 2 * * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    log.info('Starting add-on renewal processing');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active add-on transactions that need renewal (30 days old)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const renewalCandidates = await prisma.paymentTransaction.findMany({
      where: {
        status: 'SUCCESS',
        rawRequest: {
          path: ['meta', 'type'],
          equals: 'addon',
        },
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 24 * 60 * 60 * 1000), // 1 day buffer
          lte: new Date(thirtyDaysAgo.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                email: true,
                phone: true,
                name: true,
              },
            },
          },
        },
      },
    });

    log.info('Found renewal candidates', { count: renewalCandidates.length });

    const results = {
      processed: 0,
      invoicesCreated: 0,
      errors: 0,
      skipped: 0
    };

    for (const transaction of renewalCandidates) {
      try {
        const meta = (transaction.rawRequest as any)?.meta || {};

        // Check if already renewed
        const existingRenewal = await prisma.paymentTransaction.findFirst({
          where: {
            businessId: transaction.businessId,
            rawRequest: {
              path: ['meta', 'renewalOf'],
              equals: transaction.id,
            },
          },
        });

        if (existingRenewal) {
          log.info('Already renewed', { transactionId: transaction.id });
          results.skipped++;
          continue;
        }

        // Create renewal invoice
        const invoice = await IremboPayService.createInvoice({
          businessId: transaction.businessId,
          amountCents: transaction.amountCents,
          description: `${meta.addon || 'addon'} - Monthly Renewal - ${transaction.business.name}`,
          customer: {
            email: transaction.business.owner.email || undefined,
            phoneNumber: transaction.business.owner.phone || undefined,
            name: transaction.business.owner.name || undefined,
          },
        });

        // Store renewal transaction
        await prisma.paymentTransaction.create({
          data: {
            businessId: transaction.businessId,
            invoiceNumber: invoice.invoiceNumber,
            transactionId: invoice.transactionId,
            gateway: 'IREMBO_PAY',
            paymentMethod: 'WEB',
            status: 'PENDING',
            amountCents: transaction.amountCents,
            currency: 'RWF',
            vatAmountCents: transaction.vatAmountCents,
            exVatAmountCents: transaction.exVatAmountCents,
            gatewayFeeEstimatedCents: transaction.gatewayFeeEstimatedCents,
            netToBusinessCents: transaction.netToBusinessCents,
            paymentLinkUrl: invoice.paymentLinkUrl,
            expiryAt: invoice.expiryAt ? new Date(invoice.expiryAt) : null,
            payerName: transaction.business.owner.name,
            payerEmail: transaction.business.owner.email,
            payerPhone: transaction.business.owner.phone,
            rawRequest: {
              ...invoice,
              meta: {
                ...(typeof meta === 'object' && meta ? meta : {}),
                renewalOf: transaction.id,
                renewalDate: today.toISOString(),
              },
            }
          }
        });

        results.invoicesCreated++;
        log.info('Renewal invoice created', { 
          businessId: transaction.businessId, 
          addon: meta.addon,
          invoiceNumber: invoice.invoiceNumber
        });

      } catch (error: any) {
        log.error('Renewal processing failed', { 
          transactionId: transaction.id, 
          error: error.message 
        });
        results.errors++;
      }

      results.processed++;
    }

    return res.status(200).json({
      success: true,
      message: 'Add-on renewals processed',
      stats: {
        ...results,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error('Add-on renewal cron failed', { error: error.message });
    
    // Alert on renewal processing failure
    await AlertDeliveryService.deliver({
      severity: 'error',
      title: 'Add-on renewal job failed',
      details: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    }).catch((alertError) => {
      log.error('Failed to send addon renewal failure alert', { alertError })
    })
    
    return res.status(500).json({ 
      error: 'Renewal processing failed',
      message: error.message 
    });
  }
}
