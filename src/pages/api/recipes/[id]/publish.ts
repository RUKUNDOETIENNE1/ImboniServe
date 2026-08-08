import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { RecipeService, RecipeError } from '@/lib/services/recipe.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

/**
 * Recipe Publish API
 * 
 * POST /api/recipes/:id/publish - Publish a draft recipe
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx
  const recipeId = req.query.id as string

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required', code: 'MISSING_ID' })
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const recipe = await RecipeService.publishRecipeVersion(recipeId, businessId)
    return res.status(200).json(recipe)
  } catch (error) {
    if (error instanceof RecipeError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      })
    }

    console.error('Recipe publish API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    })
  }
}

export default withRateLimit(
  requirePermission('menu.write')(handler),
  { windowMs: 60 * 1000, maxRequests: 50 }
)
