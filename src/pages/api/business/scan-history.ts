import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission.middleware';
import { resolveBusinessContext } from '@/lib/api/business-context';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ctx = await resolveBusinessContext(req, res);
  if (!ctx) return;

  const { userId } = ctx;

  try {

    // Fetch last 10 scans for this user
    const scans = await prisma.$queryRaw<Array<{
      id: string;
      created_at: Date;
      score: number;
    }>>`
      SELECT id, created_at, score
      FROM business_scans
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return res.status(200).json({ scans });
  } catch (error) {
    console.error('Scan history error:', error);
    return res.status(500).json({ error: 'Failed to fetch scan history' });
  }
}

export default requirePermission('settings.read')(handler);
