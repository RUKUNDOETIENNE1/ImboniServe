/**
 * Order Status Tracker Component
 * Shows real-time order preparation status
 */

import { Clock, ChefHat, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderStatusTrackerProps {
  status: 'pending' | 'preparing' | 'almost_ready' | 'ready';
  estimatedMinutes?: number;
  orderNumber?: string;
}

export default function OrderStatusTracker({ status, estimatedMinutes, orderNumber }: OrderStatusTrackerProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Order Received',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      message: 'Your order has been received and will be prepared shortly.',
    },
    preparing: {
      icon: ChefHat,
      label: 'Preparing',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      message: 'Our kitchen is preparing your order now.',
    },
    almost_ready: {
      icon: AlertCircle,
      label: 'Almost Ready',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      message: 'Your order is almost ready!',
    },
    ready: {
      icon: CheckCircle,
      label: 'Ready',
      color: '#10b981',
      bgColor: '#d1fae5',
      message: 'Your order is ready for pickup/delivery!',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const steps = ['pending', 'preparing', 'almost_ready', 'ready'];
  const currentStepIndex = steps.indexOf(status);

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      {/* Order Number */}
      {orderNumber && (
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
          Order #{orderNumber}
        </div>
      )}

      {/* Current Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          background: config.bgColor,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Icon size={32} color={config.color} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: config.color, marginBottom: 4 }}>
            {config.label}
          </div>
          <div style={{ fontSize: 14, color: '#374151' }}>{config.message}</div>
        </div>
      </div>

      {/* Estimated Time */}
      {estimatedMinutes && status !== 'ready' && (
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
          Estimated time: {estimatedMinutes} minutes
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const stepConfig = statusConfig[step as keyof typeof statusConfig];
          
          return (
            <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: isActive ? stepConfig.color : '#e5e7eb',
                  borderRadius: 2,
                  transition: 'background 0.3s',
                }}
              />
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isActive ? stepConfig.color : '#e5e7eb',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#6b7280' }}>
        <span>Received</span>
        <span>Preparing</span>
        <span>Almost Ready</span>
        <span>Ready</span>
      </div>
    </div>
  );
}
