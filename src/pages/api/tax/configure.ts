import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { TaxService } from '@/lib/services/tax.service'
import { TaxType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const taxes = await TaxService.getActiveTaxes(businessId)
      return res.status(200).json({ taxes })
    }

    if (req.method === 'POST') {
      const roles: string[] = (session?.user as any)?.roles || []
      if (!roles.some(r => ['OWNER', 'ADMIN'].includes(r))) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const { action, countryCode, taxType, name, rate, isInclusive } = req.body

      if (action === 'init') {
        await TaxService.createDefaultTaxConfig(businessId, countryCode || 'RW')
        const taxes = await TaxService.getActiveTaxes(businessId)
        return res.status(200).json({ taxes, message: 'Default tax configuration created' })
      }

      if (action === 'add_service_charge') {
        await TaxService.addServiceCharge(businessId, rate || 10.0)
        const taxes = await TaxService.getActiveTaxes(businessId)
        return res.status(200).json({ taxes, message: 'Service charge added' })
      }

      if (action === 'add_tourism_levy') {
        await TaxService.addTourismLevy(businessId, rate || 1.5)
        const taxes = await TaxService.getActiveTaxes(businessId)
        return res.status(200).json({ taxes, message: 'Tourism levy added' })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Tax configuration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
