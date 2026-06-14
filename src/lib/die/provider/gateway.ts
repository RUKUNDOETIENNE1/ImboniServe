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
}

export type ExtractInput = {
  buffer: Buffer
  mime: string
  fileName?: string
  documentType?: 'SUPPLIER_INVOICE' | 'DELIVERY_NOTE' | 'GENERIC'
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
