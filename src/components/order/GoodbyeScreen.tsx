import { useEffect, useState } from 'react';
import { CheckCircle, Star, Share2, Clock, Utensils } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';

interface GoodbyeScreenProps {
  restaurantName: string;
  orderNumber?: string | null;
  totalCents?: number;
  currency?: string;
  items?: Array<{ name: string; quantity: number }>;
  tableNumber?: string | null;
  logoUrl?: string | null;
  isPaid: boolean;
  eta?: string;
  onShare?: () => void;
  onRate?: (rating: number) => void;
}

export default function GoodbyeScreen({
  restaurantName,
  orderNumber,
  totalCents = 0,
  items = [],
  tableNumber,
  logoUrl,
  isPaid,
  eta,
  onShare,
  onRate,
}: GoodbyeScreenProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    setShowThankYou(true);
    if (onRate) onRate(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Thank You Header */}
        <div className="text-center mb-8 animate-fade-in">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-md"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-imboni-blue to-accent mx-auto mb-4 flex items-center justify-center shadow-md">
              <Utensils className="w-7 h-7 text-white" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-imboni-dark">
            {isPaid ? 'Thank you for dining with us' : 'Your order is confirmed'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{restaurantName}</p>

          {/* Payment Status */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-3 ${
            isPaid
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {isPaid ? 'Paid' : 'Payment Pending'}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-imboni-dark text-sm">Your Visit</h3>
            {orderNumber && (
              <span className="text-xs text-gray-400 font-mono">#{orderNumber}</span>
            )}
          </div>

          {tableNumber && (
            <div className="text-xs text-gray-500 mb-3">
              Table {tableNumber}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <span className="font-medium text-imboni-dark">{item.quantity}×</span> {item.name}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          {totalCents > 0 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-imboni-dark">
                <CurrencyDisplay amount={totalCents} inCents />
              </span>
            </div>
          )}

          {/* ETA */}
          {isPaid && eta && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Estimated time: <span className="font-semibold">{eta}</span>
              </p>
            </div>
          )}
        </div>

        {/* Rate Experience */}
        {isPaid && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6 text-center">
            {!showThankYou ? (
              <>
                <p className="text-sm text-gray-500 mb-3">How was {restaurantName} tonight?</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      onClick={() => handleRate(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-300/30 rounded"
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= value
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <p className="text-sm font-medium text-imboni-dark mb-1">
                  {rating >= 4 ? "Wonderful! We're so glad." : 'Thank you for your feedback.'}
                </p>
                <p className="text-xs text-gray-400">We hope to see you again soon.</p>
              </div>
            )}
          </div>
        )}

        {/* Share the Love */}
        {isPaid && onShare && (
          <div className="bg-gradient-to-br from-imboni-blue/5 to-accent/5 rounded-2xl border border-imboni-blue/10 p-5 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Loved {restaurantName}? Share with friends and earn rewards.
            </p>
            <button
              onClick={onShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-imboni-dark hover:border-imboni-blue/30 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
              aria-label="Share this restaurant with friends"
            >
              <Share2 className="w-4 h-4" />
              Share the Love
            </button>
          </div>
        )}

        {/* Goodbye Message */}
        <div className="text-center py-6">
          <p className="text-lg font-medium text-imboni-dark">
            See you soon.
          </p>
          <p className="text-sm text-gray-400 mt-1">— {restaurantName}</p>
        </div>
      </div>
    </div>
  );
}
