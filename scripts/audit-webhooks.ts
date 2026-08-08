/**
 * Phase 0.8B.5 — Webhook Governance Audit
 * 
 * Purpose: Inventory all webhook endpoints and verify security
 * - InTouch webhooks
 * - IremboPay webhooks
 * - WhatsApp webhooks
 * - Other provider webhooks
 * - Route
 * - Signature validation
 * - Environment variables
 * - Replay protection
 * - Idempotency
 * - Logging
 * - Risk classification
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

interface WebhookEndpoint {
  route: string
  file: string
  provider: string
  method: 'GET' | 'POST' | 'BOTH' | 'UNKNOWN'
  security: {
    signatureValidation: boolean
    signatureHeader?: string
    replayProtection: boolean
    idempotency: boolean
    basicAuth: boolean
    secretValidation: boolean
  }
  errorHandling: {
    hasTryCatch: boolean
    hasLogging: boolean
    hasAlerting: boolean
    returns200OnError: boolean
  }
  envVars: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface WebhookAuditReport {
  discoveryDate: string
  webhooks: WebhookEndpoint[]
  summary: {
    totalWebhooks: number
    withSignatureValidation: number
    withReplayProtection: number
    withIdempotency: number
    withBasicAuth: number
    withLogging: number
    withAlerting: number
    criticalRisk: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  securityFindings: {
    webhooksWithoutSignatureValidation: string[]
    webhooksWithoutIdempotency: string[]
    webhooksWithoutLogging: string[]
    webhooksReturning200OnError: string[]
  }
}

function auditWebhooks(): WebhookEndpoint[] {
  console.log('🔍 Auditing webhook endpoints...')
  
  const webhooks: WebhookEndpoint[] = []
  
  const webhookFiles = globSync('src/pages/api/webhooks/**/*.ts', {
    cwd: process.cwd()
  })
  
  for (const file of webhookFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    
    const route = file
      .replace(/\\/g, '/')
      .replace('src/pages/api/', '/api/')
      .replace(/\.ts$/, '')
      .replace(/\/index$/, '')
    
    // Determine provider
    let provider = 'Unknown'
    if (file.includes('intouch')) provider = 'InTouch'
    else if (file.includes('irembopay') || file.includes('irembo')) provider = 'IremboPay'
    else if (file.includes('whatsapp')) provider = 'WhatsApp'
    else if (file.includes('twilio')) provider = 'Twilio'
    else if (file.includes('pusher')) provider = 'Pusher'
    
    // Determine HTTP method
    let method: WebhookEndpoint['method'] = 'UNKNOWN'
    if (content.includes('req.method === \'GET\'') && content.includes('req.method === \'POST\'')) {
      method = 'BOTH'
    } else if (content.includes('req.method === \'GET\'')) {
      method = 'GET'
    } else if (content.includes('req.method === \'POST\'')) {
      method = 'POST'
    }
    
    // Check security features
    const signatureValidation = 
      content.includes('verifyWebhookSignature') ||
      content.includes('x-hub-signature') ||
      content.includes('x-twilio-signature') ||
      content.includes('signature')
    
    let signatureHeader: string | undefined
    if (content.includes('x-hub-signature-256')) signatureHeader = 'x-hub-signature-256'
    else if (content.includes('x-twilio-signature')) signatureHeader = 'x-twilio-signature'
    else if (content.includes('x-signature')) signatureHeader = 'x-signature'
    
    const replayProtection = 
      content.includes('timestamp') ||
      content.includes('nonce') ||
      content.includes('replay')
    
    const idempotency = 
      content.includes('idempotencyKey') ||
      content.includes('idempotency')
    
    const basicAuth = 
      content.includes('authorization') &&
      content.includes('Basic')
    
    const secretValidation = 
      content.includes('WEBHOOK_SECRET') ||
      content.includes('VERIFY_TOKEN')
    
    // Check error handling
    const hasTryCatch = content.includes('try') && content.includes('catch')
    const hasLogging = content.includes('logger.') || content.includes('console.')
    const hasAlerting = content.includes('alert') || content.includes('slack')
    const returns200OnError = content.includes('res.status(200)') && content.includes('catch')
    
    // Extract environment variables
    const envVarMatches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)
    const envVars = Array.from(new Set(Array.from(envVarMatches).map(m => m[1])))
    
    // Determine risk level
    let riskLevel: WebhookEndpoint['riskLevel'] = 'medium'
    if (provider === 'InTouch' || provider === 'IremboPay') {
      riskLevel = 'critical' // Payment webhooks are critical
    } else if (!signatureValidation && !basicAuth) {
      riskLevel = 'high' // No authentication
    } else if (signatureValidation && idempotency) {
      riskLevel = 'low' // Well secured
    }
    
    webhooks.push({
      route,
      file: file.replace(/\\/g, '/'),
      provider,
      method,
      security: {
        signatureValidation,
        signatureHeader,
        replayProtection,
        idempotency,
        basicAuth,
        secretValidation
      },
      errorHandling: {
        hasTryCatch,
        hasLogging,
        hasAlerting,
        returns200OnError
      },
      envVars,
      riskLevel
    })
  }
  
  return webhooks
}

function generateReport(): WebhookAuditReport {
  console.log('🚀 Starting Webhook Governance Audit...\n')
  
  const webhooks = auditWebhooks()
  
  const securityFindings = {
    webhooksWithoutSignatureValidation: webhooks
      .filter(w => !w.security.signatureValidation && !w.security.basicAuth)
      .map(w => w.route),
    webhooksWithoutIdempotency: webhooks
      .filter(w => !w.security.idempotency && w.provider !== 'Unknown')
      .map(w => w.route),
    webhooksWithoutLogging: webhooks
      .filter(w => !w.errorHandling.hasLogging)
      .map(w => w.route),
    webhooksReturning200OnError: webhooks
      .filter(w => w.errorHandling.returns200OnError)
      .map(w => w.route)
  }
  
  const report: WebhookAuditReport = {
    discoveryDate: new Date().toISOString(),
    webhooks,
    summary: {
      totalWebhooks: webhooks.length,
      withSignatureValidation: webhooks.filter(w => w.security.signatureValidation).length,
      withReplayProtection: webhooks.filter(w => w.security.replayProtection).length,
      withIdempotency: webhooks.filter(w => w.security.idempotency).length,
      withBasicAuth: webhooks.filter(w => w.security.basicAuth).length,
      withLogging: webhooks.filter(w => w.errorHandling.hasLogging).length,
      withAlerting: webhooks.filter(w => w.errorHandling.hasAlerting).length,
      criticalRisk: webhooks.filter(w => w.riskLevel === 'critical').length,
      highRisk: webhooks.filter(w => w.riskLevel === 'high').length,
      mediumRisk: webhooks.filter(w => w.riskLevel === 'medium').length,
      lowRisk: webhooks.filter(w => w.riskLevel === 'low').length
    },
    securityFindings
  }
  
  console.log('\n📊 Audit Summary:')
  console.log(`   Total Webhooks: ${report.summary.totalWebhooks}`)
  console.log(`   With Signature Validation: ${report.summary.withSignatureValidation}`)
  console.log(`   With Replay Protection: ${report.summary.withReplayProtection}`)
  console.log(`   With Idempotency: ${report.summary.withIdempotency}`)
  console.log(`   With Basic Auth: ${report.summary.withBasicAuth}`)
  console.log(`   With Logging: ${report.summary.withLogging}`)
  console.log(`   With Alerting: ${report.summary.withAlerting}`)
  console.log(`   🔴 Critical Risk: ${report.summary.criticalRisk}`)
  console.log(`   🟠 High Risk: ${report.summary.highRisk}`)
  console.log(`   🟡 Medium Risk: ${report.summary.mediumRisk}`)
  console.log(`   🟢 Low Risk: ${report.summary.lowRisk}`)
  
  console.log('\n🚨 Security Findings:')
  console.log(`   Without Signature Validation: ${securityFindings.webhooksWithoutSignatureValidation.length}`)
  console.log(`   Without Idempotency: ${securityFindings.webhooksWithoutIdempotency.length}`)
  console.log(`   Without Logging: ${securityFindings.webhooksWithoutLogging.length}`)
  console.log(`   Returning 200 on Error: ${securityFindings.webhooksReturning200OnError.length}`)
  
  console.log('\n💾 Saving report to webhook-governance.json...')
  fs.writeFileSync(
    'webhook-governance.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report saved successfully!')
  
  return report
}

// Run audit
try {
  generateReport()
  console.log('\n✅ Webhook Governance Audit Complete!')
  console.log('\n🎯 Next step: Review webhook-governance.json and generate WEBHOOK_GOVERNANCE_REPORT.md')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Audit Failed:', error)
  process.exit(1)
}
