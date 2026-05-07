import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-slate-600 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-imboni-blue text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
