import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function SWUpdateToast() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true)
          }
        })
      })
    })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    setShowUpdate(false)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-imboni-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
            Update Available
          </h3>
          <p className="text-xs text-slate-600 dark:text-gray-300 mb-3">
            A new version of Imboni Serve is ready. Update now for the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-imboni-blue text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="px-3 py-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowUpdate(false)}
          className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
