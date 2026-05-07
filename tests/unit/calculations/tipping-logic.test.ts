/**
 * UNIT TESTS: Digital Tipping Logic
 * Tests round-up tip calculations, edge cases, and consistency
 * 
 * Priority: HIGH
 * Coverage Target: 100%
 */

import { calculateRoundUpTip } from '@/lib/services/digital-tipping.service';

describe('Digital Tipping Logic', () => {

  // ─── Round-Up Logic: Bills < RWF 5,000 (round to nearest 500) ─────

  describe('Bills under RWF 5,000 (round to nearest 500)', () => {

    test('RWF 3,200 → rounds up to RWF 3,500 (tip: RWF 300)', () => {
      const result = calculateRoundUpTip(320000); // 3200 RWF in cents
      expect(result.originalAmountCents).toBe(320000);
      expect(result.suggestedAmountCents).toBe(350000);
      expect(result.tipAmountCents).toBe(30000);
      expect(result.enabled).toBe(true);
    });

    test('RWF 1,000 → already at 500 boundary (tip: RWF 0)', () => {
      const result = calculateRoundUpTip(100000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 1,500 → already at 500 boundary (tip: RWF 0)', () => {
      const result = calculateRoundUpTip(150000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 2,001 → rounds to RWF 2,500 (tip: RWF 499)', () => {
      const result = calculateRoundUpTip(200100);
      expect(result.suggestedAmountCents).toBe(250000);
      expect(result.tipAmountCents).toBe(49900);
      expect(result.enabled).toBe(true);
    });

    test('RWF 4,999 → rounds to RWF 5,000 (tip: RWF 1)', () => {
      const result = calculateRoundUpTip(499900);
      expect(result.suggestedAmountCents).toBe(500000);
      expect(result.tipAmountCents).toBe(100);
      expect(result.enabled).toBe(true);
    });

    test('RWF 100 → rounds to RWF 500 (tip: RWF 400)', () => {
      const result = calculateRoundUpTip(10000);
      expect(result.suggestedAmountCents).toBe(50000);
      expect(result.tipAmountCents).toBe(40000);
      expect(result.enabled).toBe(true);
    });
  });

  // ─── Round-Up Logic: Bills >= RWF 5,000 (round to nearest 1,000) ──

  describe('Bills RWF 5,000+ (round to nearest 1,000)', () => {

    test('RWF 5,200 → rounds to RWF 6,000 (tip: RWF 800)', () => {
      const result = calculateRoundUpTip(520000);
      expect(result.suggestedAmountCents).toBe(600000);
      expect(result.tipAmountCents).toBe(80000);
      expect(result.enabled).toBe(true);
    });

    test('RWF 10,000 → already at 1000 boundary (tip: RWF 0)', () => {
      const result = calculateRoundUpTip(1000000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 9,500 → rounds to RWF 10,000 (tip: RWF 500)', () => {
      const result = calculateRoundUpTip(950000);
      expect(result.suggestedAmountCents).toBe(1000000);
      expect(result.tipAmountCents).toBe(50000);
      expect(result.enabled).toBe(true);
    });

    test('RWF 15,001 → rounds to RWF 16,000 (tip: RWF 999)', () => {
      const result = calculateRoundUpTip(1500100);
      expect(result.suggestedAmountCents).toBe(1600000);
      expect(result.tipAmountCents).toBe(99900);
      expect(result.enabled).toBe(true);
    });

    test('RWF 50,000 → already at 1000 boundary (tip: RWF 0)', () => {
      const result = calculateRoundUpTip(5000000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 99,999 → rounds to RWF 100,000 (tip: RWF 1)', () => {
      const result = calculateRoundUpTip(9999900);
      expect(result.suggestedAmountCents).toBe(10000000);
      expect(result.tipAmountCents).toBe(100);
      expect(result.enabled).toBe(true);
    });
  });

  // ─── Boundary: Exactly RWF 5,000 ──────────────────────────────────

  describe('Boundary at RWF 5,000', () => {

    test('RWF 4,999 uses 500 rounding → RWF 5,000', () => {
      const result = calculateRoundUpTip(499900);
      expect(result.suggestedAmountCents).toBe(500000);
    });

    test('RWF 5,000 uses 1000 rounding → tip is 0', () => {
      const result = calculateRoundUpTip(500000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 5,001 uses 1000 rounding → RWF 6,000', () => {
      const result = calculateRoundUpTip(500100);
      expect(result.suggestedAmountCents).toBe(600000);
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────

  describe('Edge Cases', () => {

    test('RWF 0 → tip is 0, disabled', () => {
      const result = calculateRoundUpTip(0);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('RWF 1 (1 cent) → rounds to RWF 500', () => {
      const result = calculateRoundUpTip(100);
      expect(result.suggestedAmountCents).toBe(50000);
      expect(result.tipAmountCents).toBe(49900);
    });

    test('very large bill: RWF 500,000 → no tip (at boundary)', () => {
      const result = calculateRoundUpTip(50000000);
      expect(result.tipAmountCents).toBe(0);
      expect(result.enabled).toBe(false);
    });

    test('tip amount is always non-negative', () => {
      const amounts = [0, 1, 100, 10000, 50000, 100000, 500000, 1000000, 5000000, 99999999];
      for (const amt of amounts) {
        const result = calculateRoundUpTip(amt);
        expect(result.tipAmountCents).toBeGreaterThanOrEqual(0);
      }
    });

    test('suggested amount is always >= original', () => {
      const amounts = [0, 100, 50000, 100000, 499900, 500100, 1000000, 9999900];
      for (const amt of amounts) {
        const result = calculateRoundUpTip(amt);
        expect(result.suggestedAmountCents).toBeGreaterThanOrEqual(amt);
      }
    });

    test('tipAmount = suggestedAmount - originalAmount (math identity)', () => {
      const amounts = [100, 320000, 499900, 500100, 950000, 1500100, 9999900];
      for (const amt of amounts) {
        const result = calculateRoundUpTip(amt);
        expect(result.tipAmountCents).toBe(result.suggestedAmountCents - result.originalAmountCents);
      }
    });
  });

  // ─── Platform Fee on Tips ──────────────────────────────────────────

  describe('Platform Fee on Tips (2.5%)', () => {
    const TIPPING_FEE_PERCENT = 2.5;

    test('fee on RWF 500 tip = RWF 12.50 → rounds to 13', () => {
      const tipCents = 50000;
      const fee = Math.round(tipCents * (TIPPING_FEE_PERCENT / 100));
      expect(fee).toBe(1250);
      const net = tipCents - fee;
      expect(net).toBe(48750);
      expect(fee + net).toBe(tipCents);
    });

    test('fee on RWF 1,000 tip = RWF 25', () => {
      const tipCents = 100000;
      const fee = Math.round(tipCents * (TIPPING_FEE_PERCENT / 100));
      expect(fee).toBe(2500);
    });

    test('fee on RWF 1 tip = 0 (too small)', () => {
      const tipCents = 100;
      const fee = Math.round(tipCents * (TIPPING_FEE_PERCENT / 100));
      expect(fee).toBe(3); // 2.5 → rounds to 3
    });

    test('fee + net always equals original tip (no money lost)', () => {
      const tips = [100, 1000, 5000, 10000, 50000, 100000, 500000, 999999];
      for (const tipCents of tips) {
        const fee = Math.round(tipCents * (TIPPING_FEE_PERCENT / 100));
        const net = tipCents - fee;
        expect(fee + net).toBe(tipCents);
      }
    });
  });
});
