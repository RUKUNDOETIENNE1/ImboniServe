import { describe, it, expect } from '@jest/globals'

// Pure refund math helpers (extracted from /api/payments/refunds.ts logic)

function validateRefundAmount(refundCents: number, originalCents: number): string | null {
  if (refundCents <= 0) return 'Refund amount must be positive'
  if (refundCents > originalCents) return 'Refund amount cannot exceed original transaction amount'
  return null
}

function resolveRefundAmount(
  requestedCents: number | undefined,
  originalCents: number
): number {
  return requestedCents ?? originalCents
}

function intouchAmountFromCents(amountCents: number): number {
  return Math.round(amountCents / 100)
}

describe('Refund amount validation', () => {
  it('allows full refund', () => {
    expect(validateRefundAmount(50000, 50000)).toBeNull()
  })

  it('allows partial refund', () => {
    expect(validateRefundAmount(25000, 50000)).toBeNull()
  })

  it('rejects refund exceeding original', () => {
    expect(validateRefundAmount(60000, 50000)).toMatch(/exceed/)
  })

  it('rejects zero amount', () => {
    expect(validateRefundAmount(0, 50000)).toMatch(/positive/)
  })

  it('rejects negative amount', () => {
    expect(validateRefundAmount(-100, 50000)).toMatch(/positive/)
  })

  it('allows 1-cent partial refund', () => {
    expect(validateRefundAmount(1, 50000)).toBeNull()
  })
})

describe('resolveRefundAmount', () => {
  it('uses requested amount when provided', () => {
    expect(resolveRefundAmount(25000, 50000)).toBe(25000)
  })

  it('defaults to original amount when undefined', () => {
    expect(resolveRefundAmount(undefined, 50000)).toBe(50000)
  })
})

describe('InTouch amount conversion (cents to RWF units)', () => {
  it('converts 5000 RWF cents to 50 RWF', () => {
    expect(intouchAmountFromCents(5000)).toBe(50)
  })

  it('converts 100000 RWF cents to 1000 RWF', () => {
    expect(intouchAmountFromCents(100000)).toBe(1000)
  })

  it('rounds fractional cents down', () => {
    expect(intouchAmountFromCents(10001)).toBe(100)
  })

  it('handles 1 RWF (100 cents)', () => {
    expect(intouchAmountFromCents(100)).toBe(1)
  })

  it('handles large amounts (500,000 RWF)', () => {
    expect(intouchAmountFromCents(50000000)).toBe(500000)
  })
})

describe('Payout net calculation', () => {
  function calcNetToBusinessCents(
    amountCents: number,
    platformFeePercent: number,
    gatewayFeePercent: number
  ): number {
    const platformFee = Math.round(amountCents * (platformFeePercent / 100))
    const gatewayFee = Math.round(amountCents * (gatewayFeePercent / 100))
    return amountCents - platformFee - gatewayFee
  }

  it('calculates net correctly with 2% platform + 1% gateway', () => {
    const net = calcNetToBusinessCents(100000, 2, 1)
    expect(net).toBe(97000)
  })

  it('calculates net correctly with no fees', () => {
    expect(calcNetToBusinessCents(100000, 0, 0)).toBe(100000)
  })

  it('never produces negative net for reasonable fee rates', () => {
    const net = calcNetToBusinessCents(100000, 5, 3)
    expect(net).toBeGreaterThan(0)
    expect(net).toBe(92000)
  })

  it('handles rounding on odd amounts', () => {
    // 333 cents * 5% = 16.65 → rounds to 17
    const platformFee = Math.round(333 * 0.05)
    expect(platformFee).toBe(17)
    const net = calcNetToBusinessCents(333, 5, 0)
    expect(net).toBe(333 - 17)
  })
})
