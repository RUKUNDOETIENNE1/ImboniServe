import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { RevenueEventService } from '@/lib/services/revenue-event.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = session.user?.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OWNER')) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    // Get query parameters
    const { limit = '100', type, entityType, entityId } = req.query;

    let events;

    // Route to appropriate query method based on parameters
    if (type) {
      events = await RevenueEventService.getEventsByType(type as any, parseInt(limit as string));
    } else if (entityType && entityId) {
      events = await RevenueEventService.getEventsForEntity(entityType as string, entityId as string, parseInt(limit as string));
    } else {
      events = await RevenueEventService.getRecentEvents(parseInt(limit as string));
    }

    logger.info('Admin revenue events accessed', {
      accessedBy: session.user?.id
    });

    return res.status(200).json({
      success: true,
      events
    });
  } catch (error: any) {
    logger.error('Admin revenue events fetch failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
