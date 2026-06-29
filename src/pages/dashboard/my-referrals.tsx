import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  QrCode,
  ExternalLink
} from 'lucide-react'
import type { GetServerSideProps } from 'next'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function MyReferralsPage() {
  const { data: session } = useSession()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchReferralData()
  }, [])

  async function fetchReferralData() {
    setLoading(true)
    try {
      // Try to get existing referral code
      const res = await fetch('/api/customer-referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerPhone: session?.user?.phone || '',
          referrerName: session?.user?.name || ''
        })
      })

      if (res.ok) {
        const data = await res.json()
        setReferralCode(data.referralCode)
        
        // Generate QR code
        const qr = await QRCode.toDataURL(data.referralLink, { width: 300 })
        setQrCode(qr)

        // Fetch stats (if dashboard API exists)
        try {
          const statsRes = await fetch(`/api/referrals/dashboard?code=${data.referralCode}`)
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats(statsData.stats)
          }
        } catch (e) {
          console.log('Stats not available yet')
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateCode() {
    if (!session?.user?.phone) {
      toast.error('Phone number required')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/customer-referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerPhone: session.user.phone,
          referrerName: session.user.name
        })
      })

      if (res.ok) {
        const data = await res.json()
        setReferralCode(data.referralCode)
        
        const qr = await QRCode.toDataURL(data.referralLink, { width: 300 })
        setQrCode(qr)
      }
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setGenerating(false)
    }
  }

  function copyLink() {
    if (!referralCode) return
    const link = `${window.location.origin}/r/${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareLink() {
    if (!referralCode) return
    const link = `${window.location.origin}/r/${referralCode}`
    const message = `🎁 Join me on Imboni Serve and get 1,000 RWF! Use my referral code: ${referralCode}\n\n${link}\n\nOrder from amazing restaurants and we both earn rewards!`

    if (navigator.share) {
      navigator.share({
        title: 'Get 1,000 RWF on Imboni Serve',
        text: message,
        url: link
      })
    } else {
      copyLink()
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Gift className="w-6 h-6 text-imboni-orange" />
          My Referrals
        </h1>
        <p className="text-sm text-slate-500 mt-1">Share & earn 1,000 RWF per friend</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">Total Clicks</p>
              <Users className="w-5 h-5 text-imboni-blue" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.totalClicks || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">Signups</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.totalSignups || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">Total Earned</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              <CurrencyDisplay amount={stats.totalEarnings / 100} />
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">Pending</p>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              <CurrencyDisplay amount={stats.pendingEarnings / 100} />
            </p>
          </div>
        </div>
      )}

      {!referralCode ? (
        /* Generate Code Card */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-imboni-orange to-orange-500 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Earning 1,000 RWF Per Friend</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Generate your unique referral code and share it with friends. When they order, you both get 1,000 RWF!
          </p>
          <button
            onClick={generateCode}
            disabled={generating}
            className="bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate My Referral Code'}
          </button>
        </div>
      ) : (
        /* Referral Code Card */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Your Referral Code</h2>
            
            <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-xl p-6 text-white text-center mb-4">
              <p className="text-sm opacity-90 mb-2">Share this code</p>
              <p className="text-4xl font-bold tracking-wider mb-2">{referralCode}</p>
              <p className="text-xs opacity-75 font-mono break-all">
                {window.location.origin}/r/{referralCode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareLink}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">QR Code</h2>
              <div className="flex flex-col items-center">
                <img src={qrCode} alt="Referral QR Code" className="w-64 h-64 border-4 border-imboni-blue rounded-xl" />
                <p className="text-sm text-slate-600 mt-4 text-center">
                  Friends can scan this QR code to use your referral link
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-imboni-blue rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-white">1</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Share Your Link</h3>
            <p className="text-sm text-slate-600">Send your referral link to friends via WhatsApp, SMS, or social media</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-imboni-orange rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-white">2</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">They Order</h3>
            <p className="text-sm text-slate-600">Friend clicks your link and places their first order (min. 5,000 RWF)</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">You Both Earn</h3>
            <p className="text-sm text-slate-600">1,000 RWF credited to each account after 7-day validation</p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Important Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>7-day validation:</strong> Rewards unlock 7 days after order confirmation
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Minimum order:</strong> Friend's first order must be at least 5,000 RWF
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>One-time reward:</strong> 1,000 RWF per friend (not recurring)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Withdrawal:</strong> Minimum 10,000 RWF to cash out via Mobile Money
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <a href="/service-terms#referral" className="text-imboni-blue hover:underline text-sm flex items-center gap-1">
            Read full terms & conditions <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}
