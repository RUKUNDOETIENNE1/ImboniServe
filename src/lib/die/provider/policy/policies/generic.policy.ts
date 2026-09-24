import type { ProviderPolicy, PolicyInput, ProviderRanking } from '../types'

// ---------------------------------------------------------------------------
// GenericPolicy
//
// Fallback policy when no document-type-specific policy applies (or when
// documentType is undefined).  Uses only cheap signals:
//
//   - Multi-page PDF (pageCount > 3) → Azure primary
//     Azure accepts PDFs natively and has mature layout analysis.  The OpenAI
//     provider renders the entire PDF as one tall PNG via Puppeteer, which
//     degrades on multi-page documents.
//
//   - Images and single-page PDFs → OpenAI primary
//     GPT-4o has superior semantic understanding for single-page visual
//     extraction and avoids Azure's async polling overhead.
//
// In both cases the other provider is the fallback.
// ---------------------------------------------------------------------------

const GENERIC_PDF_PAGE_THRESHOLD = 3

export const GenericPolicy: ProviderPolicy = {
  documentType: 'GENERIC',
  select(input: PolicyInput): ProviderRanking {
    const isPdf = input.mime === 'application/pdf'
    const isMultiPagePdf = isPdf && (input.pageCount ?? 1) > GENERIC_PDF_PAGE_THRESHOLD

    if (isMultiPagePdf) {
      return {
        primary: 'azure_document_intelligence',
        fallbacks: ['openai'],
        reason: `Generic document: multi-page PDF (${input.pageCount} pages > ${GENERIC_PDF_PAGE_THRESHOLD}) → Azure for native PDF layout analysis`,
      }
    }

    return {
      primary: 'openai',
      fallbacks: ['azure_document_intelligence'],
      reason: isPdf
        ? `Generic document: single-page PDF → OpenAI for semantic understanding`
        : `Generic document: image → OpenAI Vision`,
    }
  },
}
