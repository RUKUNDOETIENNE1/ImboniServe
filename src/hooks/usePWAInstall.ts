import { useState, useEffect } from 'react'
import { pwaTelemetry } from '@/lib/analytics/pwa-telemetry'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
      pwaTelemetry.track('install_prompt_available')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      setCanInstall(false)
      pwaTelemetry.track('app_already_installed')
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      pwaTelemetry.track('app_installed_success')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    pwaTelemetry.track('install_prompt_clicked')
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    pwaTelemetry.track('install_prompt_result', { outcome })
    setDeferredPrompt(null)
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome === 'accepted'
  }

  return {
    canInstall: mounted && !!deferredPrompt && !isInstalled,
    isInstalled,
    install,
  }
}
