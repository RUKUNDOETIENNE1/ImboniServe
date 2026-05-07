/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 * Prevents runtime crashes due to missing configuration
 */

interface EnvConfig {
  required: string[]
  optional: string[]
}

const envConfig: EnvConfig = {
  required: [
    // Database
    'DATABASE_URL',
    'DIRECT_URL',
    
    // Authentication
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    
    // IremboPay Payment Gateway (Primary)
    'IREMBO_PUBLIC_KEY',
    'IREMBO_SECRET_KEY',
    'IREMBO_PAYMENT_ACCOUNT',
    'IREMBO_PAYMENT_ITEM_CODE',
    'IREMBO_API_BASE',
  ],
  optional: [
    // OpenAI (AI features)
    'OPENAI_API_KEY',
    
    // WhatsApp
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_WHATSAPP_NUMBER',
    'WHATSAPP_CLOUD_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    
    // Pusher (Real-time)
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER',
    'NEXT_PUBLIC_PUSHER_KEY',
    'NEXT_PUBLIC_PUSHER_CLUSTER',
    
    // Redis (Rate limiting & caching)
    'REDIS_URL',
    
    // Monitoring
    'SENTRY_DSN',
    
    // Storage
    'SUPABASE_STORAGE_URL',
    'SUPABASE_STORAGE_KEY',
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_CREDENTIALS_JSON',
  ]
}

export class EnvValidationError extends Error {
  constructor(message: string, public missingVars: string[]) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

/**
 * Validates all required environment variables
 * @throws {EnvValidationError} if any required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const key of envConfig.required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // Check optional but recommended variables
  for (const key of envConfig.optional) {
    if (!process.env[key]) {
      warnings.push(key)
    }
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`
    throw new EnvValidationError(message, missing)
  }

  // Log warnings for missing optional variables (only in development)
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Missing optional environment variables:')
    warnings.forEach(v => console.warn(`  - ${v}`))
    console.warn('\nSome features may be disabled.\n')
  }

  // Validate specific formats
  validateSpecificFormats()

  console.log('✅ Environment variables validated successfully')
}

/**
 * Validates specific environment variable formats
 */
function validateSpecificFormats(): void {
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    throw new Error('NEXTAUTH_URL must be a valid HTTP/HTTPS URL')
  }

  // Validate NEXTAUTH_SECRET length (should be at least 32 characters)
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long for security')
  }

  // Validate IREMBO_API_BASE format
  if (process.env.IREMBO_API_BASE && !process.env.IREMBO_API_BASE.startsWith('http')) {
    throw new Error('IREMBO_API_BASE must be a valid HTTP/HTTPS URL')
  }

  // Validate Redis URL format if provided
  if (process.env.REDIS_URL && !/^rediss?:\/\//.test(process.env.REDIS_URL)) {
    console.warn('⚠️  REDIS_URL should start with redis:// or rediss:// for proper connection')
  }
}

/**
 * Gets a required environment variable or throws an error
 * Use this in services to ensure type safety
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}
