import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { RecipeService, RecipeError } from '@/lib/services/recipe.service'
import { updateDraftRecipeSchema } from '@/lib/validations/recipe.schema'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { ZodError } from 'zod'

/**
 * Recipe API - Get, Update, Delete by ID
 * 
 * GET /api/recipes/:id - Get a recipe by ID
 * PATCH /api/recipes/:id - Update a draft recipe
 * DELETE /api/recipes/:id - Delete a draft recipe
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
    if (req.method === 'GET') {
      const recipe = await RecipeService.getRecipe(recipeId, businessId)

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found', code: 'RECIPE_NOT_FOUND' })
      }

      return res.status(200).json(recipe)
    }

    if (req.method === 'PATCH') {
      const input = updateDraftRecipeSchema.parse(req.body)
      const recipe = await RecipeService.updateDraftRecipe(recipeId, businessId, input)
      return res.status(200).json(recipe)
    }

    if (req.method === 'DELETE') {
      await RecipeService.deleteDraftRecipe(recipeId, businessId)
      return res.status(204).end()
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
