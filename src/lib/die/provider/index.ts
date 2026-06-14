import { ProviderGateway } from './gateway'
import { AzureDocIntelligenceProvider } from './azure'
import { OpenAIVisionProvider } from './openai'

export function buildProviderChain(): ProviderGateway[] {
  const providers: ProviderGateway[] = []
  if (process.env.AZURE_DI_ENDPOINT && process.env.AZURE_DI_KEY) {
    providers.push(new AzureDocIntelligenceProvider())
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push(new OpenAIVisionProvider())
  }
  // Fallback to OpenAI even if not configured will throw helpful error
  if (providers.length === 0) {
    providers.push(new OpenAIVisionProvider())
  }
  return providers
}
