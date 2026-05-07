
// src/components/USSDMenu.tsx (Future Feature)

import { Phone, Hash } from 'lucide-react'

export default function USSDMenu() {
  const ussdCode = '*182*7*123456#'
  
  const menuOptions = [
    { key: '1', action: 'Check daily sales' },
    { key: '2', action: 'Record a sale' },
    { key: '3', action: 'Check stock levels' },
    { key: '4', action: 'Get profit report' },
    { key: '5', action: 'Talk to support' },
    { key: '0', action: 'Go back' },
  ]
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(ussdCode)
    alert('USSD code copied! Dial this from your phone.')
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Phone className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold">USSD Menu (Coming Soon)</h3>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
          Beta
        </span>
      </div>
      
      <div className="space-y-6">
        {/* USSD Code */}
        <div className="text-center">
          <div className="inline-flex items-center bg-gray-100 px-6 py-3 rounded-lg">
            <Hash className="w-5 h-5 mr-2 text-gray-600" />
            <code className="text-2xl font-mono font-bold">{ussdCode}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className="mt-3 text-sm text-purple-600 hover:text-purple-800"
          >
            📋 Copy USSD Code
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Dial this code from any phone (no internet needed)
          </p>
        </div>
        
        {/* USSD Menu Flow */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Menu Options:</h4>
          <div className="space-y-2">
            {menuOptions.map(option => (
              <div key={option.key} className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-3">
                  <span className="font-bold">{option.key}</span>
                </div>
                <span>{option.action}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* How It Works */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📱 How USSD Works</h4>
          <ol className="text-sm text-blue-700 space-y-2">
            <li>1. Dial <strong>{ussdCode}</strong> from your phone</li>
            <li>2. Follow the voice prompts</li>
            <li>3. Select options using your keypad</li>
            <li>4. Get instant updates via SMS</li>
            <li>5. No internet or smartphone required!</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm font-medium">Supported Networks:</p>
            <div className="flex space-x-4 mt-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">MTN</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded">Airtel</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">Tigo</span>
            </div>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl mb-1">📶</div>
            <p className="text-sm font-medium">Works Offline</p>
            <p className="text-xs text-gray-600">No internet needed</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-2xl mb-1">💸</div>
            <p className="text-sm font-medium">Low Cost</p>
            <p className="text-xs text-gray-600">Standard call rates</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl mb-1">👵</div>
            <p className="text-sm font-medium">Easy to Use</p>
            <p className="text-xs text-gray-600">Simple keypad navigation</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl mb-1">🇷🇼</div>
            <p className="text-sm font-medium">Rwanda-Wide</p>
            <p className="text-xs text-gray-600">Works nationwide</p>
          </div>
        </div>
      </div>
    </div>
  )
}