/**
 * Mock Data Factory
 * Generates realistic test data for all test scenarios
 */

// ─── Business ────────────────────────────────────────────────────────
export function createMockBusiness(overrides: Record<string, any> = {}) {
  return {
    id: 'biz_test_' + Math.random().toString(36).substr(2, 8),
    name: 'Test Restaurant',
    phone: '+250788000001',
    ownerId: 'owner_test_001',
    currency: 'RWF',
    city: 'Kigali',
    country: 'RW',
    timezone: 'Africa/Kigali',
    isActive: true,
    taxMode: 'EXCLUSIVE' as const,
    taxRate: 18.0,
    enableDigitalTipping: true,
    enableQRInVenue: true,
    enableQRRemote: true,
    splitPaymentConvenienceFeeEnabled: true,
    splitPaymentConvenienceFeePercent: 1.5,
    defaultDepositPercent: 50.0,
    requireDepositRemote: true,
    slotDurationMinutes: 30,
    maxRemoteOrdersPerSlot: 10,
    ...overrides,
  };
}

// ─── Menu Items ──────────────────────────────────────────────────────
export function createMockMenuItem(overrides: Record<string, any> = {}) {
  return {
    id: 'menu_' + Math.random().toString(36).substr(2, 8),
    name: 'Beef Brochette',
    description: 'Grilled beef skewers',
    priceCents: 350000, // RWF 3,500
    isAvailable: true,
    businessId: 'biz_test_001',
    ...overrides,
  };
}

// ─── Sale (Order) ────────────────────────────────────────────────────
export function createMockSale(overrides: Record<string, any> = {}) {
  return {
    id: 'sale_' + Math.random().toString(36).substr(2, 8),
    orderNumber: `ORD-${Date.now()}-TEST`,
    businessId: 'biz_test_001',
    userId: 'user_test_001',
    totalAmountCents: 1000000, // RWF 10,000
    paymentMethod: 'MTN_MOBILE_MONEY',
    paymentStatus: 'PENDING',
    isPaid: false,
    status: 'ACTIVE',
    orderSource: 'QR_IN_VENUE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Sale Item ───────────────────────────────────────────────────────
export function createMockSaleItem(overrides: Record<string, any> = {}) {
  return {
    id: 'item_' + Math.random().toString(36).substr(2, 8),
    saleId: 'sale_test_001',
    menuItemId: 'menu_test_001',
    quantity: 1,
    unitPriceCents: 350000,
    totalPriceCents: 350000,
    ...overrides,
  };
}

// ─── Table ───────────────────────────────────────────────────────────
export function createMockTable(overrides: Record<string, any> = {}) {
  return {
    id: 'table_' + Math.random().toString(36).substr(2, 8),
    number: '1',
    capacity: 4,
    businessId: 'biz_test_001',
    isActive: true,
    qrCode: 'QR-TABLE-001',
    ...overrides,
  };
}

// ─── Seat ────────────────────────────────────────────────────────────
export function createMockSeat(overrides: Record<string, any> = {}) {
  return {
    id: 'seat_' + Math.random().toString(36).substr(2, 8),
    tableId: 'table_test_001',
    seatNumber: 1,
    seatLabel: 'Seat A',
    isActive: true,
    qrCode: 'QR-SEAT-001',
    qrDesign: null,
    position: null,
    table: createMockTable(),
    ...overrides,
  };
}

// ─── Payment Transaction ─────────────────────────────────────────────
export function createMockPaymentTransaction(overrides: Record<string, any> = {}) {
  return {
    id: 'txn_' + Math.random().toString(36).substr(2, 8),
    businessId: 'biz_test_001',
    invoiceNumber: `INV-${Date.now()}`,
    transactionId: `TXN-${Date.now()}`,
    amountCents: 1000000,
    status: 'PENDING',
    gateway: 'IREMBO_PAY',
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Staff Tip ───────────────────────────────────────────────────────
export function createMockStaffTip(overrides: Record<string, any> = {}) {
  return {
    id: 'tip_' + Math.random().toString(36).substr(2, 8),
    saleId: 'sale_test_001',
    staffId: 'staff_test_001',
    businessId: 'biz_test_001',
    amountCents: 50000, // RWF 500
    platformFeeCents: 1250, // 2.5%
    netToStaffCents: 48750,
    status: 'PENDING',
    tipType: 'ROUND_UP',
    ...overrides,
  };
}

// ─── User ────────────────────────────────────────────────────────────
export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user_' + Math.random().toString(36).substr(2, 8),
    name: 'Test User',
    email: 'test@example.com',
    phone: '+250788000001',
    password: 'hashed_password',
    roles: ['OWNER'],
    isActive: true,
    businessId: 'biz_test_001',
    ...overrides,
  };
}

// ─── Platform Fee Config ─────────────────────────────────────────────
export function createMockFeeConfig(overrides: Record<string, any> = {}) {
  return {
    id: 'fee_' + Math.random().toString(36).substr(2, 8),
    feeType: 'BUSINESS_COMMISSION',
    feePercent: 5.0,
    isActive: true,
    description: 'Test fee config',
    effectiveFrom: new Date('2024-01-01'),
    effectiveUntil: null,
    minAmountCents: null,
    maxAmountCents: null,
    ...overrides,
  };
}

// ─── Reservation ─────────────────────────────────────────────────────
export function createMockReservation(overrides: Record<string, any> = {}) {
  return {
    id: 'res_' + Math.random().toString(36).substr(2, 8),
    businessId: 'biz_test_001',
    userId: 'user_test_001',
    tableId: 'table_test_001',
    guestCount: 4,
    status: 'PENDING',
    reservedAt: new Date(Date.now() + 86400000), // tomorrow
    ...overrides,
  };
}

// ─── Batch Generators ────────────────────────────────────────────────

/** Generate N mock sales for stress testing */
export function generateBulkSales(count: number, businessId: string = 'biz_test_001') {
  return Array.from({ length: count }, (_, i) =>
    createMockSale({
      orderNumber: `ORD-BULK-${i + 1}`,
      businessId,
      totalAmountCents: Math.floor(Math.random() * 5000000) + 100000,
    })
  );
}

/** Generate N mock menu items */
export function generateBulkMenuItems(count: number, businessId: string = 'biz_test_001') {
  const names = ['Brochette', 'Chips', 'Rice', 'Fish', 'Chicken', 'Salad', 'Soup', 'Juice', 'Beer', 'Steak'];
  return Array.from({ length: count }, (_, i) =>
    createMockMenuItem({
      name: `${names[i % names.length]} ${Math.ceil((i + 1) / names.length)}`,
      priceCents: (Math.floor(Math.random() * 50) + 5) * 10000, // 500-5500 RWF
      businessId,
    })
  );
}

/** Generate N concurrent order inputs for stress testing */
export function generateConcurrentOrderInputs(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    branchId: 'biz_test_001',
    tableId: `table_${(i % 20) + 1}`,
    items: [
      { menuItemId: `menu_${(i % 10) + 1}`, quantity: Math.floor(Math.random() * 3) + 1 },
    ],
    orderSource: 'QR_IN_VENUE' as const,
    paymentMethod: 'DIGITAL' as const,
    customerPhone: `+25078800${String(i).padStart(4, '0')}`,
  }));
}
