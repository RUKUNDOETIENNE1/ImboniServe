import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Gift, Share2, Users, CheckCircle, Clock, AlertTriangle, Copy, MessageCircle } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Not used yet', color: 'text-slate-500' },
  SIGNED_UP: { label: 'Signed up', color: 'text-blue-600' },
  QUALIFYING: { label: 'Qualifying (generating slips)', color: 'text-amber-600' },
  QUALIFIED: { label: 'Qualified — credit locked', color: 'text-green-600' },
  CREDITED: { label: 'Credit applied', color: 'text-green-700' },
  EXPIRED: { label: 'Expired', color: 'text-slate-400' },
  FRAUD_FLAGGED: { label: 'Under review', color: 'text-red-600' },
}

export default function InvitePage() {
  const [code, setCode] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [whatsappShare, setWhatsappShare] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/business-invite/stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function generateCode() {
    setGenerating(true)
    try {
      const res = await fetch('/api/business-invite/generate', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setCode(data.code)
        setInviteUrl(data.inviteUrl)
        setWhatsappShare(data.whatsappShare)
        await loadStats()
      }
    } finally {
      setGenerating(false)
    }
  }

  function copyLink() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Gift className="w-6 h-6 text-imboni-orange" />
          Invite a Business — Earn a Free Month
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Invite another restaurant, café, bar or hotel to Imboni Serve.{' '}
          <strong>Both you and the business you invite get 1 free month</strong> when they qualify.
        </p>
      </div>

      {/* Stats summary */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-xs text-slate-500 mb-1">Total Sent</p>
            <p className="text-2xl font-bold text-slate-800">{stats.invites?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-xs text-slate-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-xs text-slate-500 mb-1">Qualified</p>
            <p className="text-2xl font-bold text-green-600">{stats.qualified ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <p className="text-xs text-slate-500 mb-1">Free Months Earned</p>
            <p className="text-2xl font-bold text-imboni-blue">
              {stats.freeMonthsEarned ?? 0}
            </p>
            {(stats.availableCreditsCents ?? 0) > 0 && (
              <p className="text-xs text-green-600 mt-1">
                <CurrencyDisplay amount={stats.availableCreditsCents} />
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Generate & Share */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-imboni-orange" />
            Your Invite Link
          </h2>

          {inviteUrl ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Invite Code</p>
                <p className="font-mono font-bold text-imboni-blue text-lg">{code}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 break-all">
                <p className="text-xs text-slate-500 mb-1">Invite Link</p>
                <p className="text-xs text-slate-700 font-mono">{inviteUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {whatsappShare && (
                  <a
                    href={whatsappShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share on WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Generate your personal invite link to share with other business owners.
                Each link is unique and tracks your referrals automatically.
              </p>
              <p className="text-sm text-slate-600">Earn <span className="font-bold text-green-600"><CurrencyDisplay amount={50000} /></span> for every restaurant you refer!</p>
              <button
                onClick={generateCode}
                disabled={generating}
                className="w-full bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate My Invite Link'}
              </button>
            </div>
          )}
        </div>

        {/* How it works + Rules */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            How It Works
          </h2>
          <ol className="space-y-3 mb-5">
            {[
              'Share your invite link with another business owner',
              'They sign up using your link',
              'They generate 30 Smart Dining Slips™ within 30 days',
              'They make their first subscription payment',
              'Both of you get 1 free month credited to your next invoice (14-day lock applies)',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-imboni-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-700">{step}</span>
              </li>
            ))}
          </ol>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p><strong>Anti-abuse rules:</strong></p>
                <p>• Max 10 credits per year per account</p>
                <p>• 14-day lock after qualification (clawback window)</p>
                <p>• Credits expire 6 months after issue</p>
                <p>• Self-referral and duplicate signups are blocked</p>
                <p>• High-velocity invites are flagged for review</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite history */}
      {stats?.invites?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-imboni-blue" />
            Invite History
          </h2>
          <div className="space-y-3">
            {stats.invites.map((invite: any) => {
              const s = STATUS_LABELS[invite.status] || { label: invite.status, color: 'text-slate-500' }
              return (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {invite.invitee?.name || 'Awaiting signup'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{invite.code}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>
                    {invite.credit && invite.credit.status === 'ACTIVE' && (
                      <p className="text-xs text-green-600 font-bold">
                        RWF {(invite.credit.amountCents / 100).toLocaleString()} ready
                      </p>
                    )}
                    {invite.credit && invite.credit.status === 'LOCKED' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        Unlocks {new Date(invite.credit.lockedUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
