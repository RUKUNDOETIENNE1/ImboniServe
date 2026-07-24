import { useState, useEffect } from 'react';
import { Clock, Flame, Users, AlertTriangle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { getUserPreferences, isMenuItemSafe } from '@/lib/userPreferences';
import type { MenuItemDetail } from '@/components/MenuItemDetailModal';

interface MenuCardProps {
  item: MenuItemDetail & {
    translations?: Array<{
      locale: string;
      name: string;
      description: string | null;
    }>;
  };
  userLanguage: 'en' | 'rw' | 'fr';
  onAddToCart: (item: MenuItemDetail) => void;
  inCart?: number;
}

export default function MenuCard({ item, userLanguage, onAddToCart, inCart = 0 }: MenuCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState(getUserPreferences());

  useEffect(() => {
    setPreferences(getUserPreferences());
  }, []);

  const safetyCheck = isMenuItemSafe(item, preferences);

  const localizedName = (() => {
    if (!item.translations || item.translations.length === 0) return item.name;
    const t = item.translations.find(t => t.locale === userLanguage);
    return t?.name || item.name;
  })();

  const localizedDesc = (() => {
    if (!item.translations || item.translations.length === 0) return item.description;
    const t = item.translations.find(t => t.locale === userLanguage);
    return t?.description || item.description;
  })();

  const spiceLevelIcons: Record<string, string> = {
    none: '',
    mild: '🌶️',
    medium: '🌶️🌶️',
    hot: '🌶️🌶️🌶️',
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all duration-300 bg-white ${
        expanded
          ? 'border-imboni-blue/30 shadow-xl scale-[1.01]'
          : safetyCheck.safe
          ? 'border-gray-100 shadow-sm hover:shadow-md'
          : 'border-red-200 shadow-sm'
      }`}
    >
      {/* Image */}
      {item.imageReal && (
        <div className="relative w-full h-32 sm:h-40 overflow-hidden">
          <img
            src={item.imageReal}
            alt={localizedName}
            className={`w-full h-full object-cover transition-transform duration-300 ease-out ${expanded ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {inCart > 0 && (
            <div className="absolute top-2 right-2 bg-imboni-dark text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {inCart}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4">
        {/* Safety Warning */}
        {!safetyCheck.safe && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not suitable for your preferences</span>
          </div>
        )}

        {/* Name + Price Row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-imboni-dark text-base leading-snug">{localizedName}</h3>
          <div className="font-bold text-imboni-dark whitespace-nowrap text-sm">
            <CurrencyDisplay amount={item.priceCents} inCents />
          </div>
        </div>

        {/* Collapsed: Truncated Description */}
        {!expanded && localizedDesc && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{localizedDesc}</p>
        )}

        {/* Collapsed: Quick Info */}
        {!expanded && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {item.prepTimeMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.prepTimeMinutes} min
              </div>
            )}
            {item.spiceLevel && item.spiceLevel !== 'none' && (
              <span>{spiceLevelIcons[item.spiceLevel]}</span>
            )}
            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <div className="flex gap-1">
                {item.dietaryTags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expanded: Full Details */}
        {expanded && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* Full Description */}
            {localizedDesc && (
              <p className="text-gray-600 text-sm leading-relaxed">{localizedDesc}</p>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.prepTimeMinutes && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  {item.prepTimeMinutes} min
                </div>
              )}
              {item.portionSize && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600 capitalize">
                  <Users className="w-3.5 h-3.5" />
                  {item.portionSize}
                </div>
              )}
              {item.spiceLevel && item.spiceLevel !== 'none' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <Flame className="w-3.5 h-3.5" />
                  {item.spiceLevel}
                </div>
              )}
            </div>

            {/* Ingredients */}
            {item.ingredients && item.ingredients.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Ingredients</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.ingredients.map((ing, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {item.allergens && item.allergens.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1.5">Contains</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.allergens.map((allergen, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Tags */}
            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Dietary</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.dietaryTags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-imboni-blue transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 rounded-lg px-1"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide details for' : 'Show details for'} ${localizedName}`}
          >
            {expanded ? (
              <>Less <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Details <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>

          <button
            onClick={() => onAddToCart(item)}
            className="flex items-center gap-1.5 px-4 py-2 bg-imboni-dark hover:bg-imboni-blue text-white rounded-xl text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-imboni-blue/30"
            aria-label={`Add ${localizedName} to cart`}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
