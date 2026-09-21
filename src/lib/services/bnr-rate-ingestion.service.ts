import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BnrClient, BnrExchangeRateRecord, BnrRateQuery } from './bnr-client.service';
import { clearExchangeRateCache } from './currency-exchange.service';
import { logger } from '@/lib/logger';

type BnrQuotationMode = 'RWF_PER_UNIT_OF_CURRENCY' | 'UNIT_OF_CURRENCY_PER_RWF';

export interface BnrIngestionSummary {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  errors: Array<{ id?: string; reason: string }>;
}

const log = logger.child({ service: 'bnr-ingestion' });

// Verified against live BNR response (2026-09-21): currency_name values are
// ISO 4217 codes (e.g. USD, EUR, GBP) and rates are RWF per unit of the named
// foreign currency. The name map below is a defensive fallback in case BNR
// ever returns full names.
const CURRENCY_NAME_TO_ISO: Record<string, string> = {
  'US DOLLAR': 'USD',
  'UNITED STATES DOLLAR': 'USD',
  EURO: 'EUR',
  'BRITISH POUND': 'GBP',
  'POUND STERLING': 'GBP',
  'KENYAN SHILLING': 'KES',
  'UGANDAN SHILLING': 'UGX',
  'TANZANIAN SHILLING': 'TZS',
  'RWANDAN FRANC': 'RWF',
};

function normalizeIsoCurrency(value: string): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  return CURRENCY_NAME_TO_ISO[upper] || null;
}

function parseDecimalString(value: unknown, fieldName: string): Prisma.Decimal {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new Error(`Missing ${fieldName}`);
  }
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Invalid numeric format for ${fieldName}: ${raw}`);
  }
  const decimal = new Prisma.Decimal(raw);
  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new Error(`Non-positive ${fieldName}: ${raw}`);
  }
  return decimal;
}

function parseSourceDate(raw: unknown, fieldName: string): Date {
  const text = String(raw ?? '').trim();
  if (!text) {
    throw new Error(`Missing ${fieldName}`);
  }
  // BNR returns dates like "2026/09/21"; normalize separators for portability.
  const normalized = /^\d{4}\/\d{2}\/\d{2}$/.test(text) ? text.replace(/\//g, '-') : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${text}`);
  }
  return date;
}

// Verified against the live BNR API (2026-09-21): rates are quoted as RWF per
// unit of the named foreign currency (USD average_rate ≈ 1473.015).
// BNR_QUOTATION_MODE may override only for documented API behavior changes.
function getQuotationMode(): BnrQuotationMode {
  const mode = String(process.env.BNR_QUOTATION_MODE || '').trim().toUpperCase();
  if (!mode) return 'RWF_PER_UNIT_OF_CURRENCY';
  if (mode === 'RWF_PER_UNIT_OF_CURRENCY' || mode === 'UNIT_OF_CURRENCY_PER_RWF') {
    return mode;
  }
  throw new Error(
    'BNR_QUOTATION_MODE must be RWF_PER_UNIT_OF_CURRENCY or UNIT_OF_CURRENCY_PER_RWF'
  );
}

function mapPair(mode: BnrQuotationMode, foreignCurrency: string): { fromCurrency: string; toCurrency: string } {
  if (mode === 'RWF_PER_UNIT_OF_CURRENCY') {
    return { fromCurrency: foreignCurrency, toCurrency: 'RWF' };
  }
  return { fromCurrency: 'RWF', toCurrency: foreignCurrency };
}

async function upsertSupportedCurrency(code: string): Promise<void> {
  await prisma.supportedCurrency.upsert({
    where: { code },
    update: {
      isActive: true,
      displayEnabled: true,
      transactionEnabled: code === 'RWF',
      paymentEnabled: code === 'RWF',
      settlementEnabled: code === 'RWF',
    },
    create: {
      code,
      name: code,
      symbol: code,
      decimalDigits: code === 'RWF' ? 0 : 2,
      isActive: true,
      displayEnabled: true,
      transactionEnabled: code === 'RWF',
      paymentEnabled: code === 'RWF',
      settlementEnabled: code === 'RWF',
      countries: [],
    },
  });
}

async function ingestSingleRecord(
  row: BnrExchangeRateRecord,
  mode: BnrQuotationMode,
  fetchedAt: Date
): Promise<'inserted' | 'updated' | 'skipped'> {
  const sourceRecordId = String(row.id ?? '').trim();
  if (!sourceRecordId) {
    throw new Error('Missing id');
  }

  const iso = normalizeIsoCurrency(String(row.currency_name || ''));
  if (!iso) {
    throw new Error(`Unsupported currency_name: ${String(row.currency_name || '')}`);
  }

  const averageRate = parseDecimalString(row.average_rate, 'average_rate');
  const buyingRate = parseDecimalString(row.buying_rate, 'buying_rate');
  const sellingRate = parseDecimalString(row.selling_rate, 'selling_rate');
  const effectiveDate = parseSourceDate(row.post_date, 'post_date');
  const sourceRecordCreatedAt = parseSourceDate(row.created_at, 'created_at');

  const { fromCurrency, toCurrency } = mapPair(mode, iso);

  const existing = await prisma.currencyExchangeRate.findFirst({
    where: {
      source: 'BNR',
      sourceRecordId,
      fromCurrency,
      toCurrency,
      effectiveDate,
      status: 'ACTIVE',
    },
    select: { id: true, averageRate: true, buyingRate: true, sellingRate: true, rate: true, revision: true },
    orderBy: { revision: 'desc' },
  });

  await upsertSupportedCurrency(fromCurrency);
  await upsertSupportedCurrency(toCurrency);

  if (!existing) {
    await prisma.currencyExchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: averageRate,
        averageRate,
        buyingRate,
        sellingRate,
        source: 'BNR',
        sourceRecordId,
        sourceCurrencyName: String(row.currency_name || ''),
        sourceRecordCreatedAt,
        effectiveDate,
        fetchedAt,
        validFrom: effectiveDate,
        status: 'ACTIVE',
        revision: 0,
        metadata: row as unknown as Prisma.JsonObject,
      },
    });
    return 'inserted';
  }

  const changed =
    (existing.averageRate ? existing.averageRate.toString() : '') !== averageRate.toString() ||
    (existing.buyingRate ? existing.buyingRate.toString() : '') !== buyingRate.toString() ||
    (existing.sellingRate ? existing.sellingRate.toString() : '') !== sellingRate.toString();

  if (!changed) {
    await prisma.currencyExchangeRate.update({
      where: { id: existing.id },
      data: { fetchedAt },
    });
    return 'skipped';
  }

  // Supersession: never overwrite a published rate. Mark the prior version
  // SUPERSEDED and insert a new revision so transactions that reference the
  // prior snapshot remain reconstructable.
  const newRevision = (existing.revision ?? 0) + 1;
  await prisma.currencyExchangeRate.update({
    where: { id: existing.id },
    data: { status: 'SUPERSEDED' },
  });
  await prisma.currencyExchangeRate.create({
    data: {
      fromCurrency,
      toCurrency,
      rate: averageRate,
      averageRate,
      buyingRate,
      sellingRate,
      source: 'BNR',
      sourceRecordId,
      sourceCurrencyName: String(row.currency_name || ''),
      sourceRecordCreatedAt,
      effectiveDate,
      fetchedAt,
      validFrom: effectiveDate,
      status: 'ACTIVE',
      revision: newRevision,
      metadata: row as unknown as Prisma.JsonObject,
    },
  });
  return 'updated';
}

export async function ingestBnrExchangeRates(query: BnrRateQuery = {}): Promise<BnrIngestionSummary> {
  const client = new BnrClient();
  const mode = getQuotationMode();
  const fetchedAt = new Date();

  log.info('BNR ingestion started', { query, mode });
  const rows = await client.listExchangeRates(query);

  const summary: BnrIngestionSummary = {
    fetched: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    rejected: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      const result = await ingestSingleRecord(row, mode, fetchedAt);
      if (result === 'inserted') summary.inserted += 1;
      else if (result === 'updated') summary.updated += 1;
      else summary.skipped += 1;
    } catch (error: any) {
      summary.rejected += 1;
      summary.errors.push({
        id: row?.id ? String(row.id) : undefined,
        reason: error?.message || String(error),
      });
    }
  }

  log.info('BNR ingestion complete', {
    fetched: summary.fetched,
    inserted: summary.inserted,
    updated: summary.updated,
    skipped: summary.skipped,
    rejected: summary.rejected,
  });
  if (summary.rejected > 0) {
    log.warn('BNR ingestion rejected records', { rejected: summary.rejected, errors: summary.errors.slice(0, 10) });
  }

  clearExchangeRateCache();
  return summary;
}

export async function ingestBnrExchangeRateById(id: string | number): Promise<BnrIngestionSummary> {
  const client = new BnrClient();
  const mode = getQuotationMode();
  const fetchedAt = new Date();
  const row = await client.getExchangeRateById(id);

  const summary: BnrIngestionSummary = {
    fetched: row ? 1 : 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    rejected: 0,
    errors: [],
  };

  if (!row) return summary;

  try {
    const result = await ingestSingleRecord(row, mode, fetchedAt);
    if (result === 'inserted') summary.inserted += 1;
    else if (result === 'updated') summary.updated += 1;
    else summary.skipped += 1;
  } catch (error: any) {
    summary.rejected += 1;
    summary.errors.push({
      id: row?.id ? String(row.id) : undefined,
      reason: error?.message || String(error),
    });
  }

  log.info('BNR single-record ingestion complete', {
    fetched: summary.fetched,
    inserted: summary.inserted,
    updated: summary.updated,
    skipped: summary.skipped,
    rejected: summary.rejected,
  });

  clearExchangeRateCache();
  return summary;
}
