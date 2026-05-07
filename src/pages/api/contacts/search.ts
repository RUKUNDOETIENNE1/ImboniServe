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

  const businessId = (session.user as any).businessId

  if (!businessId) {
    return res.status(403).json({ error: 'No business associated with user' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q, limit = '20' } = req.query

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' })
    }

    const contacts = await ContactService.searchContacts(
      businessId,
      q,
      parseInt(limit as string)
    )

    return res.status(200).json(contacts)
  } catch (error: any) {
    console.error('Contact search error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
