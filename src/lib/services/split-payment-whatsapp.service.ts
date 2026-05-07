/**
 * Split Payment WhatsApp Auto-Trigger Service
 * Automatically sends split payment links via WhatsApp when conditions are met
 */

import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils/currency';
import { NotificationService } from './notification.service';
import { getSplitPaymentSummary } from './split-payment.service';

export interface WhatsAppTriggerConditions {
  shouldTrigger: boolean;
  reason?: string;
  tablePersonCount?: number;
  unpaidBalanceCents?: number;
}

/**
 * Check if WhatsApp auto-trigger should fire for a sale
 * Conditions:
 * 1. More than 1 person at table
 * 2. Unpaid balance exists
 */
export async function checkWhatsAppTriggerConditions(
  saleId: string
): Promise<WhatsAppTriggerConditions> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      totalAmountCents: true,
      isPaid: true,
      table: {
        select: {
          id: true,
          number: true,
          capacity: true
        }
      }
    }
  });

  if (!sale) {
    return {
      shouldTrigger: false,
      reason: 'Sale not found'
    };
  }

  // Check if already fully paid
  if (sale.isPaid) {
    return {
      shouldTrigger: false,
      reason: 'Sale already fully paid'
    };
  }

  // Get split payment summary to check unpaid balance
  const paymentSummary = await getSplitPaymentSummary(saleId);
  const unpaidBalanceCents = paymentSummary.summary.remainingCents;

  if (unpaidBalanceCents <= 0) {
    return {
      shouldTrigger: false,
      reason: 'No unpaid balance'
    };
  }

  // Determine number of people at table
  // Use table capacity as estimate (or default to 2 for split bill scenarios)
  const tablePersonCount = sale.table?.capacity || 2;

  if (tablePersonCount <= 1) {
    return {
      shouldTrigger: false,
      reason: 'Only 1 person at table (avoid annoying solo diners)',
      tablePersonCount,
      unpaidBalanceCents
    };
  }

  // All conditions met - trigger WhatsApp
  return {
    shouldTrigger: true,
    tablePersonCount,
    unpaidBalanceCents
  };
}

/**
 * Generate split payment link for WhatsApp sharing
 */
export function generateSplitPaymentLink(
  saleId: string,
  businessId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imboni.rw';
  return `${baseUrl}/split-bill/${saleId}?ref=whatsapp`;
}

/**
 * Auto-trigger WhatsApp split payment link
 * Only sends if conditions are met (>1 person + unpaid balance)
 */
export async function autoTriggerWhatsAppSplitPayment(
  saleId: string
): Promise<{ sent: boolean; reason?: string }> {
  // Check trigger conditions
  const conditions = await checkWhatsAppTriggerConditions(saleId);

  if (!conditions.shouldTrigger) {
    return {
      sent: false,
      reason: conditions.reason
    };
  }

  // Get sale details
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          currency: true
        }
      },
      table: true,
      customer: {
        select: {
          phone: true,
          name: true
        }
      }
    }
  });

  if (!sale) {
    return {
      sent: false,
      reason: 'Sale not found'
    };
  }

  // Generate split payment link
  const splitPaymentLink = generateSplitPaymentLink(saleId, sale.businessId);

  // Format message
  const currency = sale.business.currency || 'RWF';
  const unpaidAmount = conditions.unpaidBalanceCents! / 100;
  const tableName = sale.table?.number || 'your table';

  const message = `
🍽️ *Split Bill - ${sale.business.name}*

Table: ${tableName}
Remaining balance: ${formatCurrency(unpaidAmount, currency)}

${conditions.tablePersonCount} people at your table can split the bill easily:

👉 ${splitPaymentLink}

Each person can pay their share directly from their phone. No cash needed! 💳
  `.trim();

  // Send via WhatsApp (if customer phone available)
  if (sale.customer?.phone) {
    try {
      // Send via WhatsApp using existing notification service
      // Note: This will use the WhatsApp Cloud API or Twilio fallback
      const result = await NotificationService.sendSmartDiningSlip(
        sale.customer.phone,
        sale.business.name,
        `Split Bill - Table ${tableName}`,
        sale.businessId,
        true, // consentedWhatsApp
        undefined // No PDF for split payment link
      );

      // Log the trigger
      await prisma.splitPaymentWhatsAppTrigger.create({
        data: {
          saleId,
          triggeredAt: new Date(),
          tablePersonCount: conditions.tablePersonCount!,
          unpaidBalanceCents: conditions.unpaidBalanceCents!,
          recipientPhone: sale.customer.phone,
          linkSent: splitPaymentLink
        }
      });

      return {
        sent: true
      };
    } catch (error) {
      console.error('Failed to send WhatsApp split payment link:', error);
      return {
        sent: false,
        reason: 'WhatsApp send failed'
      };
    }
  }

  return {
    sent: false,
    reason: 'No customer phone number'
  };
}

/**
 * Check if WhatsApp has already been triggered for this sale
 * Prevents duplicate messages
 */
export async function hasWhatsAppBeenTriggered(saleId: string): Promise<boolean> {
  const trigger = await prisma.splitPaymentWhatsAppTrigger.findFirst({
    where: { saleId }
  });

  return !!trigger;
}

/**
 * Auto-trigger with duplicate prevention
 */
export async function autoTriggerWhatsAppSplitPaymentOnce(
  saleId: string
): Promise<{ sent: boolean; reason?: string }> {
  // Check if already triggered
  const alreadyTriggered = await hasWhatsAppBeenTriggered(saleId);

  if (alreadyTriggered) {
    return {
      sent: false,
      reason: 'WhatsApp already sent for this sale'
    };
  }

  // Trigger
  return autoTriggerWhatsAppSplitPayment(saleId);
}
