/**
 * Admin Fee Settings Configuration Panel
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';
import { FEE_CONFIG } from '@/lib/pricing/fee-config';
import { Settings, DollarSign, Percent, Save } from 'lucide-react';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]');
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions);
  const roles = (session?.user as any)?.roles || [];
  if (!session?.user || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { props: {} };
};

interface FeeConfigState {
  digitalFeePercent: number;
  digitalFeeMin: number;
  digitalFeeMax: number;
  digitalFeeEnabled: boolean;
  marketplaceCommissionStandard: number;
  marketplaceCommissionLaunch: number;
  marketplaceCommissionHighVolume: number;
  cashDiscountMode: boolean;
  vatRate: number;
  whtEnabled: boolean;
  whtRate: number;
}

export default function FeeSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<FeeConfigState>({
    digitalFeePercent: FEE_CONFIG.digitalPayment.percent,
    digitalFeeMin: FEE_CONFIG.digitalPayment.minFee,
    digitalFeeMax: FEE_CONFIG.digitalPayment.maxFee,
    digitalFeeEnabled: FEE_CONFIG.digitalPayment.enabled,
    marketplaceCommissionStandard: FEE_CONFIG.marketplace.defaultPercent,
    marketplaceCommissionLaunch: FEE_CONFIG.marketplace.tiers[0].percent,
    marketplaceCommissionHighVolume: FEE_CONFIG.marketplace.tiers[2].percent,
    cashDiscountMode: FEE_CONFIG.display.cashDiscountMode,
    vatRate: FEE_CONFIG.tax.vatRate,
    whtEnabled: FEE_CONFIG.tax.enableWHT,
    whtRate: FEE_CONFIG.tax.whtRate,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && (session.user as any)?.role === 'admin') {
      loadConfig();
    }
  }, [session]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/fee-config');
      if (response.ok) {
        const data = await response.json();
        setConfig({
          digitalFeePercent: data.digitalFeePercent,
          digitalFeeMin: data.digitalFeeMin,
          digitalFeeMax: data.digitalFeeMax,
          digitalFeeEnabled: data.digitalFeeEnabled,
          marketplaceCommissionStandard: data.marketplaceCommStd,
          marketplaceCommissionLaunch: data.marketplaceCommLaunch,
          marketplaceCommissionHighVolume: data.marketplaceCommHV,
          cashDiscountMode: data.cashDiscountMode,
          vatRate: data.vatRate,
          whtEnabled: data.whtEnabled,
          whtRate: data.whtRate,
        });
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || !(session.user as any)?.role || (session.user as any).role !== 'admin') {
    return null;
  }

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/fee-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digitalFeeEnabled: config.digitalFeeEnabled,
          digitalFeePercent: config.digitalFeePercent,
          digitalFeeMin: config.digitalFeeMin,
          digitalFeeMax: config.digitalFeeMax,
          cashDiscountMode: config.cashDiscountMode,
          marketplaceCommStd: config.marketplaceCommissionStandard,
          marketplaceCommLaunch: config.marketplaceCommissionLaunch,
          marketplaceCommHV: config.marketplaceCommissionHighVolume,
          vatRate: config.vatRate,
          whtEnabled: config.whtEnabled,
          whtRate: config.whtRate,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save configuration');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fee & Pricing Configuration</h1>
            <p className="text-sm text-slate-500 mt-1">Manage platform fees, commissions, and tax settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6">
          ✓ Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
          ✗ {error}
        </div>
      )}

      {/* Digital Payment Fee Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-imboni-blue" />
          Digital Payment Convenience Fee
        </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="digitalFeeEnabled"
                checked={config.digitalFeeEnabled}
                onChange={(e) => setConfig({ ...config, digitalFeeEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-dark"
              />
              <label htmlFor="digitalFeeEnabled" className="text-gray-700 font-medium">
                Enable Digital Payment Fee
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={config.digitalFeePercent}
                  onChange={(e) => setConfig({ ...config, digitalFeePercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Fee (RWF)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={config.digitalFeeMin}
                  onChange={(e) => setConfig({ ...config, digitalFeeMin: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Fee (RWF)
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={config.digitalFeeMax}
                  onChange={(e) => setConfig({ ...config, digitalFeeMax: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="cashDiscountMode"
                checked={config.cashDiscountMode}
                onChange={(e) => setConfig({ ...config, cashDiscountMode: e.target.checked })}
                className="w-4 h-4 text-primary-dark"
              />
              <label htmlFor="cashDiscountMode" className="text-gray-700">
                Use Cash Discount Mode (instead of surcharge)
              </label>
            </div>
          </div>
        </div>

        {/* Marketplace Commission Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Marketplace Commission Tiers
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Launch Tier (%) - New Sellers
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={config.marketplaceCommissionLaunch}
                  onChange={(e) => setConfig({ ...config, marketplaceCommissionLaunch: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
                <p className="text-xs text-gray-500 mt-1">&lt; 10 orders</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Tier (%) - Default
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={config.marketplaceCommissionStandard}
                  onChange={(e) => setConfig({ ...config, marketplaceCommissionStandard: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
                <p className="text-xs text-gray-500 mt-1">Most sellers</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  High Volume Tier (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={config.marketplaceCommissionHighVolume}
                  onChange={(e) => setConfig({ ...config, marketplaceCommissionHighVolume: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
                <p className="text-xs text-gray-500 mt-1">&gt; RWF 5M/month</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Note:</strong> Commission rates exclude VAT. 18% VAT will be added to all commission invoices.
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Tax Configuration (Rwanda)
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={config.vatRate}
                  onChange={(e) => setConfig({ ...config, vatRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                />
                <p className="text-xs text-gray-500 mt-1">Rwanda standard: 18%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WHT Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={config.whtRate}
                  onChange={(e) => setConfig({ ...config, whtRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                  disabled={!config.whtEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">Withholding tax on commissions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="whtEnabled"
                checked={config.whtEnabled}
                onChange={(e) => setConfig({ ...config, whtEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-dark"
              />
              <label htmlFor="whtEnabled" className="text-gray-700">
                Enable Withholding Tax (WHT) capture on commission invoices
              </label>
            </div>
          </div>
        </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </AdminLayout>
  );
}
