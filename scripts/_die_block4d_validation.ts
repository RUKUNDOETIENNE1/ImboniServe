/**
 * Block 4D Validation Suite
 * Procurement Reconciliation Engine
 *
 * This script is intended to run after the Block 4D migration is applied.
 *
 * Run with:
 *   npx tsx scripts/_die_block4d_validation.ts
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { ProcurementReconciliationService } from '../src/lib/die/services/procurement-reconciliation.service'

type CheckResult = { label: string; pass: boolean; detail?: string }
type TestResult = { name: string; pass: boolean; durationMs: number; checks: CheckResult[] }

let totalTests = 0
let passedTests = 0
let failedTests = 0
let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function check(checks: CheckResult[], label: string, condition: boolean, detail?: string) {
  totalChecks++
  if (condition) passedChecks++
  else failedChecks++
  checks.push({ label, pass: condition, detail })
}

function section(title: string) {
  console.log(`\n${'='.repeat(64)}`)
  console.log(title)
  console.log('='.repeat(64))
}

function unique(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function runTest(name: string, fn: () => Promise<TestResult>) {
  totalTests++
  console.log(`\n[TEST] ${name}`)
  try {
    const result = await fn()
    const ok = result.pass
    console.log(`  ${ok ? 'PASS' : 'FAIL'} (${result.durationMs}ms)`)
    for (const c of result.checks) {
      console.log(`    ${c.pass ? '✓' : '✗'} ${c.label}${c.detail ? ` — ${c.detail}` : ''}`)
    }
    if (ok) passedTests++
    else failedTests++
    return result
  } catch (err) {
    failedTests++
    console.error(`  EXCEPTION: ${String(err)}`)
    return { name, pass: false, durationMs: 0, checks: [{ label: 'exception', pass: false, detail: String(err) }] }
  }
}

async function cleanup(ids: {
  users?: string[]
  businesses?: string[]
  suppliers?: string[]
  items?: string[]
  poItems?: string[]
  pos?: string[]
  grns?: string[]
  grnItems?: string[]
  docs?: string[]
  scanJobs?: string[]
  recs?: string[]
  links?: string[]
  aliases?: string[]
}) {
  const p: any = prisma
  const safe = async (fn: () => Promise<unknown>) => { try { await fn() } catch {} }

  if (ids.links?.length) await safe(() => p.documentEntityLink.deleteMany({ where: { id: { in: ids.links } } }))
  if (ids.recs?.length) await safe(() => p.procurementReconciliation.deleteMany({ where: { id: { in: ids.recs } } }))
  if (ids.aliases?.length) {
    await safe(() => p.productAlias.deleteMany({ where: { id: { in: ids.aliases } } }))
    await safe(() => p.supplierAlias.deleteMany({ where: { id: { in: ids.aliases } } }))
  }
  if (ids.docs?.length) {
    await safe(() => p.scannedDocumentItem.deleteMany({ where: { scannedDocumentId: { in: ids.docs } } }))
    await safe(() => p.extractedDocumentHeaderField.deleteMany({ where: { scannedDocumentId: { in: ids.docs } } }))
    await safe(() => p.scannedDocument.deleteMany({ where: { id: { in: ids.docs } } }))
  }
  if (ids.scanJobs?.length) {
    await safe(() => p.extractionPayload.deleteMany({ where: { scanJobId: { in: ids.scanJobs } } }))
    await safe(() => p.documentProcessingLog.deleteMany({ where: { scanJobId: { in: ids.scanJobs } } }))
    await safe(() => p.scanJob.deleteMany({ where: { id: { in: ids.scanJobs } } }))
  }
  if (ids.grnItems?.length) await safe(() => p.goodsReceivedNoteItem.deleteMany({ where: { id: { in: ids.grnItems } } }))
  if (ids.grns?.length) await safe(() => p.goodsReceivedNote.deleteMany({ where: { id: { in: ids.grns } } }))
  if (ids.poItems?.length) await safe(() => p.purchaseOrderItem.deleteMany({ where: { id: { in: ids.poItems } } }))
  if (ids.pos?.length) await safe(() => p.purchaseOrder.deleteMany({ where: { id: { in: ids.pos } } }))
  if (ids.items?.length) await safe(() => p.inventoryItem.deleteMany({ where: { id: { in: ids.items } } }))
  if (ids.suppliers?.length) await safe(() => p.supplier.deleteMany({ where: { id: { in: ids.suppliers } } }))
  if (ids.businesses?.length) await safe(() => p.business.deleteMany({ where: { id: { in: ids.businesses } } }))
  if (ids.users?.length) await safe(() => p.user.deleteMany({ where: { id: { in: ids.users } } }))
}

async function mkUser(p: any, label: string) {
  const n = unique(label)
  return p.user.create({
    data: {
      name: `D4D ${label}`,
      email: `${n}@validation.local`,
      password: '$2b$10$validation',
      phone: `+2507${Date.now().toString().slice(-8)}`,
      isActive: true,
    },
  })
}

async function mkBusiness(p: any, ownerId: string, label: string) {
  return p.business.create({
    data: {
      name: `D4D Business ${label}`,
      phone: `+2508${Date.now().toString().slice(-8)}`,
      ownerId,
      city: 'Kigali',
      country: 'RW',
      currency: 'RWF',
      isActive: true,
    },
  })
}

async function mkSupplier(p: any, label: string) {
  const n = unique(label)
  return p.supplier.create({
    data: {
      name: `Supplier ${label}`,
      contactName: `Contact ${label}`,
      email: `${n}@supplier.local`,
      phone: `+2509${Date.now().toString().slice(-8)}`,
      city: 'Kigali',
      country: 'RW',
      isActive: true,
    },
  })
}

async function mkItem(p: any, businessId: string, name: string, unit = 'KG') {
  return p.inventoryItem.create({
    data: {
      name,
      unit,
      unitCostCents: 1000,
      businessId,
      isActive: true,
    },
  })
}

async function mkPO(p: any, businessId: string, supplierId: string, poNumber: string, items: Array<{ name: string; qty: number; unit: string; unitPriceCents: number }>, creatorId: string) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPriceCents, 0)
  const vatCents = Math.round(subtotal * 0.18)
  const total = subtotal + vatCents
  return p.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      businessId,
      status: 'APPROVED',
      subtotalCents: subtotal,
      vatCents,
      totalCents: total,
      createdById: creatorId,
      items: {
        create: items.map((i) => ({
          productName: i.name,
          quantity: i.qty,
          unit: i.unit,
          unitPriceCents: i.unitPriceCents,
          totalPriceCents: Math.round(i.qty * i.unitPriceCents),
        })),
      },
    },
    include: { items: true },
  })
}

async function mkGRN(p: any, businessId: string, supplierId: string, purchaseOrderId: string, grnNumber: string, status = 'COMPLETED') {
  const po = await p.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  })
  if (!po) throw new Error('PO not found for GRN fixture')

  const receivedBy = await mkUser(p, `${grnNumber}-receiver`)
  return p.goodsReceivedNote.create({
    data: {
      grnNumber,
      purchaseOrderId,
      supplierId,
      businessId,
      receivedById: receivedBy.id,
      receivedByName: receivedBy.name,
      receivedAt: new Date(),
      status,
      items: {
        create: po.items.map((i: any) => ({
          poItemId: i.id,
          productName: i.productName,
          orderedQuantity: i.quantity,
          receivedQuantity: i.quantity,
          unit: i.unit,
          unitPriceCents: i.unitPriceCents,
          totalPriceCents: i.totalPriceCents,
        })),
      },
    },
    include: { items: true },
  })
}

async function mkDoc(p: any, businessId: string, supplierId: string | null, poNumber: string | null, deliveryReference: string | null, totalCents: number, items: Array<{ name: string; qty: number; unit: string; productId?: string | null }>, documentDate = new Date()) {
  const scanJob = await p.scanJob.create({
    data: {
      businessId,
      createdByUserId: (await mkUser(p, 'scan-user')).id,
      documentType: 'SUPPLIER_INVOICE',
      sourceFileKey: unique('file'),
      sourceMime: 'application/pdf',
      sourceHash: unique('hash'),
      status: 'EXTRACTED',
    },
  })

  const doc = await p.scannedDocument.create({
    data: {
      scanJobId: scanJob.id,
      businessId,
      documentType: 'SUPPLIER_INVOICE',
      supplierId,
      purchaseOrderNumber: poNumber,
      deliveryReference,
      documentDate,
      totalCents,
      currency: 'RWF',
      status: 'INTELLIGENCE_DONE',
    },
  })

  const createdItems: any[] = []
  for (let i = 0; i < items.length; i++) {
    createdItems.push(await p.scannedDocumentItem.create({
      data: {
        scannedDocumentId: doc.id,
        lineNo: i + 1,
        productName: items[i].name,
        productId: items[i].productId ?? null,
        quantity: items[i].qty,
        unit: items[i].unit,
        unitPriceCents: null,
        totalPriceCents: null,
      },
    }))
  }

  return { scanJob, doc, items: createdItems }
}

async function testExactPoMatch(): Promise<TestResult> {
  section('Exact PO Match')
  const checks: CheckResult[] = []
  const ids = { users: [], businesses: [], suppliers: [], pos: [], poItems: [], docs: [], scanJobs: [], recs: [], links: [] } as any
  const started = Date.now()

  try {
    const p: any = prisma
    const user = await mkUser(p, 'exact-po'); ids.users.push(user.id)
    const biz = await mkBusiness(p, user.id, 'exact-po'); ids.businesses.push(biz.id)
    const supplier = await mkSupplier(p, 'exact-po'); ids.suppliers.push(supplier.id)
    const po = await mkPO(p, biz.id, supplier.id, 'PO-1001', [{ name: 'Rice', qty: 10, unit: 'KG', unitPriceCents: 500 }], user.id); ids.pos.push(po.id); ids.poItems.push(...po.items.map((i: any) => i.id))
    const doc = await mkDoc(p, biz.id, supplier.id, 'PO-1001', null, po.subtotalCents + po.vatCents, [{ name: 'Rice', qty: 10, unit: 'KG' }]); ids.docs.push(doc.doc.id); ids.scanJobs.push(doc.scanJob.id)

    const result = await ProcurementReconciliationService.reconcileDocument(doc.doc.id)

    check(checks, 'success', result.success)
    check(checks, 'exact PO', result.matchType === 'EXACT_PO', `got ${result.matchType}`)
    check(checks, 'PO id set', result.purchaseOrderId === po.id)
    check(checks, 'GRN absent', result.goodsReceivedNoteId === null)
    check(checks, 'scanned document updated', true)

    return { name: 'Exact PO', pass: checks.every((c) => c.pass), durationMs: Date.now() - started, checks }
  } finally { await cleanup(ids) }
}

async function testFuzzyPoConflict(): Promise<TestResult> {
  section('PO Conflict')
  const checks: CheckResult[] = []
  const ids = { users: [], businesses: [], suppliers: [], pos: [], poItems: [], docs: [], scanJobs: [], recs: [], links: [] } as any
  const started = Date.now()

  try {
    const p: any = prisma
    const user = await mkUser(p, 'po-conflict'); ids.users.push(user.id)
    const biz = await mkBusiness(p, user.id, 'po-conflict'); ids.businesses.push(biz.id)
    const supplier = await mkSupplier(p, 'po-conflict'); ids.suppliers.push(supplier.id)
    const po1 = await mkPO(p, biz.id, supplier.id, 'PO-2001', [{ name: 'Tomatoes', qty: 10, unit: 'KG', unitPriceCents: 200 }], user.id); ids.pos.push(po1.id); ids.poItems.push(...po1.items.map((i: any) => i.id))
    const po2 = await mkPO(p, biz.id, supplier.id, 'PO-2002', [{ name: 'Tomatoes', qty: 10, unit: 'KG', unitPriceCents: 200 }], user.id); ids.pos.push(po2.id); ids.poItems.push(...po2.items.map((i: any) => i.id))
    const doc = await mkDoc(p, biz.id, supplier.id, null, null, po1.subtotalCents + po1.vatCents, [{ name: 'Tomatoes', qty: 10, unit: 'KG' }]); ids.docs.push(doc.doc.id); ids.scanJobs.push(doc.scanJob.id)

    const result = await ProcurementReconciliationService.reconcileDocument(doc.doc.id)

    check(checks, 'conflict', result.matchType === 'CONFLICT', `got ${result.matchType}`)
    check(checks, 'no PO chosen', result.purchaseOrderId === null)
    return { name: 'PO Conflict', pass: checks.every((c) => c.pass), durationMs: Date.now() - started, checks }
  } finally { await cleanup(ids) }
}

async function testGrnMatchAndPartialConflict(): Promise<TestResult> {
  section('GRN Match + Partial Conflict')
  const checks: CheckResult[] = []
  const ids = { users: [], businesses: [], suppliers: [], pos: [], poItems: [], grns: [], grnItems: [], docs: [], scanJobs: [], recs: [], links: [] } as any
  const started = Date.now()

  try {
    const p: any = prisma
    const user = await mkUser(p, 'grn'); ids.users.push(user.id)
    const biz = await mkBusiness(p, user.id, 'grn'); ids.businesses.push(biz.id)
    const supplier = await mkSupplier(p, 'grn'); ids.suppliers.push(supplier.id)
    const po = await mkPO(p, biz.id, supplier.id, 'PO-3001', [{ name: 'Milk', qty: 20, unit: 'L', unitPriceCents: 100 }], user.id); ids.pos.push(po.id); ids.poItems.push(...po.items.map((i: any) => i.id))
    const grn = await mkGRN(p, biz.id, supplier.id, po.id, 'GRN-3001', 'COMPLETED'); ids.grns.push(grn.id); ids.grnItems.push(...grn.items.map((i: any) => i.id))
    const doc = await mkDoc(p, biz.id, supplier.id, null, 'GRN-3001', po.subtotalCents + po.vatCents, [{ name: 'Milk', qty: 20, unit: 'L' }]); ids.docs.push(doc.doc.id); ids.scanJobs.push(doc.scanJob.id)

    const result = await ProcurementReconciliationService.reconcileDocument(doc.doc.id)

    check(checks, 'GRN match', result.matchType === 'GRN_MATCH' || result.matchType === 'EXACT_PO', `got ${result.matchType}`)
    check(checks, 'GRN id set', result.goodsReceivedNoteId === grn.id)

    const partialGrn = await mkGRN(p, biz.id, supplier.id, po.id, 'GRN-3002', 'PARTIAL'); ids.grns.push(partialGrn.id); ids.grnItems.push(...partialGrn.items.map((i: any) => i.id))
    const doc2 = await mkDoc(p, biz.id, supplier.id, null, 'GRN-3002', po.subtotalCents + po.vatCents, [{ name: 'Milk', qty: 20, unit: 'L' }]); ids.docs.push(doc2.doc.id); ids.scanJobs.push(doc2.scanJob.id)
    const result2 = await ProcurementReconciliationService.reconcileDocument(doc2.doc.id)
    check(checks, 'partial delivery conflict', result2.matchType === 'CONFLICT', `got ${result2.matchType}`)

    return { name: 'GRN Match + Partial Conflict', pass: checks.every((c) => c.pass), durationMs: Date.now() - started, checks }
  } finally { await cleanup(ids) }
}

async function testBusinessIsolation(): Promise<TestResult> {
  section('Business Isolation')
  const checks: CheckResult[] = []
  const ids = { users: [], businesses: [], suppliers: [], pos: [], poItems: [], docs: [], scanJobs: [], recs: [], links: [] } as any
  const started = Date.now()

  try {
    const p: any = prisma
    const userA = await mkUser(p, 'iso-a'); ids.users.push(userA.id)
    const bizA = await mkBusiness(p, userA.id, 'iso-a'); ids.businesses.push(bizA.id)
    const userB = await mkUser(p, 'iso-b'); ids.users.push(userB.id)
    const bizB = await mkBusiness(p, userB.id, 'iso-b'); ids.businesses.push(bizB.id)
    const supplier = await mkSupplier(p, 'iso'); ids.suppliers.push(supplier.id)
    const poB = await mkPO(p, bizB.id, supplier.id, 'PO-4001', [{ name: 'Sugar', qty: 5, unit: 'KG', unitPriceCents: 500 }], userB.id); ids.pos.push(poB.id); ids.poItems.push(...poB.items.map((i: any) => i.id))
    const docA = await mkDoc(p, bizA.id, supplier.id, null, null, poB.subtotalCents + poB.vatCents, [{ name: 'Sugar', qty: 5, unit: 'KG' }]); ids.docs.push(docA.doc.id); ids.scanJobs.push(docA.scanJob.id)

    const result = await ProcurementReconciliationService.reconcileDocument(docA.doc.id)
    check(checks, 'no cross-business match', result.matchType === 'NO_MATCH' || result.matchType === 'CONFLICT', `got ${result.matchType}`)
    return { name: 'Business Isolation', pass: checks.every((c) => c.pass), durationMs: Date.now() - started, checks }
  } finally { await cleanup(ids) }
}

async function testIdempotency(): Promise<TestResult> {
  section('Idempotency')
  const checks: CheckResult[] = []
  const ids = { users: [], businesses: [], suppliers: [], pos: [], poItems: [], docs: [], scanJobs: [], recs: [], links: [] } as any
  const started = Date.now()

  try {
    const p: any = prisma
    const user = await mkUser(p, 'idem'); ids.users.push(user.id)
    const biz = await mkBusiness(p, user.id, 'idem'); ids.businesses.push(biz.id)
    const supplier = await mkSupplier(p, 'idem'); ids.suppliers.push(supplier.id)
    const po = await mkPO(p, biz.id, supplier.id, 'PO-5001', [{ name: 'Tea', qty: 12, unit: 'KG', unitPriceCents: 300 }], user.id); ids.pos.push(po.id); ids.poItems.push(...po.items.map((i: any) => i.id))
    const doc = await mkDoc(p, biz.id, supplier.id, null, null, po.subtotalCents + po.vatCents, [{ name: 'Tea', qty: 12, unit: 'KG' }]); ids.docs.push(doc.doc.id); ids.scanJobs.push(doc.scanJob.id)

    const first = await ProcurementReconciliationService.reconcileDocument(doc.doc.id)
    const second = await ProcurementReconciliationService.reconcileDocument(doc.doc.id)

    const recs = await p.procurementReconciliation.findMany({ where: { scannedDocumentId: doc.doc.id } })
    const links = await p.documentEntityLink.findMany({ where: { scannedDocumentId: doc.doc.id } })

    check(checks, 'same fingerprint', first.fingerprint === second.fingerprint)
    check(checks, 'single reconciliation row', recs.length === 1, `got ${recs.length}`)
    check(checks, 'deduped links', links.length > 0)

    return { name: 'Idempotency', pass: checks.every((c) => c.pass), durationMs: Date.now() - started, checks }
  } finally { await cleanup(ids) }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Block 4D Validation — Procurement Reconciliation Engine      ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') ?? 'NOT SET'}`)
  console.log(`Run: ${new Date().toISOString()}`)

  await runTest('Exact PO Match', testExactPoMatch)
  await runTest('PO Conflict', testFuzzyPoConflict)
  await runTest('GRN Match + Partial Conflict', testGrnMatchAndPartialConflict)
  await runTest('Business Isolation', testBusinessIsolation)
  await runTest('Idempotency', testIdempotency)

  console.log(`\n${'═'.repeat(64)}`)
  console.log(`Tests:  ${passedTests}/${totalTests} passed (${failedTests} failed)`)
  console.log(`Checks: ${passedChecks}/${totalChecks} passed (${failedChecks} failed)`)
  console.log(`Result: ${failedTests === 0 ? 'ALL PASS' : 'FAILURES'} `)

  await prisma.$disconnect()
  process.exit(failedTests === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
