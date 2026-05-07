import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { useToast } from '@/components/Toast'
import { AlertTriangle, RefreshCw, Brain, TrendingUp, TrendingDown, Minus, Calendar, Zap, Users, CreditCard, Clock, ChevronRight, Sparkles } from 'lucide-react'

type ReorderSuggestion = {
  inventoryItemId: string
  name: string
  unit: string
  currentStock: number
  minStockLevel: number
  demandPerDay: number
  leadTimeDays: number
  safetyStock: number
  reorderPoint: number
  suggestedQty: number
}

type SupplierLite = {
  id: string
  name: string
}

type CostAnomalyAlert = {
  id: string
  createdAt: string
  status: string
  severity: string
  supplierId: string
  supplierName?: string
  productName: string
  unit: string
  observedUnitPriceCents: number
  trailingAvgUnitPriceCents: number
  deltaPercent: number
  thresholdPercent: number
  zScore: number | null
  notes: string | null
}

type InsightReport = {
  id: string
  businessId: string
  periodType: 'WEEKLY' | 'MONTHLY'
  periodStart: string
  periodEnd: string
  language: string
  kpiSnapshot: any
  insightText: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostCents: number | null
  triggerSource: string
  createdAt: string
}

import { formatCurrency } from '@/lib/utils/currency'

function formatRwf(cents: number) {
  return formatCurrency(Math.round(cents / 100), 'RWF')
}

function formatRwfFromCents(value?: number | null) {
  if (value === undefined || value === null) return '-'
  return formatCurrency(value / 100, 'RWF')
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'upward') return <TrendingUp className="w-4 h-4 text-green-600" />
  if (trend === 'downward') return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-slate-400" />
}

function KpiCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function BusinessSummaryTab({ businessId }: { businessId: string | undefined }) {
  const { showToast } = useToast()
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [report, setReport] = useState<InsightReport | null>(null)
  const [history, setHistory] = useState<InsightReport[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  if (!businessId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
        <p className="text-slate-800 font-semibold mb-2">Business ID Required</p>
        <p className="text-sm text-slate-500 mb-4">Your account needs to be linked to a business to use AI insights.</p>
        <p className="text-xs text-slate-400">Please contact support or check your account settings.</p>
      </div>
    )
  }

  const fetchLatest = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/insights/history?businessId=${businessId}&periodType=${period}&limit=1`)
      if (res.ok) {
        const data = await res.json()
        setReport(Array.isArray(data) && data.length > 0 ? data[0] : null)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [businessId, period])

  const fetchHistory = useCallback(async () => {
    if (!businessId) return
    try {
      const res = await fetch(`/api/insights/history?businessId=${businessId}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setHistory(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }, [businessId])

  useEffect(() => { fetchLatest() }, [fetchLatest])

  const generate = async () => {
    if (!businessId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, period, language: 'en' })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate')
      }
      const data = await res.json()
      setReport(data)
      showToast('success', 'Insight generated successfully')
    } catch (e: any) {
      showToast('error', e?.message || 'Generation failed')
    } finally { setGenerating(false) }
  }

  const kpi = report?.kpiSnapshot

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-imboni-blue to-imboni-gold text-white">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Business Summary</h2>
            <p className="text-xs text-slate-500">Actionable insights from your data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
            <button
              onClick={() => setPeriod('WEEKLY')}
              className={`px-3 py-1.5 transition ${period === 'WEEKLY' ? 'bg-imboni-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >Weekly</button>
            <button
              onClick={() => setPeriod('MONTHLY')}
              className={`px-3 py-1.5 transition ${period === 'MONTHLY' ? 'bg-imboni-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >Monthly</button>
          </div>
          <button
            onClick={generate}
            disabled={generating || !businessId}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-imboni text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <div className="animate-pulse text-sm text-slate-500">Loading latest insight...</div>
        </div>
      ) : !report ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No insight report yet</p>
          <p className="text-sm text-slate-400 mt-1">Click Generate to create your first AI business summary</p>
        </div>
      ) : (
        <>
          {kpi && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard
                label="Revenue"
                value={formatRwf(kpi.revenue?.total || 0)}
                sub={kpi.revenue?.growthPct != null ? `${kpi.revenue.growthPct > 0 ? '+' : ''}${kpi.revenue.growthPct}% vs prior` : undefined}
                icon={<TrendIcon trend={kpi.signals?.trend || 'flat'} />}
              />
              <KpiCard
                label="Transactions"
                value={String(kpi.transactions?.count || 0)}
                sub={`AOV ${formatRwf(kpi.transactions?.aov || 0)}`}
                icon={<CreditCard className="w-4 h-4" />}
              />
              <KpiCard
                label="Avg Daily"
                value={formatRwf(kpi.revenue?.avgDaily || 0)}
                sub={kpi.revenue?.bestDay ? `Best: ${kpi.revenue.bestDay}` : undefined}
                icon={<Calendar className="w-4 h-4" />}
              />
              <KpiCard
                label="Peak Hour"
                value={kpi.timePatterns?.peakHour || '-'}
                sub={kpi.timePatterns?.lowHour ? `Low: ${kpi.timePatterns.lowHour}` : undefined}
                icon={<Clock className="w-4 h-4" />}
              />
              <KpiCard
                label="Repeat Rate"
                value={`${Math.round((kpi.customers?.repeatRate || 0) * 100)}%`}
                sub={`New: ${Math.round((kpi.customers?.newRate || 0) * 100)}%`}
                icon={<Users className="w-4 h-4" />}
              />
              <KpiCard
                label="Pay Success"
                value={`${Math.round((kpi.subscription?.paymentSuccessRate || 0) * 100)}%`}
                sub={kpi.subscription?.status || ''}
                icon={<Zap className="w-4 h-4" />}
              />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Insight Report</h3>
                <p className="text-xs text-slate-400">
                  {report.periodType} &middot; {new Date(report.periodStart).toLocaleDateString()} &ndash; {new Date(report.periodEnd).toLocaleDateString()}
                  &middot; {report.model} &middot; {report.totalTokens} tokens
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${report.triggerSource === 'AUTO' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-imboni-orange'}`}>
                {report.triggerSource}
              </span>
            </div>
            <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {report.insightText}
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60">
        <button
          onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory() }}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-2xl transition"
        >
          <span className="font-medium text-slate-700 text-sm">Report History</span>
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>
        {showHistory && (
          <div className="px-4 pb-4">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No reports yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setReport(h)}
                    className="w-full flex items-center justify-between py-2.5 text-left hover:bg-slate-50 transition text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-700">{h.periodType}</span>
                      <span className="text-slate-400 ml-2">{new Date(h.periodStart).toLocaleDateString()} &ndash; {new Date(h.periodEnd).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${h.triggerSource === 'AUTO' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-imboni-orange'}`}>{h.triggerSource}</span>
                      <span className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIDashboard() {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([])
  const [chosenQtyByItemId, setChosenQtyByItemId] = useState<Record<string, number>>({})
  const [loggingByItemId, setLoggingByItemId] = useState<Record<string, boolean>>({})
  const [alerts, setAlerts] = useState<CostAnomalyAlert[]>([])

  const [suppliers, setSuppliers] = useState<SupplierLite[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')

  const [testProductName, setTestProductName] = useState('Fresh Tomatoes')
  const [testUnit, setTestUnit] = useState('kg')
  const [testQty, setTestQty] = useState(10)
  const [testUnitPriceRwf, setTestUnitPriceRwf] = useState(1500)
  const [creatingProcurement, setCreatingProcurement] = useState(false)

  const [activeTab, setActiveTab] = useState<'summary' | 'operations'>('summary')
  const businessId = (session?.user as any)?.businessId as string | undefined

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/ai/reorder?includeAll=true')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch reorder suggestions')
      }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      setSuggestions(arr)
      setChosenQtyByItemId((prev) => {
        const next = { ...prev }
        for (const s of arr) {
          if (next[s.inventoryItemId] === undefined) next[s.inventoryItemId] = Number(s.suggestedQty)
        }
        return next
      })
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to fetch reorder suggestions')
    }
  }

  const logReorderDecision = async (s: ReorderSuggestion, requestedAction: 'ACCEPTED' | 'REJECTED') => {
    const chosenRaw = chosenQtyByItemId[s.inventoryItemId]
    const chosenQty = requestedAction === 'REJECTED'
      ? 0
      : Number.isFinite(chosenRaw)
        ? Number(chosenRaw)
        : Number(s.suggestedQty)

    const action: 'ACCEPTED' | 'EDITED' | 'REJECTED' = requestedAction === 'REJECTED'
      ? 'REJECTED'
      : chosenQty === Number(s.suggestedQty)
        ? 'ACCEPTED'
        : 'EDITED'

    setLoggingByItemId((prev) => ({ ...prev, [s.inventoryItemId]: true }))
    try {
      const res = await fetch('/api/ai/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: s.inventoryItemId,
          suggestedQty: Number(s.suggestedQty),
          chosenQty: Number(chosenQty),
          action,
          explanation: {
            source: 'dashboard/ai',
            itemName: s.name,
            unit: s.unit,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to log reorder decision')
      }

      showToast('success', action === 'REJECTED' ? 'Suggestion dismissed' : 'Suggestion saved')
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to log reorder decision')
    } finally {
      setLoggingByItemId((prev) => ({ ...prev, [s.inventoryItemId]: false }))
    }
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/ai/cost-anomalies?status=OPEN&limit=50')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch cost anomaly alerts')
      }
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to fetch cost anomaly alerts')
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/marketplace/suppliers/nearest?limit=20')
      if (!res.ok) return
      const data = await res.json()
      const lite: SupplierLite[] = (Array.isArray(data) ? data : []).map((s: any) => ({
        id: s.id,
        name: s.name,
      }))
      setSuppliers(lite)
      if (!selectedSupplierId && lite.length > 0) {
        setSelectedSupplierId(lite[0].id)
      }
    } catch {
      // ignore
    }
  }

  const refreshAll = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    setLoading(true)
    await Promise.all([fetchSuggestions(), fetchAlerts(), fetchSuppliers()])
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    if (!businessId) { setLoading(false); return }
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const updateAlertStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/ai/cost-anomalies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update alert')
      }
      showToast('success', `Alert marked ${status}`)
      fetchAlerts()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to update alert')
    }
  }

  const createTestProcurement = async () => {
    if (!businessId) {
      showToast('error', 'No business linked to this account')
      return
    }
    if (!selectedSupplierId) {
      showToast('error', 'Select a supplier first')
      return
    }

    setCreatingProcurement(true)
    try {
      const unitPriceCents = Math.round(Number(testUnitPriceRwf) * 100)

      const poRes = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          supplierId: selectedSupplierId,
          items: [
            {
              productName: testProductName,
              quantity: Number(testQty),
              unit: testUnit,
              unitPriceCents,
            },
          ],
        }),
      })

      if (!poRes.ok) {
        const err = await poRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create purchase order')
      }

      const po = await poRes.json()
      const poItemId = po?.items?.[0]?.id
      if (!po?.id || !poItemId) {
        throw new Error('Purchase order created but items are missing')
      }

      const grnRes = await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: po.id,
          businessId,
          supplierId: selectedSupplierId,
          items: [
            {
              poItemId,
              productName: testProductName,
              orderedQuantity: Number(testQty),
              receivedQuantity: Number(testQty),
              unit: testUnit,
              unitPriceCents,
              condition: 'GOOD',
            },
          ],
        }),
      })

      if (!grnRes.ok) {
        const err = await grnRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create GRN')
      }

      showToast('success', 'Created PO + GRN. If you create a second GRN with a much higher price, an anomaly alert should appear.')
      await fetchAlerts()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to create test procurement')
    } finally {
      setCreatingProcurement(false)
    }
  }

  if (!businessId) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center max-w-2xl mx-auto mt-12">
          <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2" suppressHydrationWarning>{t('ai.setup_required.title', 'Business Setup Required')}</h2>
          <p className="text-slate-600 mb-4" suppressHydrationWarning>{t('ai.setup_required.body', 'To use AI Insights, your account must be linked to a business.')}</p>
          <p className="text-sm text-slate-500 mb-6" suppressHydrationWarning>{t('ai.setup_required.note', 'If you just signed up, this should be resolved automatically. If the issue persists, please contact support.')}</p>
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-imboni-blue text-white rounded-lg hover:bg-primary-700 transition"
          >
            {t('ai.setup_required.go_to_settings', 'Go to Settings')}
          </a>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{t('ai.title', 'AI Insights')}</h1>
          <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('ai.subtitle', 'Business Intelligence & Operations')}</p>
        </div>
        {activeTab === 'operations' && (
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'summary'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Brain className="w-4 h-4" />
          Business Summary
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'operations'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Operations AI
        </button>
      </div>

      {activeTab === 'summary' ? (
        <BusinessSummaryTab businessId={businessId} />
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Smart Reorder Recommendations</h2>

          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-sm text-slate-500">
              No suggestions yet.
              <div className="mt-2">
                Tip: go to <span className="font-medium">Inventory</span> and create items with <span className="font-medium">current stock</span> below <span className="font-medium">min stock</span>.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">Item</th>
                    <th className="py-2 pr-4">Stock</th>
                    <th className="py-2 pr-4">Min</th>
                    <th className="py-2 pr-4">Suggested</th>
                    <th className="py-2 pr-4">Chosen</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suggestions.slice(0, 20).map((s) => (
                    <tr key={s.inventoryItemId}>
                      <td className="py-2 pr-4">
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-500">Unit: {s.unit}</div>
                      </td>
                      <td className="py-2 pr-4">{s.currentStock}</td>
                      <td className="py-2 pr-4">{s.minStockLevel}</td>
                      <td className="py-2 pr-4 font-semibold text-imboni-blue">{s.suggestedQty}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="number"
                          className="w-24 px-2 py-1 rounded-lg border border-slate-200"
                          value={chosenQtyByItemId[s.inventoryItemId] ?? s.suggestedQty}
                          onChange={(e) =>
                            setChosenQtyByItemId((prev) => ({
                              ...prev,
                              [s.inventoryItemId]: Number(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={!!loggingByItemId[s.inventoryItemId]}
                            onClick={() => logReorderDecision(s, 'ACCEPTED')}
                            className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            disabled={!!loggingByItemId[s.inventoryItemId]}
                            onClick={() => logReorderDecision(s, 'REJECTED')}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cost Anomaly Alerts</h2>

          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-slate-500">
              No open alerts.
              <div className="mt-2 flex items-start gap-2 text-slate-600">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                Alerts are created when you record a GRN (goods received note) with a higher unit price than history.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 20).map((a) => (
                <div key={a.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-800">{a.productName}</div>
                      <div className="text-xs text-slate-500">
                        Supplier: {a.supplierName || a.supplierId} | Severity: {a.severity}
                      </div>
                      <div className="text-xs text-slate-600 mt-2">
                        Observed: {formatRwfFromCents(a.observedUnitPriceCents)} | Trailing avg: {formatRwfFromCents(a.trailingAvgUnitPriceCents)}
                      </div>
                      <div className="text-xs text-slate-600">
                        Delta: {Number(a.deltaPercent).toFixed(1)}% | Threshold: {Number(a.thresholdPercent).toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => updateAlertStatus(a.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => updateAlertStatus(a.id, 'DISMISSED')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => updateAlertStatus(a.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Create Test Data (Purchase Order + GRN)</h2>
        <p className="text-sm text-slate-500 mb-4">
          This helps you generate real Cost Anomaly Alerts.
          Create one GRN at a normal price, then create a second GRN with a much higher price to trigger an alert.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Supplier</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Product name</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              value={testProductName}
              onChange={(e) => setTestProductName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Unit</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              value={testUnit}
              onChange={(e) => setTestUnit(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Qty</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              value={testQty}
              onChange={(e) => setTestQty(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Unit price (RWF)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              value={testUnitPriceRwf}
              onChange={(e) => setTestUnitPriceRwf(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-5">
            <button
              disabled={creatingProcurement}
              onClick={createTestProcurement}
              className="px-4 py-2 rounded-xl bg-imboni-blue text-white hover:bg-imboni-blue/90 disabled:opacity-50"
            >
              {creatingProcurement ? 'Creating...' : 'Create PO + GRN'}
            </button>
          </div>
        </div>
      </div>
    </>
      )}
    </DashboardLayout>
  )
}
