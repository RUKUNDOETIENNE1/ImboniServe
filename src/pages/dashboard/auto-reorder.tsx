import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { Package, TrendingUp, AlertTriangle, Settings, Check, X, Zap, Clock, BarChart3 } from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  sku: string
  currentStock: number
  unit: string
  minThreshold: number
  maxThreshold: number
  avgWeeklyUsage: number
  leadTime: number
  supplierId: string
  supplierName: string
  autoReorderEnabled: boolean
  reorderQuantity: number
  lastReorderDate: Date
  predictedStockoutDate: Date
}

interface ReorderSuggestion {
  itemId: string
  itemName: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  suggestedQuantity: number
  estimatedCost: number
  reason: string
  confidence: number
}

export default function AutoReorder() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)

  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Fresh Tomatoes',
      sku: 'VEG-TOM-001',
      currentStock: 8,
      unit: 'kg',
      minThreshold: 15,
      maxThreshold: 50,
      avgWeeklyUsage: 25,
      leadTime: 2,
      supplierId: 'SUP-001',
      supplierName: 'Rwanda Fresh Produce',
      autoReorderEnabled: true,
      reorderQuantity: 40,
      lastReorderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      predictedStockoutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Beef Steak',
      sku: 'MEAT-BEF-001',
      currentStock: 15,
      unit: 'kg',
      minThreshold: 20,
      maxThreshold: 60,
      avgWeeklyUsage: 30,
      leadTime: 3,
      supplierId: 'SUP-002',
      supplierName: 'Kigali Meat Suppliers',
      autoReorderEnabled: true,
      reorderQuantity: 45,
      lastReorderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      predictedStockoutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Flour',
      sku: 'PAN-FLR-001',
      currentStock: 45,
      unit: 'kg',
      minThreshold: 30,
      maxThreshold: 100,
      avgWeeklyUsage: 20,
      leadTime: 5,
      supplierId: 'SUP-003',
      supplierName: 'Rwanda Grains Co',
      autoReorderEnabled: false,
      reorderQuantity: 55,
      lastReorderDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      predictedStockoutDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      name: 'Vegetable Oil',
      sku: 'OIL-VEG-001',
      currentStock: 5,
      unit: 'L',
      minThreshold: 10,
      maxThreshold: 30,
      avgWeeklyUsage: 8,
      leadTime: 4,
      supplierId: 'SUP-004',
      supplierName: 'Rwanda Oils Ltd',
      autoReorderEnabled: true,
      reorderQuantity: 25,
      lastReorderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      predictedStockoutDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    }
  ]

  const reorderSuggestions: ReorderSuggestion[] = [
    {
      itemId: '4',
      itemName: 'Vegetable Oil',
      urgency: 'critical',
      suggestedQuantity: 25,
      estimatedCost: 125000,
      reason: 'Stock will run out in 1 day based on current usage rate',
      confidence: 95
    },
    {
      itemId: '1',
      itemName: 'Fresh Tomatoes',
      urgency: 'high',
      suggestedQuantity: 40,
      estimatedCost: 60000,
      reason: 'Below minimum threshold, high usage rate predicted',
      confidence: 88
    },
    {
      itemId: '2',
      itemName: 'Beef Steak',
      urgency: 'medium',
      suggestedQuantity: 45,
      estimatedCost: 360000,
      reason: 'Approaching minimum threshold, lead time consideration',
      confidence: 82
    }
  ]

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getDaysUntilStockout = (predictedDate: Date) => {
    const days = Math.ceil((predictedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    return days
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('reorder.title', 'Automated Reordering')}</h1>
            <p className="text-slate-600">{t('reorder.subtitle', 'AI-powered inventory management')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {t('reorder.settings', 'Settings')}
            </button>
            <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('reorder.processAll', 'Process All')}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('reorder.aiSettings', 'AI Reorder Settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.predictionModel', 'Prediction Model')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>AI Machine Learning</option>
                  <option>Historical Average</option>
                  <option>Manual Threshold Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.reorderTrigger', 'Reorder Trigger')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>{t('reorder.predictedStockout', 'Predicted Stockout')}</option>
                  <option>{t('reorder.belowThreshold', 'Below Threshold')}</option>
                  <option>{t('reorder.both', 'Both')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.safetyStock', 'Safety Stock %')}</label>
                <input type="number" defaultValue={20} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reorder.maxBudget', 'Max Budget (RWF)')}</label>
                <input type="number" defaultValue={500000} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-imboni-blue" />
                  <span className="text-sm text-slate-700">{t('reorder.autoApprove', 'Auto-approve orders under 100,000 RWF')}</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700">
                {t('reorder.saveSettings', 'Save Settings')}
              </button>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-imboni-blue" />
            {t('reorder.aiSuggestions', 'AI Reorder Suggestions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reorderSuggestions.map(suggestion => (
              <div key={suggestion.itemId} className={`bg-white rounded-xl border-2 p-6 ${getUrgencyColor(suggestion.urgency)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{suggestion.itemName}</h3>
                      <span className={`text-xs font-medium uppercase`}>{suggestion.urgency}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{suggestion.confidence}%</div>
                    <div className="text-xs">{t('reorder.confidence', 'confidence')}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>{t('reorder.suggestedQty', 'Suggested Qty')}</span>
                    <span className="font-semibold">{suggestion.suggestedQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('reorder.estimatedCost', 'Est. Cost')}</span>
                    <span className="font-semibold">{suggestion.estimatedCost.toLocaleString()} RWF</span>
                  </div>
                </div>

                <p className="text-sm mb-4 opacity-90">{suggestion.reason}</p>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" />
                    {t('reorder.approve', 'Approve')}
                  </button>
                  <button className="flex-1 py-2 bg-white/50 hover:bg-white/70 rounded-lg font-medium flex items-center justify-center gap-1">
                    <X className="w-4 h-4" />
                    {t('reorder.ignore', 'Ignore')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{t('reorder.inventoryOverview', 'Inventory Overview')}</h3>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.item', 'Item')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.stock', 'Stock')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.status', 'Status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.predictedStockout', 'Predicted Stockout')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.autoReorder', 'Auto-Reorder')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reorder.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventoryItems.map(item => {
                const daysUntilStockout = getDaysUntilStockout(item.predictedStockoutDate)
                const isCritical = daysUntilStockout <= 2
                const isLow = daysUntilStockout <= 5 && daysUntilStockout > 2

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.currentStock} {item.unit}</div>
                      <div className="text-xs text-slate-500">Min: {item.minThreshold}</div>
                    </td>
                    <td className="px-6 py-4">
                      {isCritical ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {t('reorder.critical', 'Critical')}
                        </span>
                      ) : isLow ? (
                        <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {t('reorder.low', 'Low')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          {t('reorder.ok', 'OK')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {daysUntilStockout} {t('reorder.days', 'days')}
                    </td>
                    <td className="px-6 py-4">
                      {item.autoReorderEnabled ? (
                        <span className="text-green-600 font-medium text-sm">{t('reorder.enabled', 'Enabled')}</span>
                      ) : (
                        <span className="text-slate-500 text-sm">{t('reorder.disabled', 'Disabled')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-imboni-blue hover:text-blue-700 text-sm font-medium">
                        {t('reorder.configure', 'Configure')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Analytics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-imboni-blue" />
              <span className="text-sm text-slate-600">{t('reorder.avgWeeklySpend', 'Avg Weekly Spend')}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">545,000 RWF</div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              -12% vs last month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-imboni-blue" />
              <span className="text-sm text-slate-600">{t('reorder.stockoutPrevented', 'Stockouts Prevented')}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">23</div>
            <div className="text-xs text-slate-500 mt-1">{t('reorder.thisMonth', 'This month')}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-imboni-blue" />
              <span className="text-sm text-slate-600">{t('reorder.aiAccuracy', 'AI Prediction Accuracy')}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">87%</div>
            <div className="text-xs text-green-600 mt-1">{t('reorder.excellent', 'Excellent')}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
