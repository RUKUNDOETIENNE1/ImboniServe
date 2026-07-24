/**
 * Menu Intelligence Dashboard Page
 * 
 * Exposes existing Menu Intelligence capability through dashboard interface.
 * 
 * Existing Assets Reused:
 * - Service: src/lib/menu-intelligence/service.ts
 * - API: src/app/api/menu-intelligence/generate/route.ts
 * - Component: src/components/menu-intelligence/dashboard.tsx
 */

import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { MenuDashboard } from '@/components/menu-intelligence/dashboard'
import type { MenuDashboard as DashboardData } from '@/lib/menu-intelligence/types'
import { useTranslation } from '@/lib/i18n'
import { UtensilsCrossed, RefreshCw, AlertCircle } from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  
  return { 
    props: { 
      businessId: (session.user as any).businessId || '' 
    } 
  }
}

interface Props {
  businessId: string
}

export default function MenuIntelligencePage({ businessId }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('7d')

  useEffect(() => {
    if (businessId) {
      fetchIntelligence()
    }
  }, [businessId, timeRange])

  const fetchIntelligence = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/menu-intelligence/generate?businessId=${businessId}&timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate menu intelligence')
      }
      
      const data = await response.json()
      setDashboard(data.dashboard)
    } catch (err) {
      console.error('Menu Intelligence fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('menu_intelligence.title', 'Menu Intelligence')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('menu_intelligence.subtitle', 'Menu performance analysis and revenue optimization insights')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {(['today', 'yesterday', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {range === 'today' && t('menu_intelligence.today', 'Today')}
                  {range === 'yesterday' && t('menu_intelligence.yesterday', 'Yesterday')}
                  {range === '7d' && t('menu_intelligence.7d', '7 Days')}
                  {range === '30d' && t('menu_intelligence.30d', '30 Days')}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchIntelligence}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? t('menu_intelligence.analyzing', 'Analyzing...') : t('menu_intelligence.refresh', 'Refresh')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !dashboard && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                {t('menu_intelligence.loading', 'Analyzing menu performance...')}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  {t('menu_intelligence.error_title', 'Failed to generate intelligence')}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button
                  onClick={fetchIntelligence}
                  className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  {t('menu_intelligence.try_again', 'Try again')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !dashboard && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
              {t('menu_intelligence.no_data_title', 'No menu data available')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('menu_intelligence.no_data_message', 'There is no menu activity for the selected time range.')}
            </p>
            <button
              onClick={() => setTimeRange('30d')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {t('menu_intelligence.view_30d', 'View last 30 days')}
            </button>
          </div>
        )}

        {/* Dashboard Component */}
        {!loading && !error && dashboard && (
          <MenuDashboard dashboard={dashboard} />
        )}
      </div>
    </DashboardLayout>
  )
}
