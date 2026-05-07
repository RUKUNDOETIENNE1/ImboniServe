import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

interface OpenMeteoResponse {
  latitude: number
  longitude: number
  timezone: string
  current_weather?: {
    temperature: number
    weathercode: number
    is_day: 0 | 1
  }
}

interface OpenWeatherResponse {
  name?: string
  sys?: { country?: string }
  main?: { temp?: number }
  weather?: { id: number; main?: string; description?: string }[]
}

function getCountryName(code: string | null | undefined): string {
  if (!code) return 'Rwanda'
  const upper = code.toUpperCase()
  const map: Record<string, string> = {
    RW: 'Rwanda',
    KE: 'Kenya',
    TZ: 'Tanzania',
    UG: 'Uganda',
    US: 'United States',
    GB: 'United Kingdom',
    FR: 'France',
  }
  return map[upper] || upper
}

function mapWeatherCode(code: number): { condition: string; icon: 'sun' | 'cloud' | 'partly-cloudy' | 'rain' | 'storm' | 'snow' | 'fog' } {
  if (code === 0) return { condition: 'Clear sky', icon: 'sun' }
  if ([1, 2].includes(code)) return { condition: 'Mostly clear', icon: 'partly-cloudy' }
  if (code === 3) return { condition: 'Cloudy', icon: 'cloud' }
  if ([45, 48].includes(code)) return { condition: 'Foggy', icon: 'fog' }
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: 'Drizzle', icon: 'rain' }
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { condition: 'Rain', icon: 'rain' }
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snow', icon: 'snow' }
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', icon: 'storm' }
  return { condition: 'Cloudy', icon: 'cloud' }
}

function mapOpenWeatherCode(id: number): { condition: string; icon: 'sun' | 'cloud' | 'partly-cloudy' | 'rain' | 'storm' | 'snow' | 'fog' } {
  if (id >= 200 && id < 300) return { condition: 'Thunderstorm', icon: 'storm' }
  if (id >= 300 && id < 600) return { condition: 'Rain', icon: 'rain' }
  if (id >= 600 && id < 700) return { condition: 'Snow', icon: 'snow' }
  if (id >= 700 && id < 800) return { condition: 'Foggy', icon: 'fog' }
  if (id === 800) return { condition: 'Clear sky', icon: 'sun' }
  if (id === 801 || id === 802) return { condition: 'Partly cloudy', icon: 'partly-cloudy' }
  if (id === 803 || id === 804) return { condition: 'Cloudy', icon: 'cloud' }
  return { condition: 'Cloudy', icon: 'cloud' }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { businessId } = ctx

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        timezone: true,
      },
    })

    if (!business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    const city = (business.city || 'Kigali').trim()
    const countryCode = (business.country || 'RW').trim().toUpperCase()
    const timezone = business.timezone || 'Africa/Kigali'

    const qLat = typeof req.query.lat === 'string' ? Number.parseFloat(req.query.lat) : NaN
    const qLon = typeof req.query.lon === 'string' ? Number.parseFloat(req.query.lon) : NaN

    let latitude = Number.isFinite(qLat) ? qLat : business.latitude ?? null
    let longitude = Number.isFinite(qLon) ? qLon : business.longitude ?? null

    if (latitude == null || longitude == null) {
      const key = `${city},${countryCode}`.toLowerCase()
      const fallbackCoords: Record<string, { lat: number; lon: number }> = {
        'kigali,rw': { lat: -1.9579, lon: 30.1127 },
      }
      const fb = fallbackCoords[key]
      if (fb) {
        latitude = fb.lat
        longitude = fb.lon
      }
    }

    let weatherPayload: {
      locationLabel: string
      temperatureC: number | null
      condition: string | null
      icon: 'sun' | 'cloud' | 'partly-cloudy' | 'rain' | 'storm' | 'snow' | 'fog'
      isDay: boolean | null
      timezone: string
    } = {
      locationLabel: `${city}, ${getCountryName(countryCode)}`,
      temperatureC: null,
      condition: null,
      icon: 'cloud',
      isDay: null,
      timezone,
    }

    if (latitude != null && longitude != null) {
      try {
        const provider = (process.env.WEATHER_PROVIDER || 'open-meteo').toLowerCase()
        const openWeatherKey = process.env.OPENWEATHER_API_KEY

        const fetchFromOpenMeteo = async () => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
            latitude,
          )}&longitude=${encodeURIComponent(longitude)}&current_weather=true&timezone=${encodeURIComponent(timezone)}`

          const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
          if (resp.ok) {
            const data = (await resp.json()) as OpenMeteoResponse
            if (data.current_weather) {
              const mapped = mapWeatherCode(data.current_weather.weathercode)
              weatherPayload = {
                locationLabel: `${city}, ${getCountryName(countryCode)}`,
                temperatureC: data.current_weather.temperature,
                condition: mapped.condition,
                icon: mapped.icon,
                isDay: data.current_weather.is_day === 1,
                timezone: data.timezone || timezone,
              }
            }
          }
        }

        if (provider === 'openweathermap' && openWeatherKey) {
          const owUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
            latitude,
          )}&lon=${encodeURIComponent(longitude)}&units=metric&appid=${encodeURIComponent(openWeatherKey)}`
          const owResp = await fetch(owUrl)
          if (owResp.ok) {
            const owData = (await owResp.json()) as OpenWeatherResponse
            const owWeather = owData.weather && owData.weather[0]
            const owId = owWeather?.id ?? 800
            const mapped = mapOpenWeatherCode(owId)
            const labelCity = (owData.name || city).trim()
            const labelCountryCode = (owData.sys?.country || countryCode).trim().toUpperCase()
            weatherPayload = {
              locationLabel: `${labelCity}, ${getCountryName(labelCountryCode)}`,
              temperatureC: typeof owData.main?.temp === 'number' ? owData.main.temp : null,
              condition: owWeather?.description || mapped.condition,
              icon: mapped.icon,
              isDay: owId >= 800 && owId < 900 ? true : null,
              timezone,
            }
          } else {
            await fetchFromOpenMeteo()
          }
        } else {
          await fetchFromOpenMeteo()
        }
      } catch (error) {
        console.error('Weather provider error:', error)
      }
    }

    return res.status(200).json(weatherPayload)
  } catch (error) {
    console.error('Weather API error:', error)
    return res.status(200).json({
      locationLabel: 'Kigali, Rwanda',
      temperatureC: 24,
      condition: 'Clear sky',
      icon: 'sun',
      isDay: true,
      timezone: 'Africa/Kigali',
    })
  }
}

export default handler
