import { GitBranch, ArrowRight, Store, User, Ticket, Megaphone, DollarSign, Wallet } from 'lucide-react'

interface RelationshipNode {
  type: string
  id: string
  label: string
  status?: string
}

interface RelationshipGraphProps {
  entity: {
    type: string
    id: string
    label: string
  }
  relationships: Array<{
    direction: 'upstream' | 'downstream'
    node: RelationshipNode
    relationship: string
  }>
}

const typeIcons: Record<string, any> = {
  partnership: User,
  business: Store,
  code: Ticket,
  campaign: Megaphone,
  commission: DollarSign,
  payout: Wallet,
  agreement: GitBranch,
}

const typeLabels: Record<string, string> = {
  partnership: 'Partner',
  business: 'Business',
  code: 'Code',
  campaign: 'Campaign',
  commission: 'Commission',
  payout: 'Payout',
  agreement: 'Agreement',
}

export default function RelationshipGraph({ entity, relationships }: RelationshipGraphProps) {
  const upstream = relationships.filter((r) => r.direction === 'upstream')
  const downstream = relationships.filter((r) => r.direction === 'downstream')
  const EntityIcon = typeIcons[entity.type] ?? GitBranch

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Relationship Graph</h3>
      </div>

      {/* Upstream */}
      {upstream.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Upstream (leads to)</p>
          <div className="space-y-1.5" role="list" aria-label="Upstream relationships">
            {upstream.map((rel, idx) => {
              const Icon = typeIcons[rel.node.type] ?? GitBranch
              return (
                <div key={idx} className="flex items-center gap-2" role="listitem">
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-50 border border-slate-200">
                    <Icon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{rel.node.label}</p>
                      <p className="text-xs text-slate-400">{typeLabels[rel.node.type] ?? rel.node.type}{rel.node.status ? ` · ${rel.node.status}` : ''}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" aria-hidden="true" />
                  <span className="text-xs text-slate-400">{rel.relationship}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Center entity */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <EntityIcon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{entity.label}</p>
          <p className="text-xs text-slate-500">{typeLabels[entity.type] ?? entity.type}</p>
        </div>
      </div>

      {/* Downstream */}
      {downstream.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Downstream (leads from)</p>
          <div className="space-y-1.5" role="list" aria-label="Downstream relationships">
            {downstream.map((rel, idx) => {
              const Icon = typeIcons[rel.node.type] ?? GitBranch
              return (
                <div key={idx} className="flex items-center gap-2" role="listitem">
                  <span className="text-xs text-slate-400">{rel.relationship}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-50 border border-slate-200">
                    <Icon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{rel.node.label}</p>
                      <p className="text-xs text-slate-400">{typeLabels[rel.node.type] ?? rel.node.type}{rel.node.status ? ` · ${rel.node.status}` : ''}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {upstream.length === 0 && downstream.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No relationships found for this entity.</p>
      )}
    </div>
  )
}
