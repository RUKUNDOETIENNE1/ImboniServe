import { ProviderGateway, ExtractInput, ProviderResult, isImage, isPdf } from './gateway'

// ---------------------------------------------------------------------------
// Azure Document Intelligence v4 (2024-11-30 GA) — prebuilt model selection
// ---------------------------------------------------------------------------
// documentType → Azure prebuilt model
//
// SUPPLIER_INVOICE  → prebuilt-invoice
//                     Structured invoice extraction: vendor, line items, totals.
//
// DELIVERY_NOTE     → prebuilt-receipt
//                     Closest available prebuilt; Azure has no dedicated
//                     delivery-note model. Returns merchant, totals, items.
//
// GENERIC           → prebuilt-layout?features=keyValuePairs
//                     NOTE: prebuilt-document is DEPRECATED in v4 (2024-11-30).
//                     The replacement is prebuilt-layout with the keyValuePairs
//                     feature flag, which extracts key-value pairs, tables, and
//                     structure from any document.
//                     Ref: https://learn.microsoft.com/en-us/azure/ai-services/
//                     document-intelligence/prebuilt/general-document
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<string, { model: string; queryParams?: string }> = {
  SUPPLIER_INVOICE: { model: 'prebuilt-invoice' },
  DELIVERY_NOTE:    { model: 'prebuilt-receipt' },
  GENERIC:          { model: 'prebuilt-layout', queryParams: 'features=keyValuePairs' },
}

// Minimum acceptable confidence for a field/line to count as "usable".
// Values below this are dropped before validation so they cannot be accepted
// as a successful Azure extraction.
const MIN_FIELD_CONFIDENCE = 0.3

// How many usable (above-threshold) fields or line items an extraction must
// contain before it is accepted as a real result.  If it comes back with
// fewer than this, we throw so the fallback chain continues to OpenAI.
const MIN_USABLE_FIELDS = 1

// Azure DI API version
const API_VERSION = '2024-11-30'

// ---------------------------------------------------------------------------
// Result validation helper
// ---------------------------------------------------------------------------
function assertUsable(fields: ProviderResult['fields'], lines: ProviderResult['lines']): void {
  const usableFields = (fields ?? []).filter(
    (f) => f.value !== undefined && f.value !== null && String(f.value).trim() !== ''
  )
  const usableLines = (lines ?? []).length

  if (usableFields.length + usableLines < MIN_USABLE_FIELDS) {
    throw new AzureDIEmptyResultError(
      `Azure DI returned no usable content ` +
        `(fields=${usableFields.length}, lines=${usableLines}). ` +
        `Treating as extraction failure.`
    )
  }
}

function isUsableConfidence(confidence?: number): boolean {
  return confidence === undefined || confidence === null || confidence >= MIN_FIELD_CONFIDENCE
}

// ---------------------------------------------------------------------------
// Custom error classes — makes it easy to identify failure kind in the chain
// ---------------------------------------------------------------------------
export class AzureDIConfigError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDIConfigError'
  }
}
export class AzureDIAuthError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDIAuthError'
  }
}
export class AzureDIQuotaError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDIQuotaError'
  }
}
export class AzureDITimeoutError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDITimeoutError'
  }
}
export class AzureDINetworkError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDINetworkError'
  }
}
export class AzureDIEmptyResultError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDIEmptyResultError'
  }
}
export class AzureDIValidationError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AzureDIValidationError'
  }
}

// ---------------------------------------------------------------------------
// Main provider class
// ---------------------------------------------------------------------------
export class AzureDocIntelligenceProvider implements ProviderGateway {
  name = 'azure_document_intelligence'
  private endpoint: string
  private key: string
  private timeoutMs: number

  constructor() {
    const endpoint = process.env.AZURE_DI_ENDPOINT?.trim()
    const key = process.env.AZURE_DI_KEY?.trim()
    if (!endpoint || !key) {
      throw new AzureDIConfigError(
        'AZURE_DI_ENDPOINT and AZURE_DI_KEY must both be set to use Azure Document Intelligence'
      )
    }
    // Normalise: strip trailing slash
    this.endpoint = endpoint.replace(/\/+$/, '')
    this.key = key
    // DIE_PROVIDER_TIMEOUT_MS controls per-provider total timeout (default 30 s)
    const parsedTimeout = parseInt(process.env.DIE_PROVIDER_TIMEOUT_MS || '30000', 10)
    this.timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 30000
  }

  supportsMime(mime: string): boolean {
    return isImage(mime) || isPdf(mime)
  }

  async extract(input: ExtractInput): Promise<ProviderResult> {
    const docType = input.documentType ?? 'GENERIC'
    const { model, queryParams } = MODEL_MAP[docType] ?? MODEL_MAP.GENERIC

    // Build analyze URL.
    // FIX 2: Use prebuilt-layout?features=keyValuePairs for GENERIC instead of
    // the deprecated prebuilt-document model.
    let analyzeUrl =
      `${this.endpoint}/documentintelligence/documentModels/${model}:analyze` +
      `?api-version=${API_VERSION}`
    if (queryParams) {
      analyzeUrl += `&${queryParams}`
    }

    // -----------------------------------------------------------------------
    // FIX 1 (CRITICAL): Azure DI v4 REST API requires a JSON body with
    // "base64Source" (or "urlSource"), NOT a raw binary body.
    //
    // Previous (broken):
    //   Content-Type: image/png
    //   body: <raw Buffer>
    //
    // Correct (v4 GA spec):
    //   Content-Type: application/json
    //   body: { "base64Source": "<base64 string>" }
    //
    // Ref: https://learn.microsoft.com/en-us/rest/api/aiservices/
    //      document-models/analyze-document?view=rest-aiservices-2024-11-30
    // -----------------------------------------------------------------------
    const base64Source = input.buffer.toString('base64')
    const submitBody = JSON.stringify({ base64Source })

    const submitResponse = await this.fetchWithTimeout(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.key,
        'Content-Type': 'application/json',
      },
      body: submitBody,
    })

    await this.checkHttpError(submitResponse, 'submit')

    // Azure DI uses an async polling pattern.
    // The operation URL comes back in the `Operation-Location` response header.
    const operationUrl = submitResponse.headers.get('Operation-Location')
    if (!operationUrl) {
      throw new AzureDIValidationError(
        'Azure DI did not return Operation-Location header after document submit'
      )
    }

    // FIX 4: Read the Retry-After header on the submit response.
    // Azure uses this to signal how long to wait before the first poll.
    // The spec documents Retry-After as an integer (seconds) on the 202.
    const retryAfterHeader = submitResponse.headers.get('Retry-After')
    const initialDelayMs = retryAfterHeader
      ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 5000) // cap at 5 s
      : 1500

    // -----------------------------------------------------------------------
    // Step 2: Poll until the analysis is complete
    // -----------------------------------------------------------------------
    const result = await this.pollForResult(operationUrl, initialDelayMs)

    // -----------------------------------------------------------------------
    // Step 3: Map Azure DI response → ProviderResult
    // -----------------------------------------------------------------------
    const mapped = this.mapResult(result, model)

    // -----------------------------------------------------------------------
    // Step 4: Validate — throw if nothing usable was extracted
    // -----------------------------------------------------------------------
    assertUsable(mapped.fields, mapped.lines)

    return mapped
  }

  // ---------------------------------------------------------------------------
  // Polling: waits for status=succeeded within the per-provider timeout budget.
  //
  // FIX 5: The deadline accounting now checks the budget BEFORE sleeping.
  // If there is not enough budget left to complete another poll cycle, the
  // timeout error is thrown immediately rather than after a wasted sleep.
  // ---------------------------------------------------------------------------
  private async pollForResult(operationUrl: string, initialDelayMs: number): Promise<any> {
    const deadline = Date.now() + this.timeoutMs
    const POLL_INTERVAL_MS = 1500

    // Honour the Retry-After / initial delay before the first poll.
    // FIX 5: Only sleep if we still have time in the budget.
    const firstDelay = Math.min(initialDelayMs, deadline - Date.now())
    if (firstDelay <= 0) {
      throw new AzureDITimeoutError(
        `Azure DI timeout budget exhausted before first poll (timeoutMs=${this.timeoutMs})`
      )
    }
    await sleep(firstDelay)

    while (Date.now() < deadline) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) break

      const pollResp = await this.fetchWithTimeout(
        operationUrl,
        {
          method: 'GET',
          headers: { 'Ocp-Apim-Subscription-Key': this.key },
        },
        Math.min(remaining, 10_000)
      )

      await this.checkHttpError(pollResp, 'poll')

      let body: any
      try {
        body = await pollResp.json()
      } catch {
        throw new AzureDIValidationError('Azure DI poll response is not valid JSON')
      }

      const status: string = body?.status ?? ''

      if (status === 'succeeded') {
        return body
      }

      if (status === 'failed') {
        const errMsg = body?.error?.message || body?.error?.code || 'unknown error'
        throw new AzureDINetworkError(`Azure DI analysis failed: ${errMsg}`)
      }

      // status === 'running' | 'notStarted' — keep polling.
      // FIX 5: Check budget before sleeping to avoid exceeding deadline silently.
      const afterPoll = Date.now()
      if (afterPoll + POLL_INTERVAL_MS >= deadline) {
        // Not enough budget for another full cycle — throw now.
        break
      }
      await sleep(POLL_INTERVAL_MS)
    }

    throw new AzureDITimeoutError(
      `Azure DI analysis did not complete within ${this.timeoutMs}ms`
    )
  }

  // ---------------------------------------------------------------------------
  // HTTP error handling: maps status codes to typed errors
  // ---------------------------------------------------------------------------
  private async checkHttpError(response: Response, stage: string): Promise<void> {
    if (response.ok) return

    let body = ''
    try {
      body = await response.text()
    } catch {
      // best-effort
    }

    const code = response.status
    const detail = `[Azure DI ${stage}] HTTP ${code}: ${body.slice(0, 300)}`

    if (code === 401 || code === 403) {
      throw new AzureDIAuthError(`Azure DI authentication failed. Check AZURE_DI_KEY. ${detail}`)
    }
    if (code === 429) {
      throw new AzureDIQuotaError(`Azure DI rate limit or quota exceeded. ${detail}`)
    }
    if (code >= 500) {
      throw new AzureDINetworkError(`Azure DI service error. ${detail}`)
    }
    throw new AzureDINetworkError(`Azure DI unexpected error. ${detail}`)
  }

  // ---------------------------------------------------------------------------
  // fetch wrapper with AbortController-based timeout
  // ---------------------------------------------------------------------------
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    overrideTimeoutMs?: number
  ): Promise<Response> {
    const ms = overrideTimeoutMs ?? this.timeoutMs
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      return response
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new AzureDITimeoutError(
          `Azure DI request timed out after ${ms}ms`
        )
      }
      throw new AzureDINetworkError(`Azure DI network error: ${err?.message ?? String(err)}`)
    } finally {
      clearTimeout(timer)
    }
  }

  // ---------------------------------------------------------------------------
  // Map Azure DI v4 response → ProviderResult
  //
  // Azure DI v4 response structure for prebuilt-invoice:
  //   body.analyzeResult.documents[0].fields          → header key-value pairs
  //   body.analyzeResult.documents[0].fields.Items    → line items (valueArray)
  //     .valueArray[n].valueObject                    → per-item fields
  //   body.analyzeResult.tables                       → raw table cells
  //   body.analyzeResult.pages                        → raw page lines
  //
  // For prebuilt-layout (GENERIC):
  //   body.analyzeResult.keyValuePairs                → key-value pairs
  //   body.analyzeResult.tables                       → table cells
  //
  // FIX 3: Extract invoice line items from documents[0].fields.Items.valueArray
  // rather than only from analyzeResult.tables (which works for layout/document
  // but misses the structured Items array returned by prebuilt-invoice).
  // ---------------------------------------------------------------------------
  private mapResult(body: any, model: string): ProviderResult {
    const analyzeResult = body?.analyzeResult

    if (!analyzeResult || typeof analyzeResult !== 'object') {
      throw new AzureDIValidationError(
        'Azure DI response missing analyzeResult object'
      )
    }

    const fields: ProviderResult['fields'] = []
    const lines: ProviderResult['lines'] = []

    // ---- Strategy A: structured document fields (prebuilt-invoice / prebuilt-receipt) ----
    const docFields = analyzeResult.documents?.[0]?.fields ?? {}

    for (const [key, val] of Object.entries(docFields)) {
      const v = val as any

      // Skip the Items array here — handled separately below
      if (key === 'Items') continue

      const content = v?.content ?? v?.valueString ?? v?.value ?? v?.valueDate ?? v?.valueNumber ?? ''
      const confidence = typeof v?.confidence === 'number' ? v.confidence : undefined

      if (String(content).trim() !== '' && isUsableConfidence(confidence)) {
        fields.push({
          name: key,
          value: String(content),
          confidence,
        })
      }
    }

    // FIX 3: Extract structured line items from documents[0].fields.Items.valueArray
    // This is the correct path for prebuilt-invoice and prebuilt-receipt.
    const itemsField = docFields?.Items
    if (itemsField?.valueArray && Array.isArray(itemsField.valueArray)) {
      for (const item of itemsField.valueArray) {
        const itemFields = item?.valueObject ?? {}
        const lineFields: ProviderResult['fields'] = []

        for (const [fieldName, fieldVal] of Object.entries(itemFields)) {
          const fv = fieldVal as any
          const content =
            fv?.content ?? fv?.valueString ?? fv?.value ?? fv?.valueNumber ?? fv?.valueDate ?? ''
          const confidence = typeof fv?.confidence === 'number' ? fv.confidence : undefined

          if (String(content).trim() !== '' && isUsableConfidence(confidence)) {
            lineFields.push({
              name: fieldName,
              value: String(content),
              confidence,
            })
          }
        }

        if (lineFields.length > 0) {
          lines.push({ fields: lineFields })
        }
      }
    }

    // ---- Strategy B: key-value pairs from prebuilt-layout (GENERIC) ----
    // analyzeResult.keyValuePairs is populated when features=keyValuePairs is used.
    if (fields.length === 0) {
      const kvPairs: any[] = analyzeResult.keyValuePairs ?? []
      for (const kv of kvPairs) {
        const key = String(kv?.key?.content ?? '').trim()
        const value = String(kv?.value?.content ?? '').trim()
        const confidence = typeof kv?.confidence === 'number' ? kv.confidence : undefined

        if (key && value && isUsableConfidence(confidence)) {
          fields.push({ name: key, value, confidence })
        }
      }
    }

    // ---- Strategy C: table-based line items (fallback for layout model) ----
    // Only used if we haven't already populated lines via valueArray above.
    if (lines.length === 0) {
      const tables: any[] = analyzeResult.tables ?? []
      if (tables.length > 0) {
        const table = tables[0]
        const rowCount: number = table.rowCount ?? 0
        const cells: any[] = table.cells ?? []

        const rowMap: Map<number, Map<number, string>> = new Map()
        const headerMap: Map<number, string> = new Map()

        for (const cell of cells) {
          const row: number = cell.rowIndex
          const col: number = cell.columnIndex
          const text = String(cell.content ?? '').trim()

          if (row === 0) {
            headerMap.set(col, text)
            continue
          }
          if (!rowMap.has(row)) rowMap.set(row, new Map())
          rowMap.get(row)!.set(col, text)
        }

        for (let r = 1; r < rowCount; r++) {
          const rowData = rowMap.get(r)
          if (!rowData) continue
          const lineFields: ProviderResult['fields'] = []
          for (const [col, value] of rowData.entries()) {
            if (value.trim() === '') continue
            const fieldName = headerMap.get(col) || `col_${col}`
            lineFields.push({ name: fieldName, value })
          }
          if (lineFields.length > 0) {
            lines.push({ fields: lineFields })
          }
        }
      }
    }

    // ---- Strategy D: raw page lines (last resort for truly unstructured docs) ----
    if (fields.length === 0 && lines.length === 0) {
      const pageLines: any[] = analyzeResult.pages?.[0]?.lines ?? []
      for (const line of pageLines.slice(0, 50)) {
        const text = String(line.content ?? '').trim()
        if (text) {
          fields.push({ name: 'raw_line', value: text })
        }
      }
    }

    return {
      rawPayload: analyzeResult,
      pages: analyzeResult.pages?.length,
      fields,
      lines,
    }
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
