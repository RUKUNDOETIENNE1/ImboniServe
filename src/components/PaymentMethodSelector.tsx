import { useState } from 'react'
import { CreditCard, Banknote, Smartphone, ExternalLink, CheckCircle2 } from 'lucide-react'

interface PaymentMethodSelectorProps {
  onSelect: (method: 'WEB' | 'CASH' | 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY') => void
  selected?: string
  totalCents: number
  showOnlinePayment?: boolean
}

export function PaymentMethodSelector({
  onSelect,
  selected,
  totalCents,
  showOnlinePayment = true
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(selected)

  const handleSelect = (method: 'WEB' | 'CASH' | 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY') => {
    setSelectedMethod(method)
    onSelect(method)
  }

  const paymentOptions = [
    ...(showOnlinePayment ? [{
      id: 'WEB' as const,
      icon: CreditCard,
      title: 'Pay Online Now',
      subtitle: 'Cards, Mobile Money via IremboPay',
      features: [
        'Secure checkout',
        'Order confirmed immediately',
        'Multiple payment options'
      ],
      color: 'blue',
      badge: 'Recommended'
    }] : []),
    {
      id: 'CASH' as const,
      icon: Banknote,
      title: 'Pay at Restaurant',
      subtitle: 'Cash payment when you arrive',
      features: [
        'Pay at counter',
        'Show order number to staff',
        'Order sent to kitchen after payment'
      ],
      color: 'green'
    },
    {
      id: 'MTN_MOBILE_MONEY' as const,
      icon: Smartphone,
      title: 'MTN Mobile Money',
      subtitle: 'Pay at restaurant with MTN MoMo',
      features: [
        'Pay at counter with MoMo',
        'Show order number to staff',
        'Instant confirmation'
      ],
      color: 'yellow'
    },
    {
      id: 'AIRTEL_MONEY' as const,
      icon: Smartphone,
      title: 'Airtel Money',
      subtitle: 'Pay at restaurant with Airtel Money',
      features: [
        'Pay at counter with Airtel',
        'Show order number to staff',
        'Instant confirmation'
      ],
      color: 'red'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Choose Payment Method</h3>
        <p className="text-sm text-slate-600">Select how you'd like to pay for your order</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedMethod === option.id
          
          const colorClasses = {
            blue: {
              border: 'border-blue-300',
              bg: 'bg-blue-50',
              text: 'text-blue-900',
              icon: 'text-blue-600',
              badge: 'bg-blue-600 text-white',
              selected: 'border-blue-600 bg-blue-100 ring-4 ring-blue-200'
            },
            green: {
              border: 'border-green-300',
              bg: 'bg-green-50',
              text: 'text-green-900',
              icon: 'text-green-600',
              selected: 'border-green-600 bg-green-100 ring-4 ring-green-200'
            },
            yellow: {
              border: 'border-yellow-300',
              bg: 'bg-yellow-50',
              text: 'text-yellow-900',
              icon: 'text-yellow-600',
              selected: 'border-yellow-600 bg-yellow-100 ring-4 ring-yellow-200'
            },
            red: {
              border: 'border-red-300',
              bg: 'bg-red-50',
              text: 'text-red-900',
              icon: 'text-red-600',
              selected: 'border-red-600 bg-red-100 ring-4 ring-red-200'
            }
          }

          const colors = colorClasses[option.color as keyof typeof colorClasses]

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`
                relative border-2 rounded-2xl p-5 text-left transition-all hover:shadow-lg
                ${isSelected ? colors.selected : `${colors.border} ${colors.bg} hover:${colors.border}`}
              `}
            >
              {option.badge && (
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors.badge}`}>
                    {option.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4 mb-3">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-base ${colors.text} mb-1`}>{option.title}</h4>
                  <p className="text-sm text-slate-600">{option.subtitle}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className={`w-6 h-6 ${colors.icon}`} />
                )}
              </div>

              <ul className="space-y-1.5 ml-16">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {selectedMethod && (
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">{(totalCents / 100).toLocaleString()} RWF</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Payment Method</p>
              <p className="text-base font-semibold text-slate-900">
                {selectedMethod === 'WEB' ? 'Online Payment' :
                 selectedMethod === 'CASH' ? 'Cash' :
                 selectedMethod === 'MTN_MOBILE_MONEY' ? 'MTN MoMo' :
                 'Airtel Money'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
