/**
 * FounderCodeCard — Displays a single Founder Code with stats and sharing actions.
 */

import { Tag, Copy, Share2, QrCode, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useCurrency } from '@/contexts/LocaleContext'

export interface FounderCodeData {
  id: string
  code: string
  status: string
  trialDays: number
  expiresAt: string | null
  maxRedemptions: number | null
  redemptionCount: number
  label: string | null
  notes: string | null
  campaign: { id: string; name: string } | null
  businessCount: number
  activeTrials: number
  subscribers: number
  revenueCents: number
  conversionRate: number
}

interface FounderCodeCardProps {
  code: FounderCodeData
  shareUrl?: string
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
  REVOKED: 'bg-red-100 text-red-600',
  EXHAUSTED: 'bg-blue-100 text-blue-700',
}

export default function FounderCodeCard({ code, shareUrl }: FounderCodeCardProps) {
  const { currency } = useCurrency()
  const formatCurrency = (cents: number): string =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const url = shareUrl || `${window.location.origin}/?ref=${code.code}`
    if (navigator.share) {
      navigator.share({ title: 'Join ImboniServe', url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleQR = () => {
    const url = shareUrl || `${window.location.origin}/?ref=${code.code}`
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-slate-800 text-lg">{code.code}</h3>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-600"
                aria-label={`Copy code ${code.code}`}
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            {code.label && <p className="text-xs text-slate-500">{code.label}</p>}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[code.status] || 'bg-slate-100 text-slate-600'}`}>
          {code.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-2 rounded-lg bg-slate-50">
          <div className="flex items-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span className="text-xs text-slate-500">Businesses</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{code.businessCount}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-50">
          <div className="flex items-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span className="text-xs text-slate-500">Active Trials</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{code.activeTrials}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-50">
          <div className="flex items-center gap-1 mb-0.5">
            <CheckCircle className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span className="text-xs text-slate-500">Subscribers</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{code.subscribers}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-50">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span className="text-xs text-slate-500">Revenue</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(code.revenueCents)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        {code.campaign && <span>Campaign: {code.campaign.name}</span>}
        {code.trialDays > 0 && <span>• {code.trialDays} trial days</span>}
        {code.expiresAt && <span>• Expires {new Date(code.expiresAt).toLocaleDateString()}</span>}
        {code.maxRedemptions && <span>• {code.redemptionCount}/{code.maxRedemptions} used</span>}
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100"
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share
        </button>
        <button
          onClick={handleQR}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
        >
          <QrCode className="w-3.5 h-3.5" aria-hidden="true" /> QR Code
        </button>
      </div>
    </div>
  )
}
