import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react'
import { useCurrency } from '@/contexts/LocaleContext'
import Card from '@/components/ui/Card'

interface ExchangeRates {
  [currency: string]: number
}

export default function CurrencyRatesWidget() {
  const { currency } = useCurrency()
  const [rates, setRates] = useState<ExchangeRates>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchRates = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/currency/rates?base=${currency}`)
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates || {})
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [currency])

  const displayCurrencies = ['USD', 'EUR', 'KES', 'UGX'].filter(c => c !== currency)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Exchange Rates</h3>
            <p className="text-xs text-slate-500">Base: {currency}</p>
          </div>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh rates"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !lastUpdated ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayCurrencies.slice(0, 3).map(curr => (
            <div key={curr} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{curr}</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {rates[curr] ? rates[curr].toFixed(4) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}

      <div className="mt-4">
        <a
          href="/dashboard/settings?tab=restaurant"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Change base currency →
        </a>
      </div>
    </Card>
  )
}
