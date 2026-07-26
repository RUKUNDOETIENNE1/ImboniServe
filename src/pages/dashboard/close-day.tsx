import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { CheckCircle2, Loader2, Lock, AlertTriangle, Calendar, Receipt, TrendingUp, Download, Clock } from 'lucide-react'
import { useToast } from '@/components/Toast'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  MTN_MOBILE_MONEY: 'MTN Mobile Money',
  AIRTEL_MONEY: 'Airtel Money',
  CARD: 'Card',
  PESAPAL_CARD: 'Pesapal Card',
  BANK_TRANSFER: 'Bank Transfer',
  WEB: 'Web Payment',
  MOMO_PUSH: 'MoMo Push',
  OTHER: 'Other',
}

const ORDER_SOURCE_LABELS: Record<string, string> = {
  WAITER_POS: 'Waiter POS',
  QR_TABLE: 'QR Table',
  QR_BRANCH: 'QR Branch',
  QR_PREORDER: 'QR Pre-order',
  QR_PICKUP: 'QR Pickup',
  WHATSAPP: 'WhatsApp',
  RESERVATION: 'Reservation',
}

export default function CloseDayPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const fetchReport = async (date?: string) => {
    setLoading(true)
    setError(null)
    try {
      const d = date || selectedDate
      const res = await fetch(`/api/reports/close-day?date=${d}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load Z-Report')
      setData(json)
    } catch (e: any) {
      setError(e.message || 'Failed to load Z-Report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [selectedDate])

  const handleCloseDay = async () => {
    if (!data) return
    setClosing(true)
    try {
      const res = await fetch('/api/reports/close-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to close day')
      showToast('success', 'Day closed successfully. Z-Report finalized.')
      fetchReport()
    } catch (e: any) {
      showToast('error', e.message || 'Failed to close day')
    } finally {
      setClosing(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?type=daily&date=${selectedDate}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `z-report-${selectedDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      showToast('error', 'Failed to export Z-Report')
    }
  }

  const fmtDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Close Day / Z-Report</h1>
              <p className="text-sm text-slate-500 mt-1">
                End-of-day reconciliation and sales summary
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
              <button
                onClick={handleExport}
                disabled={loading || !data}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-600 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading Z-Report...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Day Status Banner */}
            {data.isClosed ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Day Closed</p>
                  <p className="text-sm text-green-700">
                    This day has been reconciled and closed. The Z-Report is finalized.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">Day Open</p>
                  <p className="text-sm text-amber-700">
                    Review the summary below and close the day when ready. Closing finalizes the Z-Report.
                  </p>
                </div>
                <button
                  onClick={handleCloseDay}
                  disabled={closing}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {closing ? 'Closing...' : 'Close Day'}
                </button>
              </div>
            )}

            {/* Date Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-imboni-blue" />
                <h2 className="text-lg font-semibold text-slate-800">{fmtDate(data.date)}</h2>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  <CurrencyDisplay amount={data.summary.totalRevenueCents / 100} />
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">Total Orders</p>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{data.summary.totalOrders}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">Avg Order Value</p>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  <CurrencyDisplay amount={data.summary.avgOrderValueCents / 100} />
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">VAT Collected</p>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  <CurrencyDisplay amount={data.summary.vatCollectedCents / 100} />
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {data.business.taxMode} ({data.business.taxRate}%)
                </p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Method Breakdown</h3>
              {data.paymentBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Method</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Orders</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paymentBreakdown.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {PAYMENT_METHOD_LABELS[p.method] || p.method}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">{p.count}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">
                            <CurrencyDisplay amount={p.amountCents / 100} />
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 text-right">
                            {data.summary.totalRevenueCents > 0
                              ? ((p.amountCents / data.summary.totalRevenueCents) * 100).toFixed(1)
                              : '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No completed sales for this day.</p>
                </div>
              )}
            </div>

            {/* Order Sources & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Sources</h3>
                {data.orderSources.length > 0 ? (
                  <div className="space-y-2">
                    {data.orderSources.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">
                          {ORDER_SOURCE_LABELS[s.source] || s.source}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{s.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No orders recorded.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Operational Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Completed Orders</span>
                    <span className="text-sm font-medium text-green-600">{data.summary.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Pending Orders</span>
                    <span className="text-sm font-medium text-amber-600">{data.summary.pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Voided Orders</span>
                    <span className="text-sm font-medium text-red-600">{data.summary.voidedOrders}</span>
                  </div>
                  {data.reservations.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Reservations ({r.status})</span>
                      <span className="text-sm font-medium text-slate-800">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Log */}
            {data.sales.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Transaction Log ({data.sales.length})</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Order #</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Time</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Method</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Source</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 px-3 text-xs text-slate-600 font-mono">{s.orderNumber}</td>
                          <td className="py-2 px-3 text-xs text-slate-600">
                            {new Date(s.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-600">
                            {PAYMENT_METHOD_LABELS[s.paymentMethod] || s.paymentMethod}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-600">
                            {ORDER_SOURCE_LABELS[s.orderSource] || s.orderSource}
                          </td>
                          <td className="py-2 px-3 text-xs font-medium text-slate-800 text-right">
                            <CurrencyDisplay amount={s.amountCents / 100} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reconciliation Summary */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Reconciliation Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600">Gross Revenue</span>
                  <span className="text-sm font-bold text-slate-800">
                    <CurrencyDisplay amount={data.summary.totalRevenueCents / 100} />
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">VAT Collected ({data.business.taxRate}%)</span>
                  <span className="text-sm font-medium text-orange-600">
                    <CurrencyDisplay amount={data.summary.vatCollectedCents / 100} />
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Net Revenue</span>
                  <span className="text-sm font-bold text-green-600">
                    <CurrencyDisplay amount={data.summary.netRevenueCents / 100} />
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Total Orders</span>
                  <span className="text-sm font-medium text-slate-800">{data.summary.totalOrders}</span>
                </div>
                {data.summary.pendingOrders > 0 && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-200">
                    <span className="text-sm text-amber-700">Pending Orders (unclosed)</span>
                    <span className="text-sm font-medium text-amber-600">{data.summary.pendingOrders}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
