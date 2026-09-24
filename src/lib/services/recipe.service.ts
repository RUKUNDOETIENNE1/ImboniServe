import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  RecipeLifecycleState,
  type CreateRecipeInput,
  type UpdateDraftRecipeInput,
  type DuplicateRecipeInput,
  type RecipeIngredientInput,
} from '@/lib/validations/recipe.schema'

// Error types for deterministic error handling
export class RecipeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'RecipeError'
  }
}

export class RecipeNotFoundError extends RecipeError {
  constructor(recipeId: string) {
    super(`Recipe not found: ${recipeId}`, 'RECIPE_NOT_FOUND', 404)
  }
}

export class RecipeAccessDeniedError extends RecipeError {
  constructor() {
    super('Access denied to this recipe', 'RECIPE_ACCESS_DENIED', 403)
  }
}

export class RecipeInvalidStateError extends RecipeError {
  constructor(currentState: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} recipe in ${currentState} state`,
      'RECIPE_INVALID_STATE',
      400
    )
  }
}

export class RecipeValidationError extends RecipeError {
  constructor(message: string) {
    super(message, 'RECIPE_VALIDATION_ERROR', 400)
  }
}

export class RecipeCircularDependencyError extends RecipeError {
  constructor(recipeId: string, subRecipeId: string) {
    super(
      `Circular dependency detected: Recipe ${recipeId} cannot include ${subRecipeId}`,
      'RECIPE_CIRCULAR_DEPENDENCY',
      400
    )
  }
}

// Internal type for recipe with lifecycle state
interface RecipeWithState {
  id: string
  businessId: string
  name: string
  yieldQuantity: number
  yieldUnit: string
  version: number
  isActive: boolean
  costCentsCached: number | null
  costCalculatedAt: Date | null
  costStale: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
  lifecycleState: RecipeLifecycleState
}

/**
 * RecipeService - Sole owner of Recipe mutations
 * 
 * This service is the ONLY legal owner of Recipe mutations.
 * No direct Prisma writes to Recipe should occur outside this service.
 * 
 * Lifecycle states:
 * - DRAFT: Can be edited, not yet published
 * - PUBLISHED: Immutable, active version
 * - ARCHIVED: Immutable, no longer active
 */
export class RecipeService {
  /**
   * Determine lifecycle state from recipe data
   * Since we don't have a lifecycleState column, we derive it:
   * - version === 1 && isActive === true && no published marker = DRAFT
   * - isActive === true && has been published = PUBLISHED
   * - isActive === false = ARCHIVED
   * 
   * For simplicity, we use a convention:
   * - notes field contains "__DRAFT__" prefix for drafts
   * - notes field contains "__PUBLISHED__" prefix for published
   * - isActive === false means ARCHIVED
   */
  private static getLifecycleState(recipe: {
    isActive: boolean
    notes: string | null
  }): RecipeLifecycleState {
    if (!recipe.isActive) {
      return RecipeLifecycleState.ARCHIVED
    }
    if (recipe.notes?.startsWith('__PUBLISHED__')) {
      return RecipeLifecycleState.PUBLISHED
    }
    return RecipeLifecycleState.DRAFT
  }

  private static setLifecycleMarker(
    notes: string | null | undefined,
    state: RecipeLifecycleState
  ): string {
    // Remove any existing lifecycle markers
    const cleanNotes = (notes || '')
      .replace(/^__DRAFT__\s*/, '')
      .replace(/^__PUBLISHED__\s*/, '')
      .trim()

    switch (state) {
      case RecipeLifecycleState.DRAFT:
        return cleanNotes ? `__DRAFT__ ${cleanNotes}` : '__DRAFT__'
      case RecipeLifecycleState.PUBLISHED:
        return cleanNotes ? `__PUBLISHED__ ${cleanNotes}` : '__PUBLISHED__'
      case RecipeLifecycleState.ARCHIVED:
        return cleanNotes
      default:
        return cleanNotes
    }
  }

  private static getUserVisibleNotes(notes: string | null): string | null {
    if (!notes) return null
    return notes
      .replace(/^__DRAFT__\s*/, '')
      .replace(/^__PUBLISHED__\s*/, '')
      .trim() || null
  }

  /**
   * Validate business ownership of a recipe
   */
  private static async validateBusinessOwnership(
    recipeId: string,
    businessId: string
  ): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { businessId: true },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    if (recipe.businessId !== businessId) {
      throw new RecipeAccessDeniedError()
    }
  }

  /**
   * Validate that a menu item belongs to the business
   */
  private static async validateMenuItemOwnership(
    menuItemId: string,
    businessId: string
  ): Promise<void> {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: menuItemId, businessId },
    })

    if (!menuItem) {
      throw new RecipeValidationError(
        `Menu item ${menuItemId} not found or does not belong to this business`
      )
    }
  }

  /**
   * Validate that inventory items belong to the business
   */
  private static async validateIngredientOwnership(
    ingredients: RecipeIngredientInput[],
    businessId: string
  ): Promise<void> {
    const inventoryItemIds = ingredients
      .filter((i) => i.inventoryItemId)
      .map((i) => i.inventoryItemId as string)

    if (inventoryItemIds.length > 0) {
      const items = await prisma.inventoryItem.findMany({
        where: {
          id: { in: inventoryItemIds },
          businessId,
        },
        select: { id: true },
      })

      const foundIds = new Set(items.map((i) => i.id))
      const missingIds = inventoryItemIds.filter((id) => !foundIds.has(id))

      if (missingIds.length > 0) {
        throw new RecipeValidationError(
          `Inventory items not found or do not belong to this business: ${missingIds.join(', ')}`
        )
      }
    }
  }

  /**
   * Validate sub-recipes belong to the business and detect circular dependencies
   */
  private static async validateSubRecipes(
    ingredients: RecipeIngredientInput[],
    businessId: string,
    currentRecipeId?: string
  ): Promise<void> {
    const subRecipeIds = ingredients
      .filter((i) => i.subRecipeId)
      .map((i) => i.subRecipeId as string)

    if (subRecipeIds.length === 0) return

    // Check ownership
    const subRecipes = await prisma.recipe.findMany({
      where: {
        id: { in: subRecipeIds },
        businessId,
      },
      select: { id: true },
    })

    const foundIds = new Set(subRecipes.map((r) => r.id))
    const missingIds = subRecipeIds.filter((id) => !foundIds.has(id))

    if (missingIds.length > 0) {
      throw new RecipeValidationError(
        `Sub-recipes not found or do not belong to this business: ${missingIds.join(', ')}`
      )
    }

    // Check for circular dependencies
    if (currentRecipeId) {
      for (const subRecipeId of subRecipeIds) {
        const hasCircular = await this.detectCircularDependency(
          subRecipeId,
          currentRecipeId,
          new Set()
        )
        if (hasCircular) {
          throw new RecipeCircularDependencyError(currentRecipeId, subRecipeId)
        }
      }
    }
  }

  /**
   * Detect circular dependency in sub-recipe chain
   */
  private static async detectCircularDependency(
    recipeId: string,
    targetId: string,
    visited: Set<string>
  ): Promise<boolean> {
    if (recipeId === targetId) return true
    if (visited.has(recipeId)) return false

    visited.add(recipeId)

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId, subRecipeId: { not: null } },
      select: { subRecipeId: true },
    })

    for (const ingredient of ingredients) {
      if (ingredient.subRecipeId) {
        const hasCircular = await this.detectCircularDependency(
          ingredient.subRecipeId,
          targetId,
          visited
        )
        if (hasCircular) return true
      }
    }

    return false
  }

  /**
   * Validate no duplicate ingredient rows
   */
  private static validateNoDuplicateIngredients(
    ingredients: RecipeIngredientInput[]
  ): void {
    const seen = new Set<string>()

    for (const ingredient of ingredients) {
      const key = ingredient.inventoryItemId || ingredient.subRecipeId || ''
      if (seen.has(key)) {
        throw new RecipeValidationError(
          `Duplicate ingredient detected: ${key}`
        )
      }
      seen.add(key)
    }
  }

  /**
   * Create a new recipe (always starts as DRAFT)
   */
  static async createRecipe(
    businessId: string,
    input: CreateRecipeInput
  ): Promise<RecipeWithState> {
    // Validate menu item ownership if provided
    if (input.menuItemId) {
      await this.validateMenuItemOwnership(input.menuItemId, businessId)

      // Check if menu item already has a recipe
      const existingRecipe = await prisma.menuItem.findFirst({
        where: { id: input.menuItemId, recipeId: { not: null } },
        select: { recipeId: true },
      })

      if (existingRecipe?.recipeId) {
        throw new RecipeValidationError(
          `Menu item already has a recipe: ${existingRecipe.recipeId}`
        )
      }
    }

    // Validate ingredients
    if (input.ingredients && input.ingredients.length > 0) {
      this.validateNoDuplicateIngredients(input.ingredients)
      await this.validateIngredientOwnership(input.ingredients, businessId)
      await this.validateSubRecipes(input.ingredients, businessId)
    }

    // Create recipe with ingredients in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          businessId,
          name: input.name,
          yieldQuantity: input.yieldQuantity,
          yieldUnit: input.yieldUnit,
          notes: this.setLifecycleMarker(input.notes, RecipeLifecycleState.DRAFT),
          version: 1,
          isActive: true,
          costStale: true,
          ingredients: input.ingredients && input.ingredients.length > 0
            ? {
                create: input.ingredients.map((ing, index) => ({
                  inventoryItemId: ing.inventoryItemId || null,
                  subRecipeId: ing.subRecipeId || null,
                  quantity: ing.quantity,
                  unit: ing.unit,
                  yieldFactor: ing.yieldFactor,
                  isOptional: ing.isOptional,
                  displayOrder: ing.displayOrder ?? index,
                })),
              }
            : undefined,
        },
        include: {
          ingredients: {
            include: {
              inventoryItem: { select: { id: true, name: true, unit: true } },
              subRecipe: { select: { id: true, name: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          menuItem: { select: { id: true, name: true } },
        },
      })

      // Link to menu item if provided
      if (input.menuItemId) {
        await tx.menuItem.update({
          where: { id: input.menuItemId },
          data: { recipeId: newRecipe.id },
        })
      }

      return newRecipe
    })

    return {
      ...recipe,
      notes: this.getUserVisibleNotes(recipe.notes),
      lifecycleState: RecipeLifecycleState.DRAFT,
    } as RecipeWithState
  }

  /**
   * Update a draft recipe (only drafts can be edited)
   */
  static async updateDraftRecipe(
    recipeId: string,
    businessId: string,
    input: UpdateDraftRecipeInput
  ): Promise<RecipeWithState> {
    await this.validateBusinessOwnership(recipeId, businessId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { isActive: true, notes: true },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    const currentState = this.getLifecycleState(recipe)

    if (currentState !== RecipeLifecycleState.DRAFT) {
      throw new RecipeInvalidStateError(currentState, 'edit')
    }

    // Validate menu item ownership if changing
    if (input.menuItemId !== undefined && input.menuItemId !== null) {
      await this.validateMenuItemOwnership(input.menuItemId, businessId)
    }

    // Validate ingredients if provided
    if (input.ingredients && input.ingredients.length > 0) {
      this.validateNoDuplicateIngredients(input.ingredients)
      await this.validateIngredientOwnership(input.ingredients, businessId)
      await this.validateSubRecipes(input.ingredients, businessId, recipeId)
    }

    // Update recipe in a transaction
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // If ingredients are being replaced, delete existing ones
      if (input.ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({
          where: { recipeId },
        })
      }

      // Get current menu item link
      const currentMenuItem = await tx.menuItem.findFirst({
        where: { recipeId },
        select: { id: true },
      })

      // Update recipe
      const updated = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          name: input.name,
          yieldQuantity: input.yieldQuantity,
          yieldUnit: input.yieldUnit,
          notes: input.notes !== undefined
            ? this.setLifecycleMarker(input.notes, RecipeLifecycleState.DRAFT)
            : undefined,
          costStale: true,
          ingredients: input.ingredients && input.ingredients.length > 0
            ? {
                create: input.ingredients.map((ing, index) => ({
                  inventoryItemId: ing.inventoryItemId || null,
                  subRecipeId: ing.subRecipeId || null,
                  quantity: ing.quantity,
                  unit: ing.unit,
                  yieldFactor: ing.yieldFactor,
                  isOptional: ing.isOptional,
                  displayOrder: ing.displayOrder ?? index,
                })),
              }
            : undefined,
        },
        include: {
          ingredients: {
            include: {
              inventoryItem: { select: { id: true, name: true, unit: true } },
              subRecipe: { select: { id: true, name: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          menuItem: { select: { id: true, name: true } },
        },
      })

      // Handle menu item association changes
      if (input.menuItemId !== undefined) {
        // Unlink current menu item if exists
        if (currentMenuItem && currentMenuItem.id !== input.menuItemId) {
          await tx.menuItem.update({
            where: { id: currentMenuItem.id },
            data: { recipeId: null },
          })
        }

        // Link new menu item if provided
        if (input.menuItemId) {
          await tx.menuItem.update({
            where: { id: input.menuItemId },
            data: { recipeId: recipeId },
          })
        }
      }

      return updated
    })

    return {
      ...updatedRecipe,
      notes: this.getUserVisibleNotes(updatedRecipe.notes),
      lifecycleState: RecipeLifecycleState.DRAFT,
    } as RecipeWithState
  }

  /**
   * Publish a recipe (creates a new immutable version)
   * 
   * Rules:
   * - Draft recipes become published
   * - Published recipes create a new version
   * - Archived recipes cannot be published
   */
  static async publishRecipeVersion(
    recipeId: string,
    businessId: string
  ): Promise<RecipeWithState> {
    await this.validateBusinessOwnership(recipeId, businessId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: true,
      },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    const currentState = this.getLifecycleState(recipe)

    if (currentState === RecipeLifecycleState.ARCHIVED) {
      throw new RecipeInvalidStateError(currentState, 'publish')
    }

    // Validate recipe has at least one ingredient
    if (recipe.ingredients.length === 0) {
      throw new RecipeValidationError('Cannot publish recipe without ingredients')
    }

    // If already published, create a new version
    if (currentState === RecipeLifecycleState.PUBLISHED) {
      throw new RecipeInvalidStateError(
        currentState,
        'publish (recipe is already published - create a new draft to make changes)'
      )
    }

    // Publish the draft
    const publishedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        notes: this.setLifecycleMarker(
          this.getUserVisibleNotes(recipe.notes),
          RecipeLifecycleState.PUBLISHED
        ),
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true } },
            subRecipe: { select: { id: true, name: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        menuItem: { select: { id: true, name: true } },
      },
    })

    return {
      ...publishedRecipe,
      notes: this.getUserVisibleNotes(publishedRecipe.notes),
      lifecycleState: RecipeLifecycleState.PUBLISHED,
    } as RecipeWithState
  }

  /**
   * Archive a recipe (deactivate)
   */
  static async archiveRecipe(
    recipeId: string,
    businessId: string
  ): Promise<RecipeWithState> {
    await this.validateBusinessOwnership(recipeId, businessId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { isActive: true, notes: true },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    const currentState = this.getLifecycleState(recipe)

    if (currentState === RecipeLifecycleState.ARCHIVED) {
      throw new RecipeInvalidStateError(currentState, 'archive')
    }

    // Archive the recipe and unlink from menu item
    const archivedRecipe = await prisma.$transaction(async (tx) => {
      // Unlink from menu item
      await tx.menuItem.updateMany({
        where: { recipeId },
        data: { recipeId: null },
      })

      // Archive recipe
      return tx.recipe.update({
        where: { id: recipeId },
        data: {
          isActive: false,
          notes: this.setLifecycleMarker(
            this.getUserVisibleNotes(recipe.notes),
            RecipeLifecycleState.ARCHIVED
          ),
        },
        include: {
          ingredients: {
            include: {
              inventoryItem: { select: { id: true, name: true, unit: true } },
              subRecipe: { select: { id: true, name: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          menuItem: { select: { id: true, name: true } },
        },
      })
    })

    return {
      ...archivedRecipe,
      notes: this.getUserVisibleNotes(archivedRecipe.notes),
      lifecycleState: RecipeLifecycleState.ARCHIVED,
    } as RecipeWithState
  }

  /**
   * Duplicate a recipe (creates a new draft copy)
   */
  static async duplicateRecipe(
    recipeId: string,
    businessId: string,
    input?: DuplicateRecipeInput
  ): Promise<RecipeWithState> {
    await this.validateBusinessOwnership(recipeId, businessId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: true,
      },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    // Validate new menu item if provided
    if (input?.menuItemId) {
      await this.validateMenuItemOwnership(input.menuItemId, businessId)

      // Check if menu item already has a recipe
      const existingRecipe = await prisma.menuItem.findFirst({
        where: { id: input.menuItemId, recipeId: { not: null } },
        select: { recipeId: true },
      })

      if (existingRecipe?.recipeId) {
        throw new RecipeValidationError(
          `Menu item already has a recipe: ${existingRecipe.recipeId}`
        )
      }
    }

    // Create duplicate in a transaction
    const duplicatedRecipe = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          businessId,
          name: input?.name || `${recipe.name} (Copy)`,
          yieldQuantity: recipe.yieldQuantity,
          yieldUnit: recipe.yieldUnit,
          notes: this.setLifecycleMarker(
            this.getUserVisibleNotes(recipe.notes),
            RecipeLifecycleState.DRAFT
          ),
          version: 1,
          isActive: true,
          costStale: true,
          ingredients: {
            create: recipe.ingredients.map((ing) => ({
              inventoryItemId: ing.inventoryItemId,
              subRecipeId: ing.subRecipeId,
              quantity: ing.quantity,
              unit: ing.unit,
              yieldFactor: ing.yieldFactor,
              isOptional: ing.isOptional,
              displayOrder: ing.displayOrder,
            })),
          },
        },
        include: {
          ingredients: {
            include: {
              inventoryItem: { select: { id: true, name: true, unit: true } },
              subRecipe: { select: { id: true, name: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          menuItem: { select: { id: true, name: true } },
        },
      })

      // Link to menu item if provided
      if (input?.menuItemId) {
        await tx.menuItem.update({
          where: { id: input.menuItemId },
          data: { recipeId: newRecipe.id },
        })
      }

      return newRecipe
    })

    return {
      ...duplicatedRecipe,
      notes: this.getUserVisibleNotes(duplicatedRecipe.notes),
      lifecycleState: RecipeLifecycleState.DRAFT,
    } as RecipeWithState
  }

  /**
   * Get a recipe by ID
   */
  static async getRecipe(
    recipeId: string,
    businessId: string
  ): Promise<RecipeWithState | null> {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, businessId },
      include: {
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true, unitCostCents: true } },
            subRecipe: { select: { id: true, name: true, costCentsCached: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        menuItem: { select: { id: true, name: true, priceCents: true } },
        business: { select: { id: true, name: true } },
      },
    })

    if (!recipe) return null

    return {
      ...recipe,
      notes: this.getUserVisibleNotes(recipe.notes),
      lifecycleState: this.getLifecycleState(recipe),
    } as RecipeWithState
  }

  /**
   * List recipes for a business
   */
  static async listRecipes(
    businessId: string,
    options?: {
      menuItemId?: string
      isActive?: boolean
      lifecycleState?: RecipeLifecycleState
      search?: string
      page?: number
      limit?: number
    }
  ): Promise<{
    recipes: RecipeWithState[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.RecipeWhereInput = {
      businessId,
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
      ...(options?.search && {
        name: { contains: options.search, mode: 'insensitive' },
      }),
    }

    // Filter by menu item
    if (options?.menuItemId) {
      where.menuItem = { id: options.menuItemId }
    }

    // Filter by lifecycle state
    if (options?.lifecycleState) {
      switch (options.lifecycleState) {
        case RecipeLifecycleState.DRAFT:
          where.isActive = true
          where.notes = { not: { startsWith: '__PUBLISHED__' } }
          break
        case RecipeLifecycleState.PUBLISHED:
          where.isActive = true
          where.notes = { startsWith: '__PUBLISHED__' }
          break
        case RecipeLifecycleState.ARCHIVED:
          where.isActive = false
          break
      }
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          ingredients: {
            include: {
              inventoryItem: { select: { id: true, name: true, unit: true } },
              subRecipe: { select: { id: true, name: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          menuItem: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ])

    return {
      recipes: recipes.map((recipe) => ({
        ...recipe,
        notes: this.getUserVisibleNotes(recipe.notes),
        lifecycleState: this.getLifecycleState(recipe),
      })) as RecipeWithState[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Delete a draft recipe (only drafts can be deleted)
   */
  static async deleteDraftRecipe(
    recipeId: string,
    businessId: string
  ): Promise<void> {
    await this.validateBusinessOwnership(recipeId, businessId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { isActive: true, notes: true },
    })

    if (!recipe) {
      throw new RecipeNotFoundError(recipeId)
    }

    const currentState = this.getLifecycleState(recipe)

    if (currentState !== RecipeLifecycleState.DRAFT) {
      throw new RecipeInvalidStateError(currentState, 'delete')
    }

    // Delete recipe and unlink from menu item in a transaction
    await prisma.$transaction(async (tx) => {
      // Unlink from menu item
      await tx.menuItem.updateMany({
        where: { recipeId },
        data: { recipeId: null },
      })

      // Delete ingredients first (cascade should handle this, but being explicit)
      await tx.recipeIngredient.deleteMany({
        where: { recipeId },
      })

      // Delete recipe
      await tx.recipe.delete({
        where: { id: recipeId },
      })
    })
  }

  /**
   * Get recipes that use a specific inventory item as an ingredient
   */
  static async getRecipesUsingInventoryItem(
    inventoryItemId: string,
    businessId: string
  ): Promise<RecipeWithState[]> {
    const recipes = await prisma.recipe.findMany({
      where: {
        businessId,
        ingredients: {
          some: { inventoryItemId },
        },
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true } },
            subRecipe: { select: { id: true, name: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        menuItem: { select: { id: true, name: true } },
      },
    })

    return recipes.map((recipe) => ({
      ...recipe,
      notes: this.getUserVisibleNotes(recipe.notes),
      lifecycleState: this.getLifecycleState(recipe),
    })) as RecipeWithState[]
  }

  /**
   * Get recipes that use a specific recipe as a sub-recipe
   */
  static async getRecipesUsingSubRecipe(
    subRecipeId: string,
    businessId: string
  ): Promise<RecipeWithState[]> {
    const recipes = await prisma.recipe.findMany({
      where: {
        businessId,
        ingredients: {
          some: { subRecipeId },
        },
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true } },
            subRecipe: { select: { id: true, name: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        menuItem: { select: { id: true, name: true } },
      },
    })

    return recipes.map((recipe) => ({
      ...recipe,
      notes: this.getUserVisibleNotes(recipe.notes),
      lifecycleState: this.getLifecycleState(recipe),
    })) as RecipeWithState[]
  }
}
