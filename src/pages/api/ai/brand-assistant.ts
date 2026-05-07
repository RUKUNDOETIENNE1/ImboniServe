import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

/**
 * Simple MVP endpoint for the AI Brand Assistant.
 * - Requires login (so we can later ground on tenant data)
 * - Calls OpenAI if OPENAI_API_KEY is set
 * - Returns a single answer string
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { question, includeFilters, locale } = req.body || {}
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  const system = [
    'You are an AI Brand Assistant for a hospitality management platform.',
    'Respond concisely and helpfully. If the user language is not English, respond in that language.',
    'When asked about performance or engagement, explain how to derive it from activities, orders, feedback, and timelines.',
    'If you do not have access to the actual data, provide a clear, practical approach to compute it and suggest next steps.',
  ].join(' ')

  // If no API key is configured, return a deterministic helpful stub
  if (!apiKey) {
    const answer = `I can help with this. Right now, the AI model is not connected because OPENAI_API_KEY is missing.\n\n` +
      `Question: ${question}\n` +
      `How I would answer: summarize insights using recent activities (calls, emails, meetings, complaints), segment by day/time, and highlight spikes. ` +
      (includeFilters ? 'I would also respect the selected filters (date range, channel, sentiment).' : '')
    return res.status(200).json({ answer })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Locale: ${locale || 'en'}\nInclude filters: ${!!includeFilters}\nQuestion: ${question}` },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ error: `OpenAI error: ${errText}` })
    }

    const data = await response.json()
    const answer: string = data?.choices?.[0]?.message?.content || 'No answer'
    return res.status(200).json({ answer })
  } catch (error: any) {
    console.error('Brand Assistant error:', error)
    return res.status(500).json({ error: error?.message || 'Internal error' })
  }
}
