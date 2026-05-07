import React, { useState } from 'react'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Calculator, TrendingUp, DollarSign } from 'lucide-react'

export default function ProfitCalculator() {
  const [revenue, setRevenue] = useState(85000)
  const [cost, setCost] = useState(42500)
  const [taxRate, setTaxRate] = useState(18) // Rwanda VAT
  
  const profit = revenue - cost
  const tax = revenue * (taxRate / 100)
  const netProfit = profit - tax
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calculator className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Profit Calculator</h3>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Save Template
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Revenue Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Revenue
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter revenue"
            />
          </div>
        </div>
        
        {/* Cost Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Cost
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter cost"
            />
          </div>
        </div>
        
        {/* Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VAT Rate (%) - Rwanda
          </label>
          <input
            type="range"
            min="0"
            max="30"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>0%</span>
            <span className="font-medium">{taxRate}% VAT</span>
            <span>30%</span>
          </div>
        </div>
        
        {/* Results */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-green-600"><CurrencyDisplay amount={profit} /></p>
              <p className="text-sm text-green-700">Margin: {margin.toFixed(1)}%</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-blue-600"><CurrencyDisplay amount={netProfit} /></p>
              <p className="text-sm text-blue-700">Margin: {netMargin.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium"><CurrencyDisplay amount={revenue} /></span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium text-red-600">-<CurrencyDisplay amount={cost} /></span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">VAT ({taxRate}%):</span>
              <span className="font-medium text-yellow-600">-<CurrencyDisplay amount={tax} /></span>
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Net Profit:</span>
                <span className="text-green-600"><CurrencyDisplay amount={netProfit} /></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Profit Tips */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Profit Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Aim for at least 30% profit margin</li>
            <li>• Reduce food waste to lower costs</li>
            <li>• Bundle items to increase average sale value</li>
            <li>• Use local ingredients to reduce costs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}