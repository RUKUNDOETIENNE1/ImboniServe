import React from 'react'
import { useTranslation } from '@/lib/i18n'
import { Clock } from 'lucide-react'

interface LiveClockProps {
  showDate?: boolean
  className?: string
}

export default function LiveClock({ showDate = true, className = '' }: LiveClockProps) {
  const { locale } = useTranslation()
  const [now, setNow] = React.useState<Date>(() => new Date())
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Use 12h for English (with AM/PM), 24h for French and Kinyarwanda
  const is24h = locale === 'fr' || locale === 'rw'
  const time = mounted
    ? now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24h,
        ...(is24h ? { hourCycle: 'h23' as const } : {}),
      })
    : ''

  const date = mounted && showDate
    ? now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className={`px-3 py-2 rounded-xl bg-white/80 dark:bg-gray-800/90 backdrop-blur border border-slate-200/60 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="flex items-center justify-center gap-2 text-slate-900 dark:text-white leading-tight">
        <Clock className="w-4 h-4 text-slate-500 dark:text-gray-300" aria-hidden="true" />
        <span className="font-mono text-base tabular-nums" suppressHydrationWarning>{time || ' '}</span>
      </div>
      {showDate && (
        <div className="mt-0.5 text-center text-[11px] text-slate-600 dark:text-gray-300 opacity-90" suppressHydrationWarning>
          {date}
        </div>
      )}
    </div>
  )
}
