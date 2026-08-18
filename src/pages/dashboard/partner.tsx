import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { TrendingUp, Users, DollarSign, Award, Copy, Users2, Clock, CheckCircle, Activity, Wallet } from 'lucide-react'
import { useToast } from '@/components/Toast'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}

export default function PartnerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [dashboard, setDashboard] = useState<any>(null)
  const [commissions, setCommissions] = useState<any[]>([])
  const [commissionStats, setCommissionStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [application, setApplication] = useState({ motivation: '', experience: '', networkSize: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status])

  const loadData = async () => {
    try {
      const dashRes = await fetch('/api/founder-partners/dashboard')
      if (dashRes.ok) {
        const data = await dashRes.json()
        setDashboard(data)
      } else if (dashRes.status === 403) {
        setError('You are not registered as a Founder Partner yet.')
      }

      const commRes = await fetch('/api/founder-partners/commissions')
      if (commRes.ok) {
        const data = await commRes.json()
        setCommissions(data.commissions)
        setCommissionStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitApplication = async () => {
    try {
      const res = await fetch('/api/founder-partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      })
      if (res.ok) {
        showToast('success', 'Application submitted! Our team will review it within 5 business days.')
        setShowApplyForm(false)
        loadData()
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Failed to submit application')
      }
    } catch {
      showToast('error', 'Failed to submit application')
    }
  }

  const copyShareLink = (code: string) => {
    const link = `${window.location.origin}/f/${code}`
    navigator.clipboard.writeText(link)
    showToast('success', `Share link copied: ${link}`)
  }

  const requestPayout = async () => {
    const method = prompt('Payout method (MTN_MOBILE_MONEY, AIRTEL_MONEY, BANK_TRANSFER):')
    if (!method) return
    const phone = prompt('Recipient phone (for mobile money):')
    try {
      const res = await fetch('/api/founder-partners/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, recipientPhone: phone }),
      })
      if (res.ok) {
        showToast('success', 'Payout requested!')
        loadData()
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Failed to request payout')
      }
    } catch {
      showToast('error', 'Failed to request payout')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 text-center">
            <Users2 className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Founder Partner Program</h1>
            <p className="text-slate-500 mb-6">
              Join our exclusive Founder Partner Program and earn commissions by referring businesses to ImboniServe.
            </p>
            {showApplyForm ? (
              <div className="text-left space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">Motivation</label>
                  <textarea
                    placeholder="Why do you want to become a Founder Partner?"
                    value={application.motivation}
                    onChange={(e) => setApplication({ ...application, motivation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">Experience</label>
                  <textarea
                    placeholder="Describe your relevant experience and network..."
                    value={application.experience}
                    onChange={(e) => setApplication({ ...application, experience: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">Network Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500+ hospitality business owners"
                    value={application.networkSize}
                    onChange={(e) => setApplication({ ...application, networkSize: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={submitApplication}
                    disabled={!application.motivation}
                    className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50"
                  >
                    Submit Application
                  </button>
                  <button
                    onClick={() => setShowApplyForm(false)}
                    className="text-slate-600 px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowApplyForm(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
              >
                Apply to Become a Founder Partner
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { partner, stats, recentCommissions, recentActivities } = dashboard

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PROSPECT: 'bg-slate-100 text-slate-600',
      APPLIED: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      TERMINATED: 'bg-gray-200 text-gray-600',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Founder Partner Dashboard</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(partner.status)}`}>
            {partner.status}
          </span>
          <span className="text-sm text-slate-500">{partner.partnerType} Partner</span>
        </div>
      </div>

      {partner.status === 'APPLIED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Your application is under review</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">Our team will review your application within 5 business days.</p>
        </div>
      )}

      {partner.status === 'ACTIVE' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-purple-200" />
                <span className="text-2xl font-bold text-slate-800">{stats.totalSignups}</span>
              </div>
              <p className="text-sm text-slate-500">Total Signups</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-8 h-8 text-green-200" />
                <span className="text-2xl font-bold text-slate-800">{stats.totalConversions}</span>
              </div>
              <p className="text-sm text-slate-500">Conversions</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-8 h-8 text-green-200" />
                <span className="text-2xl font-bold text-slate-800">
                  {Math.round((stats.totalCommissionCents || 0) / 100).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-500">Total Earnings (RWF)</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <Wallet className="w-8 h-8 text-blue-200" />
                <span className="text-2xl font-bold text-slate-800">
                  {Math.round((stats.pendingCommissionCents || 0) / 100).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-500">Pending (RWF)</p>
            </div>
          </div>

          {partner.codes && partner.codes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Your Referral Codes</h2>
              <div className="space-y-3">
                {partner.codes.map((code: any) => (
                  <div key={code.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-mono font-bold text-lg text-purple-700">{code.code}</div>
                      <div className="text-xs text-slate-500">
                        {code.trialDays} days trial · {code._count?.redemptions ?? 0} redemptions
                        {code.status !== 'ACTIVE' && ` · ${code.status}`}
                      </div>
                    </div>
                    {code.status === 'ACTIVE' && (
                      <button
                        onClick={() => copyShareLink(code.code)}
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {commissionStats && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Commission Summary</h2>
                {commissionStats.validated?.amountCents > 0 && (
                  <button
                    onClick={requestPayout}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 text-sm"
                  >
                    Request Payout
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{Math.round((commissionStats.pending?.amountCents || 0) / 100).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Pending (RWF)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{Math.round((commissionStats.validated?.amountCents || 0) / 100).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Validated (RWF)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{Math.round((commissionStats.paid?.amountCents || 0) / 100).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Paid (RWF)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{Math.round((commissionStats.total?.amountCents || 0) / 100).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Total (RWF)</div>
                </div>
              </div>
            </div>
          )}

          {recentCommissions && recentCommissions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Commissions</h2>
              <div className="space-y-2">
                {recentCommissions.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {c.type === 'SIGNUP_BONUS' ? 'Signup Bonus' : `Month ${c.periodMonth} Recurring`}
                      </div>
                      <div className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{Math.round(c.amountCents / 100).toLocaleString()} RWF</div>
                      <div className={`text-xs ${c.status === 'PAID' ? 'text-green-600' : c.status === 'PENDING' ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {c.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentActivities && recentActivities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {recentActivities.slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-700">{a.description || a.type}</div>
                      <div className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
