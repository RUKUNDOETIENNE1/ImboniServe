import type { NextApiRequest, NextApiResponse } from 'next'
import { ContactService } from '@/lib/services/contact.service'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId, businessId } = ctx

  try {
    if (req.method === 'GET') {
      const { 
        type, 
        status, 
        city, 
        tags, 
        search, 
        assignedTo,
        page = '1',
        limit = '50',
      } = req.query

      const filters: any = {}

      if (type) {
        filters.type = Array.isArray(type) ? type : [type]
      }

      if (status) {
        filters.status = Array.isArray(status) ? status : [status]
      }

      if (city) {
        filters.city = city as string
      }

      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags as string]
      }

      if (search) {
        filters.search = search as string
      }

      if (assignedTo) {
        filters.assignedTo = assignedTo as string
      }

      const result = await ContactService.listContacts(
        businessId,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      )

      return res.status(200).json(result)
    }

    if (req.method === 'POST') {
      const contact = await ContactService.createContact(businessId, {
        ...req.body,
        createdBy: userId,
      })

      return res.status(201).json(contact)
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (error: any) {
    console.error('Contact API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
