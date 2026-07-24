import { Clock, ChefHat, AlertCircle, CheckCircle, Utensils } from 'lucide-react';

interface OrderTimelineProps {
  kitchenStatus?: string | null;
  receivedAt?: string | null;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  almostReadyAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  estimatedMinutes?: string | null;
  orderNumber?: string | null;
}

function formatTimestamp(ts?: string | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function OrderTimeline({
  kitchenStatus,
  receivedAt,
  acceptedAt,
  preparingAt,
  almostReadyAt,
  readyAt,
  servedAt,
  estimatedMinutes,
  orderNumber,
}: OrderTimelineProps) {
  const status = kitchenStatus || 'pending';

  const steps = [
    {
      key: 'received',
      label: 'Received',
      icon: Clock,
      color: '#6b7280',
      bgColor: '#f3f4f6',
      timestamp: receivedAt,
      description: 'Your order has been received',
      isComplete: ['pending', 'accepted', 'preparing', 'almost_ready', 'ready', 'served'].includes(status),
      isCurrent: status === 'pending',
    },
    {
      key: 'preparing',
      label: 'Preparing',
      icon: ChefHat,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      timestamp: preparingAt || acceptedAt,
      description: 'The kitchen is crafting your order',
      isComplete: ['preparing', 'almost_ready', 'ready', 'served'].includes(status),
      isCurrent: ['accepted', 'preparing'].includes(status),
    },
    {
      key: 'almost_ready',
      label: 'Almost Ready',
      icon: AlertCircle,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      timestamp: almostReadyAt,
      description: 'Plating — almost there',
      isComplete: ['almost_ready', 'ready', 'served'].includes(status),
      isCurrent: status === 'almost_ready',
    },
    {
      key: 'ready',
      label: 'Ready',
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#d1fae5',
      timestamp: readyAt,
      description: servedAt ? 'Enjoy your meal' : 'Your food is on its way to your table',
      isComplete: ['ready', 'served'].includes(status),
      isCurrent: status === 'ready',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5" role="region" aria-label="Order status timeline">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-imboni-orange" />
          <h3 className="font-bold text-imboni-dark">Your Order</h3>
        </div>
        {orderNumber && (
          <span className="text-xs text-gray-400 font-mono">#{orderNumber}</span>
        )}
      </div>

      {/* ETA */}
      {estimatedMinutes && status !== 'ready' && status !== 'served' && (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 rounded-xl text-sm text-amber-800 text-center">
          Estimated time: <span className="font-semibold">{estimatedMinutes}</span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Icon + Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    step.isComplete ? 'scale-100' : 'scale-90'
                  } ${step.isComplete || step.isCurrent ? '' : 'bg-gray-50'}`}
                  style={{
                    background: step.isComplete || step.isCurrent ? step.bgColor : undefined,
                    border: step.isCurrent ? `2px solid ${step.color}` : '2px solid transparent',
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: step.isComplete || step.isCurrent ? step.color : '#d1d5db' }}
                  />
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 h-8 transition-colors duration-500 ${step.isComplete ? '' : 'bg-gray-200'}`}
                    style={{
                      background: step.isComplete ? step.color : undefined,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold transition-colors"
                    style={{ color: step.isComplete || step.isCurrent ? step.color : '#9ca3af' }}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && step.isComplete && (
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(step.timestamp)}
                    </span>
                  )}
                </div>
                {(step.isCurrent || (step.isComplete && index === steps.length - 1)) && (
                  <p className="text-xs text-gray-500 mt-0.5 animate-fade-in">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
