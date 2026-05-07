import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId } = req.query;

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Check if QR ordering is enabled for this branch
    const business = await prisma.business.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        enableQRInVenue: true,
        enableQRRemote: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.enableQRInVenue && !business.enableQRRemote) {
      return res.status(403).json({ error: 'QR ordering not enabled for this business' });
    }

    // Fetch available menu items with smart intelligence fields
    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessId: branchId,
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        category: true,
        ingredients: true,
        allergens: true,
        dietaryTags: true,
        spiceLevel: true,
        portionSize: true,
        prepTimeMinutes: true,
        imageReal: true,
        translations: {
          select: {
            locale: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        category: 'asc'
      }
    });

    return res.status(200).json({
      branchId: business.id,
      branchName: business.name,
      address: business.address,
      city: business.city,
      phone: business.phone,
      menu: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
