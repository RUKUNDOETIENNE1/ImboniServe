import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { AlertCircle, Bell, BellOff, Package, Settings, Mail, MessageSquare, Check, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface InventoryAlert {
  id: string
  itemName: string
  currentStock: number
  threshold: number
  unit: string
  category: string
  lastRestocked: string
  daysUntilOut: number
  status: 'critical' | 'warning' | 'low'
}

interface AlertSettings {
  emailEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  emailRecipients: string[]
  whatsappNumbers: string[]
  criticalThreshold: number
  warningThreshold: number
}

export default function InventoryAlerts() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [settings, setSettings] = useState<AlertSettings>({
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    emailRecipients: [],
    whatsappNumbers: [],
    criticalThreshold: 10,
    warningThreshold: 25
  })
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    fetchAlerts()
    fetchSettings()
    checkPushPermission()
  }, [])

  const checkPushPermission = () => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission === 'granted') {
        toast.success(t('alerts.push_enabled', 'Push notifications enabled'))
      }
    }
  }

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/inventory/alert-settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/inventory/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        toast.success(t('alerts.settings_saved', 'Alert settings saved'))
        setShowSettings(false)
      }
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const dismissAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/alerts/${id}/dismiss`, {
        method: 'POST'
      })
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== id))
        toast.success(t('alerts.dismissed', 'Alert dismissed'))
      }
    } catch (error) {
      toast.error('Failed to dismiss alert')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-700 border-red-300',
      'warning': 'bg-amber-100 text-amber-700 border-amber-300',
      'low': 'bg-blue-100 text-blue-700 border-blue-300'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.status === 'critical').length,
    warning: alerts.filter(a => a.status === 'warning').length,
    low: alerts.filter(a => a.status === 'low').length
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('alerts.title', 'Inventory Alerts')}
            </h1>
            <p className="text-slate-600">
              {t('alerts.subtitle', 'Real-time low-stock notifications and alerts')}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            {t('alerts.settings', 'Alert Settings')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.total}</h3>
            <p className="text-sm text-slate-600">{t('alerts.total', 'Total Alerts')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.critical}</h3>
            <p className="text-sm text-slate-600">{t('alerts.critical', 'Critical')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.warning}</h3>
            <p className="text-sm text-slate-600">{t('alerts.warning', 'Warning')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.low}</h3>
            <p className="text-sm text-slate-600">{t('alerts.low', 'Low Stock')}</p>
          </Card>
        </div>

        {/* Push Notification Permission */}
        {pushPermission !== 'granted' && (
          <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">
                    {t('alerts.enable_push', 'Enable Push Notifications')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('alerts.push_desc', 'Get instant alerts when inventory runs low')}
                  </p>
                </div>
              </div>
              <button
                onClick={requestPushPermission}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('alerts.enable', 'Enable')}
              </button>
            </div>
          </Card>
        )}

        {/* Alerts List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-imboni-blue" />
              {t('alerts.active_alerts', 'Active Alerts')}
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                {t('common.loading', 'Loading...')}
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {t('alerts.no_alerts', 'No active alerts. All inventory levels are good!')}
                </p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">{alert.itemName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{t('alerts.current_stock', 'Current Stock')}</p>
                          <p className="font-medium text-slate-800">
                            {alert.currentStock} {alert.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{t('alerts.threshold', 'Threshold')}</p>
                          <p className="font-medium text-slate-800">
                            {alert.threshold} {alert.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{t('alerts.category', 'Category')}</p>
                          <p className="font-medium text-slate-800">{alert.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{t('alerts.days_until_out', 'Days Until Out')}</p>
                          <p className="font-medium text-slate-800">{alert.daysUntilOut} days</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        {t('alerts.last_restocked', 'Last restocked')}: {new Date(alert.lastRestocked).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="ml-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      title={t('alerts.dismiss', 'Dismiss')}
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  {t('alerts.settings', 'Alert Settings')}
                </h2>

                {/* Notification Channels */}
                <div className="space-y-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-4">{t('alerts.channels', 'Notification Channels')}</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={settings.pushEnabled}
                          onChange={(e) => setSettings({ ...settings, pushEnabled: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <Bell className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{t('alerts.push_notifications', 'Push Notifications')}</p>
                          <p className="text-sm text-slate-600">{t('alerts.push_desc', 'Browser notifications')}</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={settings.emailEnabled}
                          onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <Mail className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{t('alerts.email', 'Email Alerts')}</p>
                          <p className="text-sm text-slate-600">{t('alerts.email_desc', 'Email notifications')}</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={settings.whatsappEnabled}
                          onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{t('alerts.whatsapp', 'WhatsApp Alerts')}</p>
                          <p className="text-sm text-slate-600">{t('alerts.whatsapp_desc', 'WhatsApp messages')}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-4">{t('alerts.thresholds', 'Alert Thresholds')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t('alerts.critical_threshold', 'Critical Threshold (%)')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.criticalThreshold}
                          onChange={(e) => setSettings({ ...settings, criticalThreshold: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t('alerts.warning_threshold', 'Warning Threshold (%)')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.warningThreshold}
                          onChange={(e) => setSettings({ ...settings, warningThreshold: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={saveSettings}
                    className="flex-1 px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t('common.save', 'Save Settings')}
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
