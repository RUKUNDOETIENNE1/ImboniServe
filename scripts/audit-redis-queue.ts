/**
 * Phase 0.8B.3 — Redis & Queue Governance Audit
 * 
 * Purpose: Verify Redis and BullMQ queue configuration
 * - Redis URL
 * - TLS enabled
 * - Certificate validation
 * - Queue names
 * - BullMQ workers
 * - Dead letter handling
 * - Retry policies
 * - Alerting assumptions
 * 
 * This script is READ-ONLY and makes no modifications.
 */

import * as fs from 'fs'
import * as path from 'path'

function globSync(pattern: string, options: { cwd: string; ignore?: string[] }): string[] {
  const results: string[] = []
  
  function walk(dir: string) {
    try {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          if (options.ignore?.some(ig => filePath.includes(ig.replace(/\*\*/g, '')))) {
            continue
          }
          walk(filePath)
        } else if (stat.isFile()) {
          const ext = path.extname(file)
          if (['.ts', '.tsx'].includes(ext)) {
            results.push(filePath)
          }
        }
      }
    } catch (err) {
      // Skip inaccessible directories
    }
  }
  
  walk(path.join(options.cwd, 'src'))
  return results
}

interface QueueConfig {
  name: string
  file: string
  hasWorker: boolean
  hasDeadLetterQueue: boolean
  retryPolicy?: {
    attempts?: number
    backoff?: string
  }
  hasAlerting: boolean
}

interface RedisAuditReport {
  discoveryDate: string
  redis: {
    urlConfigured: boolean
    isTLS: boolean
    certificateValidation: 'enabled' | 'disabled' | 'unknown'
    provider: 'upstash' | 'local' | 'unknown'
  }
  queues: QueueConfig[]
  workers: Array<{
    file: string
    queues: string[]
    hasErrorHandling: boolean
    hasLogging: boolean
  }>
  summary: {
    totalQueues: number
    totalWorkers: number
    queuesWithWorkers: number
    queuesWithDLQ: number
    queuesWithRetry: number
    queuesWithAlerting: number
  }
  securityFindings: {
    tlsEnabled: boolean
    certificateValidationEnabled: boolean
    rejectUnauthorized: boolean
  }
}

function parseEnvFile(filePath: string): Map<string, string> {
  const vars = new Map<string, string>()
  
  if (!fs.existsSync(filePath)) {
    return vars
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (match) {
        vars.set(match[1], match[2].replace(/^["']|["']$/g, ''))
      }
    }
  })
  
  return vars
}

function auditRedisConfig(envVars: Map<string, string>): RedisAuditReport['redis'] {
  console.log('🔍 Auditing Redis configuration...')
  
  const redisUrl = envVars.get('REDIS_URL') || ''
  const urlConfigured = redisUrl.length > 0
  const isTLS = redisUrl.startsWith('rediss://')
  const provider = redisUrl.includes('upstash') ? 'upstash' 
    : redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1') ? 'local'
    : 'unknown'
  
  // Check for certificate validation in code
  let certificateValidation: 'enabled' | 'disabled' | 'unknown' = 'unknown'
  
  const queueFiles = globSync('src/lib/die/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of queueFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    if (content.includes('rejectUnauthorized: true')) {
      certificateValidation = 'enabled'
      break
    } else if (content.includes('rejectUnauthorized: false')) {
      certificateValidation = 'disabled'
      break
    }
  }
  
  return {
    urlConfigured,
    isTLS,
    certificateValidation,
    provider
  }
}

function auditQueues(): QueueConfig[] {
  console.log('🔍 Auditing BullMQ queues...')
  
  const queues: QueueConfig[] = []
  
  // Find queue definitions
  const queueFiles = globSync('src/lib/die/queue/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of queueFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    
    // Look for queue names
    const queueNameMatches = content.matchAll(/new Queue\(['"]([^'"]+)['"]/g)
    for (const match of queueNameMatches) {
      const queueName = match[1]
      
      const hasDeadLetterQueue = content.includes('deadLetterQueue') || 
                                 content.includes('failed-')
      
      const retryMatch = content.match(/attempts:\s*(\d+)/)
      const backoffMatch = content.match(/backoff:\s*['"]([^'"]+)['"]/)
      
      const retryPolicy = retryMatch || backoffMatch ? {
        attempts: retryMatch ? parseInt(retryMatch[1]) : undefined,
        backoff: backoffMatch ? backoffMatch[1] : undefined
      } : undefined
      
      const hasAlerting = content.includes('alert') || 
                         content.includes('slack') ||
                         content.includes('email')
      
      queues.push({
        name: queueName,
        file: file.replace(/\\/g, '/'),
        hasWorker: false, // Will be updated later
        hasDeadLetterQueue,
        retryPolicy,
        hasAlerting
      })
    }
  }
  
  return queues
}

function auditWorkers(): RedisAuditReport['workers'] {
  console.log('🔍 Auditing BullMQ workers...')
  
  const workers: RedisAuditReport['workers'] = []
  
  const workerFiles = globSync('src/lib/die/**/*worker*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of workerFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    
    const queueMatches = content.matchAll(/new Worker\(['"]([^'"]+)['"]/g)
    const queues = Array.from(queueMatches).map(m => m[1])
    
    const hasErrorHandling = content.includes('try') && content.includes('catch')
    const hasLogging = content.includes('logger.') || content.includes('console.')
    
    workers.push({
      file: file.replace(/\\/g, '/'),
      queues,
      hasErrorHandling,
      hasLogging
    })
  }
  
  return workers
}

function auditSecuritySettings(): RedisAuditReport['securityFindings'] {
  console.log('🔍 Auditing Redis security settings...')
  
  let tlsEnabled = false
  let certificateValidationEnabled = false
  let rejectUnauthorized = false
  
  const files = globSync('src/lib/die/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    if (content.includes('tls:')) {
      tlsEnabled = true
    }
    
    if (content.includes('rejectUnauthorized: true')) {
      certificateValidationEnabled = true
      rejectUnauthorized = true
    }
  }
  
  return {
    tlsEnabled,
    certificateValidationEnabled,
    rejectUnauthorized
  }
}

function generateReport(): RedisAuditReport {
  console.log('🚀 Starting Redis & Queue Governance Audit...\n')
  
  const envVars = parseEnvFile('.env')
  
  const redis = auditRedisConfig(envVars)
  const queues = auditQueues()
  const workers = auditWorkers()
  const securityFindings = auditSecuritySettings()
  
  // Update queue worker status
  const workerQueueNames = new Set(workers.flatMap(w => w.queues))
  queues.forEach(q => {
    q.hasWorker = workerQueueNames.has(q.name)
  })
  
  const report: RedisAuditReport = {
    discoveryDate: new Date().toISOString(),
    redis,
    queues,
    workers,
    summary: {
      totalQueues: queues.length,
      totalWorkers: workers.length,
      queuesWithWorkers: queues.filter(q => q.hasWorker).length,
      queuesWithDLQ: queues.filter(q => q.hasDeadLetterQueue).length,
      queuesWithRetry: queues.filter(q => q.retryPolicy).length,
      queuesWithAlerting: queues.filter(q => q.hasAlerting).length
    },
    securityFindings
  }
  
  console.log('\n📊 Audit Summary:')
  console.log(`   Redis URL Configured: ${redis.urlConfigured}`)
  console.log(`   TLS Enabled: ${redis.isTLS}`)
  console.log(`   Certificate Validation: ${redis.certificateValidation}`)
  console.log(`   Provider: ${redis.provider}`)
  console.log(`   Total Queues: ${report.summary.totalQueues}`)
  console.log(`   Total Workers: ${report.summary.totalWorkers}`)
  console.log(`   Queues with Workers: ${report.summary.queuesWithWorkers}`)
  console.log(`   Queues with DLQ: ${report.summary.queuesWithDLQ}`)
  console.log(`   Queues with Retry: ${report.summary.queuesWithRetry}`)
  console.log(`   Queues with Alerting: ${report.summary.queuesWithAlerting}`)
  
  console.log('\n🔒 Security Findings:')
  console.log(`   TLS Enabled: ${securityFindings.tlsEnabled}`)
  console.log(`   Certificate Validation: ${securityFindings.certificateValidationEnabled}`)
  console.log(`   rejectUnauthorized: ${securityFindings.rejectUnauthorized}`)
  
  console.log('\n💾 Saving report to redis-governance.json...')
  fs.writeFileSync(
    'redis-governance.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report saved successfully!')
  
  return report
}

// Run audit
try {
  generateReport()
  console.log('\n✅ Redis & Queue Governance Audit Complete!')
  console.log('\n🎯 Next step: Review redis-governance.json and generate REDIS_GOVERNANCE_REPORT.md')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Audit Failed:', error)
  process.exit(1)
}
