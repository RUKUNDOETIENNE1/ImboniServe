import React from 'react'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react'

export default function SimpleReport() {
  const today = new Date().toLocaleDateString('en-RW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const stats = {
    sales: 85000,
    profit: 42500,
    margin: 50,
    transactions: 12,
    avgSale: 7083,
    lowStockItems: 3
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">📊 Daily Report</h3>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Export PDF
        </button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">
                <CurrencyDisplay amount={stats.sales} />
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-green-700 mt-1">+12% from yesterday</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-blue-600">
                <CurrencyDisplay amount={stats.profit} />
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-blue-700 mt-1">Margin: {stats.margin}%</p>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Sales Target</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Profit Target</span>
            <span>85%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>
      
      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold mb-1">{stats.transactions}</div>
          <p className="text-sm text-gray-600">Transactions</p>
          <p className="text-xs text-gray-500">Avg: <CurrencyDisplay amount={stats.avgSale} /></p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold mb-1">{stats.lowStockItems}</div>
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-xs text-gray-500">Needs attention</p>
        </div>
      </div>
      
      {/* Top Selling Items */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">🔥 Top Selling Today</h4>
        <div className="space-y-2">
          {[
            { name: 'Nyama Choma', sales: 32000, qty: 4 },
            { name: 'Grilled Tilapia', sales: 24000, qty: 2 },
            { name: 'Fanta 500ml', sales: 8000, qty: 8 }
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.qty} sold</p>
              </div>
              <p className="font-bold"><CurrencyDisplay amount={item.sales} /></p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
          📱 WhatsApp Report
        </button>
        <button className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          📧 Email Report
        </button>
      </div>
    </div>
  )
}