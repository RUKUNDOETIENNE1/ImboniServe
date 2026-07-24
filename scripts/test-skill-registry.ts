/**
 * Skill Registry Validation Runner.
 * Executes the production validation suite and reports results.
 */

import { runSkillRegistryValidation } from '../src/lib/hospitality-ai/skill-registry/validation-suite'

async function main() {
  console.log('=== Operational Skill Registry — Production Validation ===\n')

  const result = await runSkillRegistryValidation()

  console.log(`\n=== Results ===`)
  console.log(`Total Tests: ${result.totalTests}`)
  console.log(`Passed: ${result.passed}`)
  console.log(`Failed: ${result.failed}`)
  console.log(`Pass Rate: ${(result.passRate * 100).toFixed(1)}%`)
  console.log(`\n=== Summary ===`)
  console.log(`Skills Registered: ${result.summary.skillsRegistered}`)
  console.log(`Categories Covered: ${result.summary.categoriesCovered}`)
  console.log(`Orchestration Tests: ${result.summary.orchestrationTestsRun}`)
  console.log(`Discovery Tests: ${result.summary.discoveryTestsRun}`)
  console.log(`Governance Tests: ${result.summary.governanceTestsRun}`)
  console.log(`Performance Tests: ${result.summary.performanceTestsRun}`)

  console.log(`\n=== Test Details ===`)
  for (const test of result.results) {
    const status = test.passed ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${test.category}/${test.name} (${test.duration}ms)`)
    if (test.details) console.log(`  Details: ${test.details}`)
    if (test.error) console.log(`  Error: ${test.error}`)
  }

  console.log(`\n=== Certification ===`)
  console.log(`Status: ${result.certification}`)
  console.log(`Details: ${result.certificationDetails}`)

  process.exit(result.certification === 'PASS' ? 0 : 1)
}

main().catch((error) => {
  console.error('Validation suite crashed:', error)
  process.exit(1)
})
