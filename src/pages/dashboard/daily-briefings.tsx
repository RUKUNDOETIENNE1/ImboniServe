/**
 * Daily Briefings Dashboard Page
 * 
 * Exposes existing Daily Briefings capability through dashboard interface.
 * 
 * Existing Assets Reused:
 * - Service: src/lib/daily-briefings/service.ts
 * - API: src/app/api/daily-briefings/generate/route.ts
 * - Component: src/components/daily-briefings/dashboard.tsx
 */

import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { DailyBriefingsDashboard } from '@/components/daily-briefings/dashboard'
import type { DailyBriefingDashboard } from '@/lib/daily-briefings/types'
import { useTranslation } from '@/lib/i18n'
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react'

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

export default function DailyBriefingsPage({ businessId }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DailyBriefingDashboard | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (businessId) {
      fetchBriefing()
    }
  }, [businessId, selectedDate])

  const fetchBriefing = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/daily-briefings/generate?businessId=${businessId}&date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate daily briefing')
      }
      
      const data = await response.json()
      setDashboard(data.dashboard)
    } catch (err) {
      console.error('Daily Briefings fetch error:', err)
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
              {t('daily_briefings.title', 'Daily Briefings')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('daily_briefings.subtitle', 'Your daily operational intelligence summary')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? t('daily_briefings.generating', 'Generating...') : t('daily_briefings.refresh', 'Refresh')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !dashboard && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                {t('daily_briefings.loading', 'Generating your daily briefing...')}
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
                  {t('daily_briefings.error_title', 'Failed to generate briefing')}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button
                  onClick={fetchBriefing}
                  className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  {t('daily_briefings.try_again', 'Try again')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !dashboard && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
              {t('daily_briefings.no_data_title', 'No briefing available')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('daily_briefings.no_data_message', 'There is no operational data for the selected date.')}
            </p>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {t('daily_briefings.view_today', 'View today\'s briefing')}
            </button>
          </div>
        )}

        {/* Dashboard Component */}
        {!loading && !error && dashboard && (
          <DailyBriefingsDashboard dashboard={dashboard} />
        )}
      </div>
    </DashboardLayout>
  )
}
