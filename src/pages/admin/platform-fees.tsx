import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/ui/Card';

interface FeeConfig {
  id: string;
  feeType: string;
  feePercent: number;
  description: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
}

export default function PlatformFeesAdmin() {
  const router = useRouter();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/admin/platform-fees');
      const data = await response.json();
      setFees(data.fees || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feeType: string, currentPercent: number) => {
    setEditingFee(feeType);
    setEditValue(currentPercent);
  };

  const handleSave = async (feeType: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/platform-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeType,
          feePercent: editValue
        })
      });

      if (response.ok) {
        await fetchFees();
        setEditingFee(null);
      } else {
        alert('Failed to update fee');
      }
    } catch (error) {
      console.error('Error updating fee:', error);
      alert('Error updating fee');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingFee(null);
    setEditValue(0);
  };

  const getFeeTypeLabel = (feeType: string): string => {
    const labels: Record<string, string> = {
      'BUSINESS_COMMISSION': 'Business Commission',
      'SUPPLIER_PLATFORM_FEE': 'Supplier Platform Fee',
      'MARKETPLACE_COMMISSION': 'Marketplace Commission',
      'DIGITAL_PAYMENT_FEE': 'Digital Payment Fee',
      'SPLIT_PAYMENT_FEE': 'Split Payment Fee',
      'DIGITAL_TIPPING_FEE': 'Digital Tipping Fee'
    };
    return labels[feeType] || feeType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Fee Configuration</h1>
          <p className="text-gray-600 mt-2">
            Manage all platform fees from a centralized dashboard. Changes take effect immediately.
          </p>
        </div>

        {/* Fee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fees.map((fee) => (
            <div key={fee.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{getFeeTypeLabel(fee.feeType)}</h3>
                  {fee.isActive && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{fee.description}</p>
              </div>
              <div>
                <div className="space-y-4">
                  {/* Fee Percentage */}
                  <div>
                    {editingFee === fee.feeType ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editValue}
                            onChange={(e) => setEditValue(parseFloat(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={saving}
                          />
                          <span className="text-gray-600">%</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(fee.feeType)}
                            disabled={saving}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold text-blue-600">
                            {fee.feePercent}%
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Effective from {new Date(fee.effectiveFrom).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEdit(fee.feeType, fee.feePercent)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fee Impact Example */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-700 mb-1">Example:</div>
                    <div className="text-gray-600">
                      On RWF 100,000: <span className="font-semibold">RWF {(100000 * fee.feePercent / 100).toLocaleString()}</span> fee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">About Platform Fees</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Changes take effect immediately for new transactions</li>
                <li>• Historical transactions remain unchanged</li>
                <li>• All fees are tracked and auditable</li>
                <li>• Fee changes are logged with timestamps</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fee History Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/admin/fee-history')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Fee Change History →
          </button>
        </div>
      </div>
    </div>
  );
}
