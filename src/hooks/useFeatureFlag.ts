import { useEffect, useState } from 'react'

let cachedFlags: string[] | null = null
let fetchPromise: Promise<string[]> | null = null

async function fetchFlags(): Promise<string[]> {
  if (cachedFlags) return cachedFlags
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/features')
    .then(r => r.ok ? r.json() : { flags: [] })
    .then(data => {
      cachedFlags = data.flags || []
      fetchPromise = null
      return cachedFlags!
    })
    .catch(() => {
      fetchPromise = null
      return [] as string[]
    })

  return fetchPromise
}

export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetchFlags().then(flags => setEnabled(flags.includes(flagKey)))
  }, [flagKey])

  return enabled
}

export function useFeatureFlags(): string[] {
  const [flags, setFlags] = useState<string[]>([])

  useEffect(() => {
    fetchFlags().then(setFlags)
  }, [])

  return flags
}

export function invalidateFlagCache() {
  cachedFlags = null
  fetchPromise = null
}
