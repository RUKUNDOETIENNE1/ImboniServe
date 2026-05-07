import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { DollarSign, RefreshCw, Check, Globe } from 'lucide-react'
import Card from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface Currency {
  code: string
  name: string
  symbol: string
  rate: number
  isDefault: boolean
}

export default function CurrencySettings() {
  const { t } = useTranslation()
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', rate: 1, isDefault: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.00077, isDefault: false },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.00071, isDefault: false }
  ])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const updateRates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/currency/rates')
      if (res.ok) {
        const data = await res.json()
        setCurrencies(data.currencies)
        setLastUpdated(new Date())
        toast.success(t('currency.rates_updated', 'Exchange rates updated'))
      }
    } catch (error) {
      toast.error('Failed to update rates')
    } finally {
      setLoading(false)
    }
  }

  const setDefaultCurrency = async (code: string) => {
    try {
      const res = await fetch('/api/currency/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      if (res.ok) {
        setCurrencies(currencies.map(c => ({
          ...c,
          isDefault: c.code === code
        })))
        toast.success(t('currency.default_set', 'Default currency updated'))
      }
    } catch (error) {
      toast.error('Failed to set default currency')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {t('currency.title', 'Currency Settings')}
          </h1>
          <p className="text-slate-600">
            {t('currency.subtitle', 'Manage multi-currency support and exchange rates')}
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {t('currency.exchange_rates', 'Exchange Rates')}
              </h2>
              <p className="text-sm text-slate-600">
                {t('currency.last_updated', 'Last updated')}: {lastUpdated.toLocaleString()}
              </p>
            </div>
            <button
              onClick={updateRates}
              disabled={loading}
              className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {t('currency.update_rates', 'Update Rates')}
            </button>
          </div>

          <div className="space-y-4">
            {currencies.map(currency => (
              <div
                key={currency.code}
                className={`p-4 rounded-xl border-2 transition-all ${
                  currency.isDefault
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {currency.symbol}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {currency.code} - {currency.name}
                        {currency.isDefault && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-600">
                        1 RWF = {currency.rate.toFixed(6)} {currency.code}
                      </p>
                    </div>
                  </div>
                  {!currency.isDefault && (
                    <button
                      onClick={() => setDefaultCurrency(currency.code)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t('currency.set_default', 'Set as Default')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <Globe className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-800 mb-2">
                {t('currency.multi_currency_info', 'Multi-Currency Support')}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                {t('currency.info_desc', 'Customers can view prices in their preferred currency. Payments are processed in RWF and converted automatically.')}
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• {t('currency.feature_1', 'Real-time exchange rates')}</li>
                <li>• {t('currency.feature_2', 'Automatic conversion on checkout')}</li>
                <li>• {t('currency.feature_3', 'Multi-currency reports')}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
