import { useState } from 'react'
import { Package, Check, Plus } from 'lucide-react'

interface MarketingKitPanelProps {
  canManage: boolean
  onAction: (action: string, data?: Record<string, unknown>) => void
  assignedItems: string[]
}

const AVAILABLE_KIT_ITEMS = [
  { key: 'brand_guide', label: 'Brand Guide', description: 'Visual identity guidelines' },
  { key: 'logos', label: 'Logos', description: 'Logo files in various formats' },
  { key: 'campaign_assets', label: 'Campaign Assets', description: 'Pre-made marketing materials' },
  { key: 'video_guidelines', label: 'Video Guidelines', description: 'Video creation best practices' },
  { key: 'founder_handbook', label: 'Founder Handbook', description: 'Complete partner reference guide' },
  { key: 'qr_resources', label: 'QR Resources', description: 'QR code generation and tracking' },
  { key: 'social_media_assets', label: 'Social Media Assets', description: 'Pre-sized social media graphics' },
]

export default function MarketingKitPanel({ canManage, onAction, assignedItems }: MarketingKitPanelProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleItem = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleAssign = () => {
    if (selected.length === 0) return
    onAction('assignMarketingKit', { kitItems: selected })
    setSelected([])
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
          <Package className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Marketing Kit</h3>
          <p className="text-xs text-slate-500">
            {assignedItems.length > 0
              ? `${assignedItems.length} item${assignedItems.length > 1 ? 's' : ''} assigned`
              : 'No items assigned yet'}
          </p>
        </div>
      </div>

      {/* Assigned items */}
      {assignedItems.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {assignedItems.map((item) => {
            const kitItem = AVAILABLE_KIT_ITEMS.find((k) => k.key === item)
            return (
              <div key={item} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{kitItem?.label || item}</p>
                  {kitItem && <p className="text-xs text-slate-500">{kitItem.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Available items for assignment */}
      {canManage && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Available Assets:</p>
          {AVAILABLE_KIT_ITEMS.map((item) => {
            const isAssigned = assignedItems.includes(item.key)
            const isSelected = selected.includes(item.key)

            return (
              <label
                key={item.key}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${
                  isAssigned
                    ? 'opacity-50 cursor-not-allowed bg-slate-50'
                    : isSelected
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAssigned || isSelected}
                  disabled={isAssigned}
                  onChange={() => toggleItem(item.key)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  aria-label={item.label}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                {isAssigned && (
                  <span className="ml-auto text-xs text-green-600 font-medium">Assigned</span>
                )}
              </label>
            )
          })}

          {selected.length > 0 && (
            <button
              onClick={handleAssign}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium mt-3"
            >
              <Plus className="w-4 h-4" />
              Assign {selected.length} Item{selected.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
