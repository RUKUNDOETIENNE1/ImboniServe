import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const config = await prisma.feeConfiguration.findFirst({
        where: { businessId: undefined },
      });

      if (!config) {
        return res.status(200).json({
          digitalFeeEnabled: true,
          digitalFeePercent: 5.0,
          digitalFeeMin: 100,
          digitalFeeMax: 3500,
          cashDiscountMode: false,
          marketplaceCommStd: 7.0,
          marketplaceCommLaunch: 10.0,
          marketplaceCommHV: 5.0,
          vatRate: 18.0,
          whtEnabled: true,
          whtRate: 15.0,
        });
      }

      return res.status(200).json(config);
    } catch (error) {
      console.error('Error fetching fee config:', error);
      return res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        digitalFeeEnabled,
        digitalFeePercent,
        digitalFeeMin,
        digitalFeeMax,
        cashDiscountMode,
        marketplaceCommStd,
        marketplaceCommLaunch,
        marketplaceCommHV,
        vatRate,
        whtEnabled,
        whtRate,
      } = req.body;

      const config = await prisma.feeConfiguration.upsert({
        where: { businessId: undefined },
        create: {
          digitalFeeEnabled,
          digitalFeePercent,
          digitalFeeMin,
          digitalFeeMax,
          cashDiscountMode,
          marketplaceCommStd,
          marketplaceCommLaunch,
          marketplaceCommHV,
          vatRate,
          whtEnabled,
          whtRate,
        },
        update: {
          digitalFeeEnabled,
          digitalFeePercent,
          digitalFeeMin,
          digitalFeeMax,
          cashDiscountMode,
          marketplaceCommStd,
          marketplaceCommLaunch,
          marketplaceCommHV,
          vatRate,
          whtEnabled,
          whtRate,
        },
      });

      return res.status(200).json(config);
    } catch (error) {
      console.error('Error saving fee config:', error);
      return res.status(500).json({ error: 'Failed to save configuration' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
