import { useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, X, CheckCircle, Star } from 'lucide-react'

interface PaymentFeedbackProps {
  orderId: string
  orderNumber: string
  paymentMethod: string
  onComplete?: () => void
}

export function PaymentFeedback({
  orderId,
  orderNumber,
  paymentMethod,
  onComplete
}: PaymentFeedbackProps) {
  const [step, setStep] = useState<'rating' | 'details' | 'complete'>('rating')
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [issues, setIssues] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commonIssues = [
    'Payment took too long',
    'Process was confusing',
    'Phone prompt didn\'t appear',
    'Had to enter PIN multiple times',
    'Transaction failed initially',
    'Unclear instructions',
    'Amount was incorrect',
    'Other issue'
  ]

  const handleRatingSelect = (selectedRating: 'positive' | 'negative') => {
    setRating(selectedRating)
    setStep('details')
  }

  const toggleIssue = (issue: string) => {
    setIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderNumber,
          paymentMethod,
          rating,
          stars,
          issues,
          comment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setStep('complete')
      setTimeout(() => {
        onComplete?.()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-900 mb-1">Thank You!</h3>
        <p className="text-sm text-green-800">Your feedback helps us improve</p>
      </div>
    )
  }

  if (step === 'details') {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            {rating === 'positive' ? 'Great! Tell us more' : 'We\'re sorry. What went wrong?'}
          </h3>
          <button
            onClick={() => setStep('rating')}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {rating === 'positive' ? (
          // Positive feedback - star rating
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rate your experience
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStars(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= stars
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Negative feedback - issue selection
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What issues did you experience? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {commonIssues.map((issue) => (
                <button
                  key={issue}
                  onClick={() => toggleIssue(issue)}
                  className={`text-left px-4 py-2 rounded-lg border-2 transition-colors ${
                    issues.includes(issue)
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">{issue}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional comments (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            rows={3}
            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || (rating === 'positive' && stars === 0) || (rating === 'negative' && issues.length === 0)}
            className="flex-1 bg-imboni-blue text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button
            onClick={() => onComplete?.()}
            className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Rating selection
  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">
        How was your payment experience?
      </h3>
      <p className="text-sm text-slate-600 mb-6 text-center">
        Your feedback helps us improve
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleRatingSelect('positive')}
          className="flex flex-col items-center gap-3 p-6 border-2 border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors group"
        >
          <div className="w-16 h-16 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </div>
          <span className="font-semibold text-slate-900">Great</span>
          <span className="text-xs text-slate-600">It worked well</span>
        </button>

        <button
          onClick={() => handleRatingSelect('negative')}
          className="flex flex-col items-center gap-3 p-6 border-2 border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors group"
        >
          <div className="w-16 h-16 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
            <ThumbsDown className="w-8 h-8 text-red-600" />
          </div>
          <span className="font-semibold text-slate-900">Had Issues</span>
          <span className="text-xs text-slate-600">Something went wrong</span>
        </button>
      </div>

      <button
        onClick={() => onComplete?.()}
        className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        Skip feedback
      </button>
    </div>
  )
}
