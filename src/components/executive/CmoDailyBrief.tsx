import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface CmoBriefData {
  yesterday: Array<{ label: string; value: string }>
  todayOpportunities: Array<{ label: string; value: string }>
  growthAchievements: string[]
  campaignHighlights: string[]
  conversionTrends: Array<{ label: string; value: string }>
  risks: string[]
  recommendations: string[]
  upcomingLaunches: string[]
}

interface Props {
  data: CmoBriefData | null
  loading?: boolean
}

export default function CmoDailyBrief({ data, loading }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">CMO daily brief unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse brief' : 'Expand brief'}
      >
        <h3 className="text-base font-bold text-slate-900">CMO Daily Brief</h3>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Section title="Yesterday" items={data.yesterday} />
          <Section title="Today's Opportunities" items={data.todayOpportunities} />
          <Section title="Conversion Trends" items={data.conversionTrends} />

          <ListSection title="Growth Achievements" items={data.growthAchievements} color="emerald" />
          <ListSection title="Campaign Highlights" items={data.campaignHighlights} color="blue" />
          <ListSection title="Risks" items={data.risks} color="red" />
          <ListSection title="Recommendations" items={data.recommendations} color="blue" />
          <ListSection title="Upcoming Launches" items={data.upcomingLaunches} color="purple" />
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-slate-600">{item.label}</span>
          <span className="font-medium text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function ListSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-500',
    red: 'text-red-600 bg-red-500',
    blue: 'text-blue-600 bg-blue-500',
    purple: 'text-purple-600 bg-purple-500',
  }
  return (
    <div className="space-y-2">
      <p className={`text-xs font-medium uppercase tracking-wide ${colorMap[color]?.split(' ')[0]}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colorMap[color]?.split(' ')[1]}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
