/**
 * fetchWithTimeout — AbortController-based fetch with timeout
 *
 * REL-HIGH-001 (OEC-001C): All external API calls (payment providers, email, SMS, AI)
 * must use explicit timeouts to prevent hung requests from blocking customer operations.
 *
 * This utility wraps the native fetch() with an AbortController that aborts the request
 * after the specified timeout. It throws a FetchTimeoutError on timeout so callers can
 * distinguish timeout failures from network errors.
 */

export class FetchTimeoutError extends Error {
  readonly timeoutMs: number
  readonly url: string

  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`)
    this.name = 'FetchTimeoutError'
    this.timeoutMs = timeoutMs
    this.url = url
  }
}

/**
 * Fetch with an AbortController-based timeout.
 *
 * @param url — The URL to fetch
 * @param init — Standard RequestInit options
 * @param timeoutMs — Timeout in milliseconds (default: 15000 = 15 seconds)
 * @returns The fetch Response
 * @throws {FetchTimeoutError} If the request does not complete within timeoutMs
 * @throws {Error} For any other network or HTTP errors
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 15_000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    return response
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeoutMs)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
