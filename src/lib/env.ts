/**
 * Environment Variable Helper
 * Provides type-safe access to environment variables with fallbacks
 */

/**
 * Get string environment variable
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get optional string environment variable
 */
export function getEnvOptional(key: string, fallback: string = ''): string {
  return process.env[key] ?? fallback
}

/**
 * Get integer environment variable
 */
export function getEnvInt(key: string, fallback?: number): number {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required environment variable: ${key}`)
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`)
  }
  return parsed
}

/**
 * Get optional integer environment variable
 */
export function getEnvIntOptional(key: string, fallback: number = 0): number {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Get float environment variable
 */
export function getEnvFloat(key: string, fallback?: number): number {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required environment variable: ${key}`)
  }
  const parsed = parseFloat(value)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`)
  }
  return parsed
}

/**
 * Get optional float environment variable
 */
export function getEnvFloatOptional(key: string, fallback: number = 0): number {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Get boolean environment variable
 */
export function getEnvBool(key: string, fallback?: boolean): boolean {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get optional boolean environment variable
 */
export function getEnvBoolOptional(key: string, fallback: boolean = false): boolean {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get array environment variable (comma-separated)
 */
export function getEnvArray(key: string, fallback?: string[]): string[] {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

/**
 * Get optional array environment variable (comma-separated)
 */
export function getEnvArrayOptional(key: string, fallback: string[] = []): string[] {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

/**
 * Check if environment variable is set
 */
export function hasEnv(key: string): boolean {
  const value = process.env[key]
  return value !== undefined && value !== ''
}

/**
 * Get environment name (development, production, test)
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV || 'development'
  if (env === 'production' || env === 'test') return env
  return 'development'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvironment() === 'test'
}
