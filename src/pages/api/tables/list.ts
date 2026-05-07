import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Resolve or link businessId for the user
    let userRecord = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, businessId: true }
    });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userRecord.businessId) {
      const owned = await prisma.business.findFirst({ where: { ownerId: userRecord.id }, select: { id: true } });
      if (owned) {
        await prisma.user.update({ where: { id: userRecord.id }, data: { businessId: owned.id } });
        userRecord = { ...userRecord, businessId: owned.id } as typeof userRecord;
      } else {
        return res.status(404).json({ error: 'Business not found' });
      }
    }

    const tables = await prisma.table.findMany({
      where: { businessId: userRecord.businessId! },
      select: {
        id: true,
        number: true,
        capacity: true
      },
      orderBy: { number: 'asc' }
    });

    return res.status(200).json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
