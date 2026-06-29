import { useState, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import { Mail, Lock, ShieldCheck, Globe, ArrowLeft, RefreshCw } from 'lucide-react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

type Step = 'credentials' | 'otp'

export default function Login() {
  const { t, changeLocale, locale } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpChannel, setOtpChannel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ]

  const changeLanguage = async (newLocale: string) => {
    changeLocale(newLocale as any)
    setShowLangMenu(false)
    await router.push({ pathname: router.pathname, query: router.query }, undefined, { locale: newLocale })
  }

  // STEP 1 — Validate credentials and trigger OTP
  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/pre-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('auth.invalid_credentials', 'Invalid email or password'))
        return
      }

      setMaskedEmail(data.maskedEmail || email)
      setOtpChannel(data.channel || 'email')
      setStep('otp')
    } catch {
      setError(t('auth.login_error', 'Login service unavailable. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // STEP 2 — Verify OTP and complete login via NextAuth
  const handleOTP = async (e: FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Enter the complete 6-digit code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Verify OTP → get confirmToken
      const verifyRes = await fetch('/api/auth/verify-mfa-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Invalid or expired code.')
        return
      }

      // Complete session via NextAuth mfa-confirm provider
      const result = await signIn('mfa-confirm', {
        redirect: false,
        email,
        confirmToken: verifyData.confirmToken,
      })

      if (result?.ok) {
        const session = await fetch('/api/auth/session').then(r => r.json()).catch(() => null)
        const roles = (session?.user?.roles as string[]) || []
        // Admins first
        if (roles.includes('ADMIN')) {
          await router.push('/admin')
          return
        }
        // Affiliates
        try {
          const affRes = await fetch('/api/affiliate/dashboard', { method: 'GET' })
          if (affRes.ok) {
            const data = await affRes.json().catch(() => ({} as any))
            if (data && (data as any).affiliate) {
              await router.push('/affiliate')
              return
            }
          }
        } catch { /* ignore and fall back */ }

        // Onboarding completion validation — send first-timers to setup wizard
        try {
          const setupRes = await fetch('/api/business/setup-status')
          if (setupRes.ok) {
            const setup = await setupRes.json()
            if (!setup.coreSetupComplete) {
              await router.push('/setup')
              return
            }
          }
        } catch { /* ignore and fall back */ }

        await router.push('/dashboard')
      } else {
        setError('Login could not be completed. The code may have expired — request a new one.')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResending(true)
    setError(null)
    setOtp(['', '', '', '', '', ''])
    try {
      const res = await fetch('/api/auth/pre-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not resend code.')
      }
    } catch {
      setError('Could not resend code. Try again.')
    } finally {
      setResending(false)
      otpRefs.current[0]?.focus()
    }
  }

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
    // Auto-submit when all 6 digits entered
    if (updated.every(d => d) && updated.join('').length === 6) {
      setTimeout(() => {
        const form = document.getElementById('otp-form') as HTMLFormElement
        form?.requestSubmit()
      }, 80)
    }
  }

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  return (
    <>
    <Head><title>{t('auth.signin_title', 'Sign In — Imboni Serve')}</title></Head>
    <div key={locale} className="min-h-screen flex items-center justify-center bg-imboni-light p-4">
      <div className="w-full max-w-md">
        {/* Back to home + Language */}
        <div className="mb-4 flex items-center justify-between">
          {step === 'otp' ? (
            <button
              onClick={() => { setStep('credentials'); setError(null); setOtp(['','','','','','']) }}
              className="text-sm text-imboni-blue hover:text-imboni-orange transition inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link href="/" className="text-sm text-imboni-blue hover:text-imboni-orange transition inline-flex items-center gap-1" suppressHydrationWarning>
              ← {t('auth.back_to_home', 'Back to home')}
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={t('topbar.language', 'Language')}
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${lang.code === router.locale ? 'bg-teal-50' : ''}`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/imgs/logo2.png" alt="Imboni Serve" width={256} height={96} priority className="h-24 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-imboni-blue">Imboni Serve</h1>
          <p className="text-gray-600" suppressHydrationWarning>
            {step === 'otp' 
              ? t('auth.verify_identity', 'Verify your identity')
              : t('auth.login_subtitle', 'Login to your hospitality dashboard')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* ─── STEP 1: Credentials ─── */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentials} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" suppressHydrationWarning>
                  {t('auth.email_address', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    placeholder="owner@restaurant.rw"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" suppressHydrationWarning>
                  {t('auth.password', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-imboni-blue text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-imboni-blue disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                {loading ? t('auth.logging_in', 'Sending code...') : t('auth.login', 'Login')}
              </button>
            </form>
          )}

          {/* ─── STEP 2: OTP ─── */}
          {step === 'otp' && (
            <form id="otp-form" onSubmit={handleOTP} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-4">
                  <ShieldCheck className="w-7 h-7 text-imboni-blue" />
                </div>
                <p className="text-sm text-gray-600">
                  A 6-digit code was sent to <strong>{maskedEmail}</strong>
                  {otpChannel === 'both' && ' (email + WhatsApp)'}
                  {otpChannel === 'whatsapp' && ' via WhatsApp'}
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue border-gray-300 outline-none transition"
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="w-full bg-imboni-blue text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-imboni-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="text-sm text-imboni-blue hover:text-imboni-orange inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : "Didn't receive it? Resend code"}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                🔒 Never share this code. It expires in 10 minutes.
              </p>
            </form>
          )}

          {/* Links */}
          {step === 'credentials' && (
            <div className="mt-6 text-center space-y-2">
              <Link href="/forgot-password" className="text-sm text-imboni-blue hover:text-imboni-orange" suppressHydrationWarning>
                {t('auth.forgot_password', 'Forgot password?')}
              </Link>
              <p className="text-sm text-gray-600" suppressHydrationWarning>
                {t('auth.no_account', "Don't have an account?")}{' '}
                <Link href="/signup" className="font-medium text-imboni-blue hover:text-imboni-orange" suppressHydrationWarning>
                  {t('auth.sign_up', 'Sign up')}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Offline Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800" suppressHydrationWarning>
            💡 <strong>{t('auth.offline_mode', 'Offline mode available:')}</strong> {t('auth.offline_desc', 'You can still record sales even without internet!')}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        <a href="https://www.icthubs.com" target="_blank" rel="noreferrer" className="hover:text-gray-600">
          Powered by ICTHubs
        </a>
      </div>
    </div>
  </>
  )
}
