import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';
import { isValidCurrency } from '@/lib/utils/currency';
import { isValidTimezone } from '@/lib/utils/timezone';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json(unauthorizedResponse());
  }

  const userId = (session.user as any).id;

  if (req.method === 'GET') {
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        locale: true,
        preferredCurrency: true
      }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    return res.status(200).json(successResponse(user));
  }

  if (req.method === 'PATCH') {
    // Update user preferences
    const { timezone, locale, preferredCurrency } = req.body;

    // Validate inputs
    if (timezone && !isValidTimezone(timezone)) {
      return res.status(400).json(errorResponse('Invalid timezone'));
    }

    if (preferredCurrency && !isValidCurrency(preferredCurrency)) {
      return res.status(400).json(errorResponse('Invalid currency code'));
    }

    if (locale && !['en', 'fr', 'rw'].includes(locale)) {
      return res.status(400).json(errorResponse('Invalid locale. Must be en, fr, or rw'));
    }

    // Build update object
    const updateData: any = {};
    if (timezone !== undefined) updateData.timezone = timezone;
    if (locale !== undefined) updateData.locale = locale;
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(errorResponse('No preferences provided'));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        timezone: true,
        locale: true,
        preferredCurrency: true
      }
    });

    return res.status(200).json(successResponse(updatedUser, 'Preferences updated successfully'));
  }

  return res.status(405).json(errorResponse('Method not allowed'));
}

export default withErrorHandler(handler);
