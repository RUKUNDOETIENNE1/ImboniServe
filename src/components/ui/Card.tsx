/**
 * Standardized Card Component
 * Provides consistent card styling across the application
 */

import { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'lg' | 'xl' | '2xl'
  padding?: '4' | '6' | '8' | '12'
  border?: boolean
  className?: string
  onClick?: () => void
}

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
}

const roundedClasses = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl'
}

const paddingClasses = {
  '4': 'p-4',
  '6': 'p-6',
  '8': 'p-8',
  '12': 'p-12'
}

export default function Card({
  children,
  shadow = 'sm',
  rounded = '2xl',
  padding = '6',
  border = true,
  className = '',
  onClick
}: CardProps) {
  const classes = [
    'bg-white',
    shadowClasses[shadow],
    roundedClasses[rounded],
    paddingClasses[padding],
    border && 'border border-slate-200/60',
    onClick && 'cursor-pointer hover:shadow-md transition-shadow',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-lg font-semibold text-slate-800 ${className}`}>
      {children}
    </h2>
  )
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-slate-500 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 ${className}`}>
      {children}
    </div>
  )
}
