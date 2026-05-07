import { useState } from 'react';
import { X } from 'lucide-react';

interface TipSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  billAmountCents: number;
  suggestedAmountCents: number;
  tipAmountCents: number;
  staffName?: string;
  currency?: string;
  onAccept: () => void;
  onSkip: () => void;
}

export default function TipSuggestionModal({
  isOpen,
  onClose,
  billAmountCents,
  suggestedAmountCents,
  tipAmountCents,
  staffName = 'your server',
  currency = 'RWF',
  onAccept,
  onSkip
}: TipSuggestionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const billAmount = (billAmountCents / 100).toLocaleString();
  const suggestedAmount = (suggestedAmountCents / 100).toLocaleString();
  const tipAmount = (tipAmountCents / 100).toLocaleString();

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await onSkip();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">💡 Round Up Your Bill?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Your bill:</span>
              <span className="text-lg font-medium">{currency} {billAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Round up to:</span>
              <span className="text-2xl font-bold text-green-600">{currency} {suggestedAmount}</span>
            </div>
          </div>

          {/* Tip Info */}
          <div className="text-center py-2">
            <p className="text-gray-700">
              Tip <span className="font-semibold text-green-600">{currency} {tipAmount}</span> for{' '}
              <span className="font-semibold">{staffName}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Show your appreciation for great service! 🙏
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Accept Tip (${currency} ${suggestedAmount})`}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Skip / No Tip'}
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            100% of your tip goes to the staff (minus 2.5% platform fee)
          </p>
        </div>
      </div>
    </div>
  );
}
