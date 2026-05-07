/**
 * Pricing Validation Script
 * Verifies that all pricing follows the correct 25% monthly premium formula
 */

import { PRICING_PLANS } from '../src/config/pricing'

console.log('🔍 Validating Pricing Consistency...\n')

let allValid = true

PRICING_PLANS.forEach(plan => {
  console.log(`\n📋 ${plan.name} (${plan.code})`)
  console.log('─'.repeat(50))
  
  if (plan.monthlyPriceRWF === null || plan.annualMonthlyRWF === null) {
    console.log('✅ Custom pricing - skipped')
    return
  }
  
  const expected = Math.round(plan.annualMonthlyRWF * 1.25)
  const actual = plan.monthlyPriceRWF
  const isValid = expected === actual
  
  console.log(`Annual Monthly Rate: ${plan.annualMonthlyRWF.toLocaleString()} RWF`)
  console.log(`Expected Monthly:    ${expected.toLocaleString()} RWF (×1.25)`)
  console.log(`Actual Monthly:      ${actual.toLocaleString()} RWF`)
  console.log(`Annual Total:        ${plan.annualTotalRWF?.toLocaleString()} RWF`)
  
  if (isValid) {
    console.log('✅ VALID - Correct 25% premium')
  } else {
    console.log(`❌ INVALID - Expected ${expected}, got ${actual}`)
    console.log(`   Difference: ${actual - expected} RWF`)
    allValid = false
  }
  
  // Verify annual total (allow ±10 RWF rounding tolerance)
  const expectedAnnual = plan.annualMonthlyRWF * 12
  const annualDiff = Math.abs((plan.annualTotalRWF || 0) - expectedAnnual)
  if (annualDiff > 10) {
    console.log(`⚠️  Annual total mismatch: Expected ${expectedAnnual}, got ${plan.annualTotalRWF}`)
    allValid = false
  } else if (annualDiff > 0) {
    console.log(`ℹ️  Minor rounding: ${annualDiff} RWF difference (acceptable)`)
  }
})

console.log('\n' + '='.repeat(50))
if (allValid) {
  console.log('✅ ALL PRICING VALID - 25% premium correctly applied')
  process.exit(0)
} else {
  console.log('❌ PRICING ERRORS FOUND - Please review above')
  process.exit(1)
}
