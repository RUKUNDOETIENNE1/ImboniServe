/**
 * Canonical Currency Exchange Service
 *
 * Single source of truth for:
 * - Currency capability definitions
 * - Historical exchange-rate lookup
 * - Deterministic conversion with explicit direction and rate type
 *
 * Safety policy:
 * - Never silently falls back to 1:1
 * - Never silently switches to third-party FX providers
 */

import { prisma } from '@/lib/prisma';
import { Prisma, ExchangeRateType } from '@prisma/client';

export type ConversionRateType = ExchangeRateType;

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  isActive: boolean;
  displayEnabled: boolean;
  transactionEnabled: boolean;
  paymentEnabled: boolean;
  settlementEnabled: boolean;
}

export interface ExchangeRateSnapshot {
  rateId: string;
  fromCurrency: string;
  toCurrency: string;
  rateType: ConversionRateType;
  rate: Prisma.Decimal;
  source: string;
  sourceRecordId?: string;
  effectiveDate: Date;
  fetchedAt: Date;
}

export interface MinorUnitConversionResult {
  fromAmountMinor: number;
  fromCurrency: string;
  toAmountMinor: number;
  toCurrency: string;
  rateSnapshot: ExchangeRateSnapshot;
}

export class CurrencyValidationError extends Error {}
export class ExchangeRateNotFoundError extends Error {}
export class ExchangeRateStaleError extends Error {}
export class ExchangeRateInvalidError extends Error {}

const identityRateCache = new Map<string, { snapshot: ExchangeRateSnapshot; cachedAt: number }>();
const currencyCache = new Map<string, { currency: CurrencyDefinition; cachedAt: number }>();
const RATE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CURRENCY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_RATE_AGE_HOURS = parseInt(process.env.FX_MAX_RATE_AGE_HOURS || '168', 10); // 7 days
const DEFAULT_MAX_PAYMENT_RATE_AGE_HOURS = parseInt(process.env.FX_MAX_PAYMENT_RATE_AGE_HOURS || '48', 10); // 2 days

/**
 * Rate-type policy (Phase 2 §8.2).
 *
 * Which BNR rate type each operation uses is a business/accounting decision.
 * Until accounting confirms otherwise, all operations default to AVERAGE.
 * Each operation can be overridden explicitly via environment variables so the
 * choice is configurable and auditable rather than silently assumed:
 *
 *   FX_RATE_TYPE_DISPLAY    - display/analytics conversion
 *   FX_RATE_TYPE_PAYMENT    - payment initiation conversion
 *   FX_RATE_TYPE_REFUND     - refund/reversal reference rate
 *   FX_RATE_TYPE_REPORTING  - reporting/settlement projections
 */
export type RateTypeOperation = 'display' | 'payment' | 'refund' | 'reporting';

function resolveRateType(raw: string | undefined, fallback: ConversionRateType): ConversionRateType {
  const v = String(raw || '').trim().toUpperCase();
  if (v === 'AVERAGE' || v === 'BUYING' || v === 'SELLING') return v;
  return fallback;
}

export function getRateTypeForOperation(operation: RateTypeOperation): ConversionRateType {
  switch (operation) {
    case 'display':
      return resolveRateType(process.env.FX_RATE_TYPE_DISPLAY, 'AVERAGE');
    case 'payment':
      return resolveRateType(process.env.FX_RATE_TYPE_PAYMENT, 'AVERAGE');
    case 'refund':
      return resolveRateType(process.env.FX_RATE_TYPE_REFUND, 'AVERAGE');
    case 'reporting':
      return resolveRateType(process.env.FX_RATE_TYPE_REPORTING, 'AVERAGE');
  }
}

function normalizeCurrencyCode(code: string): string {
  return String(code || '').trim().toUpperCase();
}

function safeDecimalPow10(power: number): Prisma.Decimal {
  return new Prisma.Decimal(10).pow(power);
}

function decimalFromUnknown(value: unknown): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(String(value));
}

function selectRateValue(
  row: {
    rate: Prisma.Decimal;
    averageRate: Prisma.Decimal | null;
    buyingRate: Prisma.Decimal | null;
    sellingRate: Prisma.Decimal | null;
  },
  rateType: ConversionRateType
): Prisma.Decimal {
  if (rateType === 'AVERAGE') {
    return row.averageRate ? decimalFromUnknown(row.averageRate) : decimalFromUnknown(row.rate);
  }
  if (rateType === 'BUYING') {
    if (!row.buyingRate) {
      throw new ExchangeRateInvalidError('Requested BUYING rate is not available for this rate record');
    }
    return decimalFromUnknown(row.buyingRate);
  }
  if (rateType === 'SELLING') {
    if (!row.sellingRate) {
      throw new ExchangeRateInvalidError('Requested SELLING rate is not available for this rate record');
    }
    return decimalFromUnknown(row.sellingRate);
  }
  throw new ExchangeRateInvalidError(`Unsupported exchange-rate type: ${rateType}`);
}

function ensurePositiveRate(rate: Prisma.Decimal, context: string): void {
  if (!rate.isFinite() || rate.lte(0)) {
    throw new ExchangeRateInvalidError(`Invalid non-positive exchange rate for ${context}`);
  }
}

export async function getCurrencyDefinition(code: string): Promise<CurrencyDefinition> {
  const normalized = normalizeCurrencyCode(code);
  if (!normalized) {
    throw new CurrencyValidationError('Currency code is required');
  }

  const now = Date.now();
  const cached = currencyCache.get(normalized);
  if (cached && now - cached.cachedAt < CURRENCY_CACHE_TTL_MS) {
    return cached.currency;
  }

  const row = await prisma.supportedCurrency.findUnique({
    where: { code: normalized },
    select: {
      code: true,
      name: true,
      symbol: true,
      decimalDigits: true,
      isActive: true,
      displayEnabled: true,
      transactionEnabled: true,
      paymentEnabled: true,
      settlementEnabled: true,
    },
  });

  if (!row) {
    if (normalized === 'RWF') {
      const rwfFallback: CurrencyDefinition = {
        code: 'RWF',
        name: 'Rwandan Franc',
        symbol: 'RWF',
        decimalDigits: 0,
        isActive: true,
        displayEnabled: true,
        transactionEnabled: true,
        paymentEnabled: true,
        settlementEnabled: true,
      };
      currencyCache.set('RWF', { currency: rwfFallback, cachedAt: now });
      return rwfFallback;
    }
    throw new CurrencyValidationError(`Unsupported currency: ${normalized}`);
  }

  const mapped: CurrencyDefinition = {
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    decimalDigits: row.decimalDigits,
    isActive: row.isActive,
    displayEnabled: row.displayEnabled,
    transactionEnabled: row.transactionEnabled,
    paymentEnabled: row.paymentEnabled,
    settlementEnabled: row.settlementEnabled,
  };

  if (!mapped.isActive) {
    throw new CurrencyValidationError(`Inactive currency is not allowed: ${normalized}`);
  }

  currencyCache.set(normalized, { currency: mapped, cachedAt: now });
  return mapped;
}

interface RateLookupOptions {
  asOf?: Date;
  rateType?: ConversionRateType;
  maxAgeHours?: number;
  allowStale?: boolean;
}

export async function getHistoricalExchangeRateSnapshot(
  fromCurrency: string,
  toCurrency: string,
  options: RateLookupOptions = {}
): Promise<ExchangeRateSnapshot> {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  const rateType = options.rateType || 'AVERAGE';
  const asOf = options.asOf || new Date();
  const maxAgeHours = options.maxAgeHours ?? DEFAULT_MAX_RATE_AGE_HOURS;
  const allowStale = options.allowStale ?? false;

  await getCurrencyDefinition(from);
  await getCurrencyDefinition(to);

  if (from === to) {
    return {
      rateId: 'IDENTITY',
      fromCurrency: from,
      toCurrency: to,
      rateType,
      rate: new Prisma.Decimal(1),
      source: 'IDENTITY',
      effectiveDate: asOf,
      fetchedAt: asOf,
    };
  }

  const cacheKey = `${from}:${to}:${rateType}:${asOf.toISOString().slice(0, 10)}`;
  const nowMs = Date.now();
  const cacheHit = identityRateCache.get(cacheKey);
  if (cacheHit && nowMs - cacheHit.cachedAt < RATE_CACHE_TTL_MS) {
    return cacheHit.snapshot;
  }

  const direct = await prisma.currencyExchangeRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      status: 'ACTIVE',
      effectiveDate: { lte: asOf },
      OR: [{ validUntil: null }, { validUntil: { gte: asOf } }],
    },
    orderBy: [{ effectiveDate: 'desc' }, { fetchedAt: 'desc' }, { validFrom: 'desc' }, { createdAt: 'desc' }],
  });

  let snapshot: ExchangeRateSnapshot | null = null;
  if (direct) {
    const rate = selectRateValue(direct, rateType);
    ensurePositiveRate(rate, `${from}->${to}`);
    snapshot = {
      rateId: direct.id,
      fromCurrency: from,
      toCurrency: to,
      rateType,
      rate,
      source: direct.source,
      sourceRecordId: direct.sourceRecordId || undefined,
      effectiveDate: direct.effectiveDate,
      fetchedAt: direct.fetchedAt,
    };
  } else {
    const reverse = await prisma.currencyExchangeRate.findFirst({
      where: {
        fromCurrency: to,
        toCurrency: from,
        status: 'ACTIVE',
        effectiveDate: { lte: asOf },
        OR: [{ validUntil: null }, { validUntil: { gte: asOf } }],
      },
      orderBy: [{ effectiveDate: 'desc' }, { fetchedAt: 'desc' }, { validFrom: 'desc' }, { createdAt: 'desc' }],
    });

    if (reverse) {
      const reverseRate = selectRateValue(reverse, rateType);
      ensurePositiveRate(reverseRate, `${to}->${from}`);
      const inverse = new Prisma.Decimal(1).div(reverseRate);
      ensurePositiveRate(inverse, `${from}->${to} (inverted)`);
      snapshot = {
        rateId: reverse.id,
        fromCurrency: from,
        toCurrency: to,
        rateType,
        rate: inverse,
        source: reverse.source,
        sourceRecordId: reverse.sourceRecordId || undefined,
        effectiveDate: reverse.effectiveDate,
        fetchedAt: reverse.fetchedAt,
      };
    }
  }

  if (!snapshot) {
    throw new ExchangeRateNotFoundError(
      `Missing exchange rate for ${from} -> ${to} (type=${rateType}, asOf=${asOf.toISOString()})`
    );
  }

  const ageMs = nowMs - snapshot.effectiveDate.getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  if (ageMs > maxAgeMs && !allowStale) {
    throw new ExchangeRateStaleError(
      `Exchange rate for ${from} -> ${to} is stale (${Math.floor(ageMs / 3600000)}h old, max=${maxAgeHours}h)`
    );
  }

  identityRateCache.set(cacheKey, { snapshot, cachedAt: nowMs });
  return snapshot;
}

export async function convertMinorUnits(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
  options: RateLookupOptions = {}
): Promise<MinorUnitConversionResult> {
  if (!Number.isFinite(amountMinor)) {
    throw new CurrencyValidationError(`Invalid amount for conversion: ${amountMinor}`);
  }

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  const fromDef = await getCurrencyDefinition(from);
  const toDef = await getCurrencyDefinition(to);

  if (from === to) {
    const now = new Date();
    return {
      fromAmountMinor: Math.trunc(amountMinor),
      fromCurrency: from,
      toAmountMinor: Math.trunc(amountMinor),
      toCurrency: to,
      rateSnapshot: {
        rateId: 'IDENTITY',
        fromCurrency: from,
        toCurrency: to,
        rateType: options.rateType || 'AVERAGE',
        rate: new Prisma.Decimal(1),
        source: 'IDENTITY',
        effectiveDate: now,
        fetchedAt: now,
      },
    };
  }

  const snapshot = await getHistoricalExchangeRateSnapshot(from, to, options);
  const fromFactor = safeDecimalPow10(fromDef.decimalDigits);
  const toFactor = safeDecimalPow10(toDef.decimalDigits);

  const amountMajor = new Prisma.Decimal(String(amountMinor)).div(fromFactor);
  const convertedMajor = amountMajor.mul(snapshot.rate);
  const convertedMinor = convertedMajor.mul(toFactor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const toAmountMinor = Number(convertedMinor.toString());

  if (!Number.isFinite(toAmountMinor)) {
    throw new ExchangeRateInvalidError('Conversion produced non-finite amount');
  }

  return {
    fromAmountMinor: Math.trunc(amountMinor),
    fromCurrency: from,
    toAmountMinor,
    toCurrency: to,
    rateSnapshot: snapshot,
  };
}

export async function getExchangeRate(
  fromCurrencyOrTargetCurrency: string,
  maybeToCurrency?: string,
  options: RateLookupOptions = {}
): Promise<number> {
  const fromCurrency = maybeToCurrency ? fromCurrencyOrTargetCurrency : 'RWF';
  const toCurrency = maybeToCurrency || fromCurrencyOrTargetCurrency;
  const snapshot = await getHistoricalExchangeRateSnapshot(fromCurrency, toCurrency, options);
  return Number(snapshot.rate.toString());
}

export async function convertCurrency(
  amountMajor: number,
  fromCurrency: string,
  toCurrency: string,
  options: RateLookupOptions = {}
): Promise<number> {
  if (!Number.isFinite(amountMajor)) {
    throw new CurrencyValidationError('Amount must be a finite number');
  }
  const fromDef = await getCurrencyDefinition(fromCurrency);
  const fromFactor = safeDecimalPow10(fromDef.decimalDigits);
  const amountMinor = Number(new Prisma.Decimal(String(amountMajor)).mul(fromFactor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toString());
  const converted = await convertMinorUnits(amountMinor, fromCurrency, toCurrency, options);
  const toDef = await getCurrencyDefinition(toCurrency);
  const toFactor = safeDecimalPow10(toDef.decimalDigits);
  return Number(new Prisma.Decimal(String(converted.toAmountMinor)).div(toFactor).toString());
}

export async function convertFromRWF(
  amountRWF: number,
  targetCurrency: string,
  options: RateLookupOptions = {}
): Promise<number> {
  return convertCurrency(amountRWF, 'RWF', targetCurrency, options);
}

export async function convertToRWF(
  amount: number,
  sourceCurrency: string,
  options: RateLookupOptions = {}
): Promise<number> {
  return convertCurrency(amount, sourceCurrency, 'RWF', options);
}

export async function getAllExchangeRates(options: { asOf?: Date } = {}): Promise<
  Array<{
    fromCurrency: string;
    toCurrency: string;
    source: string;
    effectiveDate: Date;
    averageRate: string | null;
    buyingRate: string | null;
    sellingRate: string | null;
    rate: string;
  }>
> {
  const asOf = options.asOf || new Date();
  const rows = await prisma.currencyExchangeRate.findMany({
    where: {
      status: 'ACTIVE',
      effectiveDate: { lte: asOf },
      OR: [{ validUntil: null }, { validUntil: { gte: asOf } }],
    },
    orderBy: [{ fromCurrency: 'asc' }, { toCurrency: 'asc' }, { effectiveDate: 'desc' }],
  });

  return rows.map((row) => ({
    fromCurrency: row.fromCurrency,
    toCurrency: row.toCurrency,
    source: row.source,
    effectiveDate: row.effectiveDate,
    averageRate: row.averageRate ? row.averageRate.toString() : null,
    buyingRate: row.buyingRate ? row.buyingRate.toString() : null,
    sellingRate: row.sellingRate ? row.sellingRate.toString() : null,
    rate: row.rate.toString(),
  }));
}

export async function getRatesForBaseCurrency(
  baseCurrency: string,
  options: RateLookupOptions = {}
): Promise<{ base: string; rateType: ConversionRateType; asOf: string; rates: Record<string, number> }> {
  const base = normalizeCurrencyCode(baseCurrency);
  const asOf = options.asOf || new Date();
  const rateType = options.rateType || getRateTypeForOperation('display');

  const currencies = await prisma.supportedCurrency.findMany({
    where: { isActive: true, displayEnabled: true },
    select: { code: true },
    orderBy: { code: 'asc' },
  });

  const codes = new Set(currencies.map((c) => c.code));
  codes.add(base);
  codes.add('RWF');

  const rates: Record<string, number> = {};
  for (const code of codes) {
    if (code === base) {
      rates[code] = 1;
      continue;
    }
    try {
      const snapshot = await getHistoricalExchangeRateSnapshot(base, code, options);
      rates[code] = Number(snapshot.rate.toString());
    } catch {
      // If no rate exists for this currency, omit it instead of faking one.
    }
  }

  return {
    base,
    rateType,
    asOf: asOf.toISOString(),
    rates,
  };
}

export async function updateExchangeRates(
  rates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
    effectiveDate?: Date;
  }>
): Promise<void> {
  const fetchedAt = new Date();
  for (const item of rates) {
    const from = normalizeCurrencyCode(item.fromCurrency);
    const to = normalizeCurrencyCode(item.toCurrency);
    const effectiveDate = item.effectiveDate || fetchedAt;
    const value = new Prisma.Decimal(String(item.rate));
    ensurePositiveRate(value, `${from}->${to}`);

    await prisma.currencyExchangeRate.create({
      data: {
        fromCurrency: from,
        toCurrency: to,
        rate: value,
        averageRate: value,
        source: item.source || 'manual',
        effectiveDate,
        fetchedAt,
        validFrom: effectiveDate,
        status: 'ACTIVE',
      },
    });
  }

  clearExchangeRateCache();
}

export function clearExchangeRateCache(): void {
  identityRateCache.clear();
  currencyCache.clear();
}

export function getDefaultPaymentRateMaxAgeHours(): number {
  return DEFAULT_MAX_PAYMENT_RATE_AGE_HOURS;
}
