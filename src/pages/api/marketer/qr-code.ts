import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { QRCodeService } from '@/lib/services/qr-code.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find marketer by email
    const marketer = await ProfessionalMarketerService.getMarketerByEmail(session.user?.email || '');
    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (marketer.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Marketer account is not active' });
    }

    // Get query parameters
    const { format = 'dataURL', width = '400', download = 'false' } = req.query;

    // Generate base URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'];
    const baseUrl = `${protocol}://${host}`;

    // Generate QR code
    const qrCode = await QRCodeService.generateReferralQR(
      marketer.referralCode,
      baseUrl,
      {
        width: parseInt(width as string),
        brandColor: '#1E40AF' // Imboni blue
      }
    );

    logger.info('QR code generated', {
      marketerId: marketer.id,
      format,
      width
    });

    // If download requested, send as file
    if (download === 'true') {
      const buffer = Buffer.from(qrCode.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="referral-qr-${marketer.referralCode}.png"`);
      return res.send(buffer);
    }

    // Otherwise return JSON
    return res.status(200).json({
      success: true,
      qrCode,
      referralCode: marketer.referralCode,
      referralUrl: `${baseUrl}/signup?m=${marketer.referralCode}`
    });
  } catch (error: any) {
    logger.error('QR code generation failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
