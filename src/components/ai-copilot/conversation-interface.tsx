/**
 * AI Copilot™ - Conversation Interface
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, FileText, Play, Download, Sparkles, MessageSquare } from 'lucide-react'
import type { Conversation, Message } from '@/lib/ai-copilot/types'

interface Props {
  conversation: Conversation | null
  onConversationUpdate: (conversation: Conversation) => void
}

export function ConversationInterface({ conversation, onConversationUpdate }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages)
    }
  }, [conversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai-copilot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation?.id,
          message: userMessage,
          includeEvidence: true,
          includeHistorical: true,
          includeReplay: true,
        }),
      })

      const data = await response.json()

      if (data.success && data.conversation) {
        onConversationUpdate(data.conversation)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-16 h-16 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Copilot™</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Ask me anything about your restaurant operations. I'll provide evidence-based answers from your platform intelligence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {[
                'Why was lunch slow today?',
                'Which waiter improved the most this week?',
                'What caused the kitchen bottleneck yesterday?',
                'Show me restaurants with declining service quality',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your operations..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gray-600' : 'bg-blue-600'}`}>
        {isUser ? <MessageSquare className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-3xl rounded-lg p-4 ${isUser ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-900'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {!isUser && message.confidence && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Confidence: <span className="font-semibold">{(message.confidence * 100).toFixed(0)}%</span>
              </p>
            </div>
          )}

          {!isUser && (message.evidence && message.evidence.length > 0 || message.replayLinks && message.replayLinks.length > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-3">
              {message.evidence && message.evidence.length > 0 && (
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Evidence ({message.evidence.length})
                </button>
              )}
              {message.replayLinks && message.replayLinks.length > 0 && (
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Replay ({message.replayLinks.length})
                </button>
              )}
            </div>
          )}

          {!isUser && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Suggested follow-ups:</p>
              <div className="flex flex-wrap gap-2">
                {message.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
