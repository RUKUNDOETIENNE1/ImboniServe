import { Minus, Plus, ChefHat, Send, Trash2 } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import UpsellRecommendations from '@/components/order/UpsellRecommendations';

interface CartItem {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

interface CartPanelProps {
  cartItems: CartItem[];
  cartTotalCents: number;
  menu: any[];
  onAddToCart: (item: any) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onSubmit: () => void;
  loading: boolean;
  submitted: boolean;
  disabled?: boolean;
  disabledReason?: string;
  showUpsell?: boolean;
  footerNote?: string;
}

export default function CartPanel({
  cartItems,
  cartTotalCents,
  menu,
  onAddToCart,
  onInc,
  onDec,
  onSubmit,
  loading,
  submitted,
  disabled = false,
  disabledReason,
  showUpsell = true,
  footerNote,
}: CartPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sticky top-4" role="region" aria-label="Your cart">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ChefHat className="w-5 h-5 text-imboni-orange" />
        <h2 className="text-lg font-bold text-imboni-dark">Your Selections</h2>
      </div>

      {/* Empty State */}
      {cartItems.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <ChefHat className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">No items yet</p>
          <p className="text-gray-300 text-xs mt-1">Explore the menu to begin your order</p>
        </div>
      ) : (
        <>
          {/* Items */}
          <div className="space-y-3">
            {cartItems.map(ci => (
              <div key={ci.menuItemId} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-imboni-dark truncate">{ci.name}</p>
                  <p className="text-xs text-gray-400">
                    <CurrencyDisplay amount={ci.priceCents} inCents /> each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDec(ci.menuItemId)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                    aria-label={`Decrease ${ci.name} quantity`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-imboni-dark" aria-label={`${ci.name} quantity: ${ci.quantity}`}>{ci.quantity}</span>
                  <button
                    onClick={() => onInc(ci.menuItemId)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                    aria-label={`Increase ${ci.name} quantity`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-imboni-dark">
                  <CurrencyDisplay amount={ci.priceCents * ci.quantity} inCents />
                </div>
              </div>
            ))}
          </div>

          {/* Upsell Recommendations */}
          {showUpsell && !submitted && (
            <div className="mt-4">
              <UpsellRecommendations
                cartItems={cartItems}
                menu={menu}
                onAddToCart={onAddToCart}
              />
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-bold text-imboni-dark">
              <CurrencyDisplay amount={cartTotalCents} inCents />
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={disabled || loading || submitted}
            className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none ${
              disabled || submitted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-imboni-dark hover:bg-imboni-blue text-white active:scale-[0.98] shadow-md focus:ring-2 focus:ring-imboni-blue/30'
            }`}
            aria-label="Send your order to the kitchen"
          >
            {submitted ? (
              <>✓ Sent to Kitchen</>
            ) : loading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to Kitchen
              </>
            )}
          </button>

          {/* Disabled Reason */}
          {disabled && disabledReason && (
            <p className="text-xs text-gray-400 text-center mt-2">{disabledReason}</p>
          )}

          {/* Footer Note */}
          {footerNote && (
            <p className="text-xs text-gray-400 text-center mt-3">{footerNote}</p>
          )}
        </>
      )}
    </div>
  );
}
