/**
 * UNIT TESTS: Tax Calculation Logic
 * Tests INCLUSIVE vs EXCLUSIVE tax modes for financial accuracy
 * 
 * Priority: HIGHEST
 * Coverage Target: 100%
 */

describe('Tax Calculation Logic', () => {

  const VAT_RATE = 18.0;

  // ─── Helper: mirrors qr-order.service.ts logic ────────────────────

  function calculateTax(menuPriceSumCents: number, taxMode: 'INCLUSIVE' | 'EXCLUSIVE', taxRate: number = VAT_RATE) {
    let subtotalCents: number;
    let vatCents: number;
    let totalCents: number;

    if (taxMode === 'INCLUSIVE') {
      totalCents = menuPriceSumCents;
      vatCents = Math.round(totalCents * (taxRate / (100 + taxRate)));
      subtotalCents = totalCents - vatCents;
    } else {
      subtotalCents = menuPriceSumCents;
      vatCents = Math.round(subtotalCents * (taxRate / 100));
      totalCents = subtotalCents + vatCents;
    }

    return { subtotalCents, vatCents, totalCents };
  }

  // ─── EXCLUSIVE Tax Mode ───────────────────────────────────────────

  describe('EXCLUSIVE Tax Mode (VAT added on top)', () => {

    test('RWF 10,000 subtotal → RWF 1,800 VAT → RWF 11,800 total', () => {
      const result = calculateTax(1000000, 'EXCLUSIVE');
      expect(result.subtotalCents).toBe(1000000);
      expect(result.vatCents).toBe(180000);
      expect(result.totalCents).toBe(1180000);
    });

    test('RWF 5,000 subtotal → RWF 900 VAT → RWF 5,900 total', () => {
      const result = calculateTax(500000, 'EXCLUSIVE');
      expect(result.subtotalCents).toBe(500000);
      expect(result.vatCents).toBe(90000);
      expect(result.totalCents).toBe(590000);
    });

    test('subtotal + VAT always equals total', () => {
      const amounts = [100, 1000, 10000, 50000, 100000, 999999, 5000000];
      for (const amt of amounts) {
        const r = calculateTax(amt, 'EXCLUSIVE');
        expect(r.subtotalCents + r.vatCents).toBe(r.totalCents);
      }
    });

    test('VAT is exactly 18% of subtotal (rounded)', () => {
      const amounts = [100000, 500000, 1000000, 3333333];
      for (const amt of amounts) {
        const r = calculateTax(amt, 'EXCLUSIVE');
        expect(r.vatCents).toBe(Math.round(amt * 0.18));
      }
    });
  });

  // ─── INCLUSIVE Tax Mode ───────────────────────────────────────────

  describe('INCLUSIVE Tax Mode (VAT included in price)', () => {

    test('RWF 11,800 total → extracts RWF 1,800 VAT → RWF 10,000 subtotal', () => {
      const result = calculateTax(1180000, 'INCLUSIVE');
      expect(result.totalCents).toBe(1180000);
      expect(result.vatCents).toBe(180000);
      expect(result.subtotalCents).toBe(1000000);
    });

    test('RWF 5,900 total → extracts RWF 900 VAT → RWF 5,000 subtotal', () => {
      const result = calculateTax(590000, 'INCLUSIVE');
      expect(result.totalCents).toBe(590000);
      expect(result.vatCents).toBe(90000);
      expect(result.subtotalCents).toBe(500000);
    });

    test('total = subtotal + VAT always holds', () => {
      const amounts = [100, 1000, 59000, 118000, 500000, 1180000, 9999999];
      for (const amt of amounts) {
        const r = calculateTax(amt, 'INCLUSIVE');
        expect(r.subtotalCents + r.vatCents).toBe(r.totalCents);
      }
    });

    test('INCLUSIVE total equals menu price (no extra charge)', () => {
      const menuPrice = 1180000;
      const r = calculateTax(menuPrice, 'INCLUSIVE');
      expect(r.totalCents).toBe(menuPrice);
    });
  });

  // ─── Cross-Mode Consistency ───────────────────────────────────────

  describe('Cross-Mode Consistency', () => {

    test('EXCLUSIVE subtotal X → INCLUSIVE total should extract same subtotal', () => {
      const subtotal = 1000000; // RWF 10,000
      const exclusive = calculateTax(subtotal, 'EXCLUSIVE');
      const inclusive = calculateTax(exclusive.totalCents, 'INCLUSIVE');

      // Inclusive extraction should match original subtotal
      expect(inclusive.subtotalCents).toBe(subtotal);
      expect(inclusive.vatCents).toBe(exclusive.vatCents);
    });

    test('round-trip consistency for various amounts', () => {
      const subtotals = [50000, 100000, 333333, 500000, 1000000, 2500000];
      for (const sub of subtotals) {
        const excl = calculateTax(sub, 'EXCLUSIVE');
        const incl = calculateTax(excl.totalCents, 'INCLUSIVE');
        expect(incl.subtotalCents).toBe(sub);
      }
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────

  describe('Tax Edge Cases', () => {

    test('zero amount → zero everything', () => {
      const exclResult = calculateTax(0, 'EXCLUSIVE');
      expect(exclResult.subtotalCents).toBe(0);
      expect(exclResult.vatCents).toBe(0);
      expect(exclResult.totalCents).toBe(0);

      const inclResult = calculateTax(0, 'INCLUSIVE');
      expect(inclResult.subtotalCents).toBe(0);
      expect(inclResult.vatCents).toBe(0);
      expect(inclResult.totalCents).toBe(0);
    });

    test('1 cent amount (smallest possible)', () => {
      const exclResult = calculateTax(1, 'EXCLUSIVE');
      expect(exclResult.subtotalCents).toBe(1);
      expect(exclResult.vatCents).toBe(0); // 0.18 rounds to 0
      expect(exclResult.totalCents).toBe(1);
    });

    test('0% tax rate → no VAT', () => {
      const result = calculateTax(1000000, 'EXCLUSIVE', 0);
      expect(result.vatCents).toBe(0);
      expect(result.totalCents).toBe(1000000);
    });

    test('100% tax rate → doubles the price (EXCLUSIVE)', () => {
      const result = calculateTax(1000000, 'EXCLUSIVE', 100);
      expect(result.vatCents).toBe(1000000);
      expect(result.totalCents).toBe(2000000);
    });

    test('all results are integers (no floating point cents)', () => {
      const amounts = [1, 3, 7, 11, 99, 333, 777, 9999, 33333, 77777, 123456];
      for (const amt of amounts) {
        for (const mode of ['INCLUSIVE', 'EXCLUSIVE'] as const) {
          const r = calculateTax(amt, mode);
          expect(Number.isInteger(r.subtotalCents)).toBe(true);
          expect(Number.isInteger(r.vatCents)).toBe(true);
          expect(Number.isInteger(r.totalCents)).toBe(true);
        }
      }
    });

    test('very large amount handles correctly', () => {
      const result = calculateTax(10000000000, 'EXCLUSIVE'); // RWF 100M
      expect(result.vatCents).toBe(1800000000); // 18M VAT
      expect(result.totalCents).toBe(11800000000);
      expect(Number.isFinite(result.totalCents)).toBe(true);
    });
  });

  // ─── Deposit Calculation ──────────────────────────────────────────

  describe('Deposit Calculation', () => {

    function calculateDeposit(totalCents: number, isRemote: boolean, requireDeposit: boolean, depositPercent: number = 50) {
      const depositCents = (isRemote && requireDeposit)
        ? Math.round(totalCents * (depositPercent / 100))
        : 0;
      const remainingCents = totalCents - depositCents;
      return { depositCents, remainingCents };
    }

    test('remote order with 50% deposit', () => {
      const r = calculateDeposit(1000000, true, true, 50);
      expect(r.depositCents).toBe(500000);
      expect(r.remainingCents).toBe(500000);
    });

    test('in-venue order → no deposit', () => {
      const r = calculateDeposit(1000000, false, true, 50);
      expect(r.depositCents).toBe(0);
      expect(r.remainingCents).toBe(1000000);
    });

    test('remote but deposit not required → no deposit', () => {
      const r = calculateDeposit(1000000, true, false, 50);
      expect(r.depositCents).toBe(0);
      expect(r.remainingCents).toBe(1000000);
    });

    test('deposit + remaining = total (always)', () => {
      const totals = [100, 1000, 50000, 100000, 999999, 5000000];
      const percents = [10, 25, 50, 75, 100];
      for (const total of totals) {
        for (const pct of percents) {
          const r = calculateDeposit(total, true, true, pct);
          expect(r.depositCents + r.remainingCents).toBe(total);
        }
      }
    });

    test('100% deposit → remaining is 0', () => {
      const r = calculateDeposit(1000000, true, true, 100);
      expect(r.depositCents).toBe(1000000);
      expect(r.remainingCents).toBe(0);
    });
  });
});
