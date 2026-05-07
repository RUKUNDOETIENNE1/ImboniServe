import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { ContactService } from '@/lib/services/contact.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = (session.user as any).id
  const businessId = (session.user as any).businessId

  if (!businessId) {
    return res.status(403).json({ error: 'No business associated with user' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { contacts } = req.body

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts array' })
    }

    // Limit to 1000 contacts per import
    if (contacts.length > 1000) {
      return res.status(400).json({ 
        error: 'Maximum 1000 contacts per import. Please split your file.' 
      })
    }

    const result = await ContactService.bulkImport(businessId, contacts, userId)

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Bulk import error:', error)
    return res.status(500).json({ error: error.message || 'Import failed' })
  }
}
