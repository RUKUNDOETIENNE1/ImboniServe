/**
 * Hospitality AI Copilot™ — Validation Suite Runner.
 *
 * Runs the production validation suite and prints results.
 */

import { runCopilotValidationSuite, type TestResult } from '../src/lib/hospitality-ai/copilot/validation-suite'

async function main() {
  console.log('=== Hospitality AI Copilot™ — Production Validation Suite ===\n')

  const report = await runCopilotValidationSuite()

  // Print results grouped by category
  const categories = new Map<string, TestResult[]>()
  for (const result of report.results) {
    const arr = categories.get(result.category) || []
    arr.push(result)
    categories.set(result.category, arr)
  }

  for (const [category, results] of categories) {
    console.log(`\n--- ${category} ---`)
    for (const result of results) {
      const status = result.passed ? '[PASS]' : '[FAIL]'
      const time = `${result.duration}ms`
      console.log(`${status} ${result.name} (${time})`)
      if (result.error) {
        console.log(`  Error: ${result.error}`)
      }
    }
  }

  // Print summary
  console.log('\n=== Summary ===')
  console.log(`Total tests: ${report.totalTests}`)
  console.log(`Passed: ${report.passed}`)
  console.log(`Failed: ${report.failed}`)
  console.log(`Pass rate: ${(report.passRate * 100).toFixed(1)}%`)
  console.log(`\n=== Certification ===`)
  console.log(`Status: ${report.certification}`)
  console.log(`Details: ${report.certificationDetails}`)

  if (report.certification === 'FAIL') {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Validation suite crashed:', err)
  process.exit(1)
})
