import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { BookOpen, Plus, Search, Calculator, Edit, Trash2, Scale, DollarSign, Percent } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  cost: number
}

interface Recipe {
  id: string
  name: string
  category: string
  description: string
  servings: number
  ingredients: RecipeIngredient[]
  totalCost: number
  costPerServing: number
  sellingPrice: number
  profitMargin: number
  preparationTime: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export default function RecipeManagement() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCalculator, setShowCalculator] = useState(false)

  const ingredients: Ingredient[] = [
    { id: '1', name: 'Chicken Breast', unit: 'kg', costPerUnit: 8000 },
    { id: '2', name: 'Flour', unit: 'kg', costPerUnit: 1500 },
    { id: '3', name: 'Tomatoes', unit: 'kg', costPerUnit: 2000 },
    { id: '4', name: 'Onions', unit: 'kg', costPerUnit: 1200 },
    { id: '5', name: 'Vegetable Oil', unit: 'L', costPerUnit: 5000 },
    { id: '6', name: 'Salt', unit: 'kg', costPerUnit: 800 },
    { id: '7', name: 'Black Pepper', unit: 'kg', costPerUnit: 15000 },
    { id: '8', name: 'Garlic', unit: 'kg', costPerUnit: 6000 },
  ]

  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Grilled Chicken',
      category: 'Main Course',
      description: 'Marinated chicken with herbs and spices',
      servings: 4,
      ingredients: [
        { ingredientId: '1', ingredientName: 'Chicken Breast', quantity: 1, unit: 'kg', cost: 8000 },
        { ingredientId: '6', ingredientName: 'Salt', quantity: 0.02, unit: 'kg', cost: 16 },
        { ingredientId: '7', ingredientName: 'Black Pepper', quantity: 0.01, unit: 'kg', cost: 150 },
        { ingredientId: '5', ingredientName: 'Vegetable Oil', quantity: 0.05, unit: 'L', cost: 250 },
      ],
      totalCost: 8416,
      costPerServing: 2104,
      sellingPrice: 12000,
      profitMargin: 82.5,
      preparationTime: 25,
      difficulty: 'Medium'
    },
    {
      id: '2',
      name: 'Caesar Salad',
      category: 'Appetizer',
      description: 'Fresh romaine with parmesan and croutons',
      servings: 2,
      ingredients: [
        { ingredientId: '3', ingredientName: 'Tomatoes', quantity: 0.3, unit: 'kg', cost: 600 },
        { ingredientId: '4', ingredientName: 'Onions', quantity: 0.1, unit: 'kg', cost: 120 },
        { ingredientId: '6', ingredientName: 'Salt', quantity: 0.01, unit: 'kg', cost: 8 },
        { ingredientId: '5', ingredientName: 'Vegetable Oil', quantity: 0.1, unit: 'L', cost: 500 },
      ],
      totalCost: 1228,
      costPerServing: 614,
      sellingPrice: 6000,
      profitMargin: 79.8,
      preparationTime: 15,
      difficulty: 'Easy'
    },
    {
      id: '3',
      name: 'Beef Burger',
      category: 'Main Course',
      description: 'Juicy beef patty with cheese and vegetables',
      servings: 4,
      ingredients: [
        { ingredientId: '2', ingredientName: 'Flour', quantity: 0.2, unit: 'kg', cost: 300 },
        { ingredientId: '4', ingredientName: 'Onions', quantity: 0.3, unit: 'kg', cost: 360 },
        { ingredientId: '6', ingredientName: 'Salt', quantity: 0.02, unit: 'kg', cost: 16 },
        { ingredientId: '5', ingredientName: 'Vegetable Oil', quantity: 0.15, unit: 'L', cost: 750 },
      ],
      totalCost: 1426,
      costPerServing: 356,
      sellingPrice: 8000,
      profitMargin: 82.1,
      preparationTime: 20,
      difficulty: 'Easy'
    }
  ]

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = ['All', ...Array.from(new Set(recipes.map(r => r.category)))]

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (selectedRecipe) {
    return (
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ← {t('recipe.back', 'Back')}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedRecipe.name}</h1>
                <p className="text-slate-600">{selectedRecipe.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {t('recipe.edit', 'Edit')}
              </button>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {t('recipe.costCalculator', 'Cost Calculator')}
              </button>
            </div>
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Ingredients */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ingredients */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('recipe.ingredients', 'Ingredients')}</h3>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">{t('recipe.ingredient', 'Ingredient')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">{t('recipe.quantity', 'Quantity')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">{t('recipe.cost', 'Cost')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRecipe.ingredients.map((ing, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">{ing.ingredientName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{ing.quantity} {ing.unit}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{ing.cost.toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('recipe.instructions', 'Instructions')}</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-imboni-blue text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <p className="text-sm text-slate-600 pt-1">Prepare all ingredients and measure quantities accurately.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-imboni-blue text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <p className="text-sm text-slate-600 pt-1">Follow the cooking instructions based on the difficulty level.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-imboni-blue text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <p className="text-sm text-slate-600 pt-1">Plate and serve immediately for best results.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Cost Analysis */}
            <div className="space-y-6">
              {/* Cost Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('recipe.costSummary', 'Cost Summary')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('recipe.totalCost', 'Total Cost')}</span>
                    <span className="font-semibold text-slate-900">{selectedRecipe.totalCost.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('recipe.servings', 'Servings')}</span>
                    <span className="font-medium text-slate-900">{selectedRecipe.servings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('recipe.costPerServing', 'Cost per Serving')}</span>
                    <span className="font-semibold text-slate-900">{selectedRecipe.costPerServing.toLocaleString()} RWF</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('recipe.sellingPrice', 'Selling Price')}</span>
                    <span className="font-bold text-slate-900">{selectedRecipe.sellingPrice.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">{t('recipe.profitMargin', 'Profit Margin')}</span>
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      {selectedRecipe.profitMargin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('recipe.recipeInfo', 'Recipe Info')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('recipe.category', 'Category')}</span>
                    <span className="font-medium text-slate-900">{selectedRecipe.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('recipe.prepTime', 'Prep Time')}</span>
                    <span className="font-medium text-slate-900">{selectedRecipe.preparationTime} {t('recipe.minutes', 'min')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('recipe.difficulty', 'Difficulty')}</span>
                    <span className={`font-medium ${
                      selectedRecipe.difficulty === 'Easy' ? 'text-green-600' :
                      selectedRecipe.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {t(`recipe.difficulty.${selectedRecipe.difficulty.toLowerCase()}`, selectedRecipe.difficulty)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('recipe.title', 'Recipe Management')}</h1>
            <p className="text-slate-600">{t('recipe.subtitle', 'Track ingredient costs and margins')}</p>
          </div>

          <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('recipe.addRecipe', 'Add Recipe')}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('recipe.search', 'Search recipes...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-imboni-blue"
            />
          </div>

          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-white border border-slate-200 hover:bg-slate-50 text-sm"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-imboni-blue transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-imboni-blue/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-imboni-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{recipe.name}</h3>
                    <span className="text-xs text-slate-500">{recipe.category}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('recipe.cost', 'Cost')}</span>
                  <span className="font-medium text-slate-900">{recipe.costPerServing.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('recipe.sellingPrice', 'Price')}</span>
                  <span className="font-medium text-slate-900">{recipe.sellingPrice.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">{t('recipe.margin', 'Margin')}</span>
                  <span className="font-bold text-green-600">{recipe.profitMargin}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
                <span>{recipe.preparationTime} {t('recipe.min', 'min')}</span>
                <span className={`px-2 py-1 rounded ${
                  recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {t(`recipe.difficulty.${recipe.difficulty.toLowerCase()}`, recipe.difficulty)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {t('recipe.noRecipes', 'No recipes found')}
            </h3>
            <p className="text-slate-600">
              {t('recipe.noRecipesDesc', 'Add your first recipe to start tracking costs')}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
