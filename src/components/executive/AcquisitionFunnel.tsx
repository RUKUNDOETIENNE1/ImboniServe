import { ArrowRight, ArrowDown } from 'lucide-react'

export interface AcquisitionFunnelData {
  visitor: number
  lead: number
  interestedRestaurant: number
  trial: number
  activation: number
  subscription: number
  retainedCustomer: number
  conversionRates: {
    visitorToLead: string
    leadToTrial: string
    trialToActivation: string
    activationToSubscription: string
    overallConversion: string
  }
  dropOffs: {
    visitorToLead: number
    leadToTrial: number
    trialToActivation: number
    activationToSubscription: number
  }
}

interface Props {
  data: AcquisitionFunnelData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AcquisitionFunnel({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 w-full bg-slate-100 rounded" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Acquisition Funnel</h3>
        <p className="text-sm text-slate-400">No acquisition funnel data available.</p>
      </div>
    )
  }

  const stages = [
    { name: 'Visitor', value: data.visitor, link: '/admin/operations-intelligence' },
    { name: 'Lead', value: data.lead, link: '/admin/founder-partners' },
    { name: 'Interested Hospitality Business', value: data.interestedRestaurant, link: '/admin/restaurants' },
    { name: 'Trial', value: data.trial, link: '/admin/subscriptions' },
    { name: 'Activation', value: data.activation, link: '/admin/restaurants' },
    { name: 'Subscription', value: data.subscription, link: '/admin/subscriptions' },
    { name: 'Retained Customer', value: data.retainedCustomer, link: '/admin/revenue-operations' },
  ]

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Acquisition Funnel</h3>

      {/* Funnel visualization */}
      <div className="space-y-1 mb-4">
        {stages.map((stage, i) => {
          const widthPercent = Math.max(10, (stage.value / maxValue) * 100)
          const dropOff = i < stages.length - 1 ? stages[i].value - stages[i + 1].value : 0
          const dropOffPercent = stage.value > 0 ? ((dropOff / stage.value) * 100).toFixed(0) : '0'

          return (
            <div key={i}>
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: i === 0 ? '#dbeafe' : i < 3 ? '#e0e7ff' : i < 5 ? '#dcfce7' : '#d1fae5',
                }}
                onClick={() => onNavigate?.(stage.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(stage.link) }}
              >
                <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                <span className="text-sm font-bold text-slate-900">{stage.value.toLocaleString()}</span>
              </div>
              {i < stages.length - 1 && dropOff > 0 && (
                <div className="flex items-center gap-1 pl-3 py-0.5 text-xs text-slate-400">
                  <ArrowDown className="w-3 h-3" />
                  <span>{dropOff.toLocaleString()} drop-off ({dropOffPercent}%)</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <ConversionRate label="Visitor → Lead" value={data.conversionRates.visitorToLead} />
        <ConversionRate label="Lead → Trial" value={data.conversionRates.leadToTrial} />
        <ConversionRate label="Trial → Activation" value={data.conversionRates.trialToActivation} />
        <ConversionRate label="Activation → Sub" value={data.conversionRates.activationToSubscription} />
        <ConversionRate label="Overall" value={data.conversionRates.overallConversion} highlight />
      </div>

      <button
        onClick={() => onNavigate?.('/admin/founder-partners')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Growth Workspace</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function ConversionRate({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 text-center ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>{value}%</p>
    </div>
  )
}
