import { ProviderGateway } from './gateway'
import { AzureDocIntelligenceProvider } from './azure'
import { OpenAIVisionProvider } from './openai'

// ---------------------------------------------------------------------------
// Provider Chain Builder
// ---------------------------------------------------------------------------
// Order of priority:
//   1. Azure Document Intelligence  (if AZURE_DI_ENDPOINT + AZURE_DI_KEY are set)
//   2. OpenAI Vision                (if OPENAI_API_KEY is set)
//   3. OpenAI Vision fallback       (always added as last resort; throws a
//                                    helpful error if API key is not configured)
//
// Fallback behaviour:
// The worker iterates the chain in order.  If a provider throws for ANY reason,
// the next provider in the chain is tried.  A provider must throw to trigger
// fallback — returning a result (even an empty one) stops the chain.
//
// The following conditions all cause Azure to throw and fall back to OpenAI:
//
//  AZURE_DISABLED          — AZURE_DI_ENDPOINT / AZURE_DI_KEY not set
//                            → Azure never added to chain
//
//  MISSING_CREDENTIALS     — Either env var is empty string at runtime
//                            → AzureDIConfigError thrown in constructor
//                            → (constructor throws, buildProviderChain catches it)
//
//  INVALID_CREDENTIALS     — Azure returns HTTP 401 or 403
//                            → AzureDIAuthError thrown in extract()
//
//  TIMEOUT                 — Analysis or polling exceeds DIE_PROVIDER_TIMEOUT_MS
//                            → AzureDITimeoutError thrown in extract()
//
//  NETWORK_ERROR           — TCP failure, DNS failure, non-retryable HTTP 5xx
//                            → AzureDINetworkError thrown in extract()
//
//  RATE_LIMIT              — Azure returns HTTP 429
//                            → AzureDIQuotaError thrown in extract()
//
//  QUOTA_EXCEEDED          — Azure returns HTTP 429 with quota message
//                            → AzureDIQuotaError thrown in extract()
//
//  EMPTY_EXTRACTION        — Azure returns 0 usable fields AND 0 line items
//                            → AzureDIEmptyResultError thrown after assertUsable()
//
//  VALIDATION_FAILURE      — Response shape is corrupt / missing analyzeResult
//                            → AzureDIValidationError thrown in mapResult()
//
//  UNEXPECTED_SHAPE        — Operation-Location header missing after submit
//                            → AzureDIValidationError thrown in extract()
// ---------------------------------------------------------------------------

export function buildProviderChain(): ProviderGateway[] {
  const providers: ProviderGateway[] = []

  // Azure: only attempt to instantiate if both env vars are present.
  // We wrap construction in a try/catch so a bad value at startup does not
  // crash the entire worker process — it just skips Azure.
  if (process.env.AZURE_DI_ENDPOINT && process.env.AZURE_DI_KEY) {
    try {
      providers.push(new AzureDocIntelligenceProvider())
      console.log('[DIE] Azure Document Intelligence provider registered')
    } catch (err: any) {
      console.warn(
        `[DIE] Azure provider failed to initialise (${err?.name ?? 'Error'}): ${err?.message}. ` +
          'Falling back to OpenAI Vision only.'
      )
    }
  }

  // OpenAI: add if key is present
  if (process.env.OPENAI_API_KEY) {
    providers.push(new OpenAIVisionProvider())
    console.log('[DIE] OpenAI Vision provider registered')
  }

  // Safety net: always have at least one provider in the chain.
  // If no providers could be registered at all, add OpenAI anyway —
  // extract() will throw a descriptive error when a job runs.
  if (providers.length === 0) {
    console.warn(
      '[DIE] No extraction providers configured. ' +
        'Set OPENAI_API_KEY (required) and optionally AZURE_DI_ENDPOINT + AZURE_DI_KEY.'
    )
    providers.push(new OpenAIVisionProvider())
  }

  return providers
}
