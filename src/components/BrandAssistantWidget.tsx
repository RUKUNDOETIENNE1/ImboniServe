import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Sparkles, Send, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface AssistantMessage {
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
}

export default function BrandAssistantWidget() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setDismissed(localStorage.getItem('brand-assistant-dismissed') === 'true')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('brand-assistant-dismissed', 'true')
  }

  const handleRestore = () => {
    setDismissed(false)
    localStorage.removeItem('brand-assistant-dismissed')
  }
  const [input, setInput] = useState('')
  const [includeFilters, setIncludeFilters] = useState(true)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  const suggestions = useMemo(
    () => [
      t(
        'assistant.prompts.peak_engagement',
        'What are the peak engagement periods for my brand, and what events or content triggered these spikes?'
      ),
      t(
        'assistant.prompts.dislikes',
        'What do people dislike my brand for the most?'
      ),
      t(
        'assistant.prompts.next_best_actions',
        'Based on recent activity, what are the top 3 actions we should take this week?'
      ),
    ],
    [t]
  )

  async function ask(question: string) {
    if (!question.trim()) return
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    try {
      const res = await fetch('/api/ai/brand-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, includeFilters, locale }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed: ${res.status}`)
      }

      const data = (await res.json()) as { answer: string }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: err?.message || 'Failed to get an answer. Please try again.' },
      ])
    } finally {
      setLoading(false)
      // scroll to bottom
      setTimeout(() => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }

  if (!isMounted || (dismissed && !open)) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating button */}
      {!open && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-imboni-blue text-white shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t('assistant.cta', 'Ask AI Brand Assistant')}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-lg transition-colors"
            title="Hide this button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div className="w-[360px] max-w-[90vw] rounded-2xl bg-gray-900 text-white shadow-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-300" />
              <span className="font-semibold">{t('assistant.title', 'AI Brand Assistant')}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded" title="Hide assistant">
                <X className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-4 pt-3 grid gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => ask(s)}
                className="text-left text-sm bg-gray-800/60 hover:bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={containerRef} className="px-4 mt-3 max-h-56 overflow-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-blue-200' : m.role === 'assistant' ? 'text-gray-100' : 'text-red-300'}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-400">{t('assistant.loading', 'Thinking...')}</div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 mt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? ask(input) : undefined)}
                placeholder={t('assistant.placeholder', 'Ask anything here...')}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('assistant.send', 'Send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFilters}
                  onChange={() => setIncludeFilters((v) => !v)}
                />
                {t('assistant.includeFilters', 'Include filters')}
              </label>
              <div className="opacity-70">{t('assistant.beta', 'Beta')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
