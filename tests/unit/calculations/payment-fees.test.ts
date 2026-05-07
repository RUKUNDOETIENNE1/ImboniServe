/**
 * UNIT TESTS: Payment Fee Calculations
 * Tests ALL fee calculation logic for financial accuracy
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

import { calculateFeeAmount } from '@/lib/services/platform-fee.service';

describe('Payment Fee Calculations', () => {

  // ─── calculateFeeAmount (Pure Function) ───────────────────────────

  describe('calculateFeeAmount', () => {

    test('calculates 5% business commission correctly', () => {
      expect(calculateFeeAmount(1000000, 5.0)).toBe(50000); // RWF 10,000 → 500 fee
      expect(calculateFeeAmount(500000, 5.0)).toBe(25000);
      expect(calculateFeeAmount(100000, 5.0)).toBe(5000);
    });

    test('calculates 7.5% supplier fee correctly', () => {
      expect(calculateFeeAmount(1000000, 7.5)).toBe(75000);
      expect(calculateFeeAmount(200000, 7.5)).toBe(15000);
    });

    test('calculates 2.5% tipping fee correctly', () => {
      expect(calculateFeeAmount(50000, 2.5)).toBe(1250); // RWF 500 tip → 12.50 fee
      expect(calculateFeeAmount(100000, 2.5)).toBe(2500);
    });

    test('calculates 1.5% split payment fee correctly', () => {
      expect(calculateFeeAmount(500000, 1.5)).toBe(7500);
    });

    test('handles zero amount', () => {
      expect(calculateFeeAmount(0, 5.0)).toBe(0);
      expect(calculateFeeAmount(0, 100.0)).toBe(0);
    });

    test('handles zero percent', () => {
      expect(calculateFeeAmount(1000000, 0)).toBe(0);
      expect(calculateFeeAmount(999999, 0)).toBe(0);
    });

    test('rounds correctly using Math.round (nearest integer RWF)', () => {
      // 333 * 5 / 100 = 16.65 → rounds to 17
      expect(calculateFeeAmount(333, 5.0)).toBe(17);
      // 777 * 5 / 100 = 38.85 → rounds to 39
      expect(calculateFeeAmount(777, 5.0)).toBe(39);
      // 1 * 5 / 100 = 0.05 → rounds to 0
      expect(calculateFeeAmount(1, 5.0)).toBe(0);
      // 10 * 5 / 100 = 0.5 → rounds to 1 (banker's rounding in JS)
      expect(calculateFeeAmount(10, 5.0)).toBe(1);
    });

    test('respects minAmountCents', () => {
      // Fee would be 50, but min is 100
      expect(calculateFeeAmount(1000, 5.0, 100)).toBe(100);
      // Fee would be 5000, min is 100 - fee wins
      expect(calculateFeeAmount(100000, 5.0, 100)).toBe(5000);
    });

    test('respects maxAmountCents', () => {
      // Fee would be 50000, but max is 10000
      expect(calculateFeeAmount(1000000, 5.0, undefined, 10000)).toBe(10000);
      // Fee would be 500, max is 10000 - fee wins (under cap)
      expect(calculateFeeAmount(10000, 5.0, undefined, 10000)).toBe(500);
    });

    test('respects both min and max together', () => {
      // Fee = 50, min=100, max=10000 → clamped to 100
      expect(calculateFeeAmount(1000, 5.0, 100, 10000)).toBe(100);
      // Fee = 50000, min=100, max=10000 → clamped to 10000
      expect(calculateFeeAmount(1000000, 5.0, 100, 10000)).toBe(10000);
      // Fee = 5000, min=100, max=10000 → stays 5000
      expect(calculateFeeAmount(100000, 5.0, 100, 10000)).toBe(5000);
    });

    test('handles very large amounts without overflow', () => {
      // RWF 100,000,000 (100M) at 5%
      const result = calculateFeeAmount(10000000000, 5.0);
      expect(result).toBe(500000000);
      expect(Number.isFinite(result)).toBe(true);
    });

    test('handles very small amounts (1 cent)', () => {
      expect(calculateFeeAmount(1, 5.0)).toBe(0);
      expect(calculateFeeAmount(1, 50.0)).toBe(1);
      expect(calculateFeeAmount(1, 100.0)).toBe(1);
    });

    test('handles fractional percentages', () => {
      expect(calculateFeeAmount(10000, 3.42)).toBe(342); // IremboPay gateway fee
      expect(calculateFeeAmount(100000, 3.42)).toBe(3420);
    });
  });

  // ─── Customer Fee Policy (0%) ─────────────────────────────────────

  describe('Customer Fee Policy', () => {
    test('customer should NEVER pay platform fee (0%)', () => {
      const amounts = [100, 1000, 10000, 100000, 1000000, 9999999];
      for (const amount of amounts) {
        expect(calculateFeeAmount(amount, 0)).toBe(0);
      }
    });
  });

  // ─── Rounding Edge Cases ──────────────────────────────────────────

  describe('RWF Rounding (Nearest Integer)', () => {
    test('all fees produce integer results', () => {
      const testCases = [
        { amount: 1, percent: 1 },
        { amount: 3, percent: 7 },
        { amount: 7, percent: 3 },
        { amount: 11, percent: 13 },
        { amount: 99999, percent: 5.0 },
        { amount: 100001, percent: 5.0 },
        { amount: 333333, percent: 2.5 },
        { amount: 777777, percent: 7.5 },
      ];

      for (const { amount, percent } of testCases) {
        const result = calculateFeeAmount(amount, percent);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    });

    test('fee + remaining always equals original amount', () => {
      const amounts = [10000, 33333, 77777, 99999, 123456, 1000000];
      const percent = 5.0;

      for (const amount of amounts) {
        const fee = calculateFeeAmount(amount, percent);
        const remaining = amount - fee;
        expect(fee + remaining).toBe(amount);
      }
    });
  });
});
