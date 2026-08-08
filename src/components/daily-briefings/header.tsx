/**
 * Daily Briefings™ - Header Component
 */

'use client'

import { CheckCircle, ThumbsUp, AlertCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { BriefingHeaderDisplay } from '@/lib/daily-briefings/types'

interface Props {
  header: BriefingHeaderDisplay
}

export function BriefingHeader({ header }: Props) {
  const icons = {
    CheckCircle,
    ThumbsUp,
    AlertCircle,
    AlertTriangle,
    XCircle,
  }

  const Icon = icons[header.statusIcon as keyof typeof icons] || CheckCircle

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{header.greeting}</h2>
          <p className="text-lg text-gray-600 mt-1">{header.date}</p>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{header.businessName}</span>
            </p>
            <p className="text-sm text-gray-500">
              Generated at {header.generatedTime} • {header.reportingPeriod}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${header.statusColor}`} />
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Overall Status</p>
            <p className={`text-lg font-semibold ${header.statusColor}`}>
              {header.statusMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
