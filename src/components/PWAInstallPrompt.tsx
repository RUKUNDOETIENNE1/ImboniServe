import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!canInstall) return

    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return
    }

    const timer = setTimeout(() => setShowPrompt(true), 3000)
    return () => clearTimeout(timer)
  }, [canInstall])

  const handleInstallClick = async () => {
    const accepted = await install()
    setShowPrompt(false)
    if (!accepted) {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || !canInstall) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-2xl shadow-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install Imboni Serve</h3>
              <p className="text-sm text-blue-100">Add to your home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-blue-50 mb-4">
          Get quick access and work offline. Install our app for the best experience.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-imboni-blue font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  )
}
