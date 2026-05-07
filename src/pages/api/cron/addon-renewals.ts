import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { IremboPayService } from '@/lib/services/irembopay.service';
import { logger } from '@/lib/logger';

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
        status: 'COMPLETED',
        metadata: {
          path: ['type'],
          equals: 'addon'
        },
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 24 * 60 * 60 * 1000), // 1 day buffer
          lte: new Date(thirtyDaysAgo.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
                phone: true,
                name: true
              }
            }
          }
        }
      }
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
        const metadata = transaction.metadata as any;
        
        // Check if already renewed
        const existingRenewal = await prisma.paymentTransaction.findFirst({
          where: {
            businessId: transaction.businessId,
            metadata: {
              path: ['renewalOf'],
              equals: transaction.id
            }
          }
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
          description: `${metadata.addon} - Monthly Renewal - ${transaction.business.name}`,
          customer: {
            email: transaction.business.user.email,
            phoneNumber: transaction.business.user.phone,
            name: transaction.business.user.name
          }
        });

        // Store renewal transaction
        await prisma.paymentTransaction.create({
          data: {
            businessId: transaction.businessId,
            invoiceNumber: invoice.invoiceNumber,
            transactionId: invoice.transactionId,
            gateway: 'IREMBO_PAY',
            paymentMethod: 'WEB',
            status: 'INITIATED',
            amountCents: transaction.amountCents,
            currency: 'RWF',
            vatAmountCents: transaction.vatAmountCents,
            exVatAmountCents: transaction.exVatAmountCents,
            gatewayFeeEstimatedCents: transaction.gatewayFeeEstimatedCents,
            netToBusinessCents: transaction.netToBusinessCents,
            paymentLinkUrl: invoice.paymentLinkUrl,
            expiryAt: invoice.expiryAt ? new Date(invoice.expiryAt) : null,
            payerName: transaction.business.user.name,
            payerEmail: transaction.business.user.email,
            payerPhone: transaction.business.user.phone,
            metadata: {
              ...metadata,
              renewalOf: transaction.id,
              renewalDate: today.toISOString()
            },
            rawRequest: invoice as any
          }
        });

        results.invoicesCreated++;
        log.info('Renewal invoice created', { 
          businessId: transaction.businessId, 
          addon: metadata.addon,
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
    return res.status(500).json({ 
      error: 'Renewal processing failed',
      message: error.message 
    });
  }
}
