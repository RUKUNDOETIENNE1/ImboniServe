import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10),
  notes: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check for admin role (you can adjust this based on your role system)
    const userRoles = session.user?.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OWNER')) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    // Validate request body
    const body = registerSchema.parse(req.body);

    // Create marketer
    const marketer = await ProfessionalMarketerService.createMarketer({
      name: body.name,
      email: body.email,
      phone: body.phone,
      userId: session.user?.id,
      onboardedBy: session.user?.id,
      notes: body.notes
    });

    logger.info('Marketer registered via API', {
      marketerId: marketer.id,
      registeredBy: session.user?.id
    });

    return res.status(201).json({
      success: true,
      marketer: {
        id: marketer.id,
        name: marketer.name,
        email: marketer.email,
        phone: marketer.phone,
        referralCode: marketer.referralCode,
        status: marketer.status,
        createdAt: marketer.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Marketer registration failed', { error });

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    // Check for unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (field === 'phone') {
        return res.status(409).json({ error: 'Phone number already registered' });
      }
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
