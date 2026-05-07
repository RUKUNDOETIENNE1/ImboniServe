import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SiteBuilderService } from '@/lib/services/site-builder.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';
import { checkAICredits, consumeAICredits, AIFeature } from '@/lib/services/ai-credit.service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { type, ...params } = req.body;

  try {
    // Phase 2A: Check AI credits before generation
    const featureMap: Record<string, AIFeature> = {
      'menu_description': AIFeature.MENU_DESCRIPTION,
      'tagline': AIFeature.TAGLINE_GENERATOR,
      'promo': AIFeature.PROMO_TEXT
    };
    
    const aiFeature = featureMap[type] || AIFeature.SITE_BUILDER;
    const creditCheck = await checkAICredits(businessId, aiFeature);
    
    if (!creditCheck.allowed) {
      return res.status(402).json({
        error: 'Insufficient AI credits',
        message: creditCheck.message,
        creditsAvailable: creditCheck.creditsAvailable,
        creditsRequired: creditCheck.creditsRequired,
        resetDate: creditCheck.resetDate,
        upgradeRequired: true
      });
    }

    let result: string;

    switch (type) {
      case 'menu_description':
        result = await SiteBuilderService.generateMenuItemDescription(
          params.itemName,
          params.category,
          params.ingredients
        )
        break

      case 'tagline':
        result = await SiteBuilderService.generateTagline(
          params.businessName,
          params.businessType
        )
        break

      case 'promo':
        result = await SiteBuilderService.generatePromoText(
          params.businessName,
          params.occasion,
          params.details
        )
        break

      default:
        return res.status(400).json(errorResponse('Invalid generation type'))
    }

    // Phase 2A: Consume credits after successful generation
    await consumeAICredits(businessId, aiFeature, {
      generationType: type,
      resultLength: result.length
    });

    return res.status(200).json(successResponse({ text: result }));
  } catch (error: any) {
    if (error.message.includes('OpenAI')) {
      return res.status(503).json(errorResponse('AI service temporarily unavailable'))
    }
    throw error
  }
}

// Rate limiting: 10 generations per minute per business
async function rateLimitedHandler(req: NextApiRequest, res: NextApiResponse) {
  const { withRateLimit } = await import('@/lib/middleware/withRateLimit');
  return withRateLimit(withErrorHandler(handler), { maxRequests: 10, windowMs: 60000 })(req, res);
}

export default rateLimitedHandler
