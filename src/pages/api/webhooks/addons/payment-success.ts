import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { upgradeToPro } from '@/lib/services/site-builder-subscription.service';
import { upgradeDiscoveryTier } from '@/lib/services/discovery-subscription.service';
import { purchaseExtraCredits } from '@/lib/services/ai-credit.service';
import { logger } from '@/lib/logger';
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service';

const log = logger.child({ service: 'addon-webhook' });

/**
 * Webhook handler for add-on payment success
 * Called after Irembo Pay webhook confirms payment
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionId, status } = req.body;

    if (status !== 'COMPLETED' && status !== 'SUCCESS') {
      return res.status(200).json({ message: 'Payment not completed yet' });
    }

    // Get transaction details
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        business: {
          select: { id: true, name: true }
        }
      }
    });

    if (!transaction) {
      log.error('Transaction not found', { transactionId });
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const metadata = transaction.rawRequest as any;
    
    if (metadata?.type !== 'addon') {
      return res.status(200).json({ message: 'Not an addon transaction' });
    }

    const businessId = transaction.businessId;

    // Activate add-on based on type
    switch (metadata.addon) {
      case 'site_builder_pro':
        await upgradeToPro(businessId);
        log.info('Site Builder Pro activated', { businessId, transactionId });
        break;

      case 'discovery':
        const tier = metadata.tier; // FEATURED or PREMIUM
        await upgradeDiscoveryTier(businessId, tier);
        log.info('Discovery tier upgraded', { businessId, tier, transactionId });
        break;

      case 'ai_credits':
        const credits = metadata.credits;
        await purchaseExtraCredits(businessId, credits);
        log.info('AI credits purchased', { businessId, credits, transactionId });
        break;

      default:
        log.warn('Unknown addon type', { addon: metadata.addon, transactionId });
    }

    // Update transaction status
    await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS',
        rawRequest: {
          ...(transaction.rawRequest as any),
          activated: true,
          activatedAt: new Date().toISOString()
        } as any
      }
    });
    await ensurePaymentLedgerEvent(transactionId, 'SUCCESS', {
      source: 'webhooks/addons/payment-success',
      addon: metadata.addon,
    });

    return res.status(200).json({
      success: true,
      message: 'Add-on activated successfully'
    });

  } catch (error: any) {
    log.error('Add-on activation failed', { error: error.message });
    return res.status(500).json({ error: 'Failed to activate add-on' });
  }
}
