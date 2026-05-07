import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' })
    }

    const mediaAsset = await (prisma as any).mediaAsset.findUnique({
      where: { id },
    })

    if (!mediaAsset) {
      return res.status(404).json({ error: 'Media not found' })
    }

    // Get public URL and redirect
    const publicUrl = StorageService.getPublicUrl(mediaAsset.storageKey)
    
    // For local storage, serve the file directly
    if (publicUrl.startsWith('/uploads/')) {
      return res.redirect(publicUrl)
    }

    // For Supabase, redirect to the public URL
    return res.redirect(publicUrl)
  } catch (error: any) {
    console.error('Media fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch media' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const businessId = (session?.user as any)?.businessId;

    if (!session?.user || !businessId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' });
    }

    // Get media asset with business ownership check
    const mediaAsset = await (prisma as any).mediaAsset.findFirst({
      where: { 
        id,
        businessId 
      },
    });

    if (!mediaAsset) {
      return res.status(404).json({ error: 'Media not found or access denied' });
    }

    // Delete from storage
    try {
      await StorageService.deleteFile(mediaAsset.storageKey);
      if (mediaAsset.thumbnailKey) {
        await StorageService.deleteFile(mediaAsset.thumbnailKey);
      }
    } catch (storageError) {
      console.warn('Storage deletion failed (continuing anyway):', storageError);
    }

    // Delete from database
    await (prisma as any).mediaAsset.delete({
      where: { id }
    });

    // Decrement storage usage (Phase 2 usage tracking)
    const sizeToRemove = mediaAsset.sizeBytes + (mediaAsset.thumbnailKey ? Math.round(mediaAsset.sizeBytes * 0.1) : 0);
    await prisma.business.update({
      where: { id: businessId },
      data: {
        storageUsedBytes: {
          decrement: sizeToRemove
        }
      }
    });

    return res.status(200).json({ 
      success: true,
      message: 'Media deleted successfully',
      freedBytes: sizeToRemove
    });

  } catch (error: any) {
    console.error('Media deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete media' });
  }
}
