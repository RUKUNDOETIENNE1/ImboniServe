type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  service?: string
  businessId?: string
  userId?: string
  requestId?: string
  [key: string]: unknown
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry)
  }
  const prefix: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }
  const ts = entry.timestamp.split('T')[1]?.slice(0, 8) ?? entry.timestamp
  const ctx = entry.businessId ? ` [biz:${entry.businessId.slice(-6)}]` : ''
  return `${prefix[entry.level]} [${ts}]${ctx} ${entry.message}`
}

class Logger {
  private service: string

  constructor(service = 'imboni') {
    this.service = service
  }

  private log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...meta,
    }
    const formatted = formatLog(entry)
    if (level === 'error') {
      console.error(formatted)
    } else if (level === 'warn') {
      console.warn(formatted)
    } else {
      console.log(formatted)
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, meta)
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta)
  }

  child(meta: Record<string, unknown>): Logger {
    const child = new Logger(this.service)
    const originalLog = child['log'].bind(child)
    child['log'] = (level: LogLevel, message: string, extraMeta: Record<string, unknown> = {}) => {
      originalLog(level, message, { ...meta, ...extraMeta })
    }
    return child
  }
}

export const logger = new Logger('imboni-serve')
export { Logger }
