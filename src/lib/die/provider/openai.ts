import OpenAI from 'openai'
import { ProviderGateway, ExtractInput, ProviderResult, isImage, isPdf } from './gateway'

export class OpenAIVisionProvider implements ProviderGateway {
  name = 'openai'
  private client: OpenAI | null

  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
  }

  supportsMime(mime: string): boolean {
    return isImage(mime) || isPdf(mime)
  }

  async extract(input: ExtractInput): Promise<ProviderResult> {
    if (!this.client) throw new Error('OpenAI API key not configured')

    if (isImage(input.mime)) {
      const resp = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a document extraction engine. Return JSON with fields and optional line items. No markdown.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${input.mime};base64,${input.buffer.toString('base64')}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const content = resp.choices?.[0]?.message?.content || '{}'
      let parsed: any
      try {
        parsed = JSON.parse(content)
      } catch {
        parsed = { fields: [], lines: [] }
      }
      return {
        rawPayload: resp,
        pages: 1,
        fields: parsed.fields || [],
        lines: parsed.lines || [],
      }
    }

    // Minimal PDF path placeholder: treat as single page for now
    return {
      rawPayload: { note: 'pdf path to be enhanced' },
      pages: undefined,
      fields: [],
      lines: [],
    }
  }
}
