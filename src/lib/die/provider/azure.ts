import { ProviderGateway, ExtractInput, ProviderResult, isImage, isPdf } from './gateway'

export class AzureDocIntelligenceProvider implements ProviderGateway {
  name = 'azure_document_intelligence'
  private endpoint: string | undefined
  private key: string | undefined

  constructor() {
    this.endpoint = process.env.AZURE_DI_ENDPOINT
    this.key = process.env.AZURE_DI_KEY
  }

  supportsMime(mime: string): boolean {
    return isImage(mime) || isPdf(mime)
  }

  async extract(input: ExtractInput): Promise<ProviderResult> {
    if (!this.endpoint || !this.key) {
      throw new Error('Azure Document Intelligence not configured')
    }
    // Placeholder implementation; actual REST call to Azure DI will be added later.
    // Return empty structure to satisfy interface in environments without full setup.
    return {
      rawPayload: { note: 'Azure DI placeholder' },
      fields: [],
      lines: [],
    }
  }
}
