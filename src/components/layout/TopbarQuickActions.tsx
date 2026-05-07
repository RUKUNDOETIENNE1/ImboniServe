import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Moon, Sun, Maximize, Minimize, Bell, QrCode, MonitorDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function TopbarQuickActions() {
  const router = useRouter()
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const { canInstall, install } = usePWAInstall()

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Language selector removed: handled by LanguageSwitcher in DashboardLayout

  return (
    <div className="flex items-center gap-2">
      {canInstall && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all hover:border-imboni-blue hover:text-imboni-blue group"
          title={t('topbar.install_app', 'Install App')}
        >
          <MonitorDown size={16} className="group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">{t('topbar.install', 'Install')}</span>
        </button>
      )}

      <button
        onClick={() => router.push('/dashboard/qr-builder')}
        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition group"
        title={t('topbar.qr_builder', 'QR Builder')}
      >
        <QrCode size={20} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
      </button>

      {/* Language selector removed here to avoid duplicate globe icon. Use <LanguageSwitcher /> in DashboardLayout. */}

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        title={darkMode ? t('topbar.light_mode', 'Light Mode') : t('topbar.dark_mode', 'Dark Mode')}
      >
        {darkMode ? (
          <Sun size={20} className="text-yellow-500" />
        ) : (
          <Moon size={20} className="text-gray-600" />
        )}
      </button>

      <button
        onClick={toggleFullscreen}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        title={isFullscreen ? t('topbar.exit_fullscreen', 'Exit Fullscreen') : t('topbar.fullscreen', 'Fullscreen')}
      >
        {isFullscreen ? (
          <Minimize size={20} className="text-gray-600 dark:text-gray-300" />
        ) : (
          <Maximize size={20} className="text-gray-600 dark:text-gray-300" />
        )}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
          title={t('topbar.notifications', 'Notifications')}
        >
          <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('topbar.notifications', 'Notifications')}</h3>
            </div>
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Bell size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('topbar.no_notifications', 'No new notifications')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
