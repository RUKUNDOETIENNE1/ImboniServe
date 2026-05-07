/**
 * Payment Confirmation Component
 * Shows payment success with digital receipt
 */

import { CheckCircle, Download, Share2 } from 'lucide-react';

interface PaymentConfirmationProps {
  orderNumber: string;
  totalAmountCents: number;
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
  }>;
  paymentMethod: string;
  paymentReference?: string;
  timestamp: Date;
  businessName?: string;
  onClose: () => void;
}

export default function PaymentConfirmation({
  orderNumber,
  totalAmountCents,
  items,
  paymentMethod,
  paymentReference,
  timestamp,
  businessName,
  onClose,
}: PaymentConfirmationProps) {
  const formatRwf = (cents: number) => `RWF ${Math.round(cents).toLocaleString('en-RW')}`;

  const handleDownloadReceipt = () => {
    // Generate a simple text receipt
    const receiptText = `
IMBONI SERVE - DIGITAL RECEIPT
${businessName || 'Restaurant'}
================================

Order #: ${orderNumber}
Date: ${timestamp.toLocaleString()}
Payment: ${paymentMethod}
${paymentReference ? `Reference: ${paymentReference}` : ''}

ITEMS:
${items.map(item => `${item.quantity}x ${item.name} - ${formatRwf(item.priceCents * item.quantity)}`).join('\n')}

TOTAL: ${formatRwf(totalAmountCents)}

Thank you for your order!
Powered by Imboni Serve
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `Order #${orderNumber} confirmed! Total: ${formatRwf(totalAmountCents)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Order Confirmation',
          text: shareText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Order details copied to clipboard!');
    }
  };

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
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Success Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: 24,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <CheckCircle size={64} style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>
            Payment Confirmed ✅
          </h2>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.9 }}>
            Your order has been received and will be prepared shortly
          </p>
        </div>

        {/* Receipt Details */}
        <div style={{ padding: 20 }}>
          {/* Order Info */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Order Number</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>#{orderNumber}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Payment Method</div>
                <div style={{ fontWeight: 600 }}>{paymentMethod}</div>
              </div>
              {paymentReference && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#6b7280', marginBottom: 4 }}>Reference</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{paymentReference}</div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Date & Time</div>
                <div style={{ fontWeight: 600 }}>{timestamp.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Order Summary</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {item.quantity} × {formatRwf(item.priceCents)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatRwf(item.priceCents * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: '2px solid #e5e7eb',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <div>Total Paid</div>
            <div style={{ color: '#10b981' }}>{formatRwf(totalAmountCents)}</div>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <button
              onClick={handleDownloadReceipt}
              style={{
                padding: 12,
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Download size={18} />
              Download
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: 12,
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 14,
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            Done
          </button>

          {/* Footer Note */}
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: '#eff6ff',
              borderRadius: 8,
              fontSize: 13,
              color: '#1e40af',
              textAlign: 'center',
            }}
          >
            A copy of this receipt has been saved to your order history
          </div>
        </div>
      </div>
    </div>
  );
}
