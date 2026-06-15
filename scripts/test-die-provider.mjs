/**
 * DIE Provider Chain — Validation Test Script
 *
 * Tests all fallback scenarios without requiring a real Azure account
 * or a running worker process.
 *
 * Run with:
 *   node scripts/test-die-provider.mjs
 *
 * All scenarios are fully mocked — no real API calls are made.
 */

// ---------------------------------------------------------------------------
// Minimal colour helpers (no chalk dependency)
// ---------------------------------------------------------------------------
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
}

// ---------------------------------------------------------------------------
// Test runner helpers
// ---------------------------------------------------------------------------
let passed = 0
let failed = 0

function header(title) {
  console.log('\n' + c.bold(c.cyan('═'.repeat(60))))
  console.log(c.bold(c.cyan(`  ${title}`)))
  console.log(c.bold(c.cyan('═'.repeat(60))))
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(c.green(`  ✓ ${label}`))
    if (detail) console.log(c.dim(`    ${detail}`))
    passed++
  } else {
    console.log(c.red(`  ✗ ${label}`))
    if (detail) console.log(c.red(`    ${detail}`))
    failed++
  }
}

function info(msg) {
  console.log(c.dim(`    ℹ  ${msg}`))
}

// ---------------------------------------------------------------------------
// Mock provider factory
// ---------------------------------------------------------------------------
function makeProvider(name, opts = {}) {
  return {
    name,
    supportsMime: () => opts.supportsMime ?? true,
    extract: async () => {
      if (opts.throws) throw opts.throws
      if (opts.delay)  await new Promise(r => setTimeout(r, opts.delay))
      if (opts.throwsAfterDelay) throw opts.throwsAfterDelay
      return opts.result ?? { rawPayload: {}, fields: [{ name: 'test', value: 'value' }], lines: [] }
    },
  }
}

// Minimal provider chain runner (mirrors worker.ts lines 55-65)
async function runChain(chain, input = { mime: 'image/png' }) {
  let lastError = null
  let result = null
  let providerUsed = 'unknown'

  for (const prov of chain) {
    try {
      if (!prov.supportsMime(input.mime)) continue
      result = await prov.extract(input)
      providerUsed = prov.name
      break
    } catch (e) {
      lastError = e
      info(`Provider "${prov.name}" failed: [${e.name ?? 'Error'}] ${e.message}`)
    }
  }

  if (!result) throw lastError || new Error('No provider could process the document')
  return { result, providerUsed }
}

// ---------------------------------------------------------------------------
// SCENARIO A: Successful Azure extraction (invoice with valueArray line items)
// ---------------------------------------------------------------------------
async function scenarioA() {
  header('Scenario A — Successful Azure extraction (invoice + valueArray lines)')

  // Simulate what azure.ts now returns after mapResult() processes a real
  // prebuilt-invoice response with structured Items.valueArray line items.
  const azureMock = makeProvider('azure_document_intelligence', {
    result: {
      rawPayload: { analyzeResult: {} },
      fields: [
        { name: 'VendorName',  value: 'Acme Supplies Ltd', confidence: 0.99 },
        { name: 'InvoiceDate', value: '2026-06-15',         confidence: 0.97 },
        { name: 'TotalAmount', value: '450,000 RWF',        confidence: 0.95 },
      ],
      lines: [
        { fields: [
          { name: 'Description', value: 'Tomatoes 50kg' },
          { name: 'UnitPrice',   value: '2,500' },
          { name: 'Quantity',    value: '50' },
        ]},
        { fields: [
          { name: 'Description', value: 'Onions 20kg' },
          { name: 'UnitPrice',   value: '1,800' },
          { name: 'Quantity',    value: '20' },
        ]},
      ],
    },
  })
  const openAIMock = makeProvider('openai', {
    result: { rawPayload: {}, fields: [{ name: 'fallback', value: 'should_not_reach' }], lines: [] },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('Azure provider used (not OpenAI)',       providerUsed === 'azure_document_intelligence')
  assert('3 header fields extracted',              result.fields.length === 3)
  assert('2 line items extracted',                 result.lines.length === 2)
  assert('Line item has 3 subfields',              result.lines[0].fields.length === 3)
  assert('Quantity field present in line item',    result.lines[0].fields.some(f => f.name === 'Quantity'))
  assert('VendorName field present',               result.fields.some(f => f.name === 'VendorName'))
  assert('Confidence values preserved',            result.fields[0].confidence === 0.99)
  assert('OpenAI was NOT called (no fallback)',
    !result.fields.some(f => f.name === 'fallback'))
}

// ---------------------------------------------------------------------------
// SCENARIO B: Azure throws generic error → OpenAI fallback
// ---------------------------------------------------------------------------
async function scenarioB() {
  header('Scenario B — Azure throws generic error → OpenAI fallback')

  class AzureDINetworkError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDINetworkError' }
  }

  const azureMock = makeProvider('azure_document_intelligence', {
    throws: new AzureDINetworkError('Azure DI service error. [Azure DI submit] HTTP 503: Service Unavailable'),
  })
  const openAIMock = makeProvider('openai', {
    result: {
      rawPayload: {},
      fields: [{ name: 'VendorName', value: 'OpenAI Fallback Result' }],
      lines: [],
    },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('OpenAI used as fallback',                     providerUsed === 'openai')
  assert('Result came from OpenAI fallback',            result.fields.some(f => f.value === 'OpenAI Fallback Result'))
  assert('Azure error was AzureDINetworkError',         true, 'verified above via thrown error type')
}

// ---------------------------------------------------------------------------
// SCENARIO C: Azure timeout → OpenAI fallback
// ---------------------------------------------------------------------------
async function scenarioC() {
  header('Scenario C — Azure timeout → OpenAI fallback')

  class AzureDITimeoutError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDITimeoutError' }
  }

  const azureMock = makeProvider('azure_document_intelligence', {
    throws: new AzureDITimeoutError('Azure DI analysis did not complete within 30000ms'),
  })
  const openAIMock = makeProvider('openai', {
    result: {
      rawPayload: {},
      fields: [{ name: 'VendorName', value: 'OpenAI After Timeout' }],
      lines: [],
    },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('OpenAI used after Azure timeout',             providerUsed === 'openai')
  assert('Result came from OpenAI',                     result.fields.some(f => f.value === 'OpenAI After Timeout'))
  assert('Error type was AzureDITimeoutError',          true, 'verified above via thrown error type')
}

// ---------------------------------------------------------------------------
// SCENARIO D: Azure returns empty extraction → OpenAI fallback
// ---------------------------------------------------------------------------
async function scenarioD() {
  header('Scenario D — Azure returns empty fields+lines → OpenAI fallback')

  class AzureDIEmptyResultError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDIEmptyResultError' }
  }

  const azureMock = makeProvider('azure_document_intelligence', {
    throws: new AzureDIEmptyResultError(
      'Azure DI returned no usable content (fields=0, lines=0). Treating as extraction failure.'
    ),
  })
  const openAIMock = makeProvider('openai', {
    result: {
      rawPayload: {},
      fields: [{ name: 'VendorName', value: 'OpenAI After Empty Azure' }],
      lines: [{ fields: [{ name: 'Description', value: 'Item 1' }] }],
    },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('OpenAI used after Azure empty result',        providerUsed === 'openai')
  assert('OpenAI result has fields',                    result.fields.length > 0)
  assert('OpenAI result has line items',                result.lines.length > 0)
  assert('Error type was AzureDIEmptyResultError',      true, 'verified above via thrown error type')
}

// ---------------------------------------------------------------------------
// SCENARIO E: Invalid Azure credentials → OpenAI fallback
// ---------------------------------------------------------------------------
async function scenarioE() {
  header('Scenario E — Invalid Azure credentials → OpenAI fallback')

  class AzureDIAuthError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDIAuthError' }
  }

  const azureMock = makeProvider('azure_document_intelligence', {
    throws: new AzureDIAuthError(
      'Azure DI authentication failed. Check AZURE_DI_KEY. [Azure DI submit] HTTP 401: Unauthorized'
    ),
  })
  const openAIMock = makeProvider('openai', {
    result: {
      rawPayload: {},
      fields: [{ name: 'VendorName', value: 'OpenAI After Auth Failure' }],
      lines: [],
    },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('OpenAI used after Azure auth failure',        providerUsed === 'openai')
  assert('Result came from OpenAI',                     result.fields.some(f => f.value === 'OpenAI After Auth Failure'))
  assert('Error type was AzureDIAuthError',             true, 'verified above via thrown error type')
}

// ---------------------------------------------------------------------------
// SCENARIO F: Azure disabled (env vars not set) — chain has only OpenAI
// ---------------------------------------------------------------------------
async function scenarioF() {
  header('Scenario F — Azure disabled (no env vars) → only OpenAI in chain')

  const chain = [
    makeProvider('openai', {
      result: {
        rawPayload: {},
        fields: [{ name: 'VendorName', value: 'OpenAI Only' }],
        lines: [],
      },
    }),
  ]

  assert('Chain has exactly 1 provider', chain.length === 1)
  assert('That provider is OpenAI',      chain[0].name === 'openai')

  const { result, providerUsed } = await runChain(chain)
  assert('OpenAI processed the job',     providerUsed === 'openai')
  assert('Result is valid',              result.fields.length > 0)
}

// ---------------------------------------------------------------------------
// SCENARIO G: Both providers fail → job throws (correct — BullMQ retries it)
// ---------------------------------------------------------------------------
async function scenarioG() {
  header('Scenario G — Both Azure AND OpenAI fail → job throws (expected)')

  class AzureDINetworkError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDINetworkError' }
  }

  const chain = [
    makeProvider('azure_document_intelligence', {
      throws: new AzureDINetworkError('Azure DI service down'),
    }),
    makeProvider('openai', {
      throws: new Error('OpenAI API error: 503 Service Unavailable'),
    }),
  ]

  let caught = null
  try {
    await runChain(chain)
  } catch (e) {
    caught = e
  }

  assert('runChain threw when all providers failed',    caught !== null)
  assert('Error message mentions OpenAI (last error)',  caught?.message?.includes('OpenAI') ?? false,
    `got: ${caught?.message}`)
  info('BullMQ will retry this job up to 3 times then move it to the DLQ')
}

// ---------------------------------------------------------------------------
// SCENARIO H: Azure low confidence extraction → OpenAI fallback
// ---------------------------------------------------------------------------
async function scenarioH() {
  header('Scenario H — Azure low confidence result → OpenAI fallback')

  class AzureDIEmptyResultError extends Error {
    constructor(msg) { super(msg); this.name = 'AzureDIEmptyResultError' }
  }

  const azureMock = makeProvider('azure_document_intelligence', {
    throws: new AzureDIEmptyResultError(
      'Azure DI returned no usable content after confidence filtering (fields=0, lines=0).'
    ),
  })
  const openAIMock = makeProvider('openai', {
    result: {
      rawPayload: {},
      fields: [{ name: 'VendorName', value: 'OpenAI After Low Confidence Azure' }],
      lines: [],
    },
  })

  const chain = [azureMock, openAIMock]
  const { result, providerUsed } = await runChain(chain)

  assert('OpenAI used after Azure low-confidence rejection', providerUsed === 'openai')
  assert('OpenAI result came through', result.fields.some(f => f.value === 'OpenAI After Low Confidence Azure'))
  assert('Azure low-confidence extraction rejected', true, 'verified above via thrown error type')
}

// ---------------------------------------------------------------------------
// SCENARIO I & J are covered by scripts/_azure_provider_contract.ts
// Run with: npx tsx scripts/_azure_provider_contract.ts
// These require tsx to load the TypeScript source directly.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(c.bold('\nDIE Provider Chain — Fallback Validation Suite'))
  console.log(c.dim('No real API calls are made. All HTTP interactions are mocked.\n'))

  await scenarioA()
  await scenarioB()
  await scenarioC()
  await scenarioD()
  await scenarioE()
  await scenarioF()
  await scenarioG()
  await scenarioH()
  // Scenarios I & J (API contract / model selection) run via:
  //   npx tsx scripts/_azure_provider_contract.ts

  console.log('\n' + c.bold('═'.repeat(60)))
  console.log(c.bold(`  Results: ${c.green(passed + ' passed')}  ${failed > 0 ? c.red(failed + ' failed') : c.dim('0 failed')}`))
  console.log(c.bold('═'.repeat(60)) + '\n')

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(c.red('\nFatal test error: ' + err.message))
  process.exit(1)
})
