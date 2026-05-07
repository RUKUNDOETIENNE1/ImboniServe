import { z } from 'zod'

export type InsightGenerationResult = {
  text: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

const ModelConfig = {
  primary: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
  fallback: process.env.OPENAI_MODEL_FALLBACK || 'gpt-4-turbo'
}

function getCostPerToken() {
  const inputPer1K = parseFloat(process.env.OPENAI_COST_INPUT_PER_1K_USD || '0')
  const outputPer1K = parseFloat(process.env.OPENAI_COST_OUTPUT_PER_1K_USD || '0')
  return { inputPer1K, outputPer1K }
}

function buildPrompt(language: string) {
  const lang = (language || 'en').toLowerCase()
  const langHint = lang.startsWith('rw') ? 'Kinyarwanda' : 'English'
  return `You are an expert hospitality business analyst. Analyze ONLY the provided KPIs (no assumptions) and produce a concise, structured report in ${langHint} under 300 words with EXACTLY these sections:

Performance Summary
Key Strengths
Areas to Watch
Practical Suggestions (2–3 bullet points)

- Tie every point to a specific metric in the input.
- Do not invent numbers.
- Be specific and actionable.
- Keep tone professional, supportive, and brief.`
}

const KPISchema = z.object({}).passthrough()

export async function generateInsightFromKPIs(kpis: unknown, language: string): Promise<InsightGenerationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in environment')
  }

  const payload = KPISchema.parse(kpis)

  const model = ModelConfig.primary
  const systemPrompt = buildPrompt(language)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(payload) }
      ]
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI error: ${res.status} ${res.statusText} ${text}`)
  }

  const data = await res.json() as any
  const choice = data?.choices?.[0]?.message?.content || ''
  const usage = data?.usage || {}

  return {
    text: choice.trim(),
    model,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
  }
}

export function estimateCostCents(inputTokens: number, outputTokens: number) {
  const { inputPer1K, outputPer1K } = getCostPerToken()
  if (!inputPer1K && !outputPer1K) return 0
  const usd = (inputTokens / 1000) * inputPer1K + (outputTokens / 1000) * outputPer1K
  return Math.round(usd * 100)
}
