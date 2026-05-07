import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Mail, User } from 'lucide-react'
import { PRICING_PLANS } from '@/config/pricing'
import { formatCurrency } from '@/lib/utils/currency'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function PublicSupportWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! 👋 Welcome to Imboni Serve. How can we help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showContactForm, setShowContactForm] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const [hp, setHp] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null
      setTimeout(() => dialogRef.current?.focus(), 0)
    } else {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key !== 'Tab') return
    const container = dialogRef.current
    if (!container) return
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const pricingSummary = (() => {
    try {
      const plans = PRICING_PLANS
        .filter(p => typeof p.monthlyPriceRWF === 'number')
        .map(p => `${p.name}: ${formatCurrency(p.monthlyPriceRWF as number, 'RWF')}/month`)
        .join(', ')
      return `${plans}. See current details in the Pricing section below.`
    } catch {
      return 'See current plan details in the Pricing section below.'
    }
  })()

  const quickReplies = [
    { text: 'How do I get started?', response: 'Getting started is easy! Click "Start Free Trial" at the top of the page to create your account. You\'ll get 14 days free to explore all features.' },
    { text: 'What are the pricing plans?', response: pricingSummary },
    { text: 'Do you offer training?', response: 'Yes! We provide free onboarding training for all new customers, plus video tutorials and 24/7 email support. Enterprise customers get dedicated phone support.' },
    { text: 'Can I use it offline?', response: 'Yes! Imboni Serve works offline. You can take orders, record sales, and manage inventory without internet. Data syncs automatically when you\'re back online.' },
    { text: 'Talk to a human', response: 'I\'ll connect you with our team. Please share your email and we\'ll get back to you within 24 hours!' },
  ]

  const handleQuickReply = (reply: typeof quickReplies[0]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: reply.text,
      sender: 'user',
      timestamp: new Date(),
    }
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: reply.response,
      sender: 'bot',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg, botMsg])
    setShowContactForm(false)
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    if (name && email) {
      setSending(true)
      try {
        await fetch('/api/support/public-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message: input, hp }),
        })
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Thank you! We\'ve received your message and will respond to your email within 24 hours. 📧',
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } catch {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error sending your message. Please email us directly at support@imboniserve.com',
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } finally {
        setSending(false)
      }
    } else {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'d love to help! Could you please share your name and email so our team can follow up with you?',
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
      setShowContactForm(true)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-14 right-6 z-50 bg-gradient-to-r from-imboni-blue to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center gap-2 group"
          aria-label="Open support chat"
          aria-haspopup="dialog"
          aria-controls="public-support-dialog"
          aria-expanded={open}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
            Need Help?
          </span>
        </button>
      )}

      {open && (
        <div
          ref={dialogRef}
          id="public-support-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-support-title"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="fixed bottom-14 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <div style={{ position: 'absolute', left: '-10000px' }} aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" autoComplete="off" tabIndex={-1} value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          <div className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="public-support-title" className="font-bold">Imboni Support</h3>
                <p className="text-xs text-blue-100">We typically reply in minutes</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4 space-y-4 bg-gray-50 dark:bg-gray-800/50" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-imboni-blue text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick questions:</p>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}

            {showContactForm && !name && (
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Your contact info:</p>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    aria-label="Your name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    aria-label="Your email"
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                aria-label="Message input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-2 bg-imboni-blue text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                aria-label="Send message"
                aria-disabled={!input.trim() || sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
