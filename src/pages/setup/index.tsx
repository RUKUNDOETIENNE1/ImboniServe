import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle2, Circle, ArrowRight, Loader2, UtensilsCrossed, Users, Table2, ShoppingCart } from 'lucide-react'

interface SetupProgress {
  progress: {
    hasMenu: boolean
    hasTables: boolean
    hasStaff: boolean
    completedSteps: number
    totalSteps: number
    percentComplete: number
  }
  firstValue: {
    achieved: boolean
    firstSaleAt: string | null
  }
  coreSetupComplete: boolean
  nextAction: { code: string; label: string; href: string }
}

export default function SetupWizardPage() {
  const router = useRouter()
  const [data, setData] = useState<SetupProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch('/api/business/setup-status')
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Failed to load setup status')
        setData(d)
        
        // If setup is complete, redirect to dashboard
        if (d.coreSetupComplete) {
          router.push('/dashboard')
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load setup status')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const StepCard = ({ 
    done, 
    icon: Icon, 
    title, 
    description, 
    href 
  }: { 
    done: boolean
    icon: any
    title: string
    description: string
    href: string
  }) => (
    <div className={`border-2 rounded-xl p-5 transition-all ${
      done 
        ? 'border-green-200 bg-green-50/50' 
        : 'border-slate-200 bg-white hover:border-imboni-blue/30 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${done ? 'bg-green-100' : 'bg-slate-100'}`}>
          <Icon className={`w-6 h-6 ${done ? 'text-green-600' : 'text-slate-600'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {done && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          </div>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          {!done && (
            <a
              href={href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              {title.startsWith('Add') ? 'Get Started' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {done && (
            <a
              href={href}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-imboni-blue transition"
            >
              View & manage
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to ImboniServe! 🎉</h1>
          <p className="text-slate-600">Let's get your restaurant set up in just a few steps. You'll be taking orders in no time.</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-600 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin"/> 
            <span>Loading your setup progress...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Setup Progress</p>
                  <h2 className="text-3xl font-bold">{data.progress.percentComplete}%</h2>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm mb-1">Steps Completed</p>
                  <p className="text-2xl font-bold">{data.progress.completedSteps}/{data.progress.totalSteps}</p>
                </div>
              </div>
              <div className="w-full bg-blue-800/30 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${data.progress.percentComplete}%` }} 
                />
              </div>
            </div>

            {/* Next Action Highlight */}
            {!data.coreSetupComplete && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Next Step</h3>
                    <p className="text-sm text-amber-800 mb-3">{data.nextAction.label}</p>
                    <a
                      href={data.nextAction.href}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                    >
                      Continue Setup
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Steps */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">Setup Checklist</h2>
              
              <StepCard
                done={data.progress.hasMenu}
                icon={UtensilsCrossed}
                title="Add Your Menu"
                description="Add your first menu items so customers know what you're serving."
                href="/dashboard/menu-builder"
              />

              <StepCard
                done={data.progress.hasTables}
                icon={Table2}
                title="Configure Tables"
                description="Set up your tables and seating capacity for dine-in service."
                href="/dashboard/tables"
              />

              <StepCard
                done={data.progress.hasStaff}
                icon={Users}
                title="Invite Your Team"
                description="Add staff members and assign roles (waiters, managers, etc.)."
                href="/dashboard/staff"
              />

              <StepCard
                done={data.firstValue.achieved}
                icon={ShoppingCart}
                title="Record Your First Sale"
                description="Process your first order and experience the full workflow."
                href="/dashboard/sales"
              />
            </div>

            {/* First Value Achievement */}
            {data.firstValue.achieved && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">🎉 Congratulations!</h3>
                    <p className="text-sm text-green-800">
                      You've recorded your first sale! You're now experiencing the full power of ImboniServe.
                    </p>
                    {data.firstValue.firstSaleAt && (
                      <p className="text-xs text-green-700 mt-2">
                        First sale: {new Date(data.firstValue.firstSaleAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Complete Setup CTA */}
            {data.coreSetupComplete && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-900 mb-2">Setup Complete! 🎉</h3>
                <p className="text-green-800 mb-4">
                  Your restaurant is ready to go. Head to your dashboard to start managing orders.
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            )}

            {/* Help Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Need Help?</h3>
              <p className="text-sm text-slate-600 mb-3">
                Our support team is here to help you get started. Contact us anytime.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:support@imboniserve.com"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition text-sm"
                >
                  Email Support
                </a>
                <a
                  href="https://wa.me/250788000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition text-sm"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
