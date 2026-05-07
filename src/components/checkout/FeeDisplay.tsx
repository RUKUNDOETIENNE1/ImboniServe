/**
 * Fee Display Component
 * Shows digital payment convenience fee with bilingual support
 */

import React from 'react';
import { calculateConvenienceFee, formatRWF, getFeeDescription } from '@/lib/pricing/fee-calculator';
import { PaymentMethod } from '@/lib/pricing/fee-config';

interface FeeDisplayProps {
  subtotal: number;
  paymentMethod: PaymentMethod;
  tipsAmount?: number;
  language?: 'en' | 'rw';
  showBreakdown?: boolean;
}

export const FeeDisplay: React.FC<FeeDisplayProps> = ({
  subtotal,
  paymentMethod,
  tipsAmount = 0,
  language = 'en',
  showBreakdown = true,
}) => {
  const feeCalc = calculateConvenienceFee(subtotal, paymentMethod, true, tipsAmount);

  if (!feeCalc.feeApplied) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
      {/* Fee Notice */}
      <div className="flex items-start gap-2 mb-3">
        <svg
          className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-amber-800">
          {getFeeDescription(language)}
        </p>
      </div>

      {/* Fee Breakdown */}
      {showBreakdown && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>{language === 'en' ? 'Subtotal' : 'Ikiguzi Rusange'}:</span>
            <span className="font-medium">{formatRWF(feeCalc.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-amber-700">
            <span>
              {language === 'en' ? 'Convenience Fee' : 'Amafaranga ya Serivisi'} (5%):
            </span>
            <span className="font-medium">{formatRWF(feeCalc.convenienceFee)}</span>
          </div>
          
          <div className="border-t border-amber-200 pt-2 flex justify-between text-gray-900 font-semibold">
            <span>{language === 'en' ? 'Total' : 'Yose Hamwe'}:</span>
            <span className="text-lg">{formatRWF(feeCalc.total)}</span>
          </div>
        </div>
      )}

      {/* Cash Alternative */}
      <div className="mt-3 pt-3 border-t border-amber-200">
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          {language === 'en' 
            ? `Save ${formatRWF(feeCalc.convenienceFee)} by paying with cash`
            : `Kuzigama ${formatRWF(feeCalc.convenienceFee)} niwishyuye mu mafaranga`
          }
        </p>
      </div>
    </div>
  );
};

export default FeeDisplay;
