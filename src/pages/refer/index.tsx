import { useState } from 'react'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import { Gift, Share2, Users, CheckCircle, Clock, Wallet, Smartphone, Award, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'

export default function ReferPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateReferralCode() {
    if (!phone.trim()) {
      setError(t('refer.error_phone_required', 'Phone number is required'))
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
        throw new Error(data.error || t('refer.error_generate_failed', 'Failed to generate referral code'))
      }

      const data = await res.json()
      setReferralCode(data.referralCode)
    } catch (e: any) {
      setError(e.message || t('refer.error_generate_failed', 'Failed to generate referral code'))
    } finally {
      setLoading(false)
    }
  }

  function shareReferral() {
    if (!referralCode) return

    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`
    const message = t('refer.share_message', 'Join Imboni Serve and transform your hospitality business! Use my referral code: {{code}}\n\n{{link}}\n\nGet started with smart QR ordering, inventory management, and more.', { code: referralCode, link: referralLink })

    if (navigator.share) {
      navigator.share({
        title: t('refer.share_title', 'Join Imboni Serve'),
        text: message,
        url: referralLink
      })
    } else {
      navigator.clipboard.writeText(message)
      showToast('success', t('refer.copied_alert', 'Referral link copied to clipboard!'))
    }
  }

  return (
    <PublicLayout
      title={t('refer.title_page', 'Referral Program — Imboni Serve')}
      metaDescription={t('refer.meta_description', 'Share your referral link with friends. When they order, you both get 1,000 RWF. No limits, no recurring fees.')}
    >
    <div className="bg-imboni-light py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-imboni-orange to-orange-500 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-imboni-blue mb-4">{t('refer.h1', 'Share & Earn 1,000 RWF Per Friend')}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('refer.subtitle', 'Share your referral link with friends. When they order, you both get 1,000 RWF. No limits, no recurring fees — just instant rewards!')}
          </p>
        </div>

        {/* How It Works Timeline */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-8 text-center">{t('refer.how_it_works_title', 'How It Works — Simple & Fast')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('refer.steps.1_title', 'Get Your Code')}</h3>
              <p className="text-sm text-slate-600">{t('refer.steps.1_desc', 'Enter your phone to generate a unique referral code')}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('refer.steps.2_title', 'They Order')}</h3>
              <p className="text-sm text-slate-600">{t('refer.steps.2_desc', 'Friend clicks your link and places an order')}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('refer.steps.3_title', 'Order Confirmed')}</h3>
              <p className="text-sm text-slate-600">{t('refer.steps.3_desc', 'Minimum 5,000 RWF order value')}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-imboni-gold rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('refer.steps.4_title', 'You Both Earn')}</h3>
              <p className="text-sm text-slate-600">{t('refer.steps.4_desc', '1,000 RWF each — instantly!')}</p>
            </div>
          </div>

          {/* Simple Requirements */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">{t('refer.requirements_title', 'Simple Requirements')}</h4>
                <p className="text-sm text-green-800">
                  {t('refer.requirements_desc', "Your friend must complete their first order (minimum 5,000 RWF). That's it! No complicated qualification process.")}
                </p>
              </div>
            </div>
          </div>

          {!referralCode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('refer.phone_label', 'Your Phone Number *')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250788123456"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('refer.name_label', 'Your Name (Optional)')}</label>
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
                {loading ? t('refer.generating', 'Generating...') : t('refer.get_code_btn', 'Get My Referral Code')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-xl p-6 text-white text-center">
                <p className="text-sm opacity-90 mb-2">{t('refer.your_code', 'Your Referral Code')}</p>
                <p className="text-3xl font-bold tracking-wider mb-4">{referralCode}</p>
                <p className="text-sm opacity-90">{t('refer.share_code_desc', 'Share this code with hospitality business owners')}</p>
              </div>

              <button
                onClick={shareReferral}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                {t('refer.share_link_btn', 'Share Referral Link')}
              </button>

              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">
                  {t('refer.referral_link_label', 'Referral link:')} <span className="font-mono text-xs text-imboni-blue break-all">
                    {window.location.origin}/signup?ref={referralCode}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rewards Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">{t('refer.rewards_title', 'What You Get')}</h2>
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">{t('refer.welcome_bonus_title', '1,000 RWF Welcome Bonus')}</h3>
                <p className="text-sm text-slate-700 mb-2">
                  {t('refer.welcome_bonus_desc', 'One-time reward when your friend completes their first order. No recurring fees, no complicated terms.')}
                </p>
                <div className="bg-white/60 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between"><span>{t('refer.your_reward', 'Your reward:')}</span><span className="font-semibold text-green-600">1,000 RWF</span></div>
                  <div className="flex justify-between"><span>{t('refer.friend_reward', "Friend's reward:")}</span><span className="font-semibold text-green-600">1,000 RWF</span></div>
                  <div className="flex justify-between"><span>{t('refer.total_per_referral', 'Total per referral:')}</span><span className="font-semibold text-green-700">2,000 RWF value</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="w-12 h-12 bg-imboni-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">{t('refer.unlimited_title', 'Unlimited Referrals')}</h3>
                <p className="text-sm text-slate-700 mb-2">
                  {t('refer.unlimited_desc', "No caps, no limits. Refer 10 friends, earn 10,000 RWF. Refer 100 friends, earn 100,000 RWF. It's that simple!")}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="w-3 h-3" />
                  <span>{t('refer.unlimited_note', 'Share as much as you want — every referral counts!')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1 text-lg">{t('refer.fast_payout_title', 'Fast Payout')}</h3>
                <p className="text-sm text-slate-700 mb-2">
                  {t('refer.fast_payout_desc', 'Rewards unlock after 7-day validation period. Withdraw to Mobile Money or use at any hospitality business on Imboni Serve.')}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="w-3 h-3" />
                  <span>{t('refer.fast_payout_note', 'Minimum withdrawal: 10,000 RWF (10 referrals)')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Qualify */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">{t('refer.process_title', 'Simple 3-Step Process')}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">{t('refer.step1_title', 'Step 1: Share your link')}</h4>
                <p className="text-sm text-slate-600">{t('refer.step1_desc', 'Send your unique referral link to friends via WhatsApp, SMS, or social media')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">{t('refer.step2_title', 'Step 2: They order')}</h4>
                <p className="text-sm text-slate-600">{t('refer.step2_desc', 'Friend clicks your link and places their first order (minimum 5,000 RWF)')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-imboni-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">{t('refer.step3_title', 'Step 3: You both get rewarded!')}</h4>
                <p className="text-sm text-slate-600">{t('refer.step3_desc', '1,000 RWF credited to each account after 7-day validation period')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Redeem Your Credits */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-imboni-blue mb-6">{t('refer.redeem_title', 'How to Redeem Your Credits')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-imboni-orange rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">{t('refer.redeem_dine_title', 'Dine at Partner Businesses')}</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                {t('refer.redeem_dine_desc', 'Use your credits to pay for meals at any hospitality business using Imboni Serve. Just provide your phone number at checkout.')}
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ {t('refer.redeem_dine_list_1', 'No minimum spend')}</li>
                <li>✓ {t('refer.redeem_dine_list_2', 'Works at partner locations')}</li>
                <li>✓ {t('refer.redeem_dine_list_3', 'Instant redemption')}</li>
              </ul>
            </div>

            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">{t('refer.redeem_cash_title', 'Cash Out via Mobile Money')}</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                {t('refer.redeem_cash_desc', 'Withdraw credits to MTN MoMo or Airtel Money after meeting trust requirements.')}
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ {t('refer.redeem_cash_list_1', 'Requires 1+ qualified referral')}</li>
                <li>✓ {t('refer.redeem_cash_list_2', 'Account must be 30+ days old')}</li>
                <li>✓ {t('refer.redeem_cash_list_3', '100% payout (no fees)')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Important Terms */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="font-semibold text-slate-800 mb-4">{t('refer.terms_title', 'Important Terms')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                {t('refer.terms_validation', '7-day validation: Rewards unlock 7 days after order confirmation')}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                {t('refer.terms_min_order', "Minimum order: Friend's first order must be at least 5,000 RWF")}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                {t('refer.terms_one_time', 'One-time reward: 1,000 RWF per friend (not recurring)')}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                {t('refer.terms_withdrawal', 'Withdrawal: Minimum 10,000 RWF to cash out via Mobile Money')}
              </div>
            </div>
          </div>
        </div>

        {/* Looking for B2B Affiliate Program? */}
        <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-xl mb-2">{t('refer.affiliate_title', 'Looking for the B2B Affiliate Program?')}</h3>
          <p className="text-sm opacity-90 mb-4">
            {t('refer.affiliate_desc', "If you're a professional marketer looking to bring hospitality businesses to Imboni Serve and earn 15% recurring commissions, you can access your affiliate portal here.")}
          </p>
          <a 
            href="/affiliate" 
            className="inline-block bg-white text-imboni-blue px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            {t('refer.affiliate_btn', 'Open Affiliate Portal')} 
          </a>
        </div>
      </div>
    </div>
    </PublicLayout>
    )
}
