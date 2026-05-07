/**
 * Order Feedback Component
 * Simple post-order feedback collection
 */

import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useState } from 'react';

interface OrderFeedbackProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onSubmit?: (feedback: { rating: 'positive' | 'negative'; comment?: string }) => void;
}

export default function OrderFeedback({ orderId, orderNumber, onClose, onSubmit }: OrderFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSubmit) onSubmit({ rating, comment: comment.trim() || undefined });
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Thank You!</h2>
          <p style={{ color: '#6b7280' }}>Your feedback helps us improve.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 400,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>How was your order?</h2>
          <button
            onClick={onClose}
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            Order #{orderNumber}
          </div>

          {/* Rating Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => setRating('positive')}
              style={{
                padding: 20,
                border: rating === 'positive' ? '2px solid #10b981' : '1px solid #d1d5db',
                background: rating === 'positive' ? '#d1fae5' : 'white',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ThumbsUp size={32} color={rating === 'positive' ? '#10b981' : '#6b7280'} />
              <span style={{ fontWeight: 600, color: rating === 'positive' ? '#10b981' : '#374151' }}>
                Good
              </span>
            </button>
            <button
              onClick={() => setRating('negative')}
              style={{
                padding: 20,
                border: rating === 'negative' ? '2px solid #ef4444' : '1px solid #d1d5db',
                background: rating === 'negative' ? '#fee2e2' : 'white',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ThumbsDown size={32} color={rating === 'negative' ? '#ef4444' : '#6b7280'} />
              <span style={{ fontWeight: 600, color: rating === 'negative' ? '#ef4444' : '#374151' }}>
                Not Good
              </span>
            </button>
          </div>

          {/* Optional Comment */}
          {rating && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                Any comments? (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'none',
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            style={{
              width: '100%',
              padding: 12,
              background: rating ? '#111827' : '#e5e7eb',
              color: rating ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: rating ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
            Your feedback is anonymous and helps us improve
          </div>
        </div>
      </div>
    </div>
  );
}
