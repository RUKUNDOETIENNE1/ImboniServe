#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * 
 * Checks all required environment variables for production deployment
 */

const requiredVars = {
  // Critical - Must be set
  critical: [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgresql://...' },
    { name: 'DIRECT_URL', description: 'Direct database URL (Supabase)', example: 'postgresql://...' },
    { name: 'NEXTAUTH_SECRET', description: 'NextAuth secret (32+ chars)', minLength: 32 },
    { name: 'NEXTAUTH_URL', description: 'Production URL', example: 'https://your-domain.com' },
  ],
  
  // High Priority - Needed for core features
  high: [
    { name: 'INTOUCH_USERNAME', description: 'InTouch payment gateway username' },
    { name: 'INTOUCH_ACCOUNT_NO', description: 'InTouch account number' },
    { name: 'INTOUCH_PASSWORD', description: 'InTouch partner password' },
    { name: 'TWILIO_ACCOUNT_SID', description: 'Twilio Account SID' },
    { name: 'TWILIO_AUTH_TOKEN', description: 'Twilio Auth Token' },
    { name: 'TWILIO_WHATSAPP_NUMBER', description: 'Twilio WhatsApp number', example: 'whatsapp:+...' },
    { name: 'SUPABASE_STORAGE_URL', description: 'Supabase storage URL' },
    { name: 'SUPABASE_STORAGE_KEY', description: 'Supabase service role key' },
  ],
  
  // Medium Priority - Recommended
  medium: [
    { name: 'SENTRY_DSN', description: 'Sentry error tracking DSN' },
    { name: 'OPENAI_API_KEY', description: 'OpenAI API key for AI features' },
    { name: 'CRON_SECRET', description: 'Cron job secret (32+ chars)', minLength: 32 },
    { name: 'PUSHER_APP_ID', description: 'Pusher app ID' },
    { name: 'PUSHER_KEY', description: 'Pusher key' },
    { name: 'PUSHER_SECRET', description: 'Pusher secret' },
  ],
  
  // Low Priority - Optional
  low: [
    { name: 'IREMBOPAY_PUBLIC_KEY', description: 'IremboPay public key (fallback gateway)' },
    { name: 'IREMBOPAY_SECRET_KEY', description: 'IremboPay secret key' },
    { name: 'REDIS_URL', description: 'Redis URL for job queue' },
    { name: 'NEXT_PUBLIC_CRISP_WEBSITE_ID', description: 'Crisp chat widget ID' },
  ]
}

function checkVar(varConfig) {
  const value = process.env[varConfig.name]
  const status = {
    name: varConfig.name,
    set: !!value,
    valid: true,
    message: ''
  }

  if (!value) {
    status.valid = false
    status.message = `❌ Missing${varConfig.example ? ` (e.g., ${varConfig.example})` : ''}`
    return status
  }

  // Check minimum length if specified
  if (varConfig.minLength && value.length < varConfig.minLength) {
    status.valid = false
    status.message = `⚠️  Too short (min ${varConfig.minLength} chars, got ${value.length})`
    return status
  }

  // Check if it's still using example/placeholder values
  if (value.includes('your-') || value.includes('<') || value.includes('example')) {
    status.valid = false
    status.message = '⚠️  Using placeholder value'
    return status
  }

  status.message = '✅ Set'
  return status
}

function verifyEnvironment() {
  console.log('🔍 Verifying Production Environment Variables\n')
  console.log('=' .repeat(80))
  
  const results = {
    critical: { total: 0, set: 0, valid: 0 },
    high: { total: 0, set: 0, valid: 0 },
    medium: { total: 0, set: 0, valid: 0 },
    low: { total: 0, set: 0, valid: 0 }
  }

  for (const [priority, vars] of Object.entries(requiredVars)) {
    console.log(`\n${priority.toUpperCase()} PRIORITY:`)
    console.log('-'.repeat(80))
    
    results[priority].total = vars.length
    
    for (const varConfig of vars) {
      const status = checkVar(varConfig)
      
      if (status.set) results[priority].set++
      if (status.valid) results[priority].valid++
      
      const icon = status.valid ? '✅' : status.set ? '⚠️ ' : '❌'
      console.log(`${icon} ${varConfig.name.padEnd(35)} ${status.message}`)
      if (varConfig.description) {
        console.log(`   ${varConfig.description}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n📊 SUMMARY:\n')
  
  let totalVars = 0
  let totalSet = 0
  let totalValid = 0
  
  for (const [priority, stats] of Object.entries(results)) {
    const percentage = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0
    const icon = percentage === 100 ? '✅' : percentage >= 75 ? '⚠️ ' : '❌'
    
    console.log(`${icon} ${priority.toUpperCase().padEnd(10)} ${stats.valid}/${stats.total} valid (${percentage}%)`)
    
    totalVars += stats.total
    totalSet += stats.set
    totalValid += stats.valid
  }
  
  const overallPercentage = Math.round((totalValid / totalVars) * 100)
  
  console.log('\n' + '-'.repeat(80))
  console.log(`\n🎯 OVERALL: ${totalValid}/${totalVars} variables valid (${overallPercentage}%)\n`)
  
  // Deployment readiness
  const criticalReady = results.critical.valid === results.critical.total
  const highReady = results.high.valid >= results.high.total * 0.8 // 80% of high priority
  
  if (criticalReady && highReady && overallPercentage >= 75) {
    console.log('✅ Environment is READY for production deployment!\n')
    return 0
  } else if (criticalReady) {
    console.log('⚠️  Environment is READY for staging, but needs work for production.\n')
    console.log('   Please set all CRITICAL and HIGH priority variables.\n')
    return 1
  } else {
    console.log('❌ Environment is NOT READY for deployment.\n')
    console.log('   Please set all CRITICAL priority variables first.\n')
    return 1
  }
}

const exitCode = verifyEnvironment()
process.exit(exitCode)
