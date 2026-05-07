import { X, Info, Leaf, Flame, Clock, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface DishExplanationModalProps {
  dish: {
    name: string
    description?: string
    ingredients?: string[]
    cookingMethod?: string
    prepTime?: number
    allergens?: string[]
    isVegetarian?: boolean
    isVegan?: boolean
    isGlutenFree?: boolean
    spiceLevel?: 'mild' | 'medium' | 'hot'
  }
  onClose: () => void
}

export default function DishExplanationModal({ dish, onClose }: DishExplanationModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-imboni-blue to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{dish.name}</h2>
                <p className="text-sm text-blue-100">{t('menu.dish_info', 'Dish Information')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {dish.description && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('menu.description', 'Description')}</h3>
              <p className="text-slate-600 leading-relaxed">{dish.description}</p>
            </div>
          )}

          {/* Dietary Tags */}
          {(dish.isVegetarian || dish.isVegan || dish.isGlutenFree) && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('menu.dietary_info', 'Dietary Information')}</h3>
              <div className="flex flex-wrap gap-2">
                {dish.isVegetarian && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <Leaf className="w-4 h-4" />
                    {t('menu.vegetarian', 'Vegetarian')}
                  </span>
                )}
                {dish.isVegan && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <Leaf className="w-4 h-4" />
                    {t('menu.vegan', 'Vegan')}
                  </span>
                )}
                {dish.isGlutenFree && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {t('menu.gluten_free', 'Gluten-Free')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('menu.ingredients', 'Ingredients')}</h3>
              <div className="flex flex-wrap gap-2">
                {dish.ingredients.map((ingredient, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cooking Method */}
          {dish.cookingMethod && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                {t('menu.cooking_method', 'Cooking Method')}
              </h3>
              <p className="text-slate-600">{dish.cookingMethod}</p>
            </div>
          )}

          {/* Prep Time */}
          {dish.prepTime && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                {t('menu.prep_time', 'Preparation Time')}
              </h3>
              <p className="text-slate-600">{dish.prepTime} {t('common.minutes', 'minutes')}</p>
            </div>
          )}

          {/* Spice Level */}
          {dish.spiceLevel && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                {t('menu.spice_level', 'Spice Level')}
              </h3>
              <div className="flex items-center gap-2">
                {['mild', 'medium', 'hot'].map((level, i) => (
                  <div
                    key={level}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i <= ['mild', 'medium', 'hot'].indexOf(dish.spiceLevel!)
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                ))}
                <span className="text-sm text-slate-600 ml-2 capitalize">{dish.spiceLevel}</span>
              </div>
            </div>
          )}

          {/* Allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {t('menu.allergen_warning', 'Allergen Warning')}
              </h3>
              <p className="text-sm text-amber-700">
                {t('menu.contains', 'Contains')}: {dish.allergens.join(', ')}
              </p>
            </div>
          )}

          {/* Fallback if no data */}
          {!dish.description && !dish.ingredients && !dish.cookingMethod && (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {t('menu.no_additional_info', 'No additional information available for this dish.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-imboni-blue text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
