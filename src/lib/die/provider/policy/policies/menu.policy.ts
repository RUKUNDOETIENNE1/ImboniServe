import type { ProviderPolicy, PolicyInput, ProviderRanking } from '../types'

// ---------------------------------------------------------------------------
// MenuPolicy
//
// Menu photos are the canonical case for GPT-4o Vision:
//   - Native visual understanding of menu layouts
//   - Better semantic reasoning (category inference, dish names)
//   - Faster (single synchronous call vs. Azure's submit + poll)
//   - Simpler pipeline (no PDF rendering or async polling)
//
// No fallback to Azure — the audit established that Azure's prebuilt-layout
// output for menus is discarded (flattened to text) by the QRMenuPlugin, so
// Azure adds latency without value for this document type.
// ---------------------------------------------------------------------------
export const MenuPolicy: ProviderPolicy = {
  documentType: 'MENU',
  select(_input: PolicyInput): ProviderRanking {
    return {
      primary: 'openai',
      fallbacks: [],
      reason: 'Menu document: OpenAI Vision for native visual + semantic understanding (no Azure fallback)',
    }
  },
}
