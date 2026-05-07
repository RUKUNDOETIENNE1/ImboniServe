import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-slate-200'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton patterns
export const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    ))}
  </div>
)

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="circular" width={40} height={40} />
    </div>
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="rectangular" width="100%" height={100} />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width={100} height={36} />
      <Skeleton variant="rectangular" width={100} height={36} />
    </div>
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton variant="text" width="30%" height={32} />
      <Skeleton variant="text" width="50%" height={20} />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="50%" />
        </div>
      ))}
    </div>

    {/* Chart */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <Skeleton variant="text" width="30%" height={24} className="mb-4" />
      <Skeleton variant="rectangular" width="100%" height={300} />
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <Skeleton variant="text" width="30%" height={24} className="mb-4" />
      <TableSkeleton />
    </div>
  </div>
)

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    ))}
  </div>
)
