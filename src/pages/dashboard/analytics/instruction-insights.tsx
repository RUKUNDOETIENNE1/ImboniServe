import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { MessageSquare, TrendingUp, Package, Filter } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type InstructionInsights = {
  period: number
  totalOrders: number
  totalOrdersWithInstructions: number
  instructionRate: string
  topTags: Array<{ tag: string; count: number }>
  topItemsWithInstructions: Array<{ item: string; count: number }>
  categoryBreakdown: Array<{ category: string; topTags: Array<{ tag: string; count: number }> }>
  sourceBreakdown: Array<{ source: string; topTags: Array<{ tag: string; count: number }> }>
}

export default function InstructionInsightsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<InstructionInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    fetchData()
  }, [period])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/instruction-insights?period=${period}`)
      if (res.ok) {
        const result = await res.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch instruction insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-imboni-blue" />
              <span suppressHydrationWarning>{t('instruction_insights.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('instruction_insights.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-imboni-blue text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span suppressHydrationWarning>{p} {t('instruction_insights.days')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600" suppressHydrationWarning>{t('instruction_insights.total_orders')}</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{data.totalOrders}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600" suppressHydrationWarning>{t('instruction_insights.orders_with_instructions')}</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{data.totalOrdersWithInstructions}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600" suppressHydrationWarning>{t('instruction_insights.instruction_rate')}</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{data.instructionRate}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Instruction Tags */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4" suppressHydrationWarning>{t('instruction_insights.top_instruction_tags')}</h3>
          {data.topTags.length === 0 ? (
            <p className="text-center text-slate-500 py-8" suppressHydrationWarning>{t('instruction_insights.no_instruction_tags')}</p>
          ) : (
            <div className="space-y-3">
              {data.topTags.map((tag, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      #{idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{tag.tag}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{tag.count}×</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Items with Most Instructions */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Items with Most Instructions</h3>
          {data.topItemsWithInstructions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.analytics.no_data', 'No data yet')}</p>
          ) : (
            <div className="space-y-3">
              {data.topItemsWithInstructions.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      #{idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{item.item}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{item.count}×</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Instructions by Category</h3>
        {data.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.topTags.map((tag, tidx) => (
                    <div key={tidx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{tag.tag}</span>
                      <span className="font-medium text-slate-800">{tag.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Source Breakdown */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Instructions by Order Source</h3>
        {data.sourceBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.sourceBreakdown.map((src, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">{src.source}</h4>
                <div className="space-y-2">
                  {src.topTags.map((tag, tidx) => (
                    <div key={tidx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{tag.tag}</span>
                      <span className="font-medium text-slate-800">{tag.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}
