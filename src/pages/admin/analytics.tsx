import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, AlertTriangle, Eye, ShoppingCart, MessageSquare, Filter } from 'lucide-react';
import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]');
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions);
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } };
  const roles: string[] = (session.user as any).roles || [];
  if (!roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { props: {} };
};

function InsightCard({ insight }: { insight: any }) {
  const severityColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-amber-300 bg-amber-50',
    low: 'border-blue-300 bg-blue-50',
  };

  const severityIcons = {
    high: <AlertTriangle className="w-5 h-5 text-red-600" />,
    medium: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    low: <AlertTriangle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${severityColors[insight.severity as keyof typeof severityColors] || 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{severityIcons[insight.severity as keyof typeof severityIcons]}</div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 mb-1">{insight.itemName || insight.allergen || 'Insight'}</div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.message}</p>
          {insight.metrics && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(insight.metrics).map(([key, value]) => (
                <span key={key} className="text-xs bg-white px-2 py-1 rounded-full border border-slate-200">
                  <span className="font-medium">{key}:</span> {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/insights?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const menuInsights = data?.menuInsights || {};
  const allergenInsights = data?.allergenInsights || {};
  const aiInsights = data?.aiInsights || {};

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Analytics & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Actionable insights from customer behavior</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                days === d ? 'bg-imboni-blue text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Items"
              value={menuInsights.summary?.totalItems || 0}
              icon={ShoppingCart}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Items with Views"
              value={menuInsights.summary?.itemsWithViews || 0}
              icon={Eye}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="AI Questions"
              value={aiInsights.totalQuestions || 0}
              icon={MessageSquare}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="Items Filtered"
              value={allergenInsights.totalFiltered || 0}
              icon={Filter}
              color="bg-amber-100 text-amber-600"
            />
          </div>

          {/* Menu Insights */}
          {menuInsights.insights && menuInsights.insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Menu Performance Insights
              </h2>
              <div className="space-y-3">
                {menuInsights.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Top & Bottom Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performers */}
            {menuInsights.topPerformers && menuInsights.topPerformers.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">🏆 Top Performers</h2>
                <div className="space-y-2">
                  {menuInsights.topPerformers.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.ordered} orders</div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        {(item.revenue / 100).toLocaleString()} RWF
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Performers */}
            {menuInsights.bottomPerformers && menuInsights.bottomPerformers.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">📉 Needs Attention</h2>
                <div className="space-y-2">
                  {menuInsights.bottomPerformers.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.views} views, {item.ordered} orders</div>
                      </div>
                      <div className="text-sm font-semibold text-amber-600">
                        {item.ordered === 0 ? 'No orders' : `${item.ordered} orders`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Allergen Insights */}
          {allergenInsights.insights && allergenInsights.insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Allergen Impact
              </h2>
              <div className="space-y-3">
                {allergenInsights.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Top Allergens */}
          {allergenInsights.topAllergens && allergenInsights.topAllergens.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Most Filtered Allergens</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {allergenInsights.topAllergens.map((item: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="font-semibold text-slate-800">{item.allergen}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.count} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Usage */}
          {aiInsights.topKeywords && aiInsights.topKeywords.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> AI Assistant Usage
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Customers asked {aiInsights.totalQuestions} questions (avg {aiInsights.avgQuestionsPerDay?.toFixed(1)} per day)
              </p>
              <div className="flex flex-wrap gap-2">
                {aiInsights.topKeywords.map((item: any, i: number) => (
                  <div key={i} className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm">
                    <span className="font-medium">{item.keyword}</span>
                    <span className="text-slate-500 ml-1">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && (!menuInsights.insights || menuInsights.insights.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No insights available yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Insights will appear as customers interact with your menu
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
