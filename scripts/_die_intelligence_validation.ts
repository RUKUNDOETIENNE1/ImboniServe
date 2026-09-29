/**
 * DIE Block 4A+4B Intelligence Validation
 * ==========================================
 * Validates the intelligence pipeline end-to-end without a running BullMQ
 * worker or real AI provider.
 *
 * Strategy:
 *  - Synthetic ScanJob + ScannedDocument records are seeded directly.
 *  - ExtractedDocumentHeaderField and ExtractedDocumentLineField rows are
 *    inserted to simulate what the extract worker would have produced.
 *  - The intelligence logic (promoteHeaderFields, enrichLineItems,
 *    status transition) is executed inline against the real DB.
 *  - Each test verifies specific assertions, then cleans up after itself.
 *
 * Tests:
 *  T1 — Full pipeline: header promotion + line enrichment → INTELLIGENCE_DONE
 *  T2 — Idempotency: running the intelligence pass twice produces identical
 *       results, no duplicate rows, same field values
 *  T3 — Duplicate job guard: document not in EXTRACTED state is skipped
 *  T4 — Partial header: only fields with known aliases are promoted; unknown
 *       fields are silently ignored
 *  T5 — Low-confidence fields: validationScore is 0.5 when any field conf < 0.5
 *  T6 — European money format: "1.234,56" parsed correctly to 123456 cents
 *  T7 — Date parsing: multiple date formats all resolve to correct Date
 *  T8 — Line enrichment only: document with no header fields still enriches
 *       lines and transitions to INTELLIGENCE_DONE
 *  T9 — Empty lines: document with header fields but no line items still
 *       transitions to INTELLIGENCE_DONE
 *  T10 — Retry safety: intelligence pass on a document where header promotion
 *        previously ran (status still EXTRACTED) re-applies without error
 *
 * Run with:
 *   npx tsx scripts/_die_intelligence_validation.ts
 *
 * Safe to run against a shared staging database — all records are cleaned up
 * in try/finally blocks.
 */

import 'dotenv/config'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
const c = {
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
  blue:   (s: string) => `\x1b[34m${s}\x1b[0m`,
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
interface CheckResult { label: string; pass: boolean; detail?: string }
interface TestResult {
  name: string
  pass: boolean
  durationMs: number
  checks: CheckResult[]
  defects: string[]
}

const allResults: TestResult[] = []
const allDefects: string[] = []

function section(title: string) {
  console.log(`\n${c.bold(c.cyan('═'.repeat(66)))}`)
  console.log(c.bold(c.cyan(`  ${title}`)))
  console.log(c.bold(c.cyan('═'.repeat(66))))
}

function printCheck(r: CheckResult) {
  const icon = r.pass ? c.green('  ✓') : c.red('  ✗')
  console.log(`${icon} ${r.label}`)
  if (r.detail) console.log(c.dim(`    ${r.detail}`))
}

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({ log: [] })
const p = prisma as any

// ---------------------------------------------------------------------------
// Find a real business + user to attach test records to
// ---------------------------------------------------------------------------
async function getTestContext(): Promise<{ businessId: string; userId: string }> {
  const user = await p.user.findFirst({
    where: { businessId: { not: null } },
    select: { id: true, businessId: true },
  })
  if (!user) throw new Error('No user with a businessId found. Create one first.')
  return { businessId: user.businessId, userId: user.id }
}

// ---------------------------------------------------------------------------
// Intelligence logic — inlined from intelligence-worker.ts so the validation
// script has no import dependency on the worker module (which tries to connect
// to Redis on import).
// ---------------------------------------------------------------------------

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const HEADER_FIELD_MAP: Record<string, string[]> = {
  invoiceNumber: [
    'invoicenumber', 'invoiceid', 'invoiceno', 'invoice#', 'invoicenum',
    'inv#', 'invno', 'inv_number', 'documentnumber', 'docnumber',
  ],
  purchaseOrderNumber: [
    'purchaseordernumber', 'purchaseorderid', 'ponumber', 'po#', 'pono',
    'purchaseorder', 'orderreference', 'ordernumber',
  ],
  deliveryReference: [
    'deliveryreference', 'deliverynumber', 'deliveryno', 'deliveryid',
    'shipmentnumber', 'waybillnumber', 'dnnumber', 'dn#',
  ],
  documentDate: [
    'documentdate', 'invoicedate', 'date', 'issuedate', 'transactiondate',
    'billingdate', 'invoicedt',
  ],
  currency: [
    'currency', 'currencycode', 'invoicecurrency',
  ],
  subtotalCents: [
    'subtotal', 'subtotalamount', 'nettotal', 'netamount', 'amountbeforetax',
    'taxableamount', 'baseamount',
  ],
  taxCents: [
    'tax', 'taxamount', 'vat', 'vatamount', 'gst', 'gstamount', 'salestax',
    'taxrate', 'totaltax',
  ],
  totalCents: [
    'total', 'totalamount', 'grandtotal', 'invoicetotal', 'amountdue',
    'totaldue', 'totalincludingtax', 'amountpayable', 'totalpayable',
  ],
}

const LINE_FIELD_MAP: Record<string, string[]> = {
  quantity: [
    'quantity', 'qty', 'amount', 'units', 'count', 'numberofunits',
    'orderedqty', 'receivedqty',
  ],
  unit: [
    'unit', 'unitofmeasure', 'uom', 'measureunit', 'measure',
  ],
  unitPriceCents: [
    'unitprice', 'price', 'unitcost', 'cost', 'rate', 'priceper',
    'unitamount', 'listprice',
  ],
  totalPriceCents: [
    'totalprice', 'total', 'linetotal', 'lineamount', 'amount',
    'extendedprice', 'extendedamount', 'totalcost',
  ],
}

function buildReverseMap(map: Record<string, string[]>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [col, aliases] of Object.entries(map)) {
    for (const alias of aliases) out.set(alias, col)
  }
  return out
}

const HEADER_REVERSE = buildReverseMap(HEADER_FIELD_MAP)
const LINE_REVERSE   = buildReverseMap(LINE_FIELD_MAP)

function parseCents(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/[^\d.,]/g, '')
  if (!s) return null
  const europeanMatch = s.match(/^[\d.]+,(\d{2})$/)
  if (europeanMatch) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return Math.round(n * 100)
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const native = new Date(trimmed)
  if (!isNaN(native.getTime())) return native
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(candidate.getTime())) return candidate
  }
  return null
}

function parseQuantity(raw: string): number | null {
  if (!raw) return null
  const s = raw.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

async function promoteHeaderFields(
  tx: any,
  scannedDocumentId: string,
): Promise<{ promoted: Record<string, unknown>; lowConfidence: boolean }> {
  const rows: Array<{ fieldName: string; fieldValue: string; confidence: number | null }> =
    await tx.extractedDocumentHeaderField.findMany({
      where: { scannedDocumentId },
      select: { fieldName: true, fieldValue: true, confidence: true },
    })

  const candidates: Record<string, { value: string; confidence: number }> = {}
  for (const row of rows) {
    const targetCol = HEADER_REVERSE.get(normalizeKey(row.fieldName))
    if (!targetCol) continue
    const conf = row.confidence ?? 0
    const existing = candidates[targetCol]
    if (!existing || conf > existing.confidence) {
      candidates[targetCol] = { value: row.fieldValue, confidence: conf }
    }
  }

  const update: Record<string, unknown> = {}
  let lowConfidence = false
  const MIN_AUTO_CONFIDENCE = 0.5

  for (const [col, { value, confidence }] of Object.entries(candidates)) {
    if (!value || value.trim() === '') continue
    if (confidence < MIN_AUTO_CONFIDENCE) lowConfidence = true
    switch (col) {
      case 'invoiceNumber':
      case 'purchaseOrderNumber':
      case 'deliveryReference':
        update[col] = value.trim()
        break
      case 'currency':
        update[col] = value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || undefined
        break
      case 'documentDate': {
        const d = parseDate(value)
        if (d) update[col] = d
        break
      }
      case 'subtotalCents':
      case 'taxCents':
      case 'totalCents': {
        const cents = parseCents(value)
        if (cents !== null && cents >= 0) update[col] = cents
        break
      }
    }
  }

  if (Object.keys(update).length > 0) {
    await tx.scannedDocument.update({ where: { id: scannedDocumentId }, data: update })
  }
  return { promoted: update, lowConfidence }
}

async function enrichLineItems(
  tx: any,
  scannedDocumentId: string,
): Promise<{ enriched: number; lowConfidence: boolean }> {
  const items: Array<{ id: string }> = await tx.scannedDocumentItem.findMany({
    where: { scannedDocumentId },
    select: { id: true },
  })

  let enriched = 0
  let lowConfidence = false
  const MIN_AUTO_CONFIDENCE = 0.5

  for (const item of items) {
    const lineFields: Array<{ fieldName: string; fieldValue: string; confidence: number | null }> =
      await tx.extractedDocumentLineField.findMany({
        where: { scannedDocumentItemId: item.id },
        select: { fieldName: true, fieldValue: true, confidence: true },
      })

    if (lineFields.length === 0) continue
    const candidates: Record<string, { value: string; confidence: number }> = {}

    for (const field of lineFields) {
      const targetCol = LINE_REVERSE.get(normalizeKey(field.fieldName))
      if (!targetCol) continue
      const conf = field.confidence ?? 0
      const existing = candidates[targetCol]
      if (!existing || conf > existing.confidence) {
        candidates[targetCol] = { value: field.fieldValue, confidence: conf }
      }
    }

    const update: Record<string, unknown> = {}
    for (const [col, { value, confidence }] of Object.entries(candidates)) {
      if (!value || value.trim() === '') continue
      if (confidence < MIN_AUTO_CONFIDENCE) lowConfidence = true
      switch (col) {
        case 'quantity': {
          const q = parseQuantity(value)
          if (q !== null && q > 0) update.quantity = q
          break
        }
        case 'unit':
          update.unit = value.trim().toUpperCase().slice(0, 20)
          break
        case 'unitPriceCents': {
          const cv = parseCents(value)
          if (cv !== null && cv >= 0) update.unitPriceCents = cv
          break
        }
        case 'totalPriceCents': {
          const cv = parseCents(value)
          if (cv !== null && cv >= 0) update.totalPriceCents = cv
          break
        }
      }
    }

    if (Object.keys(update).length > 0) {
      await tx.scannedDocumentItem.update({ where: { id: item.id }, data: update })
      enriched++
    }
  }
  return { enriched, lowConfidence }
}

async function computeOverallConfidence(tx: any, scannedDocumentId: string): Promise<number | null> {
  const rows: Array<{ confidence: number | null }> =
    await tx.extractedDocumentHeaderField.findMany({
      where: { scannedDocumentId },
      select: { confidence: true },
    })
  const withConf = rows.filter((r: any) => r.confidence !== null)
  if (withConf.length === 0) return null
  const avg = withConf.reduce((sum: number, r: any) => sum + r.confidence, 0) / withConf.length
  return Math.round(avg * 1000) / 1000
}

/**
 * Run the full intelligence pass on a ScannedDocument, exactly as the worker does.
 * Returns { skipped, headerFieldsPromoted, lineItemsEnriched }.
 */
async function runIntelligencePass(scannedDocumentId: string, scanJobId: string): Promise<{
  skipped: boolean
  reason?: string
  headerFieldsPromoted?: number
  lineItemsEnriched?: number
}> {
  const doc = await p.scannedDocument.findUnique({
    where: { id: scannedDocumentId },
    select: { id: true, status: true },
  })
  if (!doc) throw new Error(`ScannedDocument not found: ${scannedDocumentId}`)
  if (doc.status !== 'EXTRACTED') {
    return { skipped: true, reason: `status=${doc.status}` }
  }

  await p.documentProcessingLog.create({
    data: { scanJobId, stage: 'intelligence', level: 'info', message: 'Intelligence pass started (validation)', payload: { scannedDocumentId } },
  })

  const headerResult = await p.$transaction(
    (tx: any) => promoteHeaderFields(tx, scannedDocumentId),
    { timeout: 20000 },
  )

  const lineResult = await p.$transaction(
    (tx: any) => enrichLineItems(tx, scannedDocumentId),
    { timeout: 20000 },
  )

  const anyLowConf = headerResult.lowConfidence || lineResult.lowConfidence

  await p.$transaction(async (tx: any) => {
    const confidenceOverall = await computeOverallConfidence(tx, scannedDocumentId)
    const validationScore = confidenceOverall === null ? null : anyLowConf ? 0.5 : confidenceOverall
    await tx.scannedDocument.update({
      where: { id: scannedDocumentId },
      data: {
        status: 'INTELLIGENCE_DONE',
        confidenceOverall: confidenceOverall ?? undefined,
        validationScore: validationScore ?? undefined,
      },
    })
  }, { timeout: 10000 })

  await p.documentProcessingLog.create({
    data: { scanJobId, stage: 'intelligence', level: 'info', message: 'Intelligence pass complete (validation)', payload: { scannedDocumentId } },
  })

  return {
    skipped: false,
    headerFieldsPromoted: Object.keys(headerResult.promoted).length,
    lineItemsEnriched: lineResult.enriched,
  }
}

// ---------------------------------------------------------------------------
// Fixture builder helpers
// ---------------------------------------------------------------------------

function uniqueHash() {
  return crypto.randomBytes(16).toString('hex')
}

async function seedScanJob(businessId: string, userId: string) {
  return p.scanJob.create({
    data: {
      businessId,
      createdByUserId: userId,
      documentType: 'SUPPLIER_INVOICE',
      sourceFileKey: `die/test/${uniqueHash()}.pdf`,
      sourceMime: 'application/pdf',
      sourceHash: uniqueHash(),
      status: 'EXTRACTED',
    },
  })
}

async function seedScannedDocument(scanJobId: string, businessId: string, status = 'EXTRACTED') {
  return p.scannedDocument.create({
    data: {
      scanJobId,
      businessId,
      documentType: 'SUPPLIER_INVOICE',
      status,
    },
  })
}

async function seedHeaderFields(
  scannedDocumentId: string,
  fields: Array<{ name: string; value: string; confidence?: number }>,
) {
  return p.extractedDocumentHeaderField.createMany({
    data: fields.map((f) => ({
      scannedDocumentId,
      fieldName: f.name,
      fieldValue: f.value,
      confidence: f.confidence ?? 0.9,
      source: 'test',
    })),
  })
}

async function seedLineItem(
  scannedDocumentId: string,
  lineNo: number,
  productName: string,
  fields: Array<{ name: string; value: string; confidence?: number }>,
) {
  const item = await p.scannedDocumentItem.create({
    data: {
      scannedDocumentId,
      lineNo,
      productName,
      quantity: 0,
      unit: 'UNIT',
    },
  })
  if (fields.length > 0) {
    await p.extractedDocumentLineField.createMany({
      data: fields.map((f) => ({
        scannedDocumentItemId: item.id,
        fieldName: f.name,
        fieldValue: f.value,
        confidence: f.confidence ?? 0.9,
      })),
    })
  }
  return item
}

async function cleanupScanJob(scanJobId: string) {
  // Cascade deletes via Prisma cascade: ScannedDocument → items/fields/logs
  try { await p.scanJob.delete({ where: { id: scanJobId } }) } catch { /* may already be gone */ }
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

async function runTest(
  name: string,
  fn: () => Promise<CheckResult[]>,
): Promise<TestResult> {
  const started = Date.now()
  const checks: CheckResult[] = []
  const defects: string[] = []
  let pass = true

  console.log(`\n${c.blue('▶')} ${c.bold(name)}`)

  try {
    const results = await fn()
    for (const r of results) {
      printCheck(r)
      checks.push(r)
      if (!r.pass) {
        pass = false
        defects.push(`${name}: ${r.label}`)
      }
    }
  } catch (err: any) {
    pass = false
    const msg = `THREW: ${err?.message}`
    const r = { label: msg, pass: false }
    printCheck(r)
    checks.push(r)
    defects.push(`${name}: ${msg}`)
  }

  const durationMs = Date.now() - started
  console.log(c.dim(`  (${durationMs}ms)`))

  const result = { name, pass, durationMs, checks, defects }
  allResults.push(result)
  allDefects.push(...defects)
  return result
}

// ---------------------------------------------------------------------------
// T1 — Full pipeline: header + lines → INTELLIGENCE_DONE
// ---------------------------------------------------------------------------
async function t1_fullPipeline(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber', value: 'INV-2026-001', confidence: 0.95 },
    { name: 'InvoiceDate',   value: '2026-01-15',   confidence: 0.92 },
    { name: 'Total',         value: 'RWF 150,000',  confidence: 0.88 },
    { name: 'Subtotal',      value: '127,118',      confidence: 0.87 },
    { name: 'VAT',           value: '22,882',       confidence: 0.85 },
    { name: 'Currency',      value: 'RWF',          confidence: 0.99 },
    { name: 'PO Number',     value: 'PO-2026-007',  confidence: 0.80 },
  ])

  await seedLineItem(doc.id, 1, 'Tomatoes', [
    { name: 'Quantity',   value: '50',    confidence: 0.9 },
    { name: 'UOM',        value: 'KG',    confidence: 0.9 },
    { name: 'Unit Price', value: '1,500', confidence: 0.88 },
    { name: 'Total',      value: '75,000',confidence: 0.87 },
  ])

  await seedLineItem(doc.id, 2, 'Onions', [
    { name: 'Quantity',   value: '30',    confidence: 0.9 },
    { name: 'UOM',        value: 'KG',    confidence: 0.9 },
    { name: 'Unit Price', value: '2,500', confidence: 0.88 },
    { name: 'Total',      value: '75,000',confidence: 0.87 },
  ])

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)

    checks.push({ label: 'Intelligence pass not skipped', pass: !res.skipped })
    checks.push({ label: '2 header fields promoted (invoiceNumber, invoiceDate or similar)', pass: (res.headerFieldsPromoted ?? 0) >= 2, detail: `promoted=${res.headerFieldsPromoted}` })
    checks.push({ label: '2 line items enriched', pass: res.lineItemsEnriched === 2, detail: `enriched=${res.lineItemsEnriched}` })

    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE', detail: `status=${updated.status}` })
    checks.push({ label: 'invoiceNumber promoted to INV-2026-001', pass: updated.invoiceNumber === 'INV-2026-001', detail: `invoiceNumber=${updated.invoiceNumber}` })
    checks.push({ label: 'purchaseOrderNumber promoted to PO-2026-007', pass: updated.purchaseOrderNumber === 'PO-2026-007', detail: `purchaseOrderNumber=${updated.purchaseOrderNumber}` })
    checks.push({ label: 'totalCents promoted (150000 * 100 = 15000000)', pass: updated.totalCents === 15000000, detail: `totalCents=${updated.totalCents}` })
    checks.push({ label: 'subtotalCents promoted (127118 * 100)', pass: updated.subtotalCents === 12711800, detail: `subtotalCents=${updated.subtotalCents}` })
    checks.push({ label: 'taxCents promoted (22882 * 100)', pass: updated.taxCents === 2288200, detail: `taxCents=${updated.taxCents}` })
    checks.push({ label: 'currency = RWF', pass: updated.currency === 'RWF', detail: `currency=${updated.currency}` })
    checks.push({ label: 'confidenceOverall set', pass: updated.confidenceOverall !== null, detail: `conf=${updated.confidenceOverall}` })

    const items = await p.scannedDocumentItem.findMany({ where: { scannedDocumentId: doc.id }, orderBy: { lineNo: 'asc' } })
    checks.push({ label: 'line 1 quantity = 50', pass: items[0].quantity === 50, detail: `qty=${items[0].quantity}` })
    checks.push({ label: 'line 1 unit = KG', pass: items[0].unit === 'KG', detail: `unit=${items[0].unit}` })
    checks.push({ label: 'line 1 unitPriceCents = 150000', pass: items[0].unitPriceCents === 150000, detail: `unitPrice=${items[0].unitPriceCents}` })
    checks.push({ label: 'line 1 totalPriceCents = 7500000', pass: items[0].totalPriceCents === 7500000, detail: `totalPrice=${items[0].totalPriceCents}` })
    checks.push({ label: 'line 2 quantity = 30', pass: items[1].quantity === 30, detail: `qty=${items[1].quantity}` })

    const logs = await p.documentProcessingLog.findMany({ where: { scanJobId: job.id }, orderBy: { createdAt: 'asc' } })
    checks.push({ label: 'DocumentProcessingLog entries written', pass: logs.length >= 2, detail: `logs=${logs.length}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T2 — Idempotency: running the pass twice produces identical results
// ---------------------------------------------------------------------------
async function t2_idempotency(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber', value: 'INV-IDEM-001', confidence: 0.95 },
    { name: 'Total',         value: '50,000',       confidence: 0.9  },
  ])
  await seedLineItem(doc.id, 1, 'Widget', [
    { name: 'Quantity', value: '10', confidence: 0.9 },
    { name: 'UOM',      value: 'PC', confidence: 0.9 },
  ])

  const checks: CheckResult[] = []
  try {
    // First pass
    await runIntelligencePass(doc.id, job.id)
    const afterFirst = await p.scannedDocument.findUnique({ where: { id: doc.id } })

    // Reset status to EXTRACTED so the second pass is allowed to run
    await p.scannedDocument.update({ where: { id: doc.id }, data: { status: 'EXTRACTED' } })

    // Second pass — must produce identical field values, no duplicate rows
    await runIntelligencePass(doc.id, job.id)
    const afterSecond = await p.scannedDocument.findUnique({ where: { id: doc.id } })

    checks.push({ label: 'status INTELLIGENCE_DONE after second pass', pass: afterSecond.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: 'invoiceNumber unchanged after second pass', pass: afterSecond.invoiceNumber === afterFirst.invoiceNumber, detail: `first=${afterFirst.invoiceNumber} second=${afterSecond.invoiceNumber}` })
    checks.push({ label: 'totalCents unchanged after second pass', pass: afterSecond.totalCents === afterFirst.totalCents, detail: `first=${afterFirst.totalCents} second=${afterSecond.totalCents}` })

    // Verify no duplicate ExtractedDocumentHeaderField rows were created
    const headerCount = await p.extractedDocumentHeaderField.count({ where: { scannedDocumentId: doc.id } })
    checks.push({ label: 'No duplicate header field rows (count = 2)', pass: headerCount === 2, detail: `headerFieldCount=${headerCount}` })

    const items = await p.scannedDocumentItem.findMany({ where: { scannedDocumentId: doc.id } })
    checks.push({ label: 'No duplicate ScannedDocumentItem rows (count = 1)', pass: items.length === 1, detail: `itemCount=${items.length}` })

    // line item quantity still correct
    checks.push({ label: 'Line item quantity still = 10 after second pass', pass: items[0].quantity === 10, detail: `qty=${items[0].quantity}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T3 — Duplicate job guard: document not in EXTRACTED state is skipped
// ---------------------------------------------------------------------------
async function t3_duplicateJobGuard(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  // Seed document already in INTELLIGENCE_DONE
  const doc = await seedScannedDocument(job.id, ctx.businessId, 'INTELLIGENCE_DONE')

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Pass is skipped when status = INTELLIGENCE_DONE', pass: res.skipped === true, detail: `reason=${res.reason}` })
    checks.push({ label: 'No fields promoted (skipped)', pass: res.headerFieldsPromoted === undefined })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// T3b — REVIEW state also skipped
async function t3b_reviewStateSkipped(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId, 'REVIEW')

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Pass skipped when status = REVIEW', pass: res.skipped === true, detail: `reason=${res.reason}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T4 — Unknown field names are silently ignored
// ---------------------------------------------------------------------------
async function t4_unknownFieldsIgnored(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber',   value: 'INV-UNK-001', confidence: 0.9 },
    { name: 'WeirdCustomField',value: 'some-value',   confidence: 0.9 },
    { name: 'AnotherUnknown',  value: 'other-value',  confidence: 0.9 },
  ])

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Pass completes without error', pass: !res.skipped })
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: 'invoiceNumber promoted (known field)', pass: updated.invoiceNumber === 'INV-UNK-001', detail: `value=${updated.invoiceNumber}` })
    // Unknown fields should not land anywhere on ScannedDocument — the known structured cols should stay null
    checks.push({ label: 'totalCents remains null (unknown field not promoted)', pass: updated.totalCents === null, detail: `totalCents=${updated.totalCents}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T5 — Low-confidence fields → validationScore = 0.5
// ---------------------------------------------------------------------------
async function t5_lowConfidence(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber', value: 'INV-LOWCONF', confidence: 0.95 },
    { name: 'Total',         value: '10,000',      confidence: 0.25 }, // low
  ])

  const checks: CheckResult[] = []
  try {
    await runIntelligencePass(doc.id, job.id)
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: 'validationScore = 0.5 (low confidence detected)', pass: updated.validationScore === 0.5, detail: `validationScore=${updated.validationScore}` })
    checks.push({ label: 'totalCents still promoted despite low conf', pass: updated.totalCents === 1000000, detail: `totalCents=${updated.totalCents}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T6 — European money format "1.234,56" parsed to 123456 cents
// ---------------------------------------------------------------------------
async function t6_europeanMoneyFormat(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'Total', value: '1.234,56', confidence: 0.9 },   // European: 1234.56
    { name: 'Subtotal', value: '1,234.56', confidence: 0.9 }, // US: 1234.56
  ])

  const checks: CheckResult[] = []
  try {
    await runIntelligencePass(doc.id, job.id)
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    // Total wins with best confidence (both 0.9 — first seen = European)
    checks.push({ label: 'totalCents = 123456 (European "1.234,56")', pass: updated.totalCents === 123456, detail: `totalCents=${updated.totalCents}` })
    checks.push({ label: 'subtotalCents = 123456 (US "1,234.56")', pass: updated.subtotalCents === 123456, detail: `subtotalCents=${updated.subtotalCents}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T7 — Date parsing: multiple formats
// ---------------------------------------------------------------------------
async function t7_dateParsing(): Promise<CheckResult[]> {
  // ISO 8601 is always stored as midnight UTC, so UTC components are correct.
  // Other formats are parsed as midnight in the local timezone (Node.js Date constructor),
  // so we compare the ISO date string prefix instead of UTC components.
  const tests: Array<{ label: string; input: string; expectedDateStr: string }> = [
    { label: 'ISO 8601',           input: '2026-03-15',  expectedDateStr: '2026-03-15' },
    { label: 'DD/MM/YYYY',         input: '15/03/2026',  expectedDateStr: '2026-03-15' },
    { label: 'DD-MM-YYYY',         input: '15-03-2026',  expectedDateStr: '2026-03-15' },
    { label: 'US MM/DD/YYYY fallback', input: '12/31/2026', expectedDateStr: '2026-12-31' },
  ]

  const checks: CheckResult[] = []

  for (const t of tests) {
    const ctx = await getTestContext()
    const job = await seedScanJob(ctx.businessId, ctx.userId)
    const doc = await seedScannedDocument(job.id, ctx.businessId)
    await seedHeaderFields(doc.id, [
      { name: 'InvoiceDate', value: t.input, confidence: 0.9 },
    ])
    try {
      await runIntelligencePass(doc.id, job.id)
      const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
      const d = updated.documentDate ? new Date(updated.documentDate) : null
      // Compare local date components (toLocaleDateString → YYYY-MM-DD) to avoid
      // UTC-vs-local timezone mismatches when the DB stores midnight local time.
      let localDateStr: string | null = null
      if (d) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dy = String(d.getDate()).padStart(2, '0')
        localDateStr = `${y}-${m}-${dy}`
      }
      const pass = localDateStr === t.expectedDateStr
      checks.push({
        label: `Date format "${t.label}" (${t.input})`,
        pass,
        detail: d ? `parsed=${d.toISOString()} local=${localDateStr}` : 'null',
      })
    } finally {
      await cleanupScanJob(job.id)
    }
  }

  return checks
}

// ---------------------------------------------------------------------------
// T8 — No header fields: lines still enriched → INTELLIGENCE_DONE
// ---------------------------------------------------------------------------
async function t8_noHeaderFields(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedLineItem(doc.id, 1, 'Coffee', [
    { name: 'Quantity', value: '5', confidence: 0.9 },
    { name: 'UOM',      value: 'KG', confidence: 0.9 },
  ])

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Pass completes (no header fields)', pass: !res.skipped })
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: '0 header fields promoted', pass: res.headerFieldsPromoted === 0, detail: `promoted=${res.headerFieldsPromoted}` })
    checks.push({ label: '1 line enriched', pass: res.lineItemsEnriched === 1, detail: `enriched=${res.lineItemsEnriched}` })
    const items = await p.scannedDocumentItem.findMany({ where: { scannedDocumentId: doc.id } })
    checks.push({ label: 'Line item quantity = 5', pass: items[0].quantity === 5 })
    checks.push({ label: 'Line item unit = KG', pass: items[0].unit === 'KG' })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T9 — No line items: header promoted, still INTELLIGENCE_DONE
// ---------------------------------------------------------------------------
async function t9_noLineItems(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber', value: 'INV-NOLINE', confidence: 0.95 },
  ])
  // No line items seeded

  const checks: CheckResult[] = []
  try {
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Pass completes (no line items)', pass: !res.skipped })
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: 'invoiceNumber promoted', pass: updated.invoiceNumber === 'INV-NOLINE' })
    checks.push({ label: '0 items enriched', pass: res.lineItemsEnriched === 0, detail: `enriched=${res.lineItemsEnriched}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// T10 — Retry safety: re-running on EXTRACTED (simulated partial failure)
//        re-applies header promotion without error and reaches INTELLIGENCE_DONE
// ---------------------------------------------------------------------------
async function t10_retrySafety(): Promise<CheckResult[]> {
  const ctx = await getTestContext()
  const job = await seedScanJob(ctx.businessId, ctx.userId)
  const doc = await seedScannedDocument(job.id, ctx.businessId)

  await seedHeaderFields(doc.id, [
    { name: 'InvoiceNumber', value: 'INV-RETRY', confidence: 0.95 },
    { name: 'Total',         value: '20,000',    confidence: 0.9 },
  ])

  const checks: CheckResult[] = []
  try {
    // Simulate partial first pass: promote headers but do NOT advance status
    // (mimics a crash after stage 1 before stage 3)
    await p.$transaction(
      (tx: any) => promoteHeaderFields(tx, doc.id),
      { timeout: 20000 },
    )
    // Status is still EXTRACTED — verify that
    const midState = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'Status remains EXTRACTED after partial run', pass: midState.status === 'EXTRACTED' })

    // Now run the full pass — it re-applies header promotion (upsert pattern via update) without error
    const res = await runIntelligencePass(doc.id, job.id)
    checks.push({ label: 'Full pass completes after partial run', pass: !res.skipped })
    const updated = await p.scannedDocument.findUnique({ where: { id: doc.id } })
    checks.push({ label: 'status = INTELLIGENCE_DONE', pass: updated.status === 'INTELLIGENCE_DONE' })
    checks.push({ label: 'invoiceNumber still correct', pass: updated.invoiceNumber === 'INV-RETRY', detail: `value=${updated.invoiceNumber}` })
    checks.push({ label: 'totalCents still correct', pass: updated.totalCents === 2000000, detail: `totalCents=${updated.totalCents}` })
  } finally {
    await cleanupScanJob(job.id)
  }
  return checks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  section('DIE Block 4A+4B — Intelligence Pipeline Validation')
  const dbHost = (process.env.DATABASE_URL ?? '').split('@')[1]?.split('/')[0] ?? 'configured DB'
  console.log(c.dim('  Testing against database: ' + dbHost))

  await runTest('T1 — Full pipeline (header + lines → INTELLIGENCE_DONE)', t1_fullPipeline)
  await runTest('T2 — Idempotency (running pass twice = same result, no duplicates)', t2_idempotency)
  await runTest('T3 — Duplicate job guard (INTELLIGENCE_DONE skipped)', t3_duplicateJobGuard)
  await runTest('T3b — Duplicate job guard (REVIEW status skipped)', t3b_reviewStateSkipped)
  await runTest('T4 — Unknown field names silently ignored', t4_unknownFieldsIgnored)
  await runTest('T5 — Low-confidence fields → validationScore = 0.5', t5_lowConfidence)
  await runTest('T6 — European money format parsed correctly', t6_europeanMoneyFormat)
  await runTest('T7 — Date parsing (ISO, DD/MM/YYYY, DD-MM-YYYY, US)', t7_dateParsing)
  await runTest('T8 — No header fields: lines still enriched', t8_noHeaderFields)
  await runTest('T9 — No line items: header promoted → INTELLIGENCE_DONE', t9_noLineItems)
  await runTest('T10 — Retry safety (partial failure re-runs cleanly)', t10_retrySafety)

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  section('Summary')

  const totalTests = allResults.length
  const passedTests = allResults.filter((r) => r.pass).length
  const failedTests = totalTests - passedTests
  const totalChecks = allResults.reduce((s, r) => s + r.checks.length, 0)
  const passedChecks = allResults.reduce((s, r) => s + r.checks.filter((c) => c.pass).length, 0)

  console.log()
  for (const r of allResults) {
    const icon = r.pass ? c.green('  ✓') : c.red('  ✗')
    console.log(`${icon} ${r.name}  ${c.dim(`(${r.durationMs}ms)`)}`)
  }

  console.log()
  const testLine = `Tests: ${passedTests}/${totalTests} passed`
  const checkLine = `Assertions: ${passedChecks}/${totalChecks} passed`
  console.log(failedTests === 0 ? c.green(c.bold(`  ${testLine}`)) : c.red(c.bold(`  ${testLine}`)))
  console.log(passedChecks === totalChecks ? c.green(`  ${checkLine}`) : c.red(`  ${checkLine}`))

  if (allDefects.length > 0) {
    console.log(`\n${c.red(c.bold('  Failures:'))}`)
    for (const d of allDefects) {
      console.log(c.red(`    • ${d}`))
    }
  }

  console.log()

  await prisma.$disconnect()
  process.exit(failedTests > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(c.red('Fatal: ' + e.message))
  process.exit(1)
})
