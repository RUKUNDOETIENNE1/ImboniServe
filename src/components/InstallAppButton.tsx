import { Download, Info } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import React, { useMemo, useState } from 'react'

interface InstallAppButtonProps {
  className?: string
  label?: string
}

export default function InstallAppButton({ className, label }: InstallAppButtonProps) {
  const { canInstall, isInstalled, install } = usePWAInstall()
  const [open, setOpen] = useState(false)

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }, [])

  const showHelperOnly = !canInstall && isIOS

  if (isInstalled) return null

  const defaultBtn =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ' +
    'border-white/30 text-white bg-white/10 hover:bg-white/20 ' +
    'dark:border-gray-600 dark:text-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800'

  return (
    <div className="relative inline-flex items-center gap-2">
      {canInstall && (
        <button
          onClick={async () => { await install() }}
          className={className || defaultBtn}
          title={label || 'Install App'}
        >
          <Download className="w-4 h-4" />
          <span>{label || 'Install App'}</span>
        </button>
      )}

      {(isIOS || canInstall) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={(showHelperOnly ? (className || defaultBtn) : 'inline-flex items-center justify-center p-2 rounded-lg border ' +
            'border-white/30 text-white bg-white/10 hover:bg-white/20 ' +
            'dark:border-gray-600 dark:text-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800')}
          title="How to install"
        >
          <Info className="w-4 h-4" />
          {showHelperOnly && <span>How to install</span>}
          <span className="sr-only">How to install</span>
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border bg-white text-slate-700 shadow-xl text-xs p-3 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          <div className="font-semibold mb-1">How to install</div>
          <ul className="list-disc pl-4 space-y-1">
            <li>On iPhone or iPad: open in Safari, tap Share, then Add to Home Screen.</li>
            <li>On Android (Chrome): open menu (⋮), then Install app.</li>
            <li>If you already installed, open from your Home Screen or App Drawer.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
