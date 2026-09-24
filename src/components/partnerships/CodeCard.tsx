import { useState } from 'react'
import { Tag, Plus, Pause, Play, XCircle, Copy, Check, QrCode } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CodeCardProps {
  codes: any[]
  canManage: boolean
  onAction: (action: string, data?: Record<string, unknown>) => void
}

export default function CodeCard({ codes, canManage, onAction }: CodeCardProps) {
  const [showGenerate, setShowGenerate] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleGenerate = () => {
    if (!newCode.trim()) return
    onAction('generateCode', { code: newCode.toUpperCase() })
    setNewCode('')
    setShowGenerate(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
            <Tag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Founder Codes</h3>
            <p className="text-xs text-slate-500">
              {codes.length > 0 ? `${codes.length} code${codes.length > 1 ? 's' : ''} generated` : 'No codes yet'}
            </p>
          </div>
        </div>
        {canManage && !showGenerate && (
          <button
            onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate
          </button>
        )}
      </div>

      {/* Generate form */}
      {showGenerate && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <label className="block text-xs font-medium text-slate-700 mb-1">Code (2-8 letters + 0-3 digits)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g., ISIMBI30"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
              aria-label="New founder code"
            />
            <button
              onClick={handleGenerate}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              Generate
            </button>
            <button
              onClick={() => setShowGenerate(false)}
              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Codes list */}
      {codes.length === 0 && !showGenerate ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Generate founder codes to enable business referrals.
        </p>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => {
            const remaining = code.maxRedemptions
              ? code.maxRedemptions - code.redemptionCount
              : null

            return (
              <div key={code.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <QrCode className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-slate-700 truncate">{code.code}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{code.trialDays}d trial</span>
                      <span>{code.redemptionCount} redemptions</span>
                      {remaining !== null && (
                        <span className={remaining < 5 ? 'text-amber-600' : ''}>{remaining} remaining</span>
                      )}
                      {code.expiresAt && (
                        <span>exp {new Date(code.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={code.status} size="sm" />
                  <button
                    onClick={() => handleCopy(code.code)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                    aria-label={`Copy code ${code.code}`}
                  >
                    {copiedCode === code.code ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {canManage && code.status === 'ACTIVE' && (
                    <button
                      onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'PAUSED' })}
                      className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                      aria-label={`Pause code ${code.code}`}
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && code.status === 'PAUSED' && (
                    <button
                      onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'ACTIVE' })}
                      className="p-1.5 text-slate-400 hover:text-green-600 transition"
                      aria-label={`Resume code ${code.code}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && code.status !== 'REVOKED' && (
                    <button
                      onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'REVOKED' })}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      aria-label={`Revoke code ${code.code}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
