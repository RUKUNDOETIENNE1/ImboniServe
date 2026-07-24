import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { IremboPayService } from '@/lib/services/irembopay.service';
import { prisma } from '@/lib/prisma';
import { getPackageByCode } from '@/lib/services/credits/credit-purchase.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { packageCode } = req.body;

  if (!packageCode) {
    return res.status(400).json(errorResponse('packageCode is required'));
  }

  const pkg = await getPackageByCode(packageCode);
  if (!pkg || !pkg.isActive) {
    return res.status(400).json(errorResponse('Invalid or inactive package'));
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });

  if (!business) {
    return res.status(404).json(errorResponse('Business not found'));
  }

  const grossAmountCents = pkg.priceCents;
  const { vatAmountCents, exVatAmountCents } = IremboPayService.calculateVATAmounts(grossAmountCents);
  const gatewayFeeEstimatedCents = IremboPayService.calculateGatewayFee(grossAmountCents);
  const netToBusinessCents = IremboPayService.calculateNetToBusinessCents(
    grossAmountCents,
    vatAmountCents,
    gatewayFeeEstimatedCents
  );

  const invoice = await IremboPayService.createInvoice({
    businessId,
    amountCents: grossAmountCents,
    description: `AI Credits Purchase (${pkg.name}) - ${business.name}`,
    customer: {
      email: (session.user as any).email,
      phoneNumber: (session.user as any).phone,
      name: (session.user as any).name,
    },
  });

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
          packageCode: pkg.code,
          credits: pkg.credits,
          bonusCredits: pkg.bonusCredits,
        },
      },
    },
  });

  return res.status(200).json(successResponse({
    invoiceNumber: invoice.invoiceNumber,
    paymentLinkUrl: invoice.paymentLinkUrl,
    transactionId: transaction.id,
    expiresAt: invoice.expiryAt,
    amount: grossAmountCents / 100,
    credits: pkg.credits,
    bonusCredits: pkg.bonusCredits,
    packageName: pkg.name,
  }, `AI credits purchase initiated (${pkg.name})`));
}

export default withErrorHandler(handler);
