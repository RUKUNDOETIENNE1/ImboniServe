import type { ProviderPolicy, PolicyInput, ProviderRanking } from '../types'

// ---------------------------------------------------------------------------
// DeliveryNotePolicy (DELIVERY_NOTE)
//
// Primary:   OpenAI Vision — delivery notes vary widely in format; GPT-4o's
//            semantic flexibility handles non-standard layouts better than
//            Azure's prebuilt-receipt model (which is the closest available
//            prebuilt, since Azure has no dedicated delivery-note model).
// Fallback:  Azure prebuilt-receipt — structured extraction as a safety net.
// ---------------------------------------------------------------------------
export const DeliveryNotePolicy: ProviderPolicy = {
  documentType: 'DELIVERY_NOTE',
  select(_input: PolicyInput): ProviderRanking {
    return {
      primary: 'openai',
      fallbacks: ['azure_document_intelligence'],
      reason: 'Delivery note: OpenAI primary for format flexibility, Azure prebuilt-receipt fallback',
    }
  },
}
