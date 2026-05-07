import React, { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'

interface CurrencySelectorProps {
  value: string
  onChange: (currency: string) => void
  className?: string
}

const SUPPORTED_CURRENCIES = [
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', symbol: 'FRw' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', symbol: 'USh' },
]

export default function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === value) || SUPPORTED_CURRENCIES[0]

  // Save preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredCurrency', value)
    }
  }, [value])

  const handleSelect = (code: string) => {
    onChange(code)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="Select currency"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-lg">{selectedCurrency.flag}</span>
        <span className="font-medium text-gray-900">{selectedCurrency.code}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  currency.code === value ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
                {currency.code === value && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Hook to manage currency state with localStorage persistence
 */
export function useCurrency() {
  const [currency, setCurrency] = useState('RWF')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredCurrency')
      if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved)) {
        setCurrency(saved)
      } else {
        // Auto-detect from browser
        try {
          const locale = navigator.language
          const country = locale.split('-')[1]?.toUpperCase()
          const currencyMap: Record<string, string> = {
            'RW': 'RWF',
            'US': 'USD',
            'GB': 'GBP',
            'KE': 'KES',
            'TZ': 'TZS',
            'UG': 'UGX',
          }
          if (country && currencyMap[country]) {
            setCurrency(currencyMap[country])
          }
        } catch (e) {
          // Ignore detection errors
        }
      }
    }
  }, [])

  return [currency, setCurrency] as const
}
