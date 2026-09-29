/**
 * UNIT TESTS: BNR Client API Error Handling
 *
 * Validates:
 * - X-API-KEY authentication header is sent (never in URL)
 * - missing BNR_API_KEY fails with configuration error
 * - HTTP 400/404/500 -> BnrApiError
 * - non-JSON response -> BnrApiError
 * - request timeout -> BnrTimeoutError
 * - response normalization (array / single object / wrapper)
 */

const originalFetch = global.fetch

describe('BNR Client API Error Handling', () => {
  const { BnrClient, BnrApiError, BnrTimeoutError, BnrClientConfigurationError } = require('@/lib/services/bnr-client.service')

  beforeEach(() => {
    process.env.BNR_API_KEY = 'test-key-not-real'
  })

  afterEach(() => {
    global.fetch = originalFetch as any
    delete process.env.BNR_API_KEY
    delete process.env.BNR_TIMEOUT_MS
  })

  function mockFetch(status: number, body: string) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
    }) as any
  }

  it('sends X-API-KEY header and never puts the key in the URL', async () => {
    mockFetch(200, '[]')
    const client = new BnrClient()
    await client.listExchangeRates()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [calledUrl, init] = (global.fetch as jest.Mock).mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('X-API-KEY')).toBe('test-key-not-real')
    expect(String(calledUrl)).not.toContain('test-key-not-real')
    expect(String(calledUrl)).not.toContain('api_key')
  })

  it('throws BnrClientConfigurationError when BNR_API_KEY is missing', async () => {
    delete process.env.BNR_API_KEY
    const client = new BnrClient()
    await expect(client.listExchangeRates()).rejects.toThrow(BnrClientConfigurationError)
  })

  it('throws BnrApiError with status 400 on Bad Request', async () => {
    mockFetch(400, 'Bad Request')
    const client = new BnrClient()
    await expect(client.listExchangeRates()).rejects.toMatchObject({ status: 400 })
  })

  it('throws BnrApiError with status 404 on Not Found', async () => {
    mockFetch(404, 'Not Found')
    const client = new BnrClient()
    await expect(client.getExchangeRateById('999')).rejects.toMatchObject({ status: 404 })
  })

  it('throws BnrApiError with status 500 on Internal Server Error', async () => {
    mockFetch(500, 'Internal Server Error')
    const client = new BnrClient()
    await expect(client.listExchangeRates()).rejects.toMatchObject({ status: 500 })
  })

  it('throws BnrApiError on non-JSON response', async () => {
    mockFetch(200, '<html>not json</html>')
    const client = new BnrClient()
    await expect(client.listExchangeRates()).rejects.toThrow(/non-JSON/i)
  })

  it('throws BnrTimeoutError when the request aborts via timeout', async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' })) as any
    const client = new BnrClient()
    await expect(client.listExchangeRates()).rejects.toThrow(BnrTimeoutError)
  })

  it('passes AbortSignal.timeout with configured timeout', async () => {
    process.env.BNR_TIMEOUT_MS = '5000'
    mockFetch(200, '[]')
    const client = new BnrClient()
    await client.listExchangeRates()
    const init = (global.fetch as jest.Mock).mock.calls[0][1]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('returns empty array for empty 200 response', async () => {
    mockFetch(200, '')
    const client = new BnrClient()
    const rates = await client.listExchangeRates()
    expect(rates).toEqual([])
  })

  it('parses JSON array response', async () => {
    mockFetch(200, JSON.stringify([
      {
        id: '516600',
        currency_name: 'USD',
        average_rate: '1473.015',
        buying_rate: '1468.015',
        selling_rate: '1478.015',
        post_date: '2026/09/21',
        created_at: '2026/09/21',
      },
    ]))
    const client = new BnrClient()
    const rates = await client.listExchangeRates()
    expect(rates).toHaveLength(1)
    expect(rates[0].currency_name).toBe('USD')
    expect(rates[0].average_rate).toBe('1473.015')
  })

  it('parses single object response as array', async () => {
    mockFetch(200, JSON.stringify({
      id: '1',
      currency_name: 'USD',
      average_rate: '1300',
      buying_rate: '1295',
      selling_rate: '1305',
      post_date: '2026-09-20',
      created_at: '2026-09-20T10:00:00Z',
    }))
    const client = new BnrClient()
    const rates = await client.listExchangeRates()
    expect(rates).toHaveLength(1)
  })

  it('parses { data: [...] } wrapper response', async () => {
    mockFetch(200, JSON.stringify({
      data: [
        {
          id: '1',
          currency_name: 'USD',
          average_rate: '1300',
          buying_rate: '1295',
          selling_rate: '1305',
          post_date: '2026-09-20',
          created_at: '2026-09-20T10:00:00Z',
        },
      ],
    }))
    const client = new BnrClient()
    const rates = await client.listExchangeRates()
    expect(rates).toHaveLength(1)
  })
})
