type CacheEntry<T> = {
  value: T
  expiresAt: number
}

type CacheStore = Map<string, CacheEntry<unknown>>

const globalScope = globalThis as typeof globalThis & { __diePluginCache?: CacheStore }

if (!globalScope.__diePluginCache) {
  globalScope.__diePluginCache = new Map()
}

const cacheStore = globalScope.__diePluginCache

function buildKey(namespace: string, key: string): string {
  return `${namespace}:${key}`
}

export function getCachedValue<T>(namespace: string, key: string): T | undefined {
  const cacheKey = buildKey(namespace, key)
  const entry = cacheStore.get(cacheKey)
  if (!entry) {
    return undefined
  }

  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(cacheKey)
    return undefined
  }

  return entry.value as T
}

export function setCachedValue<T>(namespace: string, key: string, value: T, ttlMs: number): void {
  if (ttlMs <= 0) return
  const cacheKey = buildKey(namespace, key)
  cacheStore.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

export function deleteCachedValue(namespace: string, key: string): void {
  cacheStore.delete(buildKey(namespace, key))
}

export function clearNamespace(namespace: string): void {
  const prefix = `${namespace}:`
  for (const cacheKey of cacheStore.keys()) {
    if (cacheKey.startsWith(prefix)) {
      cacheStore.delete(cacheKey)
    }
  }
}
