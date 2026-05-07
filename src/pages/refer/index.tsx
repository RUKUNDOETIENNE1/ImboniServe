import { useState } from 'react'
import PublicLayout from '@/components/PublicLayout'
import { Gift, Share2, Users, CheckCircle, Clock, Wallet, Smartphone, Award, Check } from 'lucide-react'

export default function ReferPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateReferralCode() {
    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/customer-referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerPhone: phone, referrerName: name })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate referral code')
      }

      const data = await res.json()
      setReferralCode(data.referralCode)
    } catch (e: any) {
      setError(e.message || 'Failed to generate referral code')
    } finally {
      setLoading(false)
    }
  }

  function shareReferral() {
    if (!referralCode) return

    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`
    const message = `Join Imboni Serve and transform your restaurant! Use my referral code: ${referralCode}\n\n${referralLink}\n\nGet started with smart QR ordering, inventory management, and more.`

    if (navigator.share) {
      navigator.share({
        title: 'Join Imboni Serve',
        text: message,
        url: referralLink
      })
    } else {
      navigator.clipboard.writeText(message)
      alert('Referral link copied to clipboard!')
    }
  }

  return (
    <PublicLayout title="Referral Program — Imboni Serve">
    <div className="bg-imboni-light py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-imboni-orange to-orange-500 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-imboni-blue mb-4">Share & Earn 1,000 RWF Per Friend</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Share your referral link with friends. When they order, <strong>you both get 1,000 RWF</strong>. No limits, no recurring fees — just instant rewards!
          </p>
        </div>

        {/* How It Works Timeline */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-8 text-center">How It Works — Simple & Fast</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Get Your Code</h3>
              <p className="text-sm text-slate-600">Enter your phone to generate a unique referral code</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">They Order</h3>
              <p className="text-sm text-slate-600">Friend clicks your link and places an order</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Order Confirmed</h3>
              <p className="text-sm text-slate-600">Minimum 5,000 RWF order value</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-gold rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">You Both Earn</h3>
              <p className="text-sm text-slate-600">1,000 RWF each — instantly!</p>
            </div>
          </div>

          {/* Simple Requirements */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Simple Requirements</h4>
                <p className="text-sm text-green-800">
                  Your friend must complete their first order (minimum 5,000 RWF). That's it! No complicated qualification process.
                </p>
              </div>
            </div>
          </div>

          {!referralCode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250788123456"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={generateReferralCode}
                disabled={loading || !phone.trim()}
                className="w-full bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Get My Referral Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-xl p-6 text-white text-center">
                <p className="text-sm opacity-90 mb-2">Your Referral Code</p>
                <p className="text-3xl font-bold tracking-wider mb-4">{referralCode}</p>
                <p className="text-sm opacity-90">Share this code with restaurant owners</p>
              </div>

              <button
                onClick={shareReferral}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share Referral Link
              </button>

              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">
                  Referral link: <span className="font-mono text-xs text-imboni-blue break-all">
                    {window.location.origin}/signup?ref={referralCode}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rewards Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">What You Get</h2>
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">1,000 RWF Welcome Bonus</h3>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>One-time reward</strong> when your friend completes their first order. No recurring fees, no complicated terms.
                </p>
                <div className="bg-white/60 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between"><span>Your reward:</span><span className="font-semibold text-green-600">1,000 RWF</span></div>
                  <div className="flex justify-between"><span>Friend's reward:</span><span className="font-semibold text-green-600">1,000 RWF</span></div>
                  <div className="flex justify-between"><span>Total per referral:</span><span className="font-semibold text-green-700">2,000 RWF value</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="w-12 h-12 bg-imboni-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">Unlimited Referrals</h3>
                <p className="text-sm text-slate-700 mb-2">
                  No caps, no limits. Refer 10 friends, earn 10,000 RWF. Refer 100 friends, earn 100,000 RWF. It's that simple!
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="w-3 h-3" />
                  <span>Share as much as you want — every referral counts!</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">Fast Payout</h3>
                <p className="text-sm text-slate-700 mb-2">
                  Rewards unlock after 7-day validation period. Withdraw to Mobile Money or use at any restaurant on Imboni Serve.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="w-3 h-3" />
                  <span>Minimum withdrawal: 10,000 RWF (10 referrals)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Qualify */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">Simple 3-Step Process</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Step 1: Share your link</h4>
                <p className="text-sm text-slate-600">Send your unique referral link to friends via WhatsApp, SMS, or social media</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Step 2: They order</h4>
                <p className="text-sm text-slate-600">Friend clicks your link and places their first order (minimum 5,000 RWF)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-imboni-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Step 3: You both get rewarded!</h4>
                <p className="text-sm text-slate-600">1,000 RWF credited to each account after 7-day validation period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Redeem Your Credits */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">How to Redeem Your Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-imboni-orange rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">Dine at Partner Restaurants</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                Use your credits to pay for meals at <strong>any restaurant using Imboni Serve</strong>. Just provide your phone number at checkout.
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ No minimum spend</li>
                <li>✓ Works at 500+ locations</li>
                <li>✓ Instant redemption</li>
              </ul>
            </div>

            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">Cash Out via Mobile Money</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                Withdraw credits to MTN MoMo or Airtel Money after meeting trust requirements.
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ Requires 1+ qualified referral</li>
                <li>✓ Account must be 30+ days old</li>
                <li>✓ 100% payout (no fees)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Important Terms */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
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
        </div>

        {/* Looking for B2B Affiliate Program? */}
        <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-xl mb-2">Looking for the B2B Affiliate Program?</h3>
          <p className="text-sm opacity-90 mb-4">
            If you're a professional marketer looking to bring restaurants to Imboni Serve and earn 15% recurring commissions, you can access your affiliate portal here.
          </p>
          <a 
            href="/affiliate" 
            className="inline-block bg-white text-imboni-blue px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            Open Affiliate Portal 
          </a>
        </div>
      </div>
    </div>
    </PublicLayout>
    )
}
