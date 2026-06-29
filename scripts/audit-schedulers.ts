/**
 * Phase 0.8B.4 — Cron & Watchdog Governance Audit
 * 
 * Purpose: Inventory all scheduled jobs and watchdog processes
 * - Cron jobs
 * - Scheduled jobs
 * - Reconciliation jobs
 * - Watchdog jobs
 * - Execution method (Vercel Cron, Node Cron, External)
 * - Expected vs actual frequency
 * - Risk level
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

interface ScheduledJob {
  name: string
  file: string
  type: 'cron' | 'watchdog' | 'reconciliation' | 'cleanup' | 'unknown'
  executionMethod: 'vercel_cron' | 'node_cron' | 'bullmq' | 'unknown'
  schedule?: string
  expectedFrequency?: string
  hasErrorHandling: boolean
  hasLogging: boolean
  hasAlerting: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface SchedulerAuditReport {
  discoveryDate: string
  cronSecret: {
    configured: boolean
    usedInCode: boolean
  }
  cronWorker: {
    enabled: boolean
    mode: 'vercel' | 'self_hosted' | 'unknown'
  }
  jobs: ScheduledJob[]
  summary: {
    totalJobs: number
    verc elCronJobs: number
    nodeCronJobs: number
    bullmqJobs: number
    unknownJobs: number
    jobsWithErrorHandling: number
    jobsWithLogging: number
    jobsWithAlerting: number
    criticalJobs: number
    highRiskJobs: number
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

function auditVercelCronJobs(): ScheduledJob[] {
  console.log('🔍 Auditing Vercel Cron jobs...')
  
  const jobs: ScheduledJob[] = []
  
  // Check vercel.json for cron configuration
  if (fs.existsSync('vercel.json')) {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'))
    
    if (vercelConfig.crons) {
      for (const cron of vercelConfig.crons) {
        jobs.push({
          name: cron.path || 'Unknown',
          file: 'vercel.json',
          type: 'cron',
          executionMethod: 'vercel_cron',
          schedule: cron.schedule,
          expectedFrequency: cron.schedule,
          hasErrorHandling: false, // Will check endpoint
          hasLogging: false,
          hasAlerting: false,
          riskLevel: 'medium'
        })
      }
    }
  }
  
  // Find cron API endpoints
  const cronFiles = globSync('src/pages/api/cron/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of cronFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const name = file.split('/').pop()?.replace('.ts', '') || 'Unknown'
    
    const hasErrorHandling = content.includes('try') && content.includes('catch')
    const hasLogging = content.includes('logger.') || content.includes('console.')
    const hasAlerting = content.includes('alert') || content.includes('slack')
    
    // Determine risk level based on job type
    let riskLevel: ScheduledJob['riskLevel'] = 'medium'
    let type: ScheduledJob['type'] = 'unknown'
    
    if (name.includes('reconcil')) {
      type = 'reconciliation'
      riskLevel = 'critical'
    } else if (name.includes('watchdog') || name.includes('monitor')) {
      type = 'watchdog'
      riskLevel = 'high'
    } else if (name.includes('cleanup') || name.includes('purge')) {
      type = 'cleanup'
      riskLevel = 'low'
    }
    
    jobs.push({
      name,
      file: file.replace(/\\/g, '/'),
      type,
      executionMethod: 'vercel_cron',
      hasErrorHandling,
      hasLogging,
      hasAlerting,
      riskLevel
    })
  }
  
  return jobs
}

function auditNodeCronJobs(): ScheduledJob[] {
  console.log('🔍 Auditing Node Cron jobs...')
  
  const jobs: ScheduledJob[] = []
  
  const files = globSync('src/**/*.ts', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  })
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    if (content.includes('node-cron') || content.includes('cron.schedule')) {
      const scheduleMatches = content.matchAll(/cron\.schedule\(['"]([^'"]+)['"]/g)
      
      for (const match of scheduleMatches) {
        const schedule = match[1]
        const name = file.split('/').pop()?.replace('.ts', '') || 'Unknown'
        
        const hasErrorHandling = content.includes('try') && content.includes('catch')
        const hasLogging = content.includes('logger.') || content.includes('console.')
        const hasAlerting = content.includes('alert') || content.includes('slack')
        
        jobs.push({
          name,
          file: file.replace(/\\/g, '/'),
          type: 'cron',
          executionMethod: 'node_cron',
          schedule,
          expectedFrequency: schedule,
          hasErrorHandling,
          hasLogging,
          hasAlerting,
          riskLevel: 'medium'
        })
      }
    }
  }
  
  return jobs
}

function auditBullMQJobs(): ScheduledJob[] {
  console.log('🔍 Auditing BullMQ scheduled jobs...')
  
  const jobs: ScheduledJob[] = []
  
  const files = globSync('src/lib/die/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    if (content.includes('repeat:') || content.includes('cron:')) {
      const name = file.split('/').pop()?.replace('.ts', '') || 'Unknown'
      
      const hasErrorHandling = content.includes('try') && content.includes('catch')
      const hasLogging = content.includes('logger.') || content.includes('console.')
      const hasAlerting = content.includes('alert') || content.includes('slack')
      
      jobs.push({
        name,
        file: file.replace(/\\/g, '/'),
        type: 'cron',
        executionMethod: 'bullmq',
        hasErrorHandling,
        hasLogging,
        hasAlerting,
        riskLevel: 'medium'
      })
    }
  }
  
  return jobs
}

function auditWatchdogJobs(): ScheduledJob[] {
  console.log('🔍 Auditing watchdog jobs...')
  
  const jobs: ScheduledJob[] = []
  
  const files = globSync('src/**/*watchdog*.ts', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  })
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const name = file.split('/').pop()?.replace('.ts', '') || 'Unknown'
    
    const hasErrorHandling = content.includes('try') && content.includes('catch')
    const hasLogging = content.includes('logger.') || content.includes('console.')
    const hasAlerting = content.includes('alert') || content.includes('slack')
    
    jobs.push({
      name,
      file: file.replace(/\\/g, '/'),
      type: 'watchdog',
      executionMethod: 'unknown',
      hasErrorHandling,
      hasLogging,
      hasAlerting,
      riskLevel: 'high'
    })
  }
  
  return jobs
}

function generateReport(): SchedulerAuditReport {
  console.log('🚀 Starting Scheduler Governance Audit...\n')
  
  const envVars = parseEnvFile('.env')
  
  const cronSecret = {
    configured: envVars.has('CRON_SECRET'),
    usedInCode: false // Will check in code
  }
  
  const cronWorkerValue = envVars.get('CRON_WORKER') || 'false'
  const cronWorker = {
    enabled: cronWorkerValue === 'true',
    mode: cronWorkerValue === 'true' ? 'self_hosted' as const : 'vercel' as const
  }
  
  const vercelJobs = auditVercelCronJobs()
  const nodeJobs = auditNodeCronJobs()
  const bullmqJobs = auditBullMQJobs()
  const watchdogJobs = auditWatchdogJobs()
  
  const allJobs = [...vercelJobs, ...nodeJobs, ...bullmqJobs, ...watchdogJobs]
  
  const report: SchedulerAuditReport = {
    discoveryDate: new Date().toISOString(),
    cronSecret,
    cronWorker,
    jobs: allJobs,
    summary: {
      totalJobs: allJobs.length,
      vercelCronJobs: allJobs.filter(j => j.executionMethod === 'vercel_cron').length,
      nodeCronJobs: allJobs.filter(j => j.executionMethod === 'node_cron').length,
      bullmqJobs: allJobs.filter(j => j.executionMethod === 'bullmq').length,
      unknownJobs: allJobs.filter(j => j.executionMethod === 'unknown').length,
      jobsWithErrorHandling: allJobs.filter(j => j.hasErrorHandling).length,
      jobsWithLogging: allJobs.filter(j => j.hasLogging).length,
      jobsWithAlerting: allJobs.filter(j => j.hasAlerting).length,
      criticalJobs: allJobs.filter(j => j.riskLevel === 'critical').length,
      highRiskJobs: allJobs.filter(j => j.riskLevel === 'high').length
    }
  }
  
  console.log('\n📊 Audit Summary:')
  console.log(`   CRON_SECRET Configured: ${cronSecret.configured}`)
  console.log(`   CRON_WORKER Enabled: ${cronWorker.enabled}`)
  console.log(`   Execution Mode: ${cronWorker.mode}`)
  console.log(`   Total Jobs: ${report.summary.totalJobs}`)
  console.log(`   Vercel Cron: ${report.summary.vercelCronJobs}`)
  console.log(`   Node Cron: ${report.summary.nodeCronJobs}`)
  console.log(`   BullMQ: ${report.summary.bullmqJobs}`)
  console.log(`   Unknown: ${report.summary.unknownJobs}`)
  console.log(`   With Error Handling: ${report.summary.jobsWithErrorHandling}`)
  console.log(`   With Logging: ${report.summary.jobsWithLogging}`)
  console.log(`   With Alerting: ${report.summary.jobsWithAlerting}`)
  console.log(`   Critical Risk: ${report.summary.criticalJobs}`)
  console.log(`   High Risk: ${report.summary.highRiskJobs}`)
  
  console.log('\n💾 Saving report to scheduler-governance.json...')
  fs.writeFileSync(
    'scheduler-governance.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report saved successfully!')
  
  return report
}

// Run audit
try {
  generateReport()
  console.log('\n✅ Scheduler Governance Audit Complete!')
  console.log('\n🎯 Next step: Review scheduler-governance.json and generate SCHEDULER_GOVERNANCE_REPORT.md')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Audit Failed:', error)
  process.exit(1)
}
