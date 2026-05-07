import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallOmniboxHint() {
  const { canInstall, isInstalled, install } = usePWAInstall()
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  const positionClass = useMemo(() => {
    if (router.pathname.startsWith('/dashboard')) return 'top-20 right-4'
    return 'top-4 right-4'
  }, [router.pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isInstalled || !canInstall) {
      setVisible(false)
      return
    }
    const dismissed = localStorage.getItem('pwa-omnibox-dismissed')
    if (dismissed) {
      const days = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (days < 7) return
    }
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [canInstall, isInstalled])

  if (!visible) return null

  return (
    <div className={`hidden md:flex fixed ${positionClass} z-40 items-center gap-2 bg-white/90 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 shadow-lg rounded-full pl-3 pr-1 py-1 backdrop-blur-sm`}
      role="dialog" aria-label="Install app">
      <span className="text-xs text-slate-700 dark:text-gray-200">Install app</span>
      <button
        onClick={async () => {
          const ok = await install()
          if (ok) setVisible(false)
        }}
        className="p-1.5 rounded-full bg-imboni-blue text-white hover:bg-blue-700 transition-colors"
        aria-label="Install"
        title="Install"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setVisible(false)
          if (typeof window !== 'undefined') localStorage.setItem('pwa-omnibox-dismissed', Date.now().toString())
        }}
        className="ml-1 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-300"
        aria-label="Dismiss"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
