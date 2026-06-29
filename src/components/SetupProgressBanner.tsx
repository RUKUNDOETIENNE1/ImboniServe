import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, X } from 'lucide-react'

interface SetupStatus {
  progress: {
    hasMenu: boolean
    hasTables: boolean
    hasStaff: boolean
    completedSteps: number
    totalSteps: number
    percentComplete: number
  }
  coreSetupComplete: boolean
  nextAction: { code: string; label: string; href: string }
}

/**
 * SetupProgressBanner
 * 
 * Shows setup progress at the top of the dashboard for incomplete setups.
 * Guides users to complete onboarding steps.
 */
export default function SetupProgressBanner() {
  const [data, setData] = useState<SetupStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem('setup-banner-dismissed') === 'true'
    if (isDismissed) {
      setDismissed(true)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const r = await fetch('/api/business/setup-status')
        if (r.ok) {
          const d = await r.json()
          setData(d)
          
          // Auto-hide if setup is complete
          if (d.coreSetupComplete) {
            setDismissed(true)
          }
        }
      } catch (e) {
        console.error('Failed to load setup status:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('setup-banner-dismissed', 'true')
    setDismissed(true)
  }

  if (loading || dismissed || !data || data.coreSetupComplete) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-blue-100 rounded-lg transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-blue-600" />
      </button>
      
      <div className="pr-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              Complete Your Setup ({data.progress.percentComplete}%)
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              You're {data.progress.completedSteps} of {data.progress.totalSteps} steps away from being fully set up.
            </p>
            
            <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.progress.percentComplete}%` }}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href={data.nextAction.href}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
              >
                {data.nextAction.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
              >
                View Full Checklist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
