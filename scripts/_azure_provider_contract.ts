/**
 * Azure Provider Contract Tests
 * Run with: npx tsx scripts/_azure_provider_contract.ts
 *
 * Tests:
 *   I  — submit body is JSON { base64Source }, not raw binary (FIX 1)
 *   J  — GENERIC uses prebuilt-layout?features=keyValuePairs, not deprecated prebuilt-document (FIX 2)
 *   K  — invoice Items.valueArray line items are extracted correctly (FIX 3)
 *   L  — Retry-After header is honoured on first poll (FIX 4)
 *   M  — prebuilt-invoice maps all known field value types (valueString, valueDate, valueNumber)
 */

import { AzureDocIntelligenceProvider } from '../src/lib/die/provider/azure'

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function setEnv(timeoutMs = '5000') {
  process.env.AZURE_DI_ENDPOINT = 'https://example.cognitiveservices.azure.com'
  process.env.AZURE_DI_KEY = 'fake-key'
  process.env.DIE_PROVIDER_TIMEOUT_MS = timeoutMs
}

function clearEnv() {
  delete process.env.AZURE_DI_ENDPOINT
  delete process.env.AZURE_DI_KEY
  delete process.env.DIE_PROVIDER_TIMEOUT_MS
}

async function withMockFetch(handler: FetchHandler, fn: () => Promise<void>) {
  const original = globalThis.fetch
  globalThis.fetch = handler as typeof globalThis.fetch
  try {
    await fn()
  } finally {
    globalThis.fetch = original
  }
}

const results: { name: string; pass: boolean; detail?: string }[] = []

function pass(name: string, detail = '') {
  results.push({ name, pass: true, detail })
  console.log(`  \x1b[32m✓ ${name}\x1b[0m${detail ? `\n    \x1b[2m${detail}\x1b[0m` : ''}`)
}

function fail(name: string, detail = '') {
  results.push({ name, pass: false, detail })
  console.log(`  \x1b[31m✗ ${name}\x1b[0m${detail ? `\n    \x1b[31m${detail}\x1b[0m` : ''}`)
}

function header(title: string) {
  console.log(`\n\x1b[1m\x1b[36m${'═'.repeat(60)}\x1b[0m`)
  console.log(`\x1b[1m\x1b[36m  ${title}\x1b[0m`)
  console.log(`\x1b[1m\x1b[36m${'═'.repeat(60)}\x1b[0m`)
}

// ---------------------------------------------------------------------------
// TEST I: Submit body is JSON { base64Source } not raw binary
// ---------------------------------------------------------------------------
async function testI() {
  header('Test I — Submit body must be JSON {base64Source} not raw binary')
  setEnv()
  let capturedBody: any = null
  let capturedContentType: string | null = null

  await withMockFetch(async (url, init) => {
    const urlStr = String(url)
    if (urlStr.includes(':analyze')) {
      capturedBody = init?.body
      capturedContentType = (init?.headers as Record<string, string>)?.['Content-Type'] ?? null
      return new Response('', { status: 202, headers: { 'Operation-Location': 'https://example/op' } })
    }
    return new Response(JSON.stringify({
      status: 'succeeded',
      analyzeResult: {
        documents: [{ fields: { VendorName: { content: 'Test Corp', confidence: 0.95 } } }],
        pages: [{ lines: [] }], tables: [],
      },
    }), { status: 200 })
  }, async () => {
    const p = new AzureDocIntelligenceProvider()
    await p.extract({ buffer: Buffer.from('pdfbytes'), mime: 'image/png', documentType: 'SUPPLIER_INVOICE' })
  })

  capturedContentType === 'application/json'
    ? pass('Content-Type is application/json', `got: ${capturedContentType}`)
    : fail('Content-Type is application/json', `got: ${capturedContentType}`)

  typeof capturedBody === 'string'
    ? pass('Body is a JSON string (not Buffer)', `got: ${typeof capturedBody}`)
    : fail('Body is a JSON string (not Buffer)', `got: ${typeof capturedBody}`)

  capturedBody?.includes('"base64Source"')
    ? pass('Body contains base64Source key', `got: ${capturedBody?.slice(0, 60)}`)
    : fail('Body contains base64Source key', `got: ${capturedBody?.slice(0, 60)}`)

  !Buffer.isBuffer(capturedBody)
    ? pass('Body is not a raw Buffer (old broken path gone)')
    : fail('Body is not a raw Buffer', 'body was raw Buffer — FIX 1 not applied')

  clearEnv()
}

// ---------------------------------------------------------------------------
// TEST J: GENERIC uses prebuilt-layout?features=keyValuePairs
// ---------------------------------------------------------------------------
async function testJ() {
  header('Test J — GENERIC uses prebuilt-layout (not deprecated prebuilt-document)')
  setEnv()
  let capturedAnalyzeUrl = ''

  await withMockFetch(async (url, init) => {
    const urlStr = String(url)
    if (urlStr.includes(':analyze')) {
      capturedAnalyzeUrl = urlStr  // only capture the actual analyze submit URL
      return new Response('', { status: 202, headers: { 'Operation-Location': 'https://example/op' } })
    }
    return new Response(JSON.stringify({
      status: 'succeeded',
      analyzeResult: {
        documents: [{ fields: { Title: { content: 'Doc', confidence: 0.9 } } }],
        pages: [{ lines: [] }], tables: [], keyValuePairs: [],
      },
    }), { status: 200 })
  }, async () => {
    const p = new AzureDocIntelligenceProvider()
    await p.extract({ buffer: Buffer.from('bytes'), mime: 'image/png', documentType: 'GENERIC' })
  })

  capturedAnalyzeUrl.includes('prebuilt-layout')
    ? pass('URL uses prebuilt-layout', `got: ${capturedAnalyzeUrl}`)
    : fail('URL uses prebuilt-layout', `got: ${capturedAnalyzeUrl}`)

  !capturedAnalyzeUrl.includes('prebuilt-document')
    ? pass('URL does NOT use deprecated prebuilt-document')
    : fail('URL uses deprecated prebuilt-document — FIX 2 not applied', capturedAnalyzeUrl)

  capturedAnalyzeUrl.includes('features=keyValuePairs')
    ? pass('URL includes features=keyValuePairs', `got: ${capturedAnalyzeUrl}`)
    : fail('URL missing features=keyValuePairs', `got: ${capturedAnalyzeUrl}`)

  clearEnv()
}

// ---------------------------------------------------------------------------
// TEST K: Invoice Items.valueArray line items are extracted
// ---------------------------------------------------------------------------
async function testK() {
  header('Test K — Invoice Items.valueArray line items extracted (FIX 3)')
  setEnv()

  let result: any = null
  await withMockFetch(async (url) => {
    if (String(url).includes(':analyze')) {
      return new Response('', { status: 202, headers: { 'Operation-Location': 'https://example/op' } })
    }
    return new Response(JSON.stringify({
      status: 'succeeded',
      analyzeResult: {
        documents: [{
          fields: {
            VendorName: { content: 'Acme Ltd', confidence: 0.99 },
            TotalAmount: { valueNumber: 450000, confidence: 0.97 },
            Items: {
              valueArray: [
                {
                  valueObject: {
                    Description: { valueString: 'Tomatoes 50kg', confidence: 0.95 },
                    Quantity:    { valueNumber: 50,              confidence: 0.93 },
                    UnitPrice:   { valueNumber: 2500,            confidence: 0.94 },
                  },
                },
                {
                  valueObject: {
                    Description: { valueString: 'Onions 20kg', confidence: 0.91 },
                    Quantity:    { valueNumber: 20,             confidence: 0.92 },
                    UnitPrice:   { valueNumber: 1800,           confidence: 0.90 },
                  },
                },
              ],
            },
          },
        }],
        pages: [{ lines: [] }],
        tables: [], // intentionally empty — Items array should take precedence
      },
    }), { status: 200 })
  }, async () => {
    const p = new AzureDocIntelligenceProvider()
    result = await p.extract({ buffer: Buffer.from('bytes'), mime: 'image/png', documentType: 'SUPPLIER_INVOICE' })
  })

  result?.fields?.length === 2
    ? pass('2 header fields extracted (VendorName, TotalAmount)', `fields: ${result.fields.map((f: any) => f.name).join(', ')}`)
    : fail('Expected 2 header fields', `got: ${result?.fields?.length}`)

  result?.lines?.length === 2
    ? pass('2 line items extracted from Items.valueArray')
    : fail('Expected 2 line items from Items.valueArray', `got: ${result?.lines?.length}`)

  const line0Fields = result?.lines?.[0]?.fields ?? []
  line0Fields.some((f: any) => f.name === 'Description')
    ? pass('Line item has Description field', `value: ${line0Fields.find((f: any) => f.name === 'Description')?.value}`)
    : fail('Line item missing Description field')

  line0Fields.some((f: any) => f.name === 'Quantity')
    ? pass('Line item has Quantity field')
    : fail('Line item missing Quantity field')

  clearEnv()
}

// ---------------------------------------------------------------------------
// TEST L: Retry-After header honoured on first poll delay
// ---------------------------------------------------------------------------
async function testL() {
  header('Test L — Retry-After header honoured on first poll (FIX 4)')
  setEnv('10000')

  const pollTimestamps: number[] = []
  let callCount = 0

  await withMockFetch(async (url) => {
    const urlStr = String(url)
    callCount++
    if (urlStr.includes(':analyze')) {
      return new Response('', {
        status: 202,
        headers: {
          'Operation-Location': 'https://example/op',
          'Retry-After': '1', // Azure says: wait 1 second before first poll
        },
      })
    }
    pollTimestamps.push(Date.now())
    return new Response(JSON.stringify({
      status: 'succeeded',
      analyzeResult: {
        documents: [{ fields: { VendorName: { content: 'Test', confidence: 0.9 } } }],
        pages: [{ lines: [] }], tables: [],
      },
    }), { status: 200 })
  }, async () => {
    const start = Date.now()
    const p = new AzureDocIntelligenceProvider()
    await p.extract({ buffer: Buffer.from('x'), mime: 'image/png', documentType: 'SUPPLIER_INVOICE' })
    const elapsed = Date.now() - start
    // With Retry-After: 1, the first poll should happen ~1000ms after submit
    elapsed >= 900
      ? pass(`First poll waited for Retry-After (elapsed ${elapsed}ms ≥ 900ms)`)
      : fail(`First poll did not wait for Retry-After`, `elapsed: ${elapsed}ms, expected ≥ 900ms`)
  })

  clearEnv()
}

// ---------------------------------------------------------------------------
// TEST M: Field value type fallbacks (valueString, valueDate, valueNumber)
// ---------------------------------------------------------------------------
async function testM() {
  header('Test M — Field value type fallbacks (valueString, valueDate, valueNumber)')
  setEnv()

  let result: any = null
  await withMockFetch(async (url) => {
    if (String(url).includes(':analyze')) {
      return new Response('', { status: 202, headers: { 'Operation-Location': 'https://example/op' } })
    }
    return new Response(JSON.stringify({
      status: 'succeeded',
      analyzeResult: {
        documents: [{
          fields: {
            InvoiceDate:  { valueDate: '2026-06-15', confidence: 0.99 },
            TotalAmount:  { valueNumber: 450000,     confidence: 0.98 },
            VendorName:   { valueString: 'Acme Ltd', confidence: 0.97 },
            InvoiceId:    { content: 'INV-100',      confidence: 0.96 },
          },
        }],
        pages: [{ lines: [] }], tables: [],
      },
    }), { status: 200 })
  }, async () => {
    const p = new AzureDocIntelligenceProvider()
    result = await p.extract({ buffer: Buffer.from('x'), mime: 'image/png', documentType: 'SUPPLIER_INVOICE' })
  })

  const fieldNames = result?.fields?.map((f: any) => f.name) ?? []
  const getValue = (name: string) => result?.fields?.find((f: any) => f.name === name)?.value

  fieldNames.includes('InvoiceDate')
    ? pass('valueDate field extracted', `value: ${getValue('InvoiceDate')}`)
    : fail('valueDate field not extracted')

  fieldNames.includes('TotalAmount')
    ? pass('valueNumber field extracted', `value: ${getValue('TotalAmount')}`)
    : fail('valueNumber field not extracted')

  fieldNames.includes('VendorName')
    ? pass('valueString field extracted', `value: ${getValue('VendorName')}`)
    : fail('valueString field not extracted')

  fieldNames.includes('InvoiceId')
    ? pass('content field extracted', `value: ${getValue('InvoiceId')}`)
    : fail('content field not extracted')

  clearEnv()
}

// ---------------------------------------------------------------------------
// resolveProductName — inline copy for testing (mirrors worker.ts exactly)
// We test the logic here without importing the worker (which requires Redis).
// ---------------------------------------------------------------------------
function resolveProductName(
  fields: Array<{ name: string; value: string }> | undefined,
  lineNo: number
): string {
  if (!fields || fields.length === 0) return `Line ${lineNo}`
  const PRIORITY_KEYS = ['name', 'description', 'item', 'product']
  for (const key of PRIORITY_KEYS) {
    const match = fields.find((f) => f.name?.toLowerCase() === key)
    if (match?.value && String(match.value).trim() !== '') return String(match.value).trim()
  }
  const firstNonEmpty = fields.find((f) => f.value && String(f.value).trim() !== '')
  if (firstNonEmpty) return String(firstNonEmpty.value).trim()
  return `Line ${lineNo}`
}

// ---------------------------------------------------------------------------
// TEST N: resolveProductName — Azure invoice (Description field)
// ---------------------------------------------------------------------------
function testN() {
  header('Test N — resolveProductName: Azure invoice "Description" field')

  const azureLineFields = [
    { name: 'Description', value: 'Tomatoes 50kg' },
    { name: 'Quantity',    value: '50' },
    { name: 'UnitPrice',   value: '2500' },
  ]

  const result = resolveProductName(azureLineFields, 1)
  result === 'Tomatoes 50kg'
    ? pass('"Description" field used as productName', `got: "${result}"`)
    : fail('"Description" field not used', `got: "${result}"`)
}

// ---------------------------------------------------------------------------
// TEST O: resolveProductName — OpenAI extraction ("name" field)
// ---------------------------------------------------------------------------
function testO() {
  header('Test O — resolveProductName: OpenAI "name" field takes priority over "description"')

  const openaiLineFields = [
    { name: 'name',        value: 'Onions 20kg' },
    { name: 'description', value: 'Should not be used' },
    { name: 'quantity',    value: '20' },
  ]

  const result = resolveProductName(openaiLineFields, 1)
  result === 'Onions 20kg'
    ? pass('"name" field has priority over "description"', `got: "${result}"`)
    : fail('"name" field did not take priority', `got: "${result}"`)
}

// ---------------------------------------------------------------------------
// TEST P: resolveProductName — "item" and "product" aliases
// ---------------------------------------------------------------------------
function testP() {
  header('Test P — resolveProductName: "item" and "product" aliases')

  const itemFields = [{ name: 'item', value: 'Carrots 10kg' }, { name: 'qty', value: '10' }]
  const r1 = resolveProductName(itemFields, 1)
  r1 === 'Carrots 10kg'
    ? pass('"item" field used as productName', `got: "${r1}"`)
    : fail('"item" field not used', `got: "${r1}"`)

  const productFields = [{ name: 'product', value: 'Pepper 5kg' }, { name: 'price', value: '500' }]
  const r2 = resolveProductName(productFields, 2)
  r2 === 'Pepper 5kg'
    ? pass('"product" field used as productName', `got: "${r2}"`)
    : fail('"product" field not used', `got: "${r2}"`)
}

// ---------------------------------------------------------------------------
// TEST Q: resolveProductName — first non-empty field fallback
// ---------------------------------------------------------------------------
function testQ() {
  header('Test Q — resolveProductName: first non-empty field fallback')

  const unknownFields = [
    { name: 'SKU',   value: 'TOM-50KG' },
    { name: 'Price', value: '2500' },
  ]

  const result = resolveProductName(unknownFields, 3)
  result === 'TOM-50KG'
    ? pass('First non-empty field used when no priority key matches', `got: "${result}"`)
    : fail('First non-empty field not used', `got: "${result}"`)
}

// ---------------------------------------------------------------------------
// TEST R: resolveProductName — "Line N" when no usable fields
// ---------------------------------------------------------------------------
function testR() {
  header('Test R — resolveProductName: "Line N" fallback when all fields empty')

  const r1 = resolveProductName([], 5)
  r1 === 'Line 5'
    ? pass('"Line N" returned for empty fields array', `got: "${r1}"`)
    : fail('"Line N" fallback failed', `got: "${r1}"`)

  const r2 = resolveProductName(undefined, 7)
  r2 === 'Line 7'
    ? pass('"Line N" returned for undefined fields', `got: "${r2}"`)
    : fail('"Line N" fallback failed for undefined', `got: "${r2}"`)

  const r3 = resolveProductName([{ name: 'qty', value: '' }, { name: 'price', value: '  ' }], 2)
  r3 === 'Line 2'
    ? pass('"Line N" returned when all field values are blank', `got: "${r3}"`)
    : fail('"Line N" fallback failed for blank values', `got: "${r3}"`)
}

// ---------------------------------------------------------------------------
// TEST S: resolveProductName — case-insensitive key matching
// ---------------------------------------------------------------------------
function testS() {
  header('Test S — resolveProductName: case-insensitive key matching')

  const mixedCase = [
    { name: 'DESCRIPTION', value: 'Mixed Case Tomatoes' },
    { name: 'Qty',         value: '10' },
  ]
  const r1 = resolveProductName(mixedCase, 1)
  r1 === 'Mixed Case Tomatoes'
    ? pass('DESCRIPTION (uppercase) matched case-insensitively', `got: "${r1}"`)
    : fail('Uppercase DESCRIPTION not matched', `got: "${r1}"`)

  const titleCase = [{ name: 'Name', value: 'Title Case Item' }]
  const r2 = resolveProductName(titleCase, 1)
  r2 === 'Title Case Item'
    ? pass('"Name" (title case) matched case-insensitively', `got: "${r2}"`)
    : fail('"Name" title case not matched', `got: "${r2}"`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\x1b[1mAzure Provider Contract Tests + productName Resolution Tests\x1b[0m')
  console.log('\x1b[2mAll HTTP interactions are mocked — no real Azure calls are made.\x1b[0m')

  await testI()
  await testJ()
  await testK()
  await testL()
  await testM()
  testN()
  testO()
  testP()
  testQ()
  testR()
  testS()

  const total = results.length
  const passed = results.filter(r => r.pass).length
  const failedCount = total - passed

  console.log(`\n\x1b[1m${'═'.repeat(60)}\x1b[0m`)
  console.log(`\x1b[1m  Results: \x1b[32m${passed} passed\x1b[0m  ${failedCount > 0 ? `\x1b[31m${failedCount} failed\x1b[0m` : '\x1b[2m0 failed\x1b[0m'}\x1b[1m\x1b[0m`)
  console.log(`\x1b[1m${'═'.repeat(60)}\x1b[0m\n`)

  if (failedCount > 0) process.exit(1)
}

main().catch(err => {
  console.error('\x1b[31mFatal: ' + err.message + '\x1b[0m')
  process.exit(1)
})
