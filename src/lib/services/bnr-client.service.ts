/**
 * BNR Exchange Rate API Client
 *
 * Uses the documented endpoints:
 * - GET /ExchangeRate
 * - GET /ExchangeRate/{id}
 *
 * Base URL default:
 * - https://fxrates.bnr.rw/ExchangeRate
 *
 * Authentication (confirmed with BNR):
 * - Header: X-API-KEY: <BNR_API_KEY env var>
 *
 * The API key is read from the BNR_API_KEY environment variable at request
 * time. It is never logged, never placed in the URL, and never hardcoded.
 */

import { logger } from '@/lib/logger';

export interface BnrExchangeRateRecord {
  id: string | number;
  currency_name: string;
  average_rate: string;
  buying_rate: string;
  selling_rate: string;
  post_date: string;
  created_at: string;
  [key: string]: unknown;
}

export interface BnrRateQuery {
  start_date?: string;
  end_date?: string;
  currency_name?: string;
  id?: string | number;
}

export class BnrClientConfigurationError extends Error {}
export class BnrTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BnrTimeoutError';
  }
}
export class BnrApiError extends Error {
  status: number;
  responseBody?: string;

  constructor(message: string, status: number, responseBody?: string) {
    super(message);
    this.status = status;
    this.responseBody = responseBody;
  }
}

const DEFAULT_BASE_URL = 'https://fxrates.bnr.rw/ExchangeRate';
const DEFAULT_TIMEOUT_MS = 30_000;
const log = logger.child({ service: 'bnr-client' });

function resolveBaseUrl(): string {
  return (process.env.BNR_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function resolveTimeoutMs(): number {
  const raw = parseInt(process.env.BNR_TIMEOUT_MS || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function resolveApiKey(): string {
  const key = (process.env.BNR_API_KEY || '').trim();
  if (!key) {
    throw new BnrClientConfigurationError(
      'BNR_API_KEY environment variable is required for BNR API authentication'
    );
  }
  return key;
}

function normalizeRateArray(payload: unknown): BnrExchangeRateRecord[] {
  if (Array.isArray(payload)) {
    return payload as BnrExchangeRateRecord[];
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BnrExchangeRateRecord[];
    if (Array.isArray(obj.results)) return obj.results as BnrExchangeRateRecord[];
    if (
      'id' in obj &&
      'currency_name' in obj &&
      'average_rate' in obj &&
      'buying_rate' in obj &&
      'selling_rate' in obj
    ) {
      return [obj as unknown as BnrExchangeRateRecord];
    }
  }

  return [];
}

async function fetchJson(url: URL): Promise<unknown> {
  const headers = new Headers({ Accept: 'application/json' });
  headers.set('X-API-KEY', resolveApiKey());

  const timeoutMs = resolveTimeoutMs();
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: any) {
    const elapsedMs = Date.now() - startedAt;
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      log.warn('BNR request timed out', { elapsedMs, timeoutMs });
      throw new BnrTimeoutError(`BNR API request timed out after ${timeoutMs}ms`);
    }
    log.error('BNR request failed (network)', { error: error?.message || String(error), elapsedMs });
    throw new BnrApiError(`BNR API request failed: ${error?.message || 'network error'}`, 0);
  }

  const body = await response.text();
  if (!response.ok) {
    log.warn('BNR API returned error status', { status: response.status });
    throw new BnrApiError(
      `BNR API request failed with status ${response.status}`,
      response.status,
      body.slice(0, 2000)
    );
  }

  if (!body.trim()) return [];
  try {
    return JSON.parse(body);
  } catch {
    log.warn('BNR API returned non-JSON response', { status: response.status });
    throw new BnrApiError('BNR API returned non-JSON response', response.status, body.slice(0, 2000));
  }
}

export class BnrClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || resolveBaseUrl()).replace(/\/+$/, '');
  }

  async listExchangeRates(query: BnrRateQuery = {}): Promise<BnrExchangeRateRecord[]> {
    const url = new URL(this.baseUrl);
    if (query.start_date) url.searchParams.set('start_date', query.start_date);
    if (query.end_date) url.searchParams.set('end_date', query.end_date);
    if (query.currency_name) url.searchParams.set('currency_name', query.currency_name);
    if (query.id !== undefined && query.id !== null) url.searchParams.set('id', String(query.id));

    const payload = await fetchJson(url);
    return normalizeRateArray(payload);
  }

  async getExchangeRateById(id: string | number): Promise<BnrExchangeRateRecord | null> {
    const normalizedId = String(id).trim();
    if (!normalizedId) {
      throw new BnrClientConfigurationError('BNR rate id is required');
    }

    const url = new URL(`${this.baseUrl}/${encodeURIComponent(normalizedId)}`);
    const payload = await fetchJson(url);
    const rows = normalizeRateArray(payload);
    return rows.length > 0 ? rows[0] : null;
  }
}
