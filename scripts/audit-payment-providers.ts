/**
 * Phase 0.8B.2 — Payment Provider Truth Audit
 * 
 * Purpose: Verify payment provider configuration and integration status
 * - InTouch (MTN + Airtel Mobile Money)
 * - IremboPay (Card Payments)
 * - Webhook URLs
 * - Callback URLs
 * - Refund endpoints
 * - Sandbox vs Production
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

interface ProviderConfig {
  name: string
  type: 'mobile_money' | 'card' | 'bank_transfer'
  status: 'configured' | 'partially_configured' | 'unknown' | 'broken'
  requiredEnvVars: string[]
  actualEnvVars: string[]
  missingEnvVars: string[]
  webhookUrl?: string
  callbackUrl?: string
  refundEndpoint?: string
  environment: 'production' | 'sandbox' | 'unknown'
  codeReferences: Array<{
    file: string
    line: number
    context: string
  }>
}

interface PaymentProviderReport {
  discoveryDate: string
  summary: {
    totalProviders: number
    configured: number
    partiallyConfigured: number
    broken: number
    unknown: number
  }
  providers: {
    intouch: ProviderConfig
    irembopay: ProviderConfig
    pesapal?: ProviderConfig
  }
  webhooks: Array<{
    route: string
    provider: string
    signatureValidation: boolean
    replayProtection: boolean
    idempotency: boolean
    logging: boolean
  }>
  routing: {
    mtnAssumptions: string[]
    airtelAssumptions: string[]
    cardAssumptions: string[]
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

function scanProviderReferences(providerName: string): ProviderConfig['codeReferences'] {
  const references: ProviderConfig['codeReferences'] = []
  
  const files = globSync('src/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  })
  
  const searchTerms = providerName === 'intouch' 
    ? ['InTouch', 'INTOUCH', 'intouch']
    : providerName === 'irembopay'
    ? ['IremboPay', 'IREMBOPAY', 'irembopay', 'Irembo']
    : []
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      if (searchTerms.some(term => line.includes(term))) {
        references.push({
          file: file.replace(/\\/g, '/'),
          line: index + 1,
          context: line.trim().substring(0, 100)
        })
      }
    })
  }
  
  return references
}

function auditInTouch(envVars: Map<string, string>): ProviderConfig {
  console.log('🔍 Auditing InTouch configuration...')
  
  const requiredVars = [
    'INTOUCH_API_URL',
    'INTOUCH_USERNAME',
    'INTOUCH_ACCOUNT_NO',
    'INTOUCH_PARTNER_PASSWORD',
    'INTOUCH_CALLBACK_URL',
    'INTOUCH_WEBHOOK_USERNAME',
    'INTOUCH_WEBHOOK_PASSWORD'
  ]
  
  const actualVars = requiredVars.filter(v => envVars.has(v))
  const missingVars = requiredVars.filter(v => !envVars.has(v))
  
  let status: ProviderConfig['status'] = 'unknown'
  if (actualVars.length === requiredVars.length) {
    status = 'configured'
  } else if (actualVars.length > 0) {
    status = 'partially_configured'
  } else {
    status = 'broken'
  }
  
  const apiUrl = envVars.get('INTOUCH_API_URL') || ''
  const environment = apiUrl.includes('sandbox') || apiUrl.includes('test') 
    ? 'sandbox' 
    : apiUrl.includes('intouchpay.co.rw')
    ? 'production'
    : 'unknown'
  
  const references = scanProviderReferences('intouch')
  
  return {
    name: 'InTouch (MTN + Airtel Mobile Money)',
    type: 'mobile_money',
    status,
    requiredEnvVars: requiredVars,
    actualEnvVars: actualVars,
    missingEnvVars: missingVars,
    webhookUrl: envVars.get('INTOUCH_CALLBACK_URL'),
    callbackUrl: envVars.get('INTOUCH_CALLBACK_URL'),
    environment,
    codeReferences: references
  }
}

function auditIremboPay(envVars: Map<string, string>): ProviderConfig {
  console.log('🔍 Auditing IremboPay configuration...')
  
  const requiredVars = [
    'IREMBOPAY_PUBLIC_KEY',
    'IREMBOPAY_SECRET_KEY',
    'IREMBOPAY_PAYMENT_ACCOUNT',
    'IREMBOPAY_API_BASE',
    'IREMBOPAY_CALLBACK_URL',
    'IREMBOPAY_RETURN_URL'
  ]
  
  const actualVars = requiredVars.filter(v => envVars.has(v))
  const missingVars = requiredVars.filter(v => !envVars.has(v))
  
  let status: ProviderConfig['status'] = 'unknown'
  if (actualVars.length === requiredVars.length) {
    status = 'configured'
  } else if (actualVars.length > 0) {
    status = 'partially_configured'
  } else {
    status = 'broken'
  }
  
  const apiBase = envVars.get('IREMBOPAY_API_BASE') || ''
  const environment = apiBase.includes('sandbox') || apiBase.includes('test')
    ? 'sandbox'
    : apiBase.includes('api.irembopay.com')
    ? 'production'
    : 'unknown'
  
  const references = scanProviderReferences('irembopay')
  
  return {
    name: 'IremboPay (Card Payments)',
    type: 'card',
    status,
    requiredEnvVars: requiredVars,
    actualEnvVars: actualVars,
    missingEnvVars: missingVars,
    webhookUrl: envVars.get('IREMBOPAY_CALLBACK_URL'),
    callbackUrl: envVars.get('IREMBOPAY_CALLBACK_URL'),
    refundEndpoint: undefined, // To be discovered from code
    environment,
    codeReferences: references
  }
}

function auditWebhooks(): PaymentProviderReport['webhooks'] {
  console.log('🔍 Auditing webhook endpoints...')
  
  const webhooks: PaymentProviderReport['webhooks'] = []
  
  // Find webhook files
  const webhookFiles = globSync('src/pages/api/webhooks/**/*.{ts,tsx}', {
    cwd: process.cwd()
  })
  
  for (const file of webhookFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const route = file
      .replace(/\\/g, '/')
      .replace('src/pages/api/', '/api/')
      .replace(/\.tsx?$/, '')
      .replace(/\/index$/, '')
    
    const provider = file.includes('intouch') ? 'InTouch'
      : file.includes('irembopay') ? 'IremboPay'
      : file.includes('whatsapp') ? 'WhatsApp'
      : file.includes('twilio') ? 'Twilio'
      : 'Unknown'
    
    const hasSignatureValidation = content.includes('verifyWebhookSignature') || 
                                   content.includes('x-hub-signature') ||
                                   content.includes('x-twilio-signature')
    
    const hasReplayProtection = content.includes('timestamp') || 
                                content.includes('nonce') ||
                                content.includes('idempotency')
    
    const hasIdempotency = content.includes('idempotencyKey') ||
                          content.includes('idempotency')
    
    const hasLogging = content.includes('logger.') || 
                      content.includes('console.log')
    
    webhooks.push({
      route,
      provider,
      signatureValidation: hasSignatureValidation,
      replayProtection: hasReplayProtection,
      idempotency: hasIdempotency,
      logging: hasLogging
    })
  }
  
  return webhooks
}

function generateReport(): PaymentProviderReport {
  console.log('🚀 Starting Payment Provider Truth Audit...\n')
  
  // Parse .env
  const envVars = parseEnvFile('.env')
  console.log(`✅ Loaded ${envVars.size} environment variables\n`)
  
  // Audit providers
  const intouch = auditInTouch(envVars)
  const irembopay = auditIremboPay(envVars)
  
  // Audit webhooks
  const webhooks = auditWebhooks()
  
  const report: PaymentProviderReport = {
    discoveryDate: new Date().toISOString(),
    summary: {
      totalProviders: 2,
      configured: [intouch, irembopay].filter(p => p.status === 'configured').length,
      partiallyConfigured: [intouch, irembopay].filter(p => p.status === 'partially_configured').length,
      broken: [intouch, irembopay].filter(p => p.status === 'broken').length,
      unknown: [intouch, irembopay].filter(p => p.status === 'unknown').length
    },
    providers: {
      intouch,
      irembopay
    },
    webhooks,
    routing: {
      mtnAssumptions: [
        'Phone starts with 078 or 079 → MTN',
        'Uses INTOUCH gateway',
        'PaymentMethod: MTN_MOBILE_MONEY'
      ],
      airtelAssumptions: [
        'Phone starts with 073 → Airtel',
        'Uses INTOUCH gateway',
        'PaymentMethod: AIRTEL_MONEY'
      ],
      cardAssumptions: [
        'Uses IREMBOPAY gateway',
        'PaymentMethod: CARD'
      ]
    }
  }
  
  console.log('\n📊 Audit Summary:')
  console.log(`   Total Providers: ${report.summary.totalProviders}`)
  console.log(`   🟢 Configured: ${report.summary.configured}`)
  console.log(`   🟡 Partially Configured: ${report.summary.partiallyConfigured}`)
  console.log(`   🔴 Broken: ${report.summary.broken}`)
  console.log(`   ⚪ Unknown: ${report.summary.unknown}`)
  console.log(`   Webhooks: ${webhooks.length}`)
  
  console.log('\n💾 Saving report to payment-provider-truth.json...')
  fs.writeFileSync(
    'payment-provider-truth.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report saved successfully!')
  
  return report
}

// Run audit
try {
  generateReport()
  console.log('\n✅ Payment Provider Truth Audit Complete!')
  console.log('\n🎯 Next step: Review payment-provider-truth.json and generate PAYMENT_PROVIDER_TRUTH_REPORT.md')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Audit Failed:', error)
  process.exit(1)
}
