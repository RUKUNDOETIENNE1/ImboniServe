import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle, Clock, Calendar, Users, MapPin } from 'lucide-react';

export default function ReservationConfirmation() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!id || typeof id !== 'string') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reservation/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmed(true);
      } else {
        setError(data.error || 'Failed to confirm reservation');
      }
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This confirmation link is invalid.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmed! 🎉</h1>
          <p className="text-lg text-gray-700 mb-6">
            Your reservation has been confirmed successfully.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              We're looking forward to serving you! Please arrive on time.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Confirmation recorded</p>
            <p>✓ Your deposit is secured</p>
            <p>✓ Table reserved for you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirm Your Reservation
          </h1>
          <p className="text-gray-600">
            Please confirm your reservation to secure your table
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">
                Confirmation Required
              </p>
              <p className="text-sm text-orange-800">
                If you don't confirm, your deposit may be forfeited. Please confirm to secure your reservation.
              </p>
            </div>
          </div>
        </div>

        {/* Reservation Details Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Your reservation details</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Party size confirmed</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Table reserved</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Confirming...
            </span>
          ) : (
            'Confirm Reservation'
          )}
        </button>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center">
          By confirming, you agree to arrive on time. No-shows may result in deposit forfeiture.
        </p>
      </div>
    </div>
  );
}
