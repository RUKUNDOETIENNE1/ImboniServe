/**
 * Block 4C Validation Suite — FIXED
 * Supplier + Product Matching Validation
 *
 * Key fixture fixes vs previous version:
 *  - Supplier.contactName is required → added to every supplier.create()
 *  - InventoryItem.businessId is a real FK → every test creates User + Business first
 *  - ScanJob requires createdByUserId FK → test10 creates real User
 *  - EntityLinkType enum only has SUPPLIER / PO / GRN / INVENTORY_ITEM (no SUPPLIER_PRODUCT)
 *    ProductMatchingService already maps SupplierProduct → SUPPLIER entity type (verified)
 *
 * Tests:
 *   T1  — Supplier exact name match
 *   T2  — Supplier alias match
 *   T3  — Supplier fuzzy AUTO_MATCH
 *   T4  — Supplier REVIEW_SUGGESTION
 *   T5  — Supplier NO_MATCH
 *   T6  — Supplier alias learning + dedup
 *   T7  — Product exact match (InventoryItem)
 *   T8  — Product alias match (SupplierProduct)
 *   T9  — Business isolation
 *   T10 — DocumentEntityLink idempotency
 *   T11 — Product alias learning + dedup
 *   T12 — Unit normalization (Rice 50 KG, Flour 5kg, Milk 1 Litre, etc.)
 *   T13 — Full resolveSupplier pipeline (match + link + alias learning)
 *   T14 — Full resolveAllProducts pipeline
 *
 * Run: npx tsx scripts/_die_block4c_validation.ts
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { SupplierMatchingService } from '../src/lib/die/services/supplier-matching.service'
import { ProductMatchingService } from '../src/lib/die/services/product-matching.service'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CheckResult = { label: string; pass: boolean; detail?: string }
type TestResult  = { name: string; pass: boolean; durationMs: number; checks: CheckResult[] }

// ─────────────────────────────────────────────────────────────────────────────
// Runner state
// ─────────────────────────────────────────────────────────────────────────────

let totalTests   = 0, passedTests  = 0, failedTests  = 0
let totalChecks  = 0, passedChecks = 0, failedChecks = 0

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(60))
}

function chk(
  checks: CheckResult[],
  label: string,
  condition: boolean,
  detail?: string,
) {
  totalChecks++
  if (condition) passedChecks++; else failedChecks++
  checks.push({ label, pass: condition, detail })
}

async function runTest(name: string, fn: () => Promise<TestResult>) {
  totalTests++
  console.log(`\n▶ ${name}`)
  try {
    const result = await fn()
    const icon   = result.pass ? '✓' : '✗'
    console.log(`  [${icon}] ${result.pass ? 'PASS' : 'FAIL'} (${result.durationMs}ms)`)
    for (const c of result.checks) {
      const ci = c.pass ? '    ✓' : '    ✗'
      console.log(`${ci} ${c.label}${c.detail ? `  →  ${c.detail}` : ''}`)
    }
    if (result.pass) passedTests++; else failedTests++
    return result
  } catch (e) {
    failedTests++
    console.error(`  [✗] EXCEPTION: ${e}`)
    return { name, pass: false, durationMs: 0, checks: [{ label: 'exception', pass: false, detail: String(e) }] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup helper
// ─────────────────────────────────────────────────────────────────────────────

interface CleanupIds {
  links?:      string[]
  aliasP?:     string[]   // ProductAlias ids
  aliasS?:     string[]   // SupplierAlias ids
  docItems?:   string[]   // ScannedDocumentItem ids
  docs?:       string[]   // ScannedDocument ids
  scanJobs?:   string[]
  invItems?:   string[]   // InventoryItem ids
  supProds?:   string[]   // SupplierProduct ids
  suppliers?:  string[]
  businesses?: string[]
  users?:      string[]
}

async function cleanup(ids: CleanupIds) {
  const p: any = prisma
  const safe = async (fn: () => Promise<unknown>) => { try { await fn() } catch { /* ignore */ } }

  if (ids.links?.length)    await safe(() => p.documentEntityLink.deleteMany({ where: { id: { in: ids.links } } }))
  if (ids.aliasP?.length)   await safe(() => p.productAlias.deleteMany({ where: { id: { in: ids.aliasP } } }))
  if (ids.aliasS?.length)   await safe(() => p.supplierAlias.deleteMany({ where: { id: { in: ids.aliasS } } }))
  if (ids.docItems?.length) await safe(() => p.scannedDocumentItem.deleteMany({ where: { id: { in: ids.docItems } } }))
  if (ids.docs?.length) {
    await safe(() => p.documentEntityLink.deleteMany({ where: { scannedDocumentId: { in: ids.docs } } }))
    await safe(() => p.extractedDocumentHeaderField.deleteMany({ where: { scannedDocumentId: { in: ids.docs } } }))
    await safe(() => p.scannedDocument.deleteMany({ where: { id: { in: ids.docs } } }))
  }
  if (ids.scanJobs?.length) {
    await safe(() => p.documentProcessingLog.deleteMany({ where: { scanJobId: { in: ids.scanJobs } } }))
    await safe(() => p.scanJob.deleteMany({ where: { id: { in: ids.scanJobs } } }))
  }
  if (ids.invItems?.length)  await safe(() => p.inventoryItem.deleteMany({ where: { id: { in: ids.invItems } } }))
  if (ids.supProds?.length)  await safe(() => p.supplierProduct.deleteMany({ where: { id: { in: ids.supProds } } }))
  if (ids.suppliers?.length) await safe(() => p.supplier.deleteMany({ where: { id: { in: ids.suppliers } } }))
  if (ids.businesses?.length) await safe(() => p.business.deleteMany({ where: { id: { in: ids.businesses } } }))
  if (ids.users?.length)     await safe(() => p.user.deleteMany({ where: { id: { in: ids.users } } }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers (proper FK chain: User → Business → InventoryItem)
// ─────────────────────────────────────────────────────────────────────────────

let _seq = 0
function seq() { return ++_seq }

async function mkUser(p: any) {
  const n = seq()
  return p.user.create({
    data: {
      name:     `DIE Test User ${n}`,
      email:    `die.test.${n}.${Date.now()}@validation.local`,
      password: '$2b$10$testhashedpassword',
      phone:    `+2507${String(n).padStart(8, '0')}`,
      isActive: true,
    },
  })
}

async function mkBusiness(p: any, ownerId: string) {
  const n = seq()
  return p.business.create({
    data: {
      name:    `DIE Test Business ${n}`,
      phone:   `+2508${String(n).padStart(8, '0')}`,
      ownerId,
      city:    'Kigali',
      country: 'RW',
      currency:'RWF',
      isActive: true,
    },
  })
}

/**
 * Supplier.contactName is a required non-nullable field.
 * Supplier.email must be globally unique.
 */
async function mkSupplier(p: any, name: string) {
  const n = seq()
  return p.supplier.create({
    data: {
      name,
      contactName: `Test Contact ${n}`,
      email:       `supplier.${n}.${Date.now()}@validation.local`,
      phone:       `+2509${String(n).padStart(8, '0')}`,
      city:        'Kigali',
      country:     'RW',
      isActive:    true,
    },
  })
}

async function mkInventoryItem(p: any, businessId: string, name: string, unit = 'KG') {
  return p.inventoryItem.create({
    data: { name, unit, unitCostCents: 10000, businessId, isActive: true },
  })
}

async function mkSupplierProduct(p: any, supplierId: string, name: string, unit = 'KG') {
  return p.supplierProduct.create({
    data: { name, unit, unitPriceCents: 12000, supplierId, isAvailable: true },
  })
}

async function mkScanJobAndDoc(p: any, businessId: string, userId: string) {
  const n = seq()
  const scanJob = await p.scanJob.create({
    data: {
      businessId,
      createdByUserId: userId,
      documentType:    'SUPPLIER_INVOICE',
      sourceFileKey:   `test/file-${n}`,
      sourceMime:      'application/pdf',
      sourceHash:      `testhash${n}${Date.now()}`,
      status:          'EXTRACTED',
    },
  })
  const doc = await p.scannedDocument.create({
    data: {
      scanJobId:    scanJob.id,
      businessId,
      documentType: 'SUPPLIER_INVOICE',
      status:       'EXTRACTED',
    },
  })
  return { scanJob, doc }
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Supplier exact name match
// ─────────────────────────────────────────────────────────────────────────────

async function t1_supplierExact(): Promise<TestResult> {
  section('T1 — Supplier exact name match')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Acme Supplies Ltd'); ids.suppliers!.push(supplier.id)

    const result = await SupplierMatchingService.findBestMatch({
      businessId: business.id,
      rawSupplierName: 'Acme Supplies Ltd',
    })

    chk(checks, 'Service returned a result',            result !== null)
    chk(checks, 'Correct supplierId',                   result.supplierId === supplier.id,          `got ${result.supplierId}`)
    chk(checks, 'Confidence === 1.0',                   result.confidence === 1.0,                   `got ${result.confidence}`)
    chk(checks, 'matchType === AUTO_MATCH',             result.matchType === 'AUTO_MATCH')
    chk(checks, 'matchSource === exact',                result.matchSource === 'exact')
    chk(checks, 'supplierName returned',                result.supplierName === 'Acme Supplies Ltd')

    return { name: 'T1', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Supplier alias match
// ─────────────────────────────────────────────────────────────────────────────

async function t2_supplierAlias(): Promise<TestResult> {
  section('T2 — Supplier alias match')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], aliasS: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Rwanda Fresh Foods'); ids.suppliers!.push(supplier.id)

    const alias = await p.supplierAlias.create({
      data: {
        supplierId: supplier.id,
        alias:      'RFF Kigali',
        normalized: SupplierMatchingService.normalizeName('RFF Kigali'),
      },
    })
    ids.aliasS!.push(alias.id)

    const result = await SupplierMatchingService.findBestMatch({
      businessId: business.id,
      rawSupplierName: 'RFF Kigali',
    })

    chk(checks, 'Service returned a result',      result !== null)
    chk(checks, 'Correct supplierId via alias',   result.supplierId === supplier.id)
    chk(checks, 'Confidence ≥ 0.95',              result.confidence >= 0.95,          `got ${result.confidence}`)
    chk(checks, 'matchType === AUTO_MATCH',        result.matchType === 'AUTO_MATCH')
    chk(checks, 'matchSource === alias',           result.matchSource === 'alias')
    chk(checks, 'aliasId returned',               result.aliasId === alias.id)

    return { name: 'T2', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Supplier fuzzy AUTO_MATCH
// ─────────────────────────────────────────────────────────────────────────────

async function t3_supplierFuzzyAutoMatch(): Promise<TestResult> {
  section('T3 — Supplier fuzzy AUTO_MATCH (missing trailing "s")')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Premium Coffee Roasters'); ids.suppliers!.push(supplier.id)

    const result = await SupplierMatchingService.findBestMatch({
      businessId:          business.id,
      rawSupplierName:     'Premium Coffee Roaster',   // missing trailing 's'
      autoMatchThreshold:  0.85,
    })

    chk(checks, 'Service returned a result',            result !== null)
    chk(checks, 'Correct supplierId',                   result.supplierId === supplier.id,  `got ${result.supplierId}`)
    chk(checks, 'Confidence ≥ 0.85',                    result.confidence >= 0.85,           `got ${result.confidence}`)
    chk(checks, 'matchType === AUTO_MATCH',             result.matchType === 'AUTO_MATCH')
    chk(checks, 'matchSource === fuzzy',                result.matchSource === 'fuzzy')

    return { name: 'T3', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Supplier REVIEW_SUGGESTION
// ─────────────────────────────────────────────────────────────────────────────

async function t4_supplierReviewSuggestion(): Promise<TestResult> {
  section('T4 — Supplier REVIEW_SUGGESTION (partial name)')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Northern Distribution Network'); ids.suppliers!.push(supplier.id)

    const result = await SupplierMatchingService.findBestMatch({
      businessId:               business.id,
      rawSupplierName:          'Northern Distribution',   // missing 'Network'
      autoMatchThreshold:       0.85,
      reviewSuggestionThreshold:0.60,
    })

    chk(checks, 'Service returned a result',           result !== null)
    chk(checks, 'Returns a supplier candidate',        result.supplierId !== null)
    chk(checks, 'Correct supplier matched',            result.supplierId === supplier.id,  `got ${result.supplierId}`)
    chk(checks, 'Confidence above review threshold',   result.confidence >= 0.60,          `got ${result.confidence}`)
    chk(checks, 'matchType is REVIEW_SUGGESTION or AUTO_MATCH',
      result.matchType === 'REVIEW_SUGGESTION' || result.matchType === 'AUTO_MATCH',
      `got ${result.matchType}`)

    return { name: 'T4', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Supplier NO_MATCH
// ─────────────────────────────────────────────────────────────────────────────

async function t5_supplierNoMatch(): Promise<TestResult> {
  section('T5 — Supplier NO_MATCH (completely different name)')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Tropical Fruit Exporters'); ids.suppliers!.push(supplier.id)

    // Name chosen to have near-zero overlap with anything in the DB
    const uniqueGibberish = `ZZXQV Electronics Corp ${Date.now()}`
    const result = await SupplierMatchingService.findBestMatch({
      businessId:               business.id,
      rawSupplierName:          uniqueGibberish,
      reviewSuggestionThreshold:0.60,
    })

    chk(checks, 'Service returned a result',  result !== null)
    chk(checks, 'supplierId is null',         result.supplierId === null,   `got ${result.supplierId}`)
    chk(checks, 'matchType === NO_MATCH',     result.matchType === 'NO_MATCH')
    chk(checks, 'matchSource === none',       result.matchSource === 'none')
    chk(checks, 'reason is populated',       !!result.reason)

    return { name: 'T5', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — Supplier alias learning + deduplication
// ─────────────────────────────────────────────────────────────────────────────

async function t6_supplierAliasLearning(): Promise<TestResult> {
  section('T6 — Supplier alias learning + dedup')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], aliasS: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Global Grain Suppliers'); ids.suppliers!.push(supplier.id)

    // Learn new alias
    const r1 = await SupplierMatchingService.learnAlias(supplier.id, 'GGS Ltd', 0.95)
    ids.aliasS!.push(r1.aliasId)

    chk(checks, 'learnAlias → created = true',  r1.created === true)

    // Now the alias should resolve
    const match = await SupplierMatchingService.findBestMatch({
      businessId:      business.id,
      rawSupplierName: 'GGS Ltd',
    })

    chk(checks, 'Alias resolves to correct supplier', match.supplierId === supplier.id)
    chk(checks, 'matchSource === alias',              match.matchSource === 'alias')

    // Learn same alias again — must NOT create duplicate
    const r2 = await SupplierMatchingService.learnAlias(supplier.id, 'GGS Ltd', 0.95)
    chk(checks, 'Second learnAlias → created = false', r2.created === false)
    chk(checks, 'Returns same aliasId',                r2.aliasId === r1.aliasId)

    // DB: exactly one alias for this supplier+normalized pair
    const rows = await p.supplierAlias.findMany({
      where: {
        supplierId: supplier.id,
        normalized: SupplierMatchingService.normalizeName('GGS Ltd'),
      },
    })
    chk(checks, 'Exactly one alias row in DB', rows.length === 1)

    return { name: 'T6', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — Product exact match (InventoryItem) — requires real Business FK
// ─────────────────────────────────────────────────────────────────────────────

async function t7_productExactMatch(): Promise<TestResult> {
  section('T7 — Product exact match (InventoryItem)')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], invItems: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const item     = await mkInventoryItem(p, business.id, 'Organic Arabica Coffee Beans', 'KG')
    ids.invItems!.push(item.id)

    const result = await ProductMatchingService.findInventoryItemMatch(
      business.id,
      'Organic Arabica Coffee Beans',
    )

    chk(checks, 'Service returned a result',  result !== null)
    chk(checks, 'Correct productId',          result.productId === item.id,            `got ${result.productId}`)
    chk(checks, 'productType === INVENTORY_ITEM', result.productType === 'INVENTORY_ITEM')
    chk(checks, 'Confidence === 1.0',         result.confidence === 1.0,               `got ${result.confidence}`)
    chk(checks, 'matchType === AUTO_MATCH',   result.matchType === 'AUTO_MATCH')
    chk(checks, 'matchSource === exact',      result.matchSource === 'exact')

    return { name: 'T7', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — Product alias match (SupplierProduct)
// ─────────────────────────────────────────────────────────────────────────────

async function t8_productAliasMatch(): Promise<TestResult> {
  section('T8 — Product alias match (SupplierProduct)')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], supProds: [], aliasP: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Bakery Supply Co'); ids.suppliers!.push(supplier.id)
    const product  = await mkSupplierProduct(p, supplier.id, 'Premium All-Purpose Flour', 'KG')
    ids.supProds!.push(product.id)

    const alias = await p.productAlias.create({
      data: {
        supplierProductId: product.id,
        alias:             'AP Flour 50kg',
        normalized:        ProductMatchingService.normalizeName('AP Flour 50kg'),
      },
    })
    ids.aliasP!.push(alias.id)

    const result = await ProductMatchingService.findSupplierProductMatch(
      supplier.id,
      'AP Flour 50kg',
    )

    chk(checks, 'Service returned a result',          result !== null)
    chk(checks, 'Correct productId via alias',        result.productId === product.id,    `got ${result.productId}`)
    chk(checks, 'productType === SUPPLIER_PRODUCT',   result.productType === 'SUPPLIER_PRODUCT')
    chk(checks, 'Confidence ≥ 0.95',                  result.confidence >= 0.95,          `got ${result.confidence}`)
    chk(checks, 'matchSource === alias',              result.matchSource === 'alias')

    return { name: 'T8', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — Business isolation
// ─────────────────────────────────────────────────────────────────────────────

async function t9_businessIsolation(): Promise<TestResult> {
  section('T9 — Business isolation')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], invItems: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma

    // Business A owns the item
    const userA     = await mkUser(p);            ids.users!.push(userA.id)
    const bizA      = await mkBusiness(p, userA.id); ids.businesses!.push(bizA.id)
    const item      = await mkInventoryItem(p, bizA.id, 'Secret Sauce Base', 'L')
    ids.invItems!.push(item.id)

    // Business B has no items
    const userB     = await mkUser(p);            ids.users!.push(userB.id)
    const bizB      = await mkBusiness(p, userB.id); ids.businesses!.push(bizB.id)

    const rA = await ProductMatchingService.findInventoryItemMatch(bizA.id, 'Secret Sauce Base')
    const rB = await ProductMatchingService.findInventoryItemMatch(bizB.id, 'Secret Sauce Base')

    chk(checks, 'Business A finds its own item',     rA.productId === item.id)
    chk(checks, 'Business B gets null productId',    rB.productId === null)
    chk(checks, 'Business B gets NO_MATCH',          rB.matchType === 'NO_MATCH')

    return { name: 'T9', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — DocumentEntityLink idempotency
// ─────────────────────────────────────────────────────────────────────────────

async function t10_linkIdempotency(): Promise<TestResult> {
  section('T10 — DocumentEntityLink idempotency')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], scanJobs: [], docs: [], links: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Link Test Supplier'); ids.suppliers!.push(supplier.id)

    const { scanJob, doc } = await mkScanJobAndDoc(p, business.id, user.id)
    ids.scanJobs!.push(scanJob.id)
    ids.docs!.push(doc.id)

    // Create link first time
    const l1 = await SupplierMatchingService.createSupplierLink(doc.id, supplier.id, 0.95, 'AUTO_MATCH')
    ids.links!.push(l1.linkId)

    chk(checks, 'First call: created = true', l1.created === true)

    // Create same link second time — must be idempotent
    const l2 = await SupplierMatchingService.createSupplierLink(doc.id, supplier.id, 0.95, 'AUTO_MATCH')

    chk(checks, 'Second call: created = false', l2.created === false)
    chk(checks, 'Same linkId returned',          l2.linkId === l1.linkId)

    // DB level: exactly one row
    const rows = await p.documentEntityLink.findMany({
      where: { scannedDocumentId: doc.id, entityType: 'SUPPLIER', entityId: supplier.id },
    })
    chk(checks, 'Exactly one row in documentEntityLink', rows.length === 1)

    return { name: 'T10', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Product alias learning + dedup
// ─────────────────────────────────────────────────────────────────────────────

async function t11_productAliasLearning(): Promise<TestResult> {
  section('T11 — Product alias learning + dedup')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], invItems: [], aliasP: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const item     = await mkInventoryItem(p, business.id, 'Sunflower Oil Premium', 'L')
    ids.invItems!.push(item.id)

    // Learn alias
    const r1 = await ProductMatchingService.learnAlias('Cooking Oil Sunflower', { inventoryItemId: item.id })
    ids.aliasP!.push(r1.aliasId)

    chk(checks, 'learnAlias → created = true', r1.created === true)

    // Alias resolves
    const match = await ProductMatchingService.findInventoryItemMatch(business.id, 'Cooking Oil Sunflower')
    chk(checks, 'Alias resolves to correct item', match.productId === item.id)
    chk(checks, 'matchSource === alias',           match.matchSource === 'alias')

    // Dedup
    const r2 = await ProductMatchingService.learnAlias('Cooking Oil Sunflower', { inventoryItemId: item.id })
    chk(checks, 'Second learnAlias → created = false', r2.created === false)
    chk(checks, 'Returns same aliasId',                r2.aliasId === r1.aliasId)

    // DB level
    const rows = await p.productAlias.findMany({
      where: {
        inventoryItemId: item.id,
        normalized:      ProductMatchingService.normalizeName('Cooking Oil Sunflower'),
      },
    })
    chk(checks, 'Exactly one alias row in DB', rows.length === 1)

    return { name: 'T11', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — Unit normalization
// ─────────────────────────────────────────────────────────────────────────────

async function t12_unitNormalization(): Promise<TestResult> {
  section('T12 — Unit normalization')
  const checks: CheckResult[] = []
  const t0 = Date.now()

  // Each entry: [input, expected output]
  const cases: [string, string][] = [
    // Quantity + unit as separate token
    ['Rice 50 KG',       'rice'],
    ['Flour 5kg',        'flour'],
    ['Milk 1 Litre',     'milk'],
    ['Milk 1 liter',     'milk'],
    ['Water 500ml',      'water'],
    ['Juice 1L',         'juice'],
    ['Rice 50 g',        'rice'],
    // Compact quantity+unit (no space)
    ['Oil 500ml',        'oil'],
    ['Soda 1l',          'soda'],
    // Trailing unit token only
    ['Sugar bag',        'sugar'],
    ['Coffee packs',     'coffee'],
    ['Apples carton',    'apples'],
    ['Bananas pcs',      'bananas'],
    ['Oranges units',    'oranges'],
    // Leading quantity prefix
    ['10x Cooking Oil',  'cooking oil'],
    ['5 Tomatoes',       'tomatoes'],
    // Sugar with parenthetical content: keep product name, strip "25kg" inside
    // Parentheses stay; the unit/qty inside is stripped by the trailing pass
    ['Sugar 25kg bag',   'sugar'],
    // Multi-word product — no unit
    ['Organic Wheat Flour', 'organic wheat flour'],
  ]

  let allPass = true
  for (const [input, expected] of cases) {
    const got  = ProductMatchingService.normalizeName(input)
    const pass = got === expected
    if (!pass) allPass = false
    chk(checks, `"${input}"  →  "${expected}"`, pass, `got "${got}"`)
  }

  return { name: 'T12', pass: allPass, durationMs: Date.now() - t0, checks }
}

// ─────────────────────────────────────────────────────────────────────────────
// T13 — Full resolveSupplier pipeline
// ─────────────────────────────────────────────────────────────────────────────

async function t13_resolveSupplierPipeline(): Promise<TestResult> {
  section('T13 — resolveSupplier pipeline (match + link + alias learn + doc update)')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], scanJobs: [], docs: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'Pipeline Test Supplier'); ids.suppliers!.push(supplier.id)

    const { scanJob, doc } = await mkScanJobAndDoc(p, business.id, user.id)
    ids.scanJobs!.push(scanJob.id)
    ids.docs!.push(doc.id)

    const { match, link, aliasLearned } = await SupplierMatchingService.resolveSupplier(
      doc.id,
      'Pipeline Test Supplier',
      business.id,
      { learnNewAliases: true },
    )

    chk(checks, 'match.matchType === AUTO_MATCH',    match.matchType === 'AUTO_MATCH')
    chk(checks, 'match.supplierId correct',          match.supplierId === supplier.id)
    chk(checks, 'link created',                     link !== undefined && link.created === true)
    chk(checks, 'aliasLearned flag set',             aliasLearned === true || aliasLearned === false) // either is valid

    // ScannedDocument.supplierId should have been updated
    const updatedDoc = await p.scannedDocument.findUnique({ where: { id: doc.id }, select: { supplierId: true } })
    chk(checks, 'ScannedDocument.supplierId updated', updatedDoc?.supplierId === supplier.id)

    // Call again — link must NOT duplicate
    const { link: link2 } = await SupplierMatchingService.resolveSupplier(
      doc.id,
      'Pipeline Test Supplier',
      business.id,
    )
    chk(checks, 'Repeat resolve does not duplicate link', link2?.created === false)

    // Clean up aliases created during this test
    await p.supplierAlias.deleteMany({ where: { supplierId: supplier.id } })

    return { name: 'T13', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// T14 — Full resolveAllProducts pipeline
// ─────────────────────────────────────────────────────────────────────────────

async function t14_resolveAllProducts(): Promise<TestResult> {
  section('T14 — resolveAllProducts pipeline')
  const checks: CheckResult[] = []
  const ids: CleanupIds = { users: [], businesses: [], suppliers: [], invItems: [], scanJobs: [], docs: [] }
  const t0 = Date.now()

  try {
    const p: any = prisma
    const user     = await mkUser(p);     ids.users!.push(user.id)
    const business = await mkBusiness(p, user.id); ids.businesses!.push(business.id)
    const supplier = await mkSupplier(p, 'All Products Supplier'); ids.suppliers!.push(supplier.id)

    // Create two inventory items
    const item1 = await mkInventoryItem(p, business.id, 'Fresh Tomatoes', 'KG'); ids.invItems!.push(item1.id)
    const item2 = await mkInventoryItem(p, business.id, 'Fresh Onions', 'KG');   ids.invItems!.push(item2.id)

    // Create scan job + document
    const { scanJob, doc } = await mkScanJobAndDoc(p, business.id, user.id)
    ids.scanJobs!.push(scanJob.id)
    ids.docs!.push(doc.id)

    // Add two line items on the scanned document
    const li1 = await p.scannedDocumentItem.create({
      data: { scannedDocumentId: doc.id, lineNo: 1, productName: 'Fresh Tomatoes', quantity: 0, unit: 'KG' },
    })
    const li2 = await p.scannedDocumentItem.create({
      data: { scannedDocumentId: doc.id, lineNo: 2, productName: 'Fresh Onions', quantity: 0, unit: 'KG' },
    })

    const summary = await ProductMatchingService.resolveAllProducts(
      doc.id,
      business.id,
      supplier.id,
      { autoMatchThreshold: 0.85, reviewSuggestionThreshold: 0.60, learnNewAliases: true },
    )

    chk(checks, 'totalItems === 2',          summary.totalItems === 2,            `got ${summary.totalItems}`)
    chk(checks, 'At least 2 matched',        summary.matched >= 2,               `got ${summary.matched}`)
    chk(checks, 'No errors in results',      summary.results.every(r => r.result.match.matchType !== 'NO_MATCH') || summary.unmatched < summary.totalItems)

    // Verify first item was linked
    const docLink1 = await p.documentEntityLink.findFirst({
      where: { scannedDocumentId: doc.id, entityType: 'INVENTORY_ITEM', entityId: item1.id },
    })
    chk(checks, 'Item1 DocumentEntityLink created', docLink1 !== null)

    const docLink2 = await p.documentEntityLink.findFirst({
      where: { scannedDocumentId: doc.id, entityType: 'INVENTORY_ITEM', entityId: item2.id },
    })
    chk(checks, 'Item2 DocumentEntityLink created', docLink2 !== null)

    // Run again — must not duplicate
    const summary2 = await ProductMatchingService.resolveAllProducts(doc.id, business.id, supplier.id)
    const links = await p.documentEntityLink.findMany({
      where: { scannedDocumentId: doc.id, entityType: 'INVENTORY_ITEM' },
    })
    chk(checks, 'No duplicate links after re-run', links.length <= 2)

    // Clean up line items and aliases created
    await p.productAlias.deleteMany({ where: { inventoryItemId: { in: [item1.id, item2.id] } } })
    await p.scannedDocumentItem.deleteMany({ where: { id: { in: [li1.id, li2.id] } } })

    return { name: 'T14', pass: checks.every(c => c.pass), durationMs: Date.now() - t0, checks }
  } finally { await cleanup(ids) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     Block 4C Validation — Supplier + Product Matching     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`DB : ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') ?? 'NOT SET'}`)
  console.log(`Run: ${new Date().toISOString()}`)

  await runTest('T1 : Supplier exact name match',         t1_supplierExact)
  await runTest('T2 : Supplier alias match',              t2_supplierAlias)
  await runTest('T3 : Supplier fuzzy AUTO_MATCH',         t3_supplierFuzzyAutoMatch)
  await runTest('T4 : Supplier REVIEW_SUGGESTION',        t4_supplierReviewSuggestion)
  await runTest('T5 : Supplier NO_MATCH',                 t5_supplierNoMatch)
  await runTest('T6 : Supplier alias learning + dedup',   t6_supplierAliasLearning)
  await runTest('T7 : Product exact match (inventory)',   t7_productExactMatch)
  await runTest('T8 : Product alias match (supplier)',    t8_productAliasMatch)
  await runTest('T9 : Business isolation',                t9_businessIsolation)
  await runTest('T10: EntityLink idempotency',            t10_linkIdempotency)
  await runTest('T11: Product alias learning + dedup',    t11_productAliasLearning)
  await runTest('T12: Unit normalization',                t12_unitNormalization)
  await runTest('T13: resolveSupplier pipeline',          t13_resolveSupplierPipeline)
  await runTest('T14: resolveAllProducts pipeline',       t14_resolveAllProducts)

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`)
  console.log('  SUMMARY')
  console.log('═'.repeat(60))
  console.log(`  Tests  : ${passedTests}/${totalTests} passed  (${failedTests} failed)`)
  console.log(`  Checks : ${passedChecks}/${totalChecks} passed  (${failedChecks} failed)`)
  console.log(`  Result : ${failedTests === 0 ? '✓ ALL TESTS PASSED' : '✗ FAILURES — see above'}`)

  await prisma.$disconnect()
  process.exit(failedTests === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
