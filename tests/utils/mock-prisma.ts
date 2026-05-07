/**
 * Prisma Mock for Unit Tests
 * Provides a mock prisma client that doesn't require database connection
 */

// Deep mock factory for Prisma operations
function createMockModel() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
}

export const mockPrisma = {
  business: createMockModel(),
  sale: createMockModel(),
  saleItem: createMockModel(),
  salePayment: createMockModel(),
  menuItem: createMockModel(),
  table: createMockModel(),
  seat: createMockModel(),
  customer: createMockModel(),
  staffTip: createMockModel(),
  tipChoice: createMockModel(),
  paymentTransaction: createMockModel(),
  platformFeeConfig: createMockModel(),
  user: createMockModel(),
  subscription: createMockModel(),
  invoice: createMockModel(),
  smartDiningSlip: createMockModel(),
  reservation: createMockModel(),
  $transaction: jest.fn((fn: any) => {
    if (typeof fn === 'function') {
      return fn(mockPrisma);
    }
    return Promise.all(fn);
  }),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

// Auto-mock the prisma import
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

/**
 * Reset all mocks between tests
 */
export function resetAllMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as jest.Mock).mockReset();
        }
      });
    }
  });
}
