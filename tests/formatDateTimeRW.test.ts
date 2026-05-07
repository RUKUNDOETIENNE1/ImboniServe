import assert from 'node:assert'
import { formatDateTimeRW } from '../src/utils/datetimeRW'

function matchNoSeconds(str: string) {
  return /\d{2}\/\d{2}\/\d{4},\s?\d{2}:\d{2}$/.test(str)
}

function matchWithSeconds(str: string) {
  return /\d{2}\/\d{2}\/\d{4},\s?\d{2}:\d{2}:\d{2}$/.test(str)
}

;(function run() {
  const iso = '2024-03-10T12:34:56.000Z'

  const enNoSec = formatDateTimeRW(iso, 'en')
  assert.strictEqual(typeof enNoSec, 'string')
  assert.ok(matchNoSeconds(enNoSec), `Expected no-seconds format, got: ${enNoSec}`)

  const enWithSec = formatDateTimeRW(new Date(iso), 'en', true)
  assert.ok(matchWithSeconds(enWithSec), `Expected with-seconds format, got: ${enWithSec}`)

  const rwNoSec = formatDateTimeRW(iso, 'rw')
  assert.strictEqual(typeof rwNoSec, 'string')
  assert.ok(matchNoSeconds(rwNoSec), `Expected no-seconds format (rw), got: ${rwNoSec}`)

  console.log('formatDateTimeRW tests passed')
})()
