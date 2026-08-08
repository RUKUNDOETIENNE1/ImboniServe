import type { DocumentType } from '../gateway'

// ---------------------------------------------------------------------------
// Provider name — must match the `name` property on each ProviderGateway
// implementation (azure.ts → 'azure_document_intelligence', openai.ts → 'openai')
// ---------------------------------------------------------------------------
export type ProviderName = 'azure_document_intelligence' | 'openai'

// ---------------------------------------------------------------------------
// ProviderRanking — the output of a policy's select() method.
//
// primary:    the provider to try first
// fallbacks:  ordered list of providers to try if the primary throws or
//             (in future phases) fails the confidence gate
// reason:     human-readable justification for observability/audit logs
// ---------------------------------------------------------------------------
export interface ProviderRanking {
  primary: ProviderName
  fallbacks: ProviderName[]
  reason: string
}

// ---------------------------------------------------------------------------
// PolicyInput — cheap signals available without any AI call.
//
// documentType:  user-selected or inferred type (may be undefined)
// mime:          MIME type of the uploaded file
// pageCount:     number of pages for PDFs (undefined for images or if
//                the count could not be determined cheaply)
// fileSizeBytes: raw file size
// ---------------------------------------------------------------------------
export interface PolicyInput {
  documentType: DocumentType | undefined
  mime: string
  pageCount?: number
  fileSizeBytes: number
}

// ---------------------------------------------------------------------------
// ProviderPolicy — Strategy Pattern interface.
//
// Each document type owns its routing logic.  The registry resolves the
// correct policy by documentType; the router calls select() to get a
// ProviderRanking.
// ---------------------------------------------------------------------------
export interface ProviderPolicy {
  readonly documentType: DocumentType
  select(input: PolicyInput): ProviderRanking
}
