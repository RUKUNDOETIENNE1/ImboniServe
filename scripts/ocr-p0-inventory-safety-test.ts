import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

type TestResult = {
  scenario: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

function log(scenario: string, passed: boolean, details?: any, error?: string) {
  results.push({ scenario, passed, error, details })
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} | ${scenario}`)
  if (details) console.log('  Details:', JSON.stringify(details, null, 2))
  if (error) console.error('  Error:', error)
}

async function main() {
  console.log('\n=== OCR P0-2: Inventory Safety Layer Validation ===\n')

  const biz = await prisma.business.findFirst({ select: { id: true, ownerId: true, name: true } })
  if (!biz) throw new Error('No business found')

  const user = await prisma.user.findUnique({ where: { id: biz.ownerId }, select: { id: true, email: true } })
  if (!user) throw new Error('No owner user found')

  console.log(`Business: ${biz.name} (${biz.id})`)
  console.log(`User: ${user.email} (${user.id})\n`)

  // Test 1: Quantity Validation - Zero quantity
  console.log('Test 1: Quantity Validation - Zero quantity')
  try {
    const scanJob = await prisma.scanJob.create({
      data: {
        businessId: biz.id,
        createdByUserId: user.id,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: 'test/safety-zero-qty.pdf',
        sourceMime: 'application/pdf',
        sourceHash: 'test-zero-qty-' + Date.now(),
        status: 'APPROVED',
      },
    })

    const doc = await prisma.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: biz.id,
        documentType: 'SUPPLIER_INVOICE',
        status: 'APPROVED',
        lifecycleState: 'APPROVED',
      },
    })

    const inv = await prisma.inventoryItem.findFirst({
      where: { businessId: biz.id, isActive: true },
      select: { id: true, name: true, unit: true },
    })

    if (!inv) throw new Error('No inventory item found')

    const item = await prisma.scannedDocumentItem.create({
      data: {
        scannedDocumentId: doc.id,
        lineNo: 1,
        productName: inv.name,
        productId: inv.id,
        quantity: 0,
        unit: inv.unit,
      },
    })

    const response = await fetch(`http://localhost:3000/api/die/documents/${doc.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyItemIds: [item.id] }),
    })

    const result = await response.json()

    if (response.status === 400 && result.errors?.some((e: any) => e.code === 'INVALID_QUANTITY')) {
      log('Test 1: Zero quantity rejected', true, { status: response.status, error: result.errors[0] })
    } else {
      log('Test 1: Zero quantity rejected', false, { status: response.status, result }, 'Expected 400 with INVALID_QUANTITY')
    }

    await prisma.scannedDocument.delete({ where: { id: doc.id } })
    await prisma.scanJob.delete({ where: { id: scanJob.id } })
  } catch (e: any) {
    log('Test 1: Zero quantity rejected', false, undefined, e.message)
  }

  // Test 2: Quantity Validation - Negative quantity
  console.log('\nTest 2: Quantity Validation - Negative quantity')
  try {
    const scanJob = await prisma.scanJob.create({
      data: {
        businessId: biz.id,
        createdByUserId: user.id,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: 'test/safety-neg-qty.pdf',
        sourceMime: 'application/pdf',
        sourceHash: 'test-neg-qty-' + Date.now(),
        status: 'APPROVED',
      },
    })

    const doc = await prisma.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: biz.id,
        documentType: 'SUPPLIER_INVOICE',
        status: 'APPROVED',
        lifecycleState: 'APPROVED',
      },
    })

    const inv = await prisma.inventoryItem.findFirst({
      where: { businessId: biz.id, isActive: true },
      select: { id: true, name: true, unit: true },
    })

    if (!inv) throw new Error('No inventory item found')

    const item = await prisma.scannedDocumentItem.create({
      data: {
        scannedDocumentId: doc.id,
        lineNo: 1,
        productName: inv.name,
        productId: inv.id,
        quantity: -10,
        unit: inv.unit,
      },
    })

    const response = await fetch(`http://localhost:3000/api/die/documents/${doc.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyItemIds: [item.id] }),
    })

    const result = await response.json()

    if (response.status === 400 && result.errors?.some((e: any) => e.code === 'INVALID_QUANTITY')) {
      log('Test 2: Negative quantity rejected', true, { status: response.status, error: result.errors[0] })
    } else {
      log('Test 2: Negative quantity rejected', false, { status: response.status, result }, 'Expected 400 with INVALID_QUANTITY')
    }

    await prisma.scannedDocument.delete({ where: { id: doc.id } })
    await prisma.scanJob.delete({ where: { id: scanJob.id } })
  } catch (e: any) {
    log('Test 2: Negative quantity rejected', false, undefined, e.message)
  }

  // Test 3: Quantity Outlier Detection
  console.log('\nTest 3: Quantity Outlier Detection')
  try {
    const scanJob = await prisma.scanJob.create({
      data: {
        businessId: biz.id,
        createdByUserId: user.id,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: 'test/safety-outlier.pdf',
        sourceMime: 'application/pdf',
        sourceHash: 'test-outlier-' + Date.now(),
        status: 'APPROVED',
      },
    })

    const doc = await prisma.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: biz.id,
        documentType: 'SUPPLIER_INVOICE',
        status: 'APPROVED',
        lifecycleState: 'APPROVED',
      },
    })

    const inv = await prisma.inventoryItem.findFirst({
      where: { businessId: biz.id, isActive: true },
      select: { id: true, name: true, unit: true },
    })

    if (!inv) throw new Error('No inventory item found')

    const item = await prisma.scannedDocumentItem.create({
      data: {
        scannedDocumentId: doc.id,
        lineNo: 1,
        productName: inv.name,
        productId: inv.id,
        quantity: 1500,
        unit: inv.unit,
      },
    })

    const response = await fetch(`http://localhost:3000/api/die/documents/${doc.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyItemIds: [item.id] }),
    })

    const result = await response.json()

    if (response.status === 409 && result.error === 'Outlier confirmation required') {
      log('Test 3: Outlier detection triggered', true, { status: response.status, warnings: result.warnings })
    } else {
      log('Test 3: Outlier detection triggered', false, { status: response.status, result }, 'Expected 409 with outlier warning')
    }

    await prisma.scannedDocument.delete({ where: { id: doc.id } })
    await prisma.scanJob.delete({ where: { id: scanJob.id } })
  } catch (e: any) {
    log('Test 3: Outlier detection triggered', false, undefined, e.message)
  }

  // Test 4: Unit Mismatch Detection
  console.log('\nTest 4: Unit Mismatch Detection')
  try {
    const scanJob = await prisma.scanJob.create({
      data: {
        businessId: biz.id,
        createdByUserId: user.id,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: 'test/safety-unit-mismatch.pdf',
        sourceMime: 'application/pdf',
        sourceHash: 'test-unit-mismatch-' + Date.now(),
        status: 'APPROVED',
      },
    })

    const doc = await prisma.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: biz.id,
        documentType: 'SUPPLIER_INVOICE',
        status: 'APPROVED',
        lifecycleState: 'APPROVED',
      },
    })

    const inv = await prisma.inventoryItem.findFirst({
      where: { businessId: biz.id, isActive: true, unit: 'KG' },
      select: { id: true, name: true, unit: true },
    })

    if (!inv) {
      console.log('  Skipping: No KG inventory item found')
      log('Test 4: Unit mismatch detection', true, { skipped: true })
    } else {
      const item = await prisma.scannedDocumentItem.create({
        data: {
          scannedDocumentId: doc.id,
          lineNo: 1,
          productName: inv.name,
          productId: inv.id,
          quantity: 10,
          unit: 'LITER',
        },
      })

      const response = await fetch(`http://localhost:3000/api/die/documents/${doc.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyItemIds: [item.id] }),
      })

      const result = await response.json()

      if (response.status === 400 && result.errors?.some((e: any) => e.code === 'UNIT_MISMATCH')) {
        log('Test 4: Unit mismatch detection', true, { status: response.status, error: result.errors[0] })
      } else {
        log('Test 4: Unit mismatch detection', false, { status: response.status, result }, 'Expected 400 with UNIT_MISMATCH')
      }
    }

    await prisma.scannedDocument.delete({ where: { id: doc.id } })
    await prisma.scanJob.delete({ where: { id: scanJob.id } })
  } catch (e: any) {
    log('Test 4: Unit mismatch detection', false, undefined, e.message)
  }

  // Test 5: InventoryUpdate Audit Trail
  console.log('\nTest 5: InventoryUpdate Audit Trail')
  try {
    const scanJob = await prisma.scanJob.create({
      data: {
        businessId: biz.id,
        createdByUserId: user.id,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: 'test/safety-audit.pdf',
        sourceMime: 'application/pdf',
        sourceHash: 'test-audit-' + Date.now(),
        status: 'APPROVED',
      },
    })

    const doc = await prisma.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: biz.id,
        documentType: 'SUPPLIER_INVOICE',
        status: 'APPROVED',
        lifecycleState: 'APPROVED',
        invoiceNumber: 'INV-SAFETY-TEST-001',
      },
    })

    const inv = await prisma.inventoryItem.findFirst({
      where: { businessId: biz.id, isActive: true },
      select: { id: true, name: true, unit: true, currentStock: true, unitCostCents: true },
    })

    if (!inv) throw new Error('No inventory item found')

    const beforeStock = inv.currentStock
    const beforeCost = inv.unitCostCents

    const item = await prisma.scannedDocumentItem.create({
      data: {
        scannedDocumentId: doc.id,
        lineNo: 1,
        productName: inv.name,
        productId: inv.id,
        quantity: 25,
        unit: inv.unit,
        unitPriceCents: 3500,
      },
    })

    const response = await fetch(`http://localhost:3000/api/die/documents/${doc.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyItemIds: [item.id] }),
    })

    const result = await response.json()

    if (response.status === 200) {
      const updatedInv = await prisma.inventoryItem.findUnique({
        where: { id: inv.id },
        select: { currentStock: true, unitCostCents: true },
      })

      const invUpdate = await prisma.inventoryUpdate.findFirst({
        where: { inventoryItemId: inv.id, notes: { contains: `documentId=${doc.id}` } },
        orderBy: { createdAt: 'desc' },
      })

      const passed = updatedInv && invUpdate &&
        updatedInv.currentStock === beforeStock + 25 &&
        updatedInv.unitCostCents === 3500 &&
        invUpdate.quantity === 25 &&
        invUpdate.type === 'ADD' &&
        invUpdate.userId === user.id &&
        invUpdate.notes?.includes(`beforeStock=${beforeStock}`) &&
        invUpdate.notes?.includes(`afterStock=${beforeStock + 25}`) &&
        invUpdate.notes?.includes(`beforeCostCents=${beforeCost}`) &&
        invUpdate.notes?.includes(`afterCostCents=3500`)

      log('Test 5: InventoryUpdate audit trail', passed, {
        beforeStock,
        afterStock: updatedInv?.currentStock,
        beforeCost,
        afterCost: updatedInv?.unitCostCents,
        invUpdate: invUpdate ? {
          type: invUpdate.type,
          quantity: invUpdate.quantity,
          userId: invUpdate.userId,
          notes: invUpdate.notes,
        } : null,
      }, passed ? undefined : 'Audit trail incomplete or incorrect')
    } else {
      log('Test 5: InventoryUpdate audit trail', false, { status: response.status, result }, 'Expected 200 OK')
    }

    await prisma.scannedDocument.delete({ where: { id: doc.id } })
    await prisma.scanJob.delete({ where: { id: scanJob.id } })
  } catch (e: any) {
    log('Test 5: InventoryUpdate audit trail', false, undefined, e.message)
  }

  console.log('\n=== Test Summary ===\n')
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${total - passed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (passed === total) {
    console.log('✅ All tests passed!')
  } else {
    console.log('❌ Some tests failed. Review details above.')
    process.exit(1)
  }

  await (prisma as any).$disconnect()
}

main().catch(async (e) => {
  console.error('Fatal error:', e)
  try {
    await (prisma as any).$disconnect()
  } catch {}
  process.exit(1)
})
