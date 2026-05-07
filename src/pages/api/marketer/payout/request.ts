import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { MarketerPayoutService } from '@/lib/services/marketer-payout.service';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

const payoutRequestSchema = z.object({
  amountCents: z.number().min(1000000), // 10,000 RWF minimum
  method: z.enum(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER']),
  recipientPhone: z.string().optional(),
  recipientBank: z.string().optional(),
  recipientAccount: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const body = payoutRequestSchema.parse(req.body);

    // Find marketer by email
    const marketer = await ProfessionalMarketerService.getMarketerByEmail(session.user?.email || '');
    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (marketer.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Marketer account is not active' });
    }

    // Validate recipient info based on method
    if ((body.method === 'MTN_MOBILE_MONEY' || body.method === 'AIRTEL_MONEY') && !body.recipientPhone) {
      return res.status(400).json({ error: 'Recipient phone required for mobile money' });
    }

    if (body.method === 'BANK_TRANSFER' && (!body.recipientBank || !body.recipientAccount)) {
      return res.status(400).json({ error: 'Bank and account required for bank transfer' });
    }

    // Request payout
    const payout = await MarketerPayoutService.requestPayout({
      marketerId: marketer.id,
      amountCents: body.amountCents,
      method: body.method,
      recipientPhone: body.recipientPhone,
      recipientBank: body.recipientBank,
      recipientAccount: body.recipientAccount
    });

    logger.info('Payout requested via API', {
      payoutId: payout.id,
      marketerId: marketer.id,
      amountCents: body.amountCents,
      method: body.method
    });

    return res.status(201).json({
      success: true,
      payout: {
        id: payout.id,
        amountCents: payout.amountCents,
        currency: payout.currency,
        method: payout.method,
        status: payout.status,
        createdAt: payout.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Payout request failed', { error });

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
