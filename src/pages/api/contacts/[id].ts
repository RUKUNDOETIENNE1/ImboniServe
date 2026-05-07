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

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' })
  }

  try {
    if (req.method === 'GET') {
      const contact = await ContactService.getContact(businessId, id)

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      return res.status(200).json(contact)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const contact = await ContactService.updateContact(businessId, {
        id,
        ...req.body,
      })

      return res.status(200).json(contact)
    }

    if (req.method === 'DELETE') {
      await ContactService.deleteContact(businessId, id)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Contact API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
