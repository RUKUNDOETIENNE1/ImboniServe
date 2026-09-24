import { FileText, Send, PenTool, CheckCircle, History, Plus } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface AgreementCardProps {
  agreement: any
  agreements: any[]
  canManage: boolean
  onAction: (action: string, data?: Record<string, unknown>) => void
}

export default function AgreementCard({ agreement, agreements, canManage, onAction }: AgreementCardProps) {
  if (!agreement) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Agreement</h3>
            <p className="text-xs text-slate-500">No agreement created yet</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => onAction('createAgreement')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Agreement
          </button>
        )}
      </div>
    )
  }

  const terms = (agreement.terms as Record<string, any>) || {}
  const status = agreement.status as string

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Agreement</h3>
            <p className="text-xs text-slate-500">Version {agreement.version}</p>
          </div>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Terms summary */}
      <dl className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Commission Rate</dt>
          <dd className="font-medium text-slate-700">{String(terms.commissionRatePercent ?? '—')}%</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Payout Schedule</dt>
          <dd className="font-medium text-slate-700">{String(terms.payoutSchedule ?? '—')}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Trial Days</dt>
          <dd className="font-medium text-slate-700">{terms.trialDaysForReferrals ?? '—'} days</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Exclusivity</dt>
          <dd className="font-medium text-slate-700">{terms.exclusivity ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Effective Date</dt>
          <dd className="font-medium text-slate-700">
            {agreement.effectiveAt ? new Date(agreement.effectiveAt).toLocaleDateString() : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Expires</dt>
          <dd className="font-medium text-slate-700">
            {agreement.expiresAt ? new Date(agreement.expiresAt).toLocaleDateString() : '—'}
          </dd>
        </div>
      </dl>

      {/* Signature status */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {agreement.signedAt ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-slate-600">
              Signed on {new Date(agreement.signedAt).toLocaleDateString()}
            </span>
          </>
        ) : (
          <>
            <PenTool className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Awaiting signature</span>
          </>
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {status === 'DRAFT' && (
            <button
              onClick={() => onAction('sendAgreement', { agreementId: agreement.id })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              Send for Signature
            </button>
          )}
          {status === 'SENT' && (
            <button
              onClick={() => onAction('signAgreement', { agreementId: agreement.id })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
            >
              <PenTool className="w-3.5 h-3.5" />
              Mark Signed
            </button>
          )}
          {status === 'SIGNED' && (
            <button
              onClick={() => onAction('activateAgreement', { agreementId: agreement.id })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Activate Agreement
            </button>
          )}
          {status === 'ACTIVE' && (
            <button
              onClick={() => onAction('amendAgreement', { agreementId: agreement.id, newTerms: agreement.terms })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-medium"
            >
              <History className="w-3.5 h-3.5" />
              Amend
            </button>
          )}
          {agreements.length > 1 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-500 text-xs">
              <History className="w-3.5 h-3.5" />
              {agreements.length} versions
            </span>
          )}
        </div>
      )}
    </div>
  )
}
