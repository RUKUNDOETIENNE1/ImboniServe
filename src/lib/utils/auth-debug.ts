import crypto from 'crypto'

type AuthDebugStatus = 'start' | 'success' | 'fail'

const AUTH_DEBUG_ENABLED = process.env.AUTH_DEBUG === 'true'

function shouldLog(requestId?: string | null): boolean {
  return AUTH_DEBUG_ENABLED || Boolean(requestId)
}

export function logAuthDebug(requestId: string | null | undefined, step: string, status: AuthDebugStatus, meta?: Record<string, unknown>): void {
  if (!shouldLog(requestId)) return

  const payload = {
    ts: new Date().toISOString(),
    requestId: requestId ?? 'n/a',
    step,
    status,
    ...(meta ?? {}),
  }

  console.log('[auth-debug]', JSON.stringify(payload))
}

export function hashIdentifier(value: string | null | undefined): string | null {
  if (!value) return null
  return crypto.createHash('sha256').update(value.toLowerCase()).digest('hex').slice(0, 12)
}

export function redactedEmail(value: string | null | undefined): string | null {
  if (!value) return null
  const [user, domain] = value.split('@')
  if (!domain) return hashIdentifier(value)
  return `${user.slice(0, 2)}***@${domain}`
}
