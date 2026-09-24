import type { Readable } from 'node:stream'

export type ProviderField = {
  name: string
  value: string
  confidence?: number
}

export type ProviderLine = {
  fields: ProviderField[]
}

export type ProviderResult = {
  rawPayload: any
  pages?: number
  fields: ProviderField[]
  lines?: ProviderLine[]
  bboxes?: any
  /**
   * Name of the provider that actually produced this result.
   * Set by ProviderRouter when it selects a provider internally.
   * Individual providers (Azure, OpenAI) do not set this — their `name`
   * property is used instead.  This field is additive and backward-compatible.
   */
  providerUsed?: string
}

export type DocumentType =
  | 'SUPPLIER_INVOICE'
  | 'DELIVERY_NOTE'
  | 'GENERIC'
  | 'MENU'
  | 'RECEIPT'

export type ExtractInput = {
  buffer: Buffer
  mime: string
  fileName?: string
  documentType?: DocumentType
}

export interface ProviderGateway {
  name: string
  supportsMime(mime: string): boolean
  extract(input: ExtractInput): Promise<ProviderResult>
}

export function isPdf(mime: string) {
  return mime === 'application/pdf'
}

export function isImage(mime: string) {
  return mime.startsWith('image/')
}
