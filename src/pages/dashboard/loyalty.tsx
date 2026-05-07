import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Gift, Search, TrendingUp, Plus, Minus, Award, RefreshCw } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useToast } from '@/components/Toast'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function LoyaltyPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueAmount, setIssueAmount] = useState('')
  const [issueType, setIssueType] = useState<'MANUAL_CREDIT' | 'MANUAL_DEBIT'>('MANUAL_CREDIT')
  const [issueDescription, setIssueDescription] = useState('')
  const loyaltyEnabled = useFeatureFlag('loyalty_system')

  async function lookup() {
    if (!phone.trim()) return
    setSearching(true)
    setResult(null)
    setShowIssueForm(false)
    try {
      const res = await fetch(`/api/loyalty/balance?customerId=${encodeURIComponent(phone)}`)
      const data = await res.json()
      setResult(data)
    } catch { 
      showToast('error', t('loyalty.failed_to_lookup'))
    } finally { 
      setSearching(false) 
    }
  }

  async function issuePoints() {
    if (!issueAmount || !result?.customer?.id) return
    setIssuing(true)
    try {
      const amount = issueType === 'MANUAL_DEBIT' ? -Math.abs(parseInt(issueAmount)) : Math.abs(parseInt(issueAmount))
      const res = await fetch('/api/loyalty/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: result.customer.id,
          amount,
          type: issueType,
          description: issueDescription || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to issue points')
      
      showToast('success', `${Math.abs(amount)} ${t(issueType === 'MANUAL_CREDIT' ? 'loyalty.points_added' : 'loyalty.points_deducted')}`)
      setIssueAmount('')
      setIssueDescription('')
      setShowIssueForm(false)
      // Refresh balance
      lookup()
    } catch (e: any) {
      showToast('error', e.message || t('loyalty.failed_to_issue'))
    } finally {
      setIssuing(false)
    }
  }

  if (!loyaltyEnabled) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium" suppressHydrationWarning>{t('loyalty.unlock_message')}</p>
          <p className="text-sm text-slate-400 mt-1" suppressHydrationWarning>{t('loyalty.unlock_desc')}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Gift className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{t('loyalty.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5" suppressHydrationWarning>{t('loyalty.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lookup Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4" suppressHydrationWarning>{t('loyalty.customer_lookup')}</h2>
            <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('loyalty.phone_number')}</label>
            <div className="flex gap-2">
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250788123456"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue transition-all"
                onKeyDown={e => e.key === 'Enter' && lookup()}
              />
              <button
                onClick={lookup}
                disabled={searching || !phone.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-blue-200 transition-all"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span suppressHydrationWarning>{searching ? t('loyalty.looking') : t('loyalty.look_up')}</span>
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800" suppressHydrationWarning>{t('loyalty.points_balance')}</h2>
                <button
                  onClick={() => setShowIssueForm(!showIssueForm)}
                  className="text-sm text-imboni-blue hover:text-blue-700 font-medium transition-colors"
                >
                  <span suppressHydrationWarning>{showIssueForm ? t('loyalty.cancel') : t('loyalty.issue_redeem')}</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{result.balance?.toLocaleString() || 0}</p>
                  <p className="text-sm text-slate-500" suppressHydrationWarning>{t('loyalty.loyalty_points')}</p>
                </div>
              </div>

              {!showIssueForm && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIssueType('MANUAL_CREDIT'); setShowIssueForm(true); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span suppressHydrationWarning>{t('loyalty.add_points')}</span>
                  </button>
                  <button
                    onClick={() => { setIssueType('MANUAL_DEBIT'); setShowIssueForm(true); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                    <span suppressHydrationWarning>{t('loyalty.deduct_points')}</span>
                  </button>
                </div>
              )}

              {showIssueForm && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" suppressHydrationWarning>{t('loyalty.amount')}</label>
                    <input
                      type="number"
                      min="1"
                      value={issueAmount}
                      onChange={e => setIssueAmount(e.target.value)}
                      placeholder={t('loyalty.enter_points_amount')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" suppressHydrationWarning>{t('loyalty.reason_optional')}</label>
                    <input
                      value={issueDescription}
                      onChange={e => setIssueDescription(e.target.value)}
                      placeholder={t('loyalty.reason_placeholder')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                    />
                  </div>
                  <button
                    onClick={issuePoints}
                    disabled={issuing || !issueAmount}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 ${
                      issueType === 'MANUAL_CREDIT' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-200' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-200'
                    }`}
                  >
                    {issuing ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> <span suppressHydrationWarning>{t('loyalty.processing')}</span></>
                    ) : (
                      <>{issueType === 'MANUAL_CREDIT' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />} <span suppressHydrationWarning>{issueType === 'MANUAL_CREDIT' ? t('loyalty.add') : t('loyalty.deduct')} {t('loyalty.points')}</span></>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Section */}
        {result && result.history?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4" suppressHydrationWarning>{t('loyalty.transaction_history')}</h2>
            <div className="space-y-3">
              {result.history.slice(0, 10).map((e: any) => (
                <div key={e.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{e.description || e.type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${e.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {e.amount > 0 ? '+' : ''}{e.amount.toLocaleString()}
                    </span>
                    <p className="text-xs text-slate-400" suppressHydrationWarning>{t('loyalty.pts')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
