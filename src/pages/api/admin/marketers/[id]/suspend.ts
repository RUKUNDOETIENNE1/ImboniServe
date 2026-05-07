import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

const suspendSchema = z.object({
  reason: z.string().min(5).max(500)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid marketer ID' });
    }

    // Check if user is authenticated and has admin role
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = session.user?.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OWNER')) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    // Validate request body
    const body = suspendSchema.parse(req.body);

    // Suspend marketer
    const marketer = await ProfessionalMarketerService.suspendMarketer(
      id,
      body.reason,
      session.user?.id || 'unknown'
    );

    logger.info('Marketer suspended via API', {
      marketerId: id,
      suspendedBy: session.user?.id,
      reason: body.reason
    });

    return res.status(200).json({
      success: true,
      marketer
    });
  } catch (error: any) {
    logger.error('Marketer suspension failed', { error });

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
