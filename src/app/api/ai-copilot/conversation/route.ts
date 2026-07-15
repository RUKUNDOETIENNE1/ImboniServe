/**
 * AI Copilot™ API - Conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAICopilotService } from '@/lib/ai-copilot'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, message, includeEvidence, includeHistorical, includeReplay } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const service = createAICopilotService()
    const response = await service.processMessage({
      conversationId,
      message,
      includeEvidence: includeEvidence ?? true,
      includeHistorical: includeHistorical ?? true,
      includeReplay: includeReplay ?? true,
    })

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to process message',
      })
    }

    return NextResponse.json({
      success: true,
      conversationId: response.conversationId,
      message: response.message,
      conversation: response.conversation,
    })
  } catch (error) {
    console.error('AI Copilot conversation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
