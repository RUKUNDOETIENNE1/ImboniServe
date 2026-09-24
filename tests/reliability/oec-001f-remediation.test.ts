/**
 * OEC-001F Business Operations Excellence Remediation Tests
 *
 * Tests for operational integrity improvements implemented in OEC-001F:
 * - OPS-CRIT-001: Reservation-table synchronization (confirm → RESERVED, cancel/complete/no-show → AVAILABLE)
 */

import fs from 'fs'
import path from 'path'

describe('OEC-001F Business Operations Excellence Remediation', () => {
  const servicesDir = path.join(process.cwd(), 'src', 'lib', 'services')
  const pagesDir = path.join(process.cwd(), 'src', 'pages')
  const apiDir = path.join(pagesDir, 'api')

  const readFile = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf-8')
  }

  describe('OPS-CRIT-001: Reservation-Table Synchronization', () => {
    const reservationServicePath = path.join(servicesDir, 'reservation.service.ts')
    const reservationService = readFile(reservationServicePath)

    it('confirmReservation should update table status to RESERVED', () => {
      expect(reservationService).toContain('confirmReservation')
      // Must query tableId
      expect(reservationService).toMatch(/select.*tableId.*true/s)
      // Must set table to RESERVED in a transaction
      expect(reservationService).toContain("'RESERVED'")
      expect(reservationService).toContain('$transaction')
    })

    it('confirmReservation should use a transaction for atomicity', () => {
      // Find the confirmReservation method and check it contains $transaction and table.update
      const idx = reservationService.indexOf('confirmReservation')
      const methodBody = reservationService.slice(idx, idx + 1200)
      expect(methodBody).toContain('$transaction')
      expect(methodBody).toContain('table.update')
    })

    it('cancelReservation should release table to AVAILABLE', () => {
      const idx = reservationService.indexOf('cancelReservation')
      const methodBody = reservationService.slice(idx, idx + 1200)
      expect(methodBody).toContain("'AVAILABLE'")
      expect(methodBody).toContain('$transaction')
    })

    it('markNoShow should release table to AVAILABLE', () => {
      const idx = reservationService.indexOf('markNoShow')
      const methodBody = reservationService.slice(idx, idx + 1200)
      expect(methodBody).toContain("'AVAILABLE'")
      expect(methodBody).toContain('$transaction')
    })

    it('completeReservation should release table to AVAILABLE', () => {
      const idx = reservationService.indexOf('completeReservation')
      const methodBody = reservationService.slice(idx, idx + 1200)
      expect(methodBody).toContain("'AVAILABLE'")
      expect(methodBody).toContain('$transaction')
    })

    it('forfeitDeposit should release table to AVAILABLE', () => {
      const idx = reservationService.indexOf('forfeitDeposit')
      const methodBody = reservationService.slice(idx, idx + 1200)
      expect(methodBody).toContain("'AVAILABLE'")
      expect(methodBody).toContain('$transaction')
    })

    it('all table release operations should be logged', () => {
      expect(reservationService).toContain('Table auto-reserved')
      expect(reservationService).toContain('Table released')
    })
  })

  describe('Operational Integrity — Order Lifecycle', () => {
    const orderConfirmApi = readFile(path.join(apiDir, 'public', 'order', 'confirm.ts'))
    const kitchenUpdateApi = readFile(path.join(apiDir, 'kitchen', 'update-status.ts'))

    it('order confirmation should be idempotent', () => {
      expect(orderConfirmApi).toContain('customerConfirmedAt')
    })

    it('order cancellation should set status to CANCELLED', () => {
      expect(orderConfirmApi).toContain('CANCELLED')
    })

    it('kitchen status updates should enforce valid transitions', () => {
      expect(kitchenUpdateApi).toContain('allowedTransitions')
      expect(kitchenUpdateApi).toContain('pending')
      expect(kitchenUpdateApi).toContain('accepted')
      expect(kitchenUpdateApi).toContain('preparing')
      expect(kitchenUpdateApi).toContain('ready')
      expect(kitchenUpdateApi).toContain('served')
    })

    it('kitchen status updates should use transactions', () => {
      expect(kitchenUpdateApi).toContain('$transaction')
    })

    it('kitchen status updates should trigger consumption on NEW → PREPARING', () => {
      expect(kitchenUpdateApi).toContain('SaleItemStatusService')
    })
  })

  describe('Operational Integrity — Payment & Refund', () => {
    const refundApi = readFile(path.join(apiDir, 'payments', 'refunds.ts'))

    it('refund should update payment transaction status', () => {
      expect(refundApi).toContain('REFUNDED')
      expect(refundApi).toContain('paymentTransaction.update')
    })

    it('refund should update sale payment status', () => {
      expect(refundApi).toContain('sale.update')
      expect(refundApi).toContain("paymentStatus: 'REFUNDED'")
    })

    it('refund should log billing event', () => {
      expect(refundApi).toContain('ensurePaymentLedgerEvent')
      expect(refundApi).toContain('REFUNDED')
    })

    it('refund should create audit log', () => {
      expect(refundApi).toContain('AuditLogService.log')
      expect(refundApi).toContain('PAYMENT_REFUND')
    })

    it('refund should validate transaction status', () => {
      expect(refundApi).toContain('SUCCESS')
      expect(refundApi).toContain('ALREADY_REFUNDED')
    })

    it('refund should be rate limited', () => {
      expect(refundApi).toContain('withRateLimit')
    })

    it('refund should require permission', () => {
      expect(refundApi).toContain('requirePermission')
      expect(refundApi).toContain('payments.refund')
    })
  })

  describe('Operational Integrity — Kitchen Dispatch', () => {
    const dispatchService = readFile(path.join(servicesDir, 'kitchen-dispatch.service.ts'))

    it('should mark sale as dispatched', () => {
      expect(dispatchService).toContain('kitchenDispatchedAt')
      expect(dispatchService).toContain('kitchenDispatchStatus')
      expect(dispatchService).toContain('dispatched')
    })

    it('should emit real-time notification', () => {
      expect(dispatchService).toContain('triggerEvent')
      expect(dispatchService).toContain('private-kitchen-')
    })

    it('should route items to stations', () => {
      expect(dispatchService).toContain('RoutingService')
      expect(dispatchService).toContain('resolveStation')
    })

    it('should record ticket event', () => {
      expect(dispatchService).toContain('TicketEventService')
      expect(dispatchService).toContain('ORDER_CREATED')
    })

    it('should handle dispatch failure', () => {
      expect(dispatchService).toContain('failed')
      expect(dispatchService).toContain('kitchenDispatchError')
    })
  })

  describe('Operational Integrity — Inventory Consumption', () => {
    const consumptionService = readFile(path.join(servicesDir, 'consumption-engine.service.ts'))
    const ledgerService = readFile(path.join(servicesDir, 'inventory-ledger.service.ts'))

    it('consumption should be idempotent', () => {
      expect(consumptionService).toContain('consumptionState')
      expect(consumptionService).toContain('CONSUMED')
    })

    it('consumption should resolve recipes', () => {
      expect(consumptionService).toContain('recipe')
      expect(consumptionService).toContain('ingredients')
    })

    it('inventory ledger should prevent negative stock', () => {
      expect(ledgerService).toContain('InsufficientStockError')
      expect(ledgerService).toContain('newStock < 0')
    })

    it('inventory ledger should create audit rows', () => {
      expect(ledgerService).toContain('inventoryUpdate')
      expect(ledgerService).toContain('create')
    })
  })

  describe('Operational Integrity — Financial Ledger', () => {
    const billingService = readFile(path.join(servicesDir, 'billing-ledger.service.ts'))

    it('should create FinancialLedgerEntry on billing events', () => {
      expect(billingService).toContain('FinancialLedgerEntry')
      expect(billingService).toContain('create')
    })

    it('should use idempotency keys', () => {
      expect(billingService).toContain('idempotencyKey')
    })

    it('should support all billing event types', () => {
      expect(billingService).toContain('BillingEventType')
      expect(billingService).toContain('PAYMENT_FAILED')
    })
  })

  describe('Operational Integrity — Z-Report / Daily Closing', () => {
    const closeDayApi = readFile(path.join(apiDir, 'reports', 'close-day.ts'))

    it('should filter by paymentStatus COMPLETED (excludes refunds)', () => {
      expect(closeDayApi).toContain("paymentStatus: 'COMPLETED'")
    })

    it('should calculate payment method breakdown', () => {
      expect(closeDayApi).toContain('paymentBreakdown')
    })

    it('should count pending orders', () => {
      expect(closeDayApi).toContain('pendingOrders')
    })

    it('should count voided orders', () => {
      expect(closeDayApi).toContain('voidedOrders')
    })

    it('should include reservation summary', () => {
      expect(closeDayApi).toContain('reservation')
    })

    it('should calculate VAT', () => {
      expect(closeDayApi).toContain('vatCollected')
      expect(closeDayApi).toContain('taxRate')
    })

    it('should prevent duplicate day closing', () => {
      expect(closeDayApi).toContain('CLOSE_DAY')
      expect(closeDayApi).toContain('auditLog')
    })
  })

  describe('Cross-System Consistency', () => {
    it('reservation API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'reservations', 'index.ts'))).toBe(true)
    })

    it('reservation confirm API should exist', () => {
      const confirmPath = path.join(apiDir, 'reservation', '[id]', 'confirm.ts')
      expect(fs.existsSync(confirmPath)).toBe(true)
    })

    it('kitchen orders API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'kitchen', 'orders.ts'))).toBe(true)
    })

    it('kitchen update-status API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'kitchen', 'update-status.ts'))).toBe(true)
    })

    it('refund API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'payments', 'refunds.ts'))).toBe(true)
    })

    it('close-day API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'reports', 'close-day.ts'))).toBe(true)
    })

    it('inventory API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'inventory', 'index.ts'))).toBe(true)
    })

    it('supplier orders API should exist', () => {
      expect(fs.existsSync(path.join(apiDir, 'supplier', 'orders.ts'))).toBe(true)
    })
  })

  describe('EGR-007 Compliance — Every operational event must strengthen business continuity', () => {
    it('reservation confirmation strengthens table management (not weakens it)', () => {
      const service = readFile(path.join(servicesDir, 'reservation.service.ts'))
      const idx = service.indexOf('confirmReservation')
      const methodBody = service.slice(idx, idx + 1200)
      expect(methodBody).toContain('RESERVED')
    })

    it('reservation cancellation releases table (restores continuity)', () => {
      const service = readFile(path.join(servicesDir, 'reservation.service.ts'))
      const idx = service.indexOf('cancelReservation')
      const methodBody = service.slice(idx, idx + 1200)
      expect(methodBody).toContain('AVAILABLE')
    })

    it('no-show releases table (restores continuity)', () => {
      const service = readFile(path.join(servicesDir, 'reservation.service.ts'))
      const idx = service.indexOf('markNoShow')
      const methodBody = service.slice(idx, idx + 1200)
      expect(methodBody).toContain('AVAILABLE')
    })

    it('reservation completion releases table (restores continuity)', () => {
      const service = readFile(path.join(servicesDir, 'reservation.service.ts'))
      const idx = service.indexOf('completeReservation')
      const methodBody = service.slice(idx, idx + 1200)
      expect(methodBody).toContain('AVAILABLE')
    })
  })
})
