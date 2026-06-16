import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { IremboPayService } from '@/lib/services/irembopay.service';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

const CREDIT_PACKS = {
  small: { credits: 20, price: 1000000 },   // 10,000 RWF for 20 credits
  medium: { credits: 50, price: 2500000 },  // 25,000 RWF for 50 credits
  large: { credits: 100, price: 4500000 }   // 45,000 RWF for 100 credits (10% discount)
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pack } = req.body;

  if (!pack || !['small', 'medium', 'large'].includes(pack)) {
    return res.status(400).json(errorResponse('Invalid pack. Must be small, medium, or large'));
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    });

    if (!business) {
      return res.status(404).json(errorResponse('Business not found'));
    }

    const packDetails = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
    const grossAmountCents = packDetails.price;
    const { vatAmountCents, exVatAmountCents } = IremboPayService.calculateVATAmounts(grossAmountCents);
    const gatewayFeeEstimatedCents = IremboPayService.calculateGatewayFee(grossAmountCents);
    const netToBusinessCents = IremboPayService.calculateNetToBusinessCents(
      grossAmountCents,
      vatAmountCents,
      gatewayFeeEstimatedCents
    );

    // Create invoice
    const invoice = await IremboPayService.createInvoice({
      businessId,
      amountCents: grossAmountCents,
      description: `AI Credits Top-up (${packDetails.credits} credits) - ${business.name}`,
      customer: {
        email: (session.user as any).email,
        phoneNumber: (session.user as any).phone,
        name: (session.user as any).name
      }
    });

    // Store transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        businessId,
        invoiceNumber: invoice.invoiceNumber,
        transactionId: invoice.transactionId,
        gateway: 'IREMBO_PAY',
        paymentMethod: 'WEB',
        status: 'PENDING',
        amountCents: grossAmountCents,
        currency: 'RWF',
        vatAmountCents,
        exVatAmountCents,
        gatewayFeeEstimatedCents,
        netToBusinessCents,
        paymentLinkUrl: invoice.paymentLinkUrl,
        expiryAt: invoice.expiryAt ? new Date(invoice.expiryAt) : null,
        payerName: (session.user as any).name,
        payerEmail: (session.user as any).email,
        payerPhone: (session.user as any).phone,
        rawRequest: {
          ...invoice,
          meta: {
            type: 'addon',
            addon: 'ai_credits',
            credits: packDetails.credits,
            pack,
          },
        }
      }
    });

    return res.status(200).json(successResponse({
      invoiceNumber: invoice.invoiceNumber,
      paymentLinkUrl: invoice.paymentLinkUrl,
      transactionId: transaction.id,
      expiresAt: invoice.expiryAt,
      amount: grossAmountCents / 100,
      credits: packDetails.credits
    }, `AI credits top-up initiated (${packDetails.credits} credits)`));
  } catch (error: any) {
    throw error;
  }
}

export default withErrorHandler(handler);
