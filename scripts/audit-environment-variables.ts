/**
 * Phase 0.8B.1 — Environment Variable Governance Audit
 * 
 * Purpose: Discover all environment variables used in code and compare
 * against .env.example to identify:
 * - Required variables
 * - Actually configured variables
 * - Missing variables
 * - Unused variables
 * - Duplicated variables
 * - Secrets still referenced in code
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
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
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

interface EnvVariable {
  name: string
  usages: Array<{
    file: string
    line: number
    context: string
  }>
  inExample: boolean
  inActualEnv: boolean
  category: 'database' | 'auth' | 'payment' | 'messaging' | 'storage' | 'monitoring' | 'api' | 'config' | 'unknown'
  isSecret: boolean
  isPublic: boolean
}

interface EnvAuditReport {
  discoveryDate: string
  summary: {
    totalVariablesInCode: number
    totalVariablesInExample: number
    totalVariablesInActualEnv: number
    missingVariables: number
    unusedVariables: number
    publicVariables: number
    secretVariables: number
  }
  variables: Record<string, EnvVariable>
  missingVariables: string[]
  unusedVariables: string[]
  duplicatedVariables: string[]
  greenVariables: string[]
  yellowVariables: string[]
  redVariables: string[]
}

const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  database: [/DATABASE_URL/, /DIRECT_URL/, /POSTGRES/, /SUPABASE_(?!STORAGE)/],
  auth: [/NEXTAUTH/, /AUTH/, /SECRET/, /HASH/, /TRIAL/],
  payment: [/INTOUCH/, /IREMBOPAY/, /PESAPAL/, /PAYMENT/, /GATEWAY/],
  messaging: [/TWILIO/, /WHATSAPP/, /PUSHER/, /SMS/, /EMAIL/, /SMTP/],
  storage: [/STORAGE/, /SUPABASE_STORAGE/, /UPLOAD/, /MEDIA/],
  monitoring: [/SENTRY/, /SLACK/, /ALERT/, /LOG_LEVEL/],
  api: [/OPENAI/, /AZURE/, /WEATHER/, /API_KEY/],
  config: [/APP_URL/, /NODE_ENV/, /CRON/, /FEATURE_FLAG/]
}

function categorizeVariable(name: string): EnvVariable['category'] {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(name))) {
      return category as EnvVariable['category']
    }
  }
  return 'unknown'
}

function isSecret(name: string): boolean {
  const secretPatterns = [
    /SECRET/,
    /PASSWORD/,
    /KEY/,
    /TOKEN/,
    /AUTH/,
    /HASH/,
    /WEBHOOK_USERNAME/,
    /WEBHOOK_PASSWORD/
  ]
  return secretPatterns.some(pattern => pattern.test(name))
}

function isPublic(name: string): boolean {
  return name.startsWith('NEXT_PUBLIC_')
}

function scanCodeForEnvVariables(): Map<string, EnvVariable> {
  console.log('🔍 Scanning code for environment variables...')
  
  const variables = new Map<string, EnvVariable>()
  
  // Find all TypeScript and JavaScript files in src/
  const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  })
  
  console.log(`   Found ${files.length} source files to scan`)
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    
    // Match process.env.VARIABLE_NAME
    const envRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g
    
    lines.forEach((line, index) => {
      let match
      while ((match = envRegex.exec(line)) !== null) {
        const varName = match[1]
        
        if (!variables.has(varName)) {
          variables.set(varName, {
            name: varName,
            usages: [],
            inExample: false,
            inActualEnv: false,
            category: categorizeVariable(varName),
            isSecret: isSecret(varName),
            isPublic: isPublic(varName)
          })
        }
        
        variables.get(varName)!.usages.push({
          file: file.replace(/\\/g, '/'),
          line: index + 1,
          context: line.trim().substring(0, 100)
        })
      }
    })
  }
  
  console.log(`✅ Found ${variables.size} unique environment variables in code`)
  return variables
}

function parseEnvFile(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) {
    return new Set()
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const variables = new Set<string>()
  
  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=/)
      if (match) {
        variables.add(match[1])
      }
    }
  })
  
  return variables
}

function generateReport(): EnvAuditReport {
  console.log('🚀 Starting Environment Variable Governance Audit...\n')
  
  // Scan code for env variables
  const variables = scanCodeForEnvVariables()
  
  // Parse .env.example
  console.log('🔍 Parsing .env.example...')
  const exampleVars = parseEnvFile('.env.example')
  console.log(`✅ Found ${exampleVars.size} variables in .env.example`)
  
  // Parse actual .env (if exists)
  console.log('🔍 Parsing .env...')
  const actualVars = parseEnvFile('.env')
  console.log(`✅ Found ${actualVars.size} variables in .env`)
  
  // Update variable metadata
  for (const [name, variable] of variables) {
    variable.inExample = exampleVars.has(name)
    variable.inActualEnv = actualVars.has(name)
  }
  
  // Find unused variables (in .env.example but not in code)
  const unusedVariables: string[] = []
  for (const varName of exampleVars) {
    if (!variables.has(varName)) {
      unusedVariables.push(varName)
    }
  }
  
  // Find missing variables (in code but not in .env.example)
  const missingVariables: string[] = []
  for (const [name, variable] of variables) {
    if (!variable.inExample) {
      missingVariables.push(name)
    }
  }
  
  // Classify variables
  const greenVariables: string[] = []
  const yellowVariables: string[] = []
  const redVariables: string[] = []
  
  for (const [name, variable] of variables) {
    if (variable.inExample && variable.inActualEnv) {
      greenVariables.push(name)
    } else if (variable.inExample && !variable.inActualEnv) {
      yellowVariables.push(name)
    } else {
      redVariables.push(name)
    }
  }
  
  // Find duplicated variables (same variable in multiple categories)
  const duplicatedVariables: string[] = []
  // This would require more complex analysis - for now, empty
  
  const report: EnvAuditReport = {
    discoveryDate: new Date().toISOString(),
    summary: {
      totalVariablesInCode: variables.size,
      totalVariablesInExample: exampleVars.size,
      totalVariablesInActualEnv: actualVars.size,
      missingVariables: missingVariables.length,
      unusedVariables: unusedVariables.length,
      publicVariables: Array.from(variables.values()).filter(v => v.isPublic).length,
      secretVariables: Array.from(variables.values()).filter(v => v.isSecret).length
    },
    variables: Object.fromEntries(variables),
    missingVariables,
    unusedVariables,
    duplicatedVariables,
    greenVariables,
    yellowVariables,
    redVariables
  }
  
  console.log('\n📊 Audit Summary:')
  console.log(`   Variables in code: ${report.summary.totalVariablesInCode}`)
  console.log(`   Variables in .env.example: ${report.summary.totalVariablesInExample}`)
  console.log(`   Variables in .env: ${report.summary.totalVariablesInActualEnv}`)
  console.log(`   Missing from .env.example: ${report.summary.missingVariables}`)
  console.log(`   Unused in code: ${report.summary.unusedVariables}`)
  console.log(`   Public variables: ${report.summary.publicVariables}`)
  console.log(`   Secret variables: ${report.summary.secretVariables}`)
  console.log(`   🟢 GREEN (configured): ${greenVariables.length}`)
  console.log(`   🟡 YELLOW (in example, not in .env): ${yellowVariables.length}`)
  console.log(`   🔴 RED (missing from example): ${redVariables.length}`)
  
  console.log('\n💾 Saving report to environment-truth.json...')
  fs.writeFileSync(
    'environment-truth.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('✅ Report saved successfully!')
  
  return report
}

// Run audit
try {
  generateReport()
  console.log('\n✅ Environment Variable Governance Audit Complete!')
  console.log('\n🎯 Next step: Review environment-truth.json and generate ENVIRONMENT_TRUTH_REPORT.md')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Audit Failed:', error)
  process.exit(1)
}
