import { ProviderGateway } from './gateway'
import { AzureDocIntelligenceProvider } from './azure'
import { OpenAIVisionProvider } from './openai'
import { ProviderPolicyRegistry } from './policy/registry'
import { ProviderRouter } from './policy/router'
import type { ProviderName } from './policy/types'
import { GenericPolicy } from './policy/policies/generic.policy'
import { MenuPolicy } from './policy/policies/menu.policy'
import { InvoicePolicy } from './policy/policies/invoice.policy'
import { DeliveryNotePolicy } from './policy/policies/delivery-note.policy'
import { ReceiptPolicy } from './policy/policies/receipt.policy'

// ---------------------------------------------------------------------------
// Provider Chain Builder (Policy-Based)
// ---------------------------------------------------------------------------
// The DIE now uses a policy-driven ProviderRouter instead of a fixed-order
// provider chain.  The router implements ProviderGateway, so the worker and
// plugins continue to call `provider.extract(input)` with no awareness of
// which underlying provider was selected.
//
// Provider selection is delegated to per-documentType policies registered
// in the ProviderPolicyRegistry.  See:
//   src/lib/die/provider/policy/types.ts        — ProviderPolicy interface
//   src/lib/die/provider/policy/registry.ts     — extension point
//   src/lib/die/provider/policy/router.ts       — ProviderGateway impl
//   src/lib/die/provider/policy/policies/*.ts   — per-type routing rules
//
// The router tries providers in policy-determined order (primary → fallbacks).
// If a provider throws for ANY reason, the next provider in the ranking is
// tried.  The router stamps `providerUsed` on the returned ProviderResult so
// downstream code (worker DB writes) records the actual provider.
//
// Provider instantiation is unchanged from the previous implementation:
//   - Azure is only instantiated if AZURE_DI_ENDPOINT + AZURE_DI_KEY are set
//   - OpenAI is added if OPENAI_API_KEY is set
//   - If neither is configured, OpenAI is added as a safety net (it will
//     throw a descriptive error when extract() is called)
//
// The return type is still ProviderGateway[] for backward compatibility with
// callers that iterate the chain.  In practice the array contains a single
// ProviderRouter entry.
// ---------------------------------------------------------------------------

export function buildProviderChain(): ProviderGateway[] {
  const providerMap = new Map<ProviderName, ProviderGateway>()

  // Azure: only attempt to instantiate if both env vars are present.
  // We wrap construction in a try/catch so a bad value at startup does not
  // crash the entire worker process — it just skips Azure.
  if (process.env.AZURE_DI_ENDPOINT && process.env.AZURE_DI_KEY) {
    try {
      providerMap.set('azure_document_intelligence', new AzureDocIntelligenceProvider())
      console.log('[DIE] Azure Document Intelligence provider registered')
    } catch (err: any) {
      console.warn(
        `[DIE] Azure provider failed to initialise (${err?.name ?? 'Error'}): ${err?.message}. ` +
          'Routing will skip Azure.'
      )
    }
  }

  // OpenAI: add if key is present
  if (process.env.OPENAI_API_KEY) {
    providerMap.set('openai', new OpenAIVisionProvider())
    console.log('[DIE] OpenAI Vision provider registered')
  }

  // Safety net: always have at least one provider.
  // If no providers could be registered at all, add OpenAI anyway —
  // extract() will throw a descriptive error when a job runs.
  if (providerMap.size === 0) {
    console.warn(
      '[DIE] No extraction providers configured. ' +
        'Set OPENAI_API_KEY (required) and optionally AZURE_DI_ENDPOINT + AZURE_DI_KEY.'
    )
    providerMap.set('openai', new OpenAIVisionProvider())
  }

  // Build the policy registry with per-documentType routing rules.
  const registry = new ProviderPolicyRegistry(GenericPolicy)
  registry.register(GenericPolicy)       // also registered explicitly for clarity
  registry.register(MenuPolicy)
  registry.register(InvoicePolicy)
  registry.register(DeliveryNotePolicy)
  registry.register(ReceiptPolicy)

  const router = new ProviderRouter(registry, providerMap)
  console.log('[DIE] ProviderRouter initialised with policy-based routing')

  return [router]
}
