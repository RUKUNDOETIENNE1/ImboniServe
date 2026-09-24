import type {
  ProviderGateway,
  ExtractInput,
  ProviderResult,
} from '../gateway'
import { isImage, isPdf } from '../gateway'
import type { ProviderPolicyRegistry } from './registry'
import type { ProviderName, PolicyInput } from './types'
import { countPdfPages } from './pdf-page-count'

// ---------------------------------------------------------------------------
// ProviderRouter
//
// Implements ProviderGateway so it is a drop-in replacement for the old
// provider chain.  The worker, QRMenuPlugin, and any future caller continue
// to call `provider.extract(input)` without knowing which underlying provider
// was selected.
//
// Responsibilities:
//   1. Build PolicyInput from ExtractInput using only cheap signals
//      (MIME type, page count, file size — no AI calls).
//   2. Ask the registry for a ProviderRanking.
//   3. Try providers in ranking order (primary → fallbacks).
//   4. Stamp `providerUsed` on the result so downstream code knows which
//      provider actually succeeded.
//   5. Throw the last error if all providers fail.
// ---------------------------------------------------------------------------
export class ProviderRouter implements ProviderGateway {
  name = 'provider_router'
  private registry: ProviderPolicyRegistry
  private providers: Map<ProviderName, ProviderGateway>

  constructor(
    registry: ProviderPolicyRegistry,
    providers: Map<ProviderName, ProviderGateway>,
  ) {
    this.registry = registry
    this.providers = providers
  }

  supportsMime(mime: string): boolean {
    for (const provider of this.providers.values()) {
      if (provider.supportsMime(mime)) return true
    }
    return false
  }

  async extract(input: ExtractInput): Promise<ProviderResult> {
    const policyInput = this.buildPolicyInput(input)
    const ranking = this.registry.select(policyInput)

    const ordered: ProviderName[] = [ranking.primary, ...ranking.fallbacks]

    let lastError: unknown = null

    for (const providerName of ordered) {
      const provider = this.providers.get(providerName)
      if (!provider) {
        // Provider not configured (e.g., Azure env vars missing) — skip
        continue
      }
      if (!provider.supportsMime(input.mime)) {
        continue
      }

      try {
        const result = await provider.extract(input)
        // Stamp which provider actually produced this result so the worker
        // and DB record the real provider, not "provider_router".
        return { ...result, providerUsed: provider.name }
      } catch (err) {
        lastError = err
        // Continue to next provider in the ranking
      }
    }

    // All providers exhausted
    const attempted = ordered.filter((n) => this.providers.has(n)).join(', ')
    const err = lastError instanceof Error ? lastError : new Error(String(lastError))
    throw new Error(
      `ProviderRouter: all providers failed for documentType=${policyInput.documentType ?? 'GENERIC'} ` +
        `(attempted: [${attempted}]). Last error: ${err.message}`
    )
  }

  // -------------------------------------------------------------------------
  // Build PolicyInput from ExtractInput — cheap signals only, no AI calls.
  // -------------------------------------------------------------------------
  private buildPolicyInput(input: ExtractInput): PolicyInput {
    let pageCount: number | undefined

    if (isPdf(input.mime)) {
      pageCount = countPdfPages(input.buffer)
    }

    return {
      documentType: input.documentType,
      mime: input.mime,
      pageCount,
      fileSizeBytes: input.buffer.length,
    }
  }
}
