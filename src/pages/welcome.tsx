import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Clock, ArrowRight, LogIn } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { PRICING_CONFIG } from '@/config/pricing'
import { TrialLengthLabel } from '@/components/TrialLengthLabel'

export default function Welcome() {
  const { t } = useTranslation()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const trialDays = PRICING_CONFIG.trialDays ?? 14

  return (
    <>
      <Head><title>{t('welcome.title', 'Welcome to Imboni Serve')}</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-imboni-light p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-6">
              <Image
                src="/imgs/logo2.png"
                alt="Imboni Serve"
                width={200}
                height={76}
                priority
                className="h-20 w-auto"
              />
            </div>

            {/* Success icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-imboni-blue mb-2">
              {t('welcome.heading', 'Your account is ready!')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('welcome.subtitle', 'You\'re all set to start managing your hospitality business with Imboni Serve.')}
            </p>

            {/* Trial confirmation card */}
            <div className="bg-gradient-imboni text-white rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-lg">
                  <TrialLengthLabel showNoCard={false} />
                </span>
              </div>
              <p className="text-white/80 text-sm">
                {t('welcome.trial_desc', `Your ${trialDays}-day free trial begins once your business is approved. No credit card required.`)}
              </p>
            </div>

            {/* Next steps */}
            <div className="text-left space-y-3 mb-8">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('welcome.next_steps', 'Next Steps')}
              </h2>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-imboni-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <p className="text-sm text-gray-600">
                  {t('welcome.step_login', 'Log in to your account to access your dashboard.')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-imboni-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-600">
                  {t('welcome.step_setup', 'Complete your business profile and set up your menu or services.')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-imboni-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-600">
                  {t('welcome.step_explore', 'Explore QR ordering, POS, analytics, and AI insights.')}
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full bg-imboni-blue text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {t('welcome.login_btn', 'Log In to Your Account')}
              </Link>
              <Link
                href="/"
                className="w-full text-imboni-blue hover:text-imboni-orange text-sm font-medium inline-flex items-center justify-center gap-1 transition"
              >
                {t('welcome.back_home', 'Back to home')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <a href="https://www.icthubs.com" target="_blank" rel="noreferrer" className="hover:text-gray-600">
              {t('auth.powered_by', 'Powered by ICTHubs')}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
