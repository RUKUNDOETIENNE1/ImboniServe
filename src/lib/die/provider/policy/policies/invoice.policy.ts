import type { ProviderPolicy, PolicyInput, ProviderRanking } from '../types'

// ---------------------------------------------------------------------------
// InvoicePolicy (SUPPLIER_INVOICE)
//
// Primary:   OpenAI Vision — strong semantic extraction of vendor, line items,
//            totals, and dates from a single image or rendered PDF page.
// Fallback:  Azure Document Intelligence — its prebuilt-invoice model has a
//            guaranteed schema and is valuable when OpenAI returns low-quality
//            or incomplete results (handled by the confidence gate in Phase 2;
//            today the fallback triggers on exceptions/empty results only).
// ---------------------------------------------------------------------------
export const InvoicePolicy: ProviderPolicy = {
  documentType: 'SUPPLIER_INVOICE',
  select(_input: PolicyInput): ProviderRanking {
    return {
      primary: 'openai',
      fallbacks: ['azure_document_intelligence'],
      reason: 'Supplier invoice: OpenAI primary for semantic extraction, Azure fallback for structured schema',
    }
  },
}
