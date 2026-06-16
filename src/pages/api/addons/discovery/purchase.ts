import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { IremboPayService } from '@/lib/services/irembopay.service';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

const PRICING = {
  FEATURED: 800000,  // 8,000 RWF/month
  PREMIUM: 1500000   // 15,000 RWF/month
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  const roles: string[] = (session?.user as any)?.roles || [];
  if (!roles.some(r => ['OWNER', 'ADMIN'].includes(r))) {
    return res.status(403).json(forbiddenResponse());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tier } = req.body;

  if (!tier || !['FEATURED', 'PREMIUM'].includes(tier)) {
    return res.status(400).json(errorResponse('Invalid tier. Must be FEATURED or PREMIUM'));
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    });

    if (!business) {
      return res.status(404).json(errorResponse('Business not found'));
    }

    // Calculate amounts
    const grossAmountCents = PRICING[tier as keyof typeof PRICING];
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
      description: `Discovery ${tier} - Monthly Subscription - ${business.name}`,
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
            addon: 'discovery',
            tier,
            billingPeriod: 'monthly',
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
      tier
    }, `Discovery ${tier} payment initiated`));
  } catch (error: any) {
    throw error;
  }
}

export default withErrorHandler(handler);
