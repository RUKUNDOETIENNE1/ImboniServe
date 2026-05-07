import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Loader2 } from 'lucide-react'

type WeatherIconKey = 'sun' | 'cloud' | 'partly-cloudy' | 'rain' | 'storm' | 'snow' | 'fog'

interface WeatherState {
  locationLabel: string | null
  temperatureC: number | null
  condition: string | null
  icon: WeatherIconKey | null
  isDay: boolean | null
}

interface LiveWeatherClockProps {
  variant?: 'compact' | 'expanded'
  className?: string
  showLiveBadge?: boolean
}

function renderWeatherIcon(icon: WeatherIconKey | null, isDay: boolean | null, size: 'sm' | 'lg' = 'sm') {
  const base = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  const dayColor = 'text-amber-300'
  const nightColor = 'text-blue-200'
  const color = isDay === false ? nightColor : dayColor

  if (icon === 'sun') return <Sun className={`${base} ${color}`} />
  if (icon === 'rain') return <CloudRain className={`${base} ${color}`} />
  if (icon === 'storm') return <CloudLightning className={`${base} ${color}`} />
  if (icon === 'snow') return <Snowflake className={`${base} ${color}`} />
  if (icon === 'fog') return <CloudFog className={`${base} ${color}`} />
  if (icon === 'partly-cloudy') return <Sun className={`${base} ${color}`} />
  return <Cloud className={`${base} ${color}`} />
}

export default function LiveWeatherClock({
  variant = 'compact',
  className = '',
  showLiveBadge = true,
}: LiveWeatherClockProps) {
  const { t, locale } = useTranslation()
  const [now, setNow] = useState<Date>(() => new Date())
  const [mounted, setMounted] = useState(false)
  const [weather, setWeather] = useState<WeatherState>({
    locationLabel: null,
    temperatureC: null,
    condition: null,
    icon: null,
    isDay: null,
  })
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let isMounted = true
    let lastCoords: { lat: number | null; lon: number | null } = { lat: null, lon: null }
    let intervalId: number | undefined

    const fetchWeather = async (lat: number | null, lon: number | null) => {
      try {
        if (!isMounted) return
        setWeatherLoading(true)
        setWeatherError(false)
        const params = new URLSearchParams()
        if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
          params.set('lat', String(lat))
          params.set('lon', String(lon))
        }
        const url = `/api/weather/current${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Failed to fetch weather')
        }
        const data = await res.json()
        if (!isMounted) return
        setWeather({
          locationLabel: typeof data.locationLabel === 'string' ? data.locationLabel : null,
          temperatureC:
            typeof data.temperatureC === 'number' && Number.isFinite(data.temperatureC)
              ? Math.round(data.temperatureC)
              : null,
          condition: typeof data.condition === 'string' ? data.condition : null,
          icon: (data.icon as WeatherIconKey) || null,
          isDay: typeof data.isDay === 'boolean' ? data.isDay : null,
        })
        setWeatherLoading(false)
      } catch (error) {
        if (!isMounted) return
        setWeatherError(true)
        setWeatherLoading(false)
      }
    }

    const bootstrap = () => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        fetchWeather(null, null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return
          lastCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          fetchWeather(lastCoords.lat, lastCoords.lon)
        },
        () => {
          fetchWeather(null, null)
        },
        {
          maximumAge: 10 * 60 * 1000,
          timeout: 8000,
        }
      )
    }

    bootstrap()

    if (typeof window !== 'undefined') {
      intervalId = window.setInterval(() => {
        fetchWeather(lastCoords.lat, lastCoords.lon)
      }, 10 * 60 * 1000)
    }

    return () => {
      isMounted = false
      if (typeof window !== 'undefined' && intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  const is24h = locale === 'fr' || locale === 'rw'
  const timeShort = mounted
    ? now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24h,
        ...(is24h ? { hourCycle: 'h23' as const } : {}),
      })
    : ''
  const timeFull = mounted
    ? now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24h,
        ...(is24h ? { hourCycle: 'h23' as const } : {}),
      })
    : ''
  const dateLabel = mounted
    ? now.toLocaleDateString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
    : ''

  const rawLocationLabel = weather.locationLabel || t('dashboard.location.default', 'Kigali, Rwanda')

  // Avoid duplicated country segments like "Kigali, Rwanda, Rwanda"
  const locationLabel = (() => {
    const parts = rawLocationLabel.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length <= 1) return rawLocationLabel
    const deduped: string[] = []
    for (const part of parts) {
      if (!deduped.some(p => p.toLowerCase() === part.toLowerCase())) {
        deduped.push(part)
      }
    }
    return deduped.join(', ')
  })()
  const temperatureText =
    weather.temperatureC != null ? `${weather.temperatureC}°C` : weatherLoading ? t('dashboard.loading', '...') : '--°C'

  const liveLabel = t('dashboard.live', 'Live')

  const liveBadge =
    showLiveBadge && (
      <div className="flex items-center gap-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-imboni-gold/80 opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-imboni-gold shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-imboni-gold">
          {liveLabel}
        </span>
      </div>
    )

  if (variant === 'expanded') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-amber-500/25 ${className}`}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-24 w-40 bg-gradient-to-tr from-amber-500/15 to-transparent" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-800/70 shadow-inner">
              {weatherLoading && !weather.icon ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
              ) : (
                renderWeatherIcon(weather.icon, weather.isDay, 'lg')
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-50">
                <span className="truncate max-w-[180px] sm:max-w-[220px]" suppressHydrationWarning>
                  {locationLabel}
                </span>
                <span className="text-imboni-gold" suppressHydrationWarning>
                  {temperatureText}
                </span>
                {weather.condition && (
                  <span className="hidden text-xs font-normal text-slate-300/90 sm:inline" suppressHydrationWarning>
                    {weather.condition}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300/90">
                {liveBadge}
                <span className="h-1 w-1 rounded-full bg-slate-500/70" />
                <span suppressHydrationWarning>{dateLabel || '\u00a0'}</span>
                <span className="h-1 w-1 rounded-full bg-slate-500/70" />
                <span className="font-mono tabular-nums" suppressHydrationWarning>
                  {timeFull || '\u00a0'}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-1 text-right text-[11px] text-slate-300/80 sm:flex">
            <span className="rounded-full bg-imboni-gold/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-imboni-gold">
              {t('dashboard.operations_center', 'Ops Center')}
            </span>
            <span className="text-[10px] text-slate-400">
              {t('dashboard.environment_label', 'Environment: Live')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative flex items-center gap-2.5 rounded-full border border-primary-300/60 bg-gradient-to-r from-primary-900/95 via-primary-800/95 to-primary-900/95 px-3 py-1 text-[11px] text-slate-100 shadow-lg shadow-black/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-imboni-gold/70 hover:shadow-xl hover:shadow-black/70 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary-300/60 bg-primary-900/80 shadow-inner">
          {weatherLoading && !weather.icon ? (
            <Loader2 className="h-4 w-4 animate-spin text-imboni-gold" />
          ) : (
            renderWeatherIcon(weather.icon, weather.isDay, 'sm')
          )}
        </div>
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1 font-medium text-slate-100">
            <span className="max-w-[120px] truncate md:max-w-[160px]" suppressHydrationWarning>
              {locationLabel}
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[10px] tabular-nums text-imboni-gold" suppressHydrationWarning>
              {temperatureText}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-300/90">
            {liveBadge}
            <span className="hidden h-1 w-1 rounded-full bg-slate-500/70 sm:inline" />
            <span className="hidden sm:inline" suppressHydrationWarning>
              {dateLabel || '\u00a0'}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-500/70 sm:inline" />
            <span className="font-mono tabular-nums" suppressHydrationWarning>
              {timeShort || '\u00a0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
