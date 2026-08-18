import React from 'react'
import Link from 'next/link'
import { LucideIcon, ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  children?: React.ReactNode
}

/**
 * EmptyState Component
 * 
 * Displays a helpful empty state when no data exists.
 * Guides users on what to do next instead of showing blank screens.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-6">{description}</p>
      
      {children}
      
      {(actionLabel && actionHref) && (
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          {(secondaryActionLabel && secondaryActionHref) && (
            <Link
              href={secondaryActionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
