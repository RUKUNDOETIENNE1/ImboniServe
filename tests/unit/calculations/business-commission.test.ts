/**
 * UNIT TESTS: Business Commission & Payout Calculations
 * Tests the 5% business commission logic with unified fee system
 * 
 * Priority: HIGHEST (financial accuracy)
 * Coverage Target: 100%
 */

import { mockPrisma, resetAllMocks } from '../../utils/mock-prisma';
import { createMockFeeConfig } from '../../utils/mock-data';

// Must import AFTER mock is set up
import { calculateBusinessPayout } from '@/lib/services/business-payout.service';
import { calculateFeeAmount, FeeType } from '@/lib/services/platform-fee.service';

describe('Business Commission & Payout Calculations', () => {

  beforeEach(() => {
    resetAllMocks();
    // Default: return 5% from database
    mockPrisma.platformFeeConfig.findFirst.mockResolvedValue(
      createMockFeeConfig({ feeType: 'BUSINESS_COMMISSION', feePercent: 5.0 })
    );
  });

  // ─── Core Commission Calculation ──────────────────────────────────

  describe('5% Business Commission', () => {

    test('RWF 10,000 gross → RWF 500 commission → RWF 9,500 net', async () => {
      const result = await calculateBusinessPayout(1000000);
      expect(result.grossAmountCents).toBe(1000000);
      expect(result.platformCommissionCents).toBe(50000);
      expect(result.netPayoutCents).toBe(950000);
      expect(result.commissionPercent).toBe(5.0);
    });

    test('RWF 1,000 gross → RWF 50 commission → RWF 950 net', async () => {
      const result = await calculateBusinessPayout(100000);
      expect(result.platformCommissionCents).toBe(5000);
      expect(result.netPayoutCents).toBe(95000);
    });

    test('RWF 100,000 gross → RWF 5,000 commission → RWF 95,000 net', async () => {
      const result = await calculateBusinessPayout(10000000);
      expect(result.platformCommissionCents).toBe(500000);
      expect(result.netPayoutCents).toBe(9500000);
    });

    test('gross = commission + net (no money lost)', async () => {
      const amounts = [100, 1000, 10000, 50000, 100000, 333333, 999999, 5000000];
      for (const amount of amounts) {
        const result = await calculateBusinessPayout(amount);
        expect(result.platformCommissionCents + result.netPayoutCents).toBe(amount);
      }
    });
  });

  // ─── Fallback When DB Unavailable ─────────────────────────────────

  describe('Fallback to Default (5%) When DB Fails', () => {

    test('uses 5% default when database query fails', async () => {
      mockPrisma.platformFeeConfig.findFirst.mockRejectedValue(new Error('DB connection lost'));
      const result = await calculateBusinessPayout(1000000);
      expect(result.platformCommissionCents).toBe(50000);
      expect(result.commissionPercent).toBe(5.0);
    });

    test('uses 5% default when no fee config exists in DB', async () => {
      mockPrisma.platformFeeConfig.findFirst.mockResolvedValue(null);
      const result = await calculateBusinessPayout(1000000);
      expect(result.platformCommissionCents).toBe(50000);
    });
  });

  // ─── Dynamic Fee Changes ──────────────────────────────────────────

  describe('Dynamic Fee from Unified System', () => {

    test('uses 3% when admin changes commission rate', async () => {
      mockPrisma.platformFeeConfig.findFirst.mockReset();
      mockPrisma.platformFeeConfig.findFirst.mockResolvedValue(
        createMockFeeConfig({ feePercent: 3.0 })
      );
      const result = await calculateBusinessPayout(1000000);
      expect(result.platformCommissionCents).toBe(30000);
      expect(result.commissionPercent).toBe(3.0);
    });

    test('uses 10% when admin sets higher rate', async () => {
      mockPrisma.platformFeeConfig.findFirst.mockReset();
      mockPrisma.platformFeeConfig.findFirst.mockResolvedValue(
        createMockFeeConfig({ feePercent: 10.0 })
      );
      const result = await calculateBusinessPayout(1000000);
      expect(result.platformCommissionCents).toBe(100000);
    });

    test('uses 0% when commission disabled', async () => {
      mockPrisma.platformFeeConfig.findFirst.mockReset();
      mockPrisma.platformFeeConfig.findFirst.mockResolvedValue(
        createMockFeeConfig({ feePercent: 0 })
      );
      const result = await calculateBusinessPayout(1000000);
      expect(result.platformCommissionCents).toBe(0);
      expect(result.netPayoutCents).toBe(1000000);
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────

  describe('Edge Cases', () => {

    test('zero gross amount', async () => {
      const result = await calculateBusinessPayout(0);
      expect(result.grossAmountCents).toBe(0);
      expect(result.platformCommissionCents).toBe(0);
      expect(result.netPayoutCents).toBe(0);
    });

    test('1 cent gross amount', async () => {
      const result = await calculateBusinessPayout(1);
      expect(result.grossAmountCents).toBe(1);
      expect(result.platformCommissionCents).toBe(0); // 0.05 rounds to 0
      expect(result.netPayoutCents).toBe(1);
    });

    test('large amount: RWF 10,000,000', async () => {
      const result = await calculateBusinessPayout(1000000000);
      expect(result.platformCommissionCents).toBe(50000000);
      expect(result.netPayoutCents).toBe(950000000);
    });

    test('odd amount: RWF 3,333', async () => {
      const result = await calculateBusinessPayout(333300);
      // 333300 * 5 / 100 = 16665
      expect(result.platformCommissionCents).toBe(16665);
      expect(result.netPayoutCents).toBe(316635);
      expect(result.platformCommissionCents + result.netPayoutCents).toBe(333300);
    });

    test('commission is always non-negative', async () => {
      const amounts = [0, 1, 3, 7, 11, 99, 100, 333, 999999];
      for (const amt of amounts) {
        const r = await calculateBusinessPayout(amt);
        expect(r.platformCommissionCents).toBeGreaterThanOrEqual(0);
        expect(r.netPayoutCents).toBeGreaterThanOrEqual(0);
      }
    });

    test('net payout never exceeds gross', async () => {
      const amounts = [0, 1, 100, 10000, 100000, 1000000, 99999999];
      for (const amt of amounts) {
        const r = await calculateBusinessPayout(amt);
        expect(r.netPayoutCents).toBeLessThanOrEqual(r.grossAmountCents);
      }
    });
  });

  // ─── Fee Type Constants ───────────────────────────────────────────

  describe('Fee Type Enum Integrity', () => {
    test('all fee types are defined', () => {
      expect(FeeType.BUSINESS_COMMISSION).toBe('BUSINESS_COMMISSION');
      expect(FeeType.SUPPLIER_PLATFORM_FEE).toBe('SUPPLIER_PLATFORM_FEE');
      expect(FeeType.MARKETPLACE_COMMISSION).toBe('MARKETPLACE_COMMISSION');
      expect(FeeType.DIGITAL_PAYMENT_FEE).toBe('DIGITAL_PAYMENT_FEE');
      expect(FeeType.SPLIT_PAYMENT_FEE).toBe('SPLIT_PAYMENT_FEE');
      expect(FeeType.DIGITAL_TIPPING_FEE).toBe('DIGITAL_TIPPING_FEE');
    });

    test('no duplicate fee types', () => {
      const values = Object.values(FeeType);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
});
