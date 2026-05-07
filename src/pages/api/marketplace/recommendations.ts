import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { AISupplierRecommendationService } from '@/lib/services/ai-supplier-recommendation.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Try to get session, but don't require it
      const session = await getServerSession(req, res, authOptions)
      const user = session?.user as any
      const businessId = user?.businessId
      
      // If no businessId, return empty recommendations (browsing mode)
      if (!businessId) {
        return res.status(200).json({
          recommendations: [],
          insights: {
            nearestSupplier: null,
            bestPricing: null,
            mostReliable: null
          }
        })
      }
      const { category, productName, detailed } = req.query

      if (detailed === 'true') {
        const result = await AISupplierRecommendationService.getSmartSupplierSuggestions(
          businessId,
          productName as string | undefined
        )
        return res.status(200).json(result)
      }

      const recommendations = await AISupplierRecommendationService.getRecommendations({
        businessId,
        productCategory: category as string | undefined,
        maxResults: 10,
        includeReasons: true
      })

      return res.status(200).json(recommendations)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Supplier recommendations API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
