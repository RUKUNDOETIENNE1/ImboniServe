import React, { useMemo, useState } from 'react';
import { PaymentMethod } from '@/lib/pricing/fee-config';
import { FeeDisplay } from '@/components/checkout/FeeDisplay';

interface DigitalPaymentSelectorProps {
  subtotal: number;
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  language?: 'en' | 'rw';
}

export const DigitalPaymentSelector: React.FC<DigitalPaymentSelectorProps> = ({
  subtotal,
  value,
  onChange,
  language = 'en',
}) => {
  const [notice, setNotice] = useState<string | null>(null);

  const enableMTN = (process.env.NEXT_PUBLIC_MTN_ENABLE || 'false') === 'true';
  const enableAIRTEL = (process.env.NEXT_PUBLIC_AIRTEL_ENABLE || 'false') === 'true';

  const options: Array<{ id: PaymentMethod; label: string; description: string }> = [
    { id: 'CASH', label: language === 'en' ? 'Cash' : 'Amafaranga (Cash)', description: language === 'en' ? 'No fee' : 'Nta kiguzi' },
    { id: 'WEB', label: language === 'en' ? 'Web Payment (IremboPay)' : 'Kwishyura kuri Web (IremboPay)', description: language === 'en' ? 'Card, mobile money, or bank transfer' : 'Ikarita, mobile money, cyangwa banki' },
    { id: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money', description: language === 'en' ? 'Pay with MTN MoMo' : 'Ishura ukoresheje MTN MoMo' },
    { id: 'AIRTEL_MONEY', label: 'Airtel Money', description: language === 'en' ? 'Pay with Airtel Money' : 'Ishura ukoresheje Airtel Money' },
  ];

  const handleSelect = (method: PaymentMethod) => {
    setNotice(null);

    if (method === 'MTN_MOBILE_MONEY' && !enableMTN) {
      setNotice(
        language === 'en'
          ? 'MTN Mobile Money temporarily processes via IremboPay. You can also pay cash to avoid the digital fee.'
          : 'MTN Mobile Money ubu gukora binyuze kuri IremboPay. Ushobora no kwishyura mu mafaranga kugira ngo wirinde ikiguzi cyiyongera.'
      );
      onChange('WEB');
      return;
    }

    if (method === 'AIRTEL_MONEY' && !enableAIRTEL) {
      setNotice(
        language === 'en'
          ? 'Airtel Money temporarily processes via IremboPay. You can also pay cash to avoid the digital fee.'
          : 'Airtel Money ubu gukora binyuze kuri IremboPay. Ushobora no kwishyura mu mafaranga kugira ngo wirinde ikiguzi cyiyongera.'
      );
      onChange('WEB');
      return;
    }

    onChange(method);
  };

  const selected = value;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={`text-left p-4 border rounded-lg hover:bg-gray-50 transition ${
              selected === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-sm text-gray-600">{opt.description}</div>
          </button>
        ))}
      </div>

      {notice && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">{notice}</div>
      )}

      {selected !== 'CASH' && (
        <FeeDisplay subtotal={subtotal} paymentMethod={selected} language={language} />
      )}
    </div>
  );
};

export default DigitalPaymentSelector;
