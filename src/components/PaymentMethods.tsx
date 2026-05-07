import { useState } from 'react'
import { Smartphone, CreditCard, Building, Wallet } from 'lucide-react'

export default function PaymentMethods({ onSelect }: { onSelect: (method: string) => void }) {
  const [selected, setSelected] = useState('')
  
  const methods = [
    {
      id: 'MTN_MOBILE_MONEY',
      name: 'MTN Mobile Money',
      icon: Smartphone,
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      description: 'Pay via MTN MoMo',
      instructions: 'Dial *182*7*1# or use MoMo app'
    },
    {
      id: 'AIRTEL_MONEY',
      name: 'Airtel Money',
      icon: Smartphone,
      color: 'bg-red-100',
      textColor: 'text-red-800',
      description: 'Pay via Airtel Money',
      instructions: 'Dial *182*7*2# or use Airtel Money app'
    },
    {
      id: 'WEB',
      name: 'Web Payment (IremboPay)',
      icon: CreditCard,
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
      description: 'Secure payment via IremboPay',
      instructions: 'Card, mobile money, and bank transfer'
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      icon: Building,
      color: 'bg-purple-100',
      textColor: 'text-purple-800',
      description: 'Direct bank transfer',
      instructions: 'BK: 0004001234567\nEquity: 1234567890'
    },
    {
      id: 'CASH',
      name: 'Cash Payment',
      icon: Wallet,
      color: 'bg-green-100',
      textColor: 'text-green-800',
      description: 'Pay with cash',
      instructions: 'Pay at restaurant location'
    }
  ]
  
  const handleSelect = (methodId: string) => {
    setSelected(methodId)
    onSelect(methodId)
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Payment Method</h3>
      
      <div className="space-y-3">
        {methods.map(method => {
          const Icon = method.icon
          return (
            <div
              key={method.id}
              onClick={() => handleSelect(method.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selected === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${method.color} mr-3`}>
                  <Icon className={`w-5 h-5 ${method.textColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{method.name}</h4>
                    {selected === method.id && (
                      <span className="text-blue-600 text-sm">✓ Selected</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  <p className="text-xs text-gray-500 mt-2 whitespace-pre-line">
                    {method.instructions}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* IremboPay Web Payment (when selected) */}
      {selected === 'WEB' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-3">Web Payment via IremboPay</h4>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You will be redirected to IremboPay to complete your payment securely.
            </p>
            <div className="p-3 bg-white rounded border">
              <p className="text-xs text-gray-600 mb-2">Accepted payment methods:</p>
              <ul className="text-sm space-y-1">
                <li>• Credit/Debit Cards (Visa, Mastercard)</li>
                <li>• MTN Mobile Money</li>
                <li>• Airtel Money</li>
                <li>• Bank Transfer</li>
              </ul>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Continue to IremboPay
            </button>
            <p className="text-xs text-gray-500 text-center">
              Secure payment powered by IremboPay
            </p>
          </div>
        </div>
      )}
      
      {/* Mobile Money Instructions */}
      {(selected === 'MTN_MOBILE_MONEY' || selected === 'AIRTEL_MONEY') && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold mb-2">Mobile Money Instructions</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Go to your mobile money menu</li>
            <li>Select "Pay Bill" or "Merchant Payment"</li>
            <li>Enter Business Number: <strong>123456</strong></li>
            <li>Enter Account Number: <strong>IMBONI001</strong></li>
            <li>Enter the amount</li>
            <li>Enter your PIN to confirm</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm font-medium">Send payment confirmation to:</p>
            <p className="text-lg font-bold text-green-600">+250 788 123 456</p>
            <p className="text-xs text-gray-500">Include your name and payment reference</p>
          </div>
        </div>
      )}
    </div>
  )
}