import type { ProviderPolicy, PolicyInput, ProviderRanking } from '../types'

// ---------------------------------------------------------------------------
// ReceiptPolicy (RECEIPT)
//
// Primary:   Azure Document Intelligence — Azure has a dedicated prebuilt-receipt
//            model trained on receipt layouts.  This is the one document type
//            where Azure's prebuilt model provides genuine advantage over
//            GPT-4o for structured field extraction (merchant, totals, tax,
//            line items with guaranteed schema).
// Fallback:  OpenAI Vision — handles receipts that Azure's model fails on
//            (unusual layouts, handwritten receipts, non-standard formats).
// ---------------------------------------------------------------------------
export const ReceiptPolicy: ProviderPolicy = {
  documentType: 'RECEIPT',
  select(_input: PolicyInput): ProviderRanking {
    return {
      primary: 'azure_document_intelligence',
      fallbacks: ['openai'],
      reason: 'Receipt: Azure prebuilt-receipt primary (dedicated trained model), OpenAI fallback for edge cases',
    }
  },
}
