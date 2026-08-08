import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { Package, TrendingUp, AlertTriangle, Settings, Check, X, Zap, Clock, BarChart3, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ReorderSuggestion {
  itemId: string
  itemName: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  suggestedQuantity: number
  estimatedCost: number
  reason: string
  confidence: number
  supplierName?: string
  currentStock?: number
  unit?: string
}

interface AutopilotDashboard {
  suggestions: any[]
  stats?: {
    totalItems?: number
    lowStockItems?: number
    pendingSuggestions?: number
    draftOrdersCreated?: number
  }
}

export default function AutoReorder() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<AutopilotDashboard | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/autopilot/reorder-suggestions')
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch reorder suggestions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard()
    }
  }, [status, fetchDashboard])

  async function handleAction(index: number, action: 'approve' | 'dismiss') {
    setActionLoading(`${index}-${action}`)
    try {
      const res = await fetch('/api/autopilot/reorder-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionIndex: index, action }),
      })
      if (res.ok) {
        showToast('success', action === 'approve' ? 'Reorder approved and draft created' : 'Suggestion dismissed')
        fetchDashboard()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast('error', data.error || 'Action failed')
      }
    } catch (error) {
      showToast('error', 'Network error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleGenerateDrafts() {
    setActionLoading('generate-drafts')
    try {
      const res = await fetch('/api/autopilot/reorder-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-drafts' }),
      })
      if (res.ok) {
        const data = await res.json()
        showToast('success', `Generated ${data.draftCount || 0} draft purchase orders`)
        fetchDashboard()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast('error', data.error || 'Failed to generate drafts')
      }
    } catch (error) {
      showToast('error', 'Network error')
    } finally {
      setActionLoading(null)
    }
  }

  const reorderSuggestions: ReorderSuggestion[] = (dashboard?.suggestions || []).map((s: any) => ({
    itemId: s.itemId || s.id,
    itemName: s.itemName || s.name,
    urgency: s.urgency || 'medium',
    suggestedQuantity: s.suggestedQuantity || s.suggestedQty || 0,
    estimatedCost: s.estimatedCost || 0,
    reason: s.reason || s.explanation || '',
    confidence: s.confidence ? Math.round(s.confidence * 100) : 0,
    supplierName: s.supplierName,
    currentStock: s.currentStock,
    unit: s.unit,
  }))

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-900'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-900'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'low': return 'bg-green-50 border-green-200 text-green-900'
      default: return 'bg-slate-50 border-slate-200 text-slate-900'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-imboni-blue" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('reorder.title', 'Automated Reordering')}</h1>
            <p className="text-slate-600">{t('reorder.subtitle', 'AI-powered inventory management')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {t('reorder.settings', 'Settings')}
            </button>
            <button
              onClick={handleGenerateDrafts}
              disabled={actionLoading === 'generate-drafts' || reorderSuggestions.length === 0}
              className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'generate-drafts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {t('reorder.processAll', 'Generate Draft POs')}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('reorder.aiSettings', 'AI Reorder Settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.predictionModel', 'Prediction Model')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>AI Machine Learning</option>
                  <option>Historical Average</option>
                  <option>Manual Threshold Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.reorderTrigger', 'Reorder Trigger')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>{t('reorder.predictedStockout', 'Predicted Stockout')}</option>
                  <option>{t('reorder.belowThreshold', 'Below Threshold')}</option>
                  <option>{t('reorder.both', 'Both')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.safetyStock', 'Safety Stock %')}</label>
                <input type="number" defaultValue={20} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.maxBudget', 'Max Budget (RWF)')}</label>
                <input type="number" defaultValue={500000} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-imboni-blue" />
                  <span className="text-sm text-slate-700">{t('reorder.autoApprove', 'Auto-approve orders under 100,000 RWF')}</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700">
                {t('reorder.saveSettings', 'Save Settings')}
              </button>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-imboni-blue" />
            {t('reorder.aiSuggestions', 'AI Reorder Suggestions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reorderSuggestions.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No reorder suggestions at this time. Inventory levels are healthy.</p>
              </div>
            )}
            {reorderSuggestions.map((suggestion, idx) => (
              <div key={`${suggestion.itemId}-${idx}`} className={`bg-white rounded-xl border-2 p-6 ${getUrgencyColor(suggestion.urgency)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{suggestion.itemName}</h3>
                      <span className={`text-xs font-medium uppercase`}>{suggestion.urgency}</span>
                    </div>
                  </div>
                  {suggestion.confidence > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">{suggestion.confidence}%</div>
                      <div className="text-xs">{t('reorder.confidence', 'confidence')}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>{t('reorder.suggestedQty', 'Suggested Qty')}</span>
                    <span className="font-semibold">{suggestion.suggestedQuantity} {suggestion.unit || ''}</span>
                  </div>
                  {suggestion.estimatedCost > 0 && (
                    <div className="flex justify-between">
                      <span>{t('reorder.estimatedCost', 'Est. Cost')}</span>
                      <span className="font-semibold">{suggestion.estimatedCost.toLocaleString()} RWF</span>
                    </div>
                  )}
                  {suggestion.supplierName && (
                    <div className="flex justify-between">
                      <span>Supplier</span>
                      <span className="font-medium text-sm">{suggestion.supplierName}</span>
                    </div>
                  )}
                </div>

                {suggestion.reason && (
                  <p className="text-sm mb-4 opacity-90">{suggestion.reason}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(idx, 'approve')}
                    disabled={actionLoading === `${idx}-approve`}
                    className="flex-1 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {actionLoading === `${idx}-approve` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {t('reorder.approve', 'Approve')}
                  </button>
                  <button
                    onClick={() => handleAction(idx, 'dismiss')}
                    disabled={actionLoading === `${idx}-dismiss`}
                    className="flex-1 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {actionLoading === `${idx}-dismiss` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    {t('reorder.ignore', 'Ignore')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-imboni-blue" />
              <span className="text-sm text-slate-600">Total Items Tracked</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{dashboard?.stats?.totalItems ?? '-'}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-slate-600">Low Stock Items</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{dashboard?.stats?.lowStockItems ?? '-'}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-imboni-blue" />
              <span className="text-sm text-slate-600">Draft Orders Created</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{dashboard?.stats?.draftOrdersCreated ?? 0}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
