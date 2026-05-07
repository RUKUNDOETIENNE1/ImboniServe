import type { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { getPlatformFee, FeeType } from '@/lib/services/platform-fee.service'

function toFeeType(type: string): FeeType | null {
  switch (type) {
    case 'BUSINESS_COMMISSION':
      return FeeType.BUSINESS_COMMISSION
    case 'SUPPLIER_PLATFORM_FEE':
      return FeeType.SUPPLIER_PLATFORM_FEE
    case 'MARKETPLACE_COMMISSION':
      return FeeType.MARKETPLACE_COMMISSION
    case 'DIGITAL_PAYMENT_FEE':
      return FeeType.DIGITAL_PAYMENT_FEE
    case 'SPLIT_PAYMENT_FEE':
      return FeeType.SPLIT_PAYMENT_FEE
    case 'DIGITAL_TIPPING_FEE':
      return FeeType.DIGITAL_TIPPING_FEE
    default:
      return null
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { type } = req.query
  if (!type || typeof type !== 'string') {
    return res.status(400).json(errorResponse('Fee type is required'))
  }

  const feeType = toFeeType(type)
  if (!feeType) {
    return res.status(400).json(errorResponse('Invalid fee type'))
  }

  try {
    const percent = await getPlatformFee(feeType).catch(() => {
      // Safe defaults if config not present
      if (feeType === FeeType.DIGITAL_PAYMENT_FEE) return 5
      if (feeType === FeeType.DIGITAL_TIPPING_FEE) return 2.5
      if (feeType === FeeType.SPLIT_PAYMENT_FEE) return 1.5
      if (feeType === FeeType.BUSINESS_COMMISSION) return 5
      if (feeType === FeeType.SUPPLIER_PLATFORM_FEE) return 7.5
      if (feeType === FeeType.MARKETPLACE_COMMISSION) return 7
      return 0
    })

    return res.status(200).json(successResponse({ feeType, percent }))
  } catch (error: any) {
    console.error('[Fees] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to fetch fee'))
  }
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 30,
  windowMs: 60 * 1000,
})
