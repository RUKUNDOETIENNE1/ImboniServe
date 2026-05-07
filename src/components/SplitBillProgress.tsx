import { useEffect, useState } from 'react';
import { Users, DollarSign } from 'lucide-react';

interface SplitBillProgressProps {
  saleId: string;
  currency?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ProgressData {
  paidPayerCount: number;
  totalPayerCount: number;
  progressPercent: number;
  remainingCents: number;
  totalAmountCents: number;
  fullyPaid: boolean;
}

export default function SplitBillProgress({
  saleId,
  currency = 'RWF',
  autoRefresh = true,
  refreshInterval = 5000
}: SplitBillProgressProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/split-payment/${saleId}/progress`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const result = await response.json();
      
      if (result.success && result.data?.summary) {
        setData(result.data.summary);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching split payment progress:', err);
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();

    if (autoRefresh && !data?.fullyPaid) {
      const interval = setInterval(fetchProgress, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [saleId, autoRefresh, refreshInterval, data?.fullyPaid]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error || 'No data available'}</p>
      </div>
    );
  }

  const remainingAmount = (data.remainingCents / 100).toLocaleString();
  const totalAmount = (data.totalAmountCents / 100).toLocaleString();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Split Bill Progress</h3>
        {data.fullyPaid && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            ✓ Fully Paid
          </span>
        )}
      </div>

      {/* Payer Count */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {data.paidPayerCount} of {data.totalPayerCount}
          </p>
          <p className="text-sm text-gray-600">
            {data.totalPayerCount === 1 ? 'person' : 'people'} paid
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span className="font-medium">{data.progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data.progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Remaining Balance */}
      {!data.fullyPaid && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Remaining balance</p>
              <p className="text-xl font-bold text-orange-600">
                {currency} {remainingAmount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total bill</span>
          <span className="font-semibold text-gray-900">{currency} {totalAmount}</span>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && !data.fullyPaid && (
        <p className="text-xs text-gray-400 text-center">
          Auto-refreshing every {refreshInterval / 1000} seconds
        </p>
      )}
    </div>
  );
}
