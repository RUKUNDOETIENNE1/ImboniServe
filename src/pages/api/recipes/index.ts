import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { RecipeService, RecipeError } from '@/lib/services/recipe.service'
import { createRecipeSchema, listRecipesQuerySchema } from '@/lib/validations/recipe.schema'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { ZodError } from 'zod'

/**
 * Recipe API - List and Create
 * 
 * GET /api/recipes - List recipes for the business
 * POST /api/recipes - Create a new recipe (draft)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    if (req.method === 'GET') {
      const query = listRecipesQuerySchema.parse(req.query)

      const result = await RecipeService.listRecipes(businessId, {
        menuItemId: query.menuItemId,
        isActive: query.isActive,
        lifecycleState: query.lifecycleState,
        search: query.search,
        page: query.page,
        limit: query.limit,
      })

      return res.status(200).json(result)
    }

    if (req.method === 'POST') {
      const input = createRecipeSchema.parse(req.body)
      const recipe = await RecipeService.createRecipe(businessId, input)
      return res.status(201).json(recipe)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      })
    }

    if (error instanceof RecipeError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      })
    }

    console.error('Recipe API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    })
  }
}

export default withRateLimit(
  requirePermission('menu.read')(handler),
  { windowMs: 60 * 1000, maxRequests: 100 }
)
