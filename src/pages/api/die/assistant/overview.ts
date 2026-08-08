import type { NextApiRequest, NextApiResponse } from 'next'
import { generateAssistantOverview } from '@/lib/die/ai-business-assistant.engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (process.env.DIE_AI_ASSISTANT_ENABLED !== 'true') {
      return res.status(200).json({ 
        summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] 
      })
    }

    const overview = await generateAssistantOverview()
    return res.status(200).json(overview)
  } catch (e: any) {
    console.debug('[DIE][Assistant Overview API] error (ignored):', e?.message)
    return res.status(200).json({ 
      summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] 
    })
  }
}
