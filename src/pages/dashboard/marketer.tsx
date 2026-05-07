import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { Wallet, Link as LinkIcon, QrCode, ArrowDownRight, ArrowUpRight, History, Building2, Copy, CheckCircle2, Download } from 'lucide-react'

interface WalletSummary {
  availableBalance: number
  pendingBalance: number
  lockedBalance: number
  totalEarned: number
  totalPaidOut: number
  netBalance: number
}

interface DashboardData {
  marketer: {
    id: string
    name: string
    email: string
    referralCode: string
    status: string
    createdAt: string
  }
  wallet: WalletSummary | null
  commissions: any
  payouts: any
  attributions: {
    total: number
    bySource: Record<string, number>
    byCampaign: Record<string, number>
    recent: Array<any>
  }
  recentActivity: Array<any>
}

export default function MarketerDashboard() {
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [payouts, setPayouts] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [copyOk, setCopyOk] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const [payoutForm, setPayoutForm] = useState({
    amountCents: 0,
    method: 'MTN_MOBILE_MONEY' as 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | 'BANK_TRANSFER',
    recipientPhone: '',
    recipientBank: '',
    recipientAccount: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [dashRes, payoutRes, bizRes] = await Promise.all([
          fetch('/api/marketer/dashboard'),
          fetch('/api/marketer/payout/history?limit=20'),
          fetch('/api/marketer/businesses')
        ])
        if (!dashRes.ok) throw new Error('Failed to load dashboard')
        const dash = await dashRes.json()
        setData(dash.data)

        if (payoutRes.ok) {
          const ph = await payoutRes.json()
          setPayouts(ph.payouts || [])
        }
        if (bizRes.ok) {
          const bz = await bizRes.json()
          setBusinesses(bz.businesses || [])
        }
      } catch (e) {
        showToast('error', t('dashboard.marketer.load_failed', 'Failed to load marketer dashboard'))
      } finally {
        setLoading(false)
      }
    }
    if (status === 'authenticated') fetchAll()
  }, [status])

  const referralLink = useMemo(() => {
    const code = data?.marketer?.referralCode
    if (!code && typeof window === 'undefined') return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/signup?m=${code}`
  }, [data?.marketer?.referralCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 1500)
      showToast('success', t('dashboard.marketer.link_copied', 'Referral link copied'))
    } catch {
      showToast('error', t('dashboard.marketer.copy_failed', 'Failed to copy link'))
    }
  }

  const fetchQRCode = async () => {
    try {
      const res = await fetch('/api/marketer/qr-code?width=400')
      if (res.ok) {
        const body = await res.json()
        setQrCode(body.qrCode)
        setShowQR(true)
      } else {
        showToast('error', t('dashboard.marketer.qr_failed', 'Failed to generate QR code'))
      }
    } catch {
      showToast('error', t('dashboard.marketer.qr_failed', 'Failed to generate QR code'))
    }
  }

  const downloadQRCode = async () => {
    try {
      const res = await fetch('/api/marketer/qr-code?width=800&download=true')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `referral-qr-${data?.marketer?.referralCode}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('dashboard.marketer.qr_downloaded', 'QR code downloaded'))
      }
    } catch {
      showToast('error', t('dashboard.marketer.download_failed', 'Failed to download QR code'))
    }
  }

  const exportCommissions = async () => {
    try {
      const res = await fetch('/api/marketer/export/commissions')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('dashboard.marketer.export_success', 'Export downloaded'))
      } else {
        showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
      }
    } catch {
      showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
    }
  }

  const exportPayouts = async () => {
    try {
      const res = await fetch('/api/marketer/export/payouts')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('dashboard.marketer.export_success', 'Export downloaded'))
      } else {
        showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
      }
    } catch {
      showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
    }
  }

  const exportBusinesses = async () => {
    try {
      const res = await fetch('/api/marketer/export/businesses')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `businesses-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('dashboard.marketer.export_success', 'Export downloaded'))
      } else {
        showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
      }
    } catch {
      showToast('error', t('dashboard.marketer.export_failed', 'Export failed'))
    }
  }

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.wallet) return
    if (payoutForm.amountCents <= 0) {
      showToast('error', t('dashboard.marketer.enter_amount', 'Enter payout amount'))
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketer/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutForm)
      })
      const body = await res.json()
      if (res.ok) {
        showToast('success', t('dashboard.marketer.payout_requested', 'Payout requested'))
        // Refresh wallet + payouts
        const [dashRes, payoutRes] = await Promise.all([
          fetch('/api/marketer/dashboard'),
          fetch('/api/marketer/payout/history?limit=20')
        ])
        if (dashRes.ok) {
          const dash = await dashRes.json()
          setData(dash.data)
        }
        if (payoutRes.ok) {
          const ph = await payoutRes.json()
          setPayouts(ph.payouts || [])
        }
      } else {
        showToast('error', body?.error || t('dashboard.marketer.request_failed', 'Request failed'))
      }
    } catch (e) {
      showToast('error', t('dashboard.marketer.request_failed', 'Request failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.marketer.title', 'Marketer Dashboard')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('dashboard.marketer.subtitle', 'Track earnings, referrals, and payouts')}</p>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-600">{t('common.loading', 'Loading...')}</div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('dashboard.marketer.available', 'Available')}</span>
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                <CurrencyDisplay amount={data.wallet?.availableBalance || 0} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('dashboard.marketer.pending', 'Pending')}</span>
                <ArrowDownRight className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                <CurrencyDisplay amount={data.wallet?.pendingBalance || 0} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('dashboard.marketer.locked', 'Locked')}</span>
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                <CurrencyDisplay amount={data.wallet?.lockedBalance || 0} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('dashboard.marketer.total_earned', 'Total Earned')}</span>
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                <CurrencyDisplay amount={data.wallet?.totalEarned || 0} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.marketer.referral_tools', 'Referral Tools')}</h2>
                    <p className="text-sm text-slate-500">{t('dashboard.marketer.referral_desc', 'Share your unique link to refer restaurants')}</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <input readOnly value={referralLink} className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50" />
                  </div>
                  <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900">
                    {copyOk ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copyOk ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                  </button>
                  <button onClick={fetchQRCode} className="inline-flex items-center justify-center gap-2 bg-imboni-blue text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                    <QrCode className="w-4 h-4" />
                    {t('common.qr_code', 'QR Code')}
                  </button>
                </div>

                {showQR && qrCode && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.marketer.referral_qr', 'Referral QR Code')}</h3>
                        <img src={qrCode} alt="QR Code" className="mx-auto mb-4 border-4 border-slate-100 rounded-xl" />
                        <p className="text-sm text-slate-600 mb-4">{t('dashboard.marketer.qr_desc', 'Scan to sign up via your referral link')}</p>
                        <div className="flex gap-3">
                          <button onClick={downloadQRCode} className="flex-1 bg-imboni-blue text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                            {t('common.download', 'Download')}
                          </button>
                          <button onClick={() => setShowQR(false)} className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200">
                            {t('common.close', 'Close')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.marketer.referred_businesses', 'Referred Businesses')}</h2>
                  <button onClick={exportBusinesses} className="inline-flex items-center gap-2 text-sm text-imboni-blue hover:text-blue-700">
                    <Download className="w-4 h-4" />
                    {t('common.export_csv', 'Export CSV')}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="py-2 pr-4">{t('common.business', 'Business')}</th>
                        <th className="py-2 pr-4">{t('common.status', 'Status')}</th>
                        <th className="py-2 pr-4">{t('common.attributed_at', 'Attributed At')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businesses.map((row, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <span className="font-medium text-slate-800">{row.business?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${row.business?.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {row.business?.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{new Date(row.attribution.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {businesses.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-500">{t('dashboard.marketer.no_businesses', 'No referred businesses yet')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.marketer.request_payout', 'Request Payout')}</h2>
                <form onSubmit={submitPayout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.amount', 'Amount')}</label>
                    <input
                      type="number"
                      min={10000}
                      placeholder="10000"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                      onChange={(e) => setPayoutForm({ ...payoutForm, amountCents: Math.round((Number(e.target.value) || 0) * 100) })}
                    />
                    <p className="text-xs text-slate-500 mt-1">{t('dashboard.marketer.payout_min', 'Minimum payout: 10,000 RWF')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.method', 'Method')}</label>
                    <select
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                      value={payoutForm.method}
                      onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value as any })}
                    >
                      <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  {(payoutForm.method === 'MTN_MOBILE_MONEY' || payoutForm.method === 'AIRTEL_MONEY') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.phone_number', 'Phone Number')}</label>
                      <input
                        type="tel"
                        placeholder="+250 7xx xxx xxx"
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        value={payoutForm.recipientPhone}
                        onChange={(e) => setPayoutForm({ ...payoutForm, recipientPhone: e.target.value })}
                      />
                    </div>
                  )}
                  {payoutForm.method === 'BANK_TRANSFER' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.bank', 'Bank')}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                          value={payoutForm.recipientBank}
                          onChange={(e) => setPayoutForm({ ...payoutForm, recipientBank: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.account_number', 'Account Number')}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                          value={payoutForm.recipientAccount}
                          onChange={(e) => setPayoutForm({ ...payoutForm, recipientAccount: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('common.processing', 'Processing...') : t('dashboard.marketer.request_payout', 'Request Payout')}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.marketer.payout_history', 'Payout History')}</h2>
                  <button onClick={exportPayouts} className="inline-flex items-center gap-2 text-sm text-imboni-blue hover:text-blue-700">
                    <Download className="w-4 h-4" />
                    {t('common.export_csv', 'Export CSV')}
                  </button>
                </div>
                <div className="space-y-3">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3">
                      <div className="text-slate-700">
                        <div className="font-medium"><CurrencyDisplay amount={p.amountCents || 0} /></div>
                        <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()} • {p.method.replace('_', ' ')}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-700'
                        : p.status === 'FAILED' ? 'bg-red-100 text-red-700'
                        : p.status === 'APPROVED' ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>{p.status}</span>
                    </div>
                  ))}
                  {payouts.length === 0 && (
                    <div className="text-center text-slate-500 py-6">{t('dashboard.marketer.no_payouts', 'No payouts yet')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
