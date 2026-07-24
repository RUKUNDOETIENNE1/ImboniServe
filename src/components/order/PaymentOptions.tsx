import { useState } from 'react';
import { Smartphone, Banknote, CreditCard, Phone, ArrowRight } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';

interface PaymentOptionsProps {
  totalCents: number;
  feePercent?: number;
  onMoMo: (phone: string) => void;
  onCash: () => void;
  onOnline: () => void;
  loading?: boolean;
  businessName?: string;
}

export default function PaymentOptions({
  totalCents,
  feePercent = 5,
  onMoMo,
  onCash,
  onOnline,
  loading = false,
  businessName,
}: PaymentOptionsProps) {
  const [method, setMethod] = useState<'momo' | 'cash' | 'online' | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const feeAmount = Math.round(totalCents * (feePercent / 100));
  const totalWithFee = totalCents + feeAmount;

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (!cleaned) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!cleaned.match(/^(078|079|072|073)\d{7}$/)) {
      setPhoneError('Please enter a valid Rwandan phone number (078/079/072/073)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (value) validatePhone(value);
  };

  const handlePay = () => {
    if (method === 'momo') {
      if (!validatePhone(phone)) return;
      onMoMo(phone);
    } else if (method === 'cash') {
      onCash();
    } else if (method === 'online') {
      onOnline();
    }
  };

  const methods = [
    {
      key: 'momo' as const,
      label: 'Mobile Money',
      sublabel: 'MTN or Airtel',
      icon: Smartphone,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      key: 'cash' as const,
      label: 'Cash',
      sublabel: 'Pay your server directly',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      key: 'online' as const,
      label: 'Online',
      sublabel: 'IremboPay',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5" role="region" aria-label="Payment options">
      {/* Header */}
      <h3 className="text-lg font-bold text-imboni-dark mb-1">Settle Up</h3>
      <p className="text-sm text-gray-400 mb-5">Choose how you'd like to pay</p>

      {/* Bill Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-imboni-dark"><CurrencyDisplay amount={totalCents} inCents /></span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Service fee ({feePercent}%)</span>
          <span className="font-medium text-imboni-dark"><CurrencyDisplay amount={feeAmount} inCents /></span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="font-semibold text-imboni-dark">Total</span>
          <span className="text-lg font-bold text-imboni-dark"><CurrencyDisplay amount={totalWithFee} inCents /></span>
        </div>
      </div>

      {/* Method Selection */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {methods.map(m => {
          const Icon = m.icon;
          const isSelected = method === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 ${
                isSelected
                  ? `${m.bgColor} ${m.borderColor} scale-[1.02]`
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
              aria-pressed={isSelected}
              aria-label={`Pay with ${m.label}`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? m.color : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${isSelected ? m.color : 'text-gray-500'}`}>{m.label}</span>
              <span className="text-[10px] text-gray-400">{m.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* MoMo Phone Input */}
      {method === 'momo' && (
        <div className="mb-5 animate-fade-in">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              Mobile Money Number
            </div>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="078 XXX XXXX"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 transition-colors text-sm ${
              phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            aria-label="Mobile Money phone number"
            aria-invalid={!!phoneError}
          />
          {phoneError && <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>}
          <p className="mt-1.5 text-xs text-gray-400">
            You'll receive a USSD prompt on your phone to approve the payment
          </p>
        </div>
      )}

      {/* Cash Info */}
      {method === 'cash' && (
        <div className="mb-5 p-4 bg-green-50 rounded-xl text-sm text-green-800 animate-fade-in">
          Please pay your server directly. They'll confirm your payment at the table.
        </div>
      )}

      {/* Online Info */}
      {method === 'online' && (
        <div className="mb-5 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 animate-fade-in">
          You'll be redirected to IremboPay to complete your payment securely.
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={!method || loading || (method === 'momo' && (!phone || !!phoneError))}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none ${
          !method || loading || (method === 'momo' && (!phone || !!phoneError))
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-imboni-dark hover:bg-imboni-blue text-white active:scale-[0.98] shadow-md focus:ring-2 focus:ring-imboni-blue/30'
        }`}
        aria-label={`Pay ${totalWithFee} cents`}
      >
        {loading ? (
          'Processing...'
        ) : (
          <>
            Pay <CurrencyDisplay amount={totalWithFee} inCents />
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
