import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { BarChart, TrendingUp, DollarSign, Zap, AlertTriangle } from 'lucide-react';

export default function AIMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const roles = (session?.user as any)?.roles || [];
    if (!roles.includes('PLATFORM_ADMIN')) {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ai-monitoring?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <AdminLayout title="AI Cost Monitoring">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Cost Monitoring">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Cost Monitoring</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total AI Calls</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalCalls.toLocaleString()}</p>
              </div>
              <Zap className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalCreditsUsed.toLocaleString()}</p>
              </div>
              <BarChart className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost (USD)</p>
                <p className="text-2xl font-bold text-gray-900">${data.summary.totalCostUSD}</p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projected Monthly</p>
                <p className="text-2xl font-bold text-gray-900">${data.projections.projectedMonthlyCostUSD}</p>
                <p className="text-xs text-gray-500">{Number(data.projections.projectedMonthlyCostRWF).toLocaleString()} RWF</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Usage by Feature */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Usage by Feature</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.byFeature.map((item: any) => (
                  <tr key={item.feature}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.feature}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.creditsUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tokensUsed.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.costUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Businesses */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 20 Businesses by Usage</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topBusinesses.map((item: any) => (
                  <tr key={item.businessId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.businessName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{item.planCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.creditsUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.costUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Businesses Near Limit */}
        {data.businessesNearLimit.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-bold text-red-900">Businesses Near AI Credit Limit (80%+)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-red-200">
                <thead className="bg-red-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Used / Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">% Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Reset Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-red-100">
                  {data.businessesNearLimit.map((item: any) => {
                    const percentUsed = ((item.aiCreditsUsed / item.aiCreditsLimit) * 100).toFixed(0);
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.plan?.code || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.aiCreditsUsed} / {item.aiCreditsLimit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            Number(percentUsed) >= 95 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {percentUsed}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.aiResetDate ? new Date(item.aiResetDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
