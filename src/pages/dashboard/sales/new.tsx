import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import DigitalPaymentSelector from '@/components/checkout/DigitalPaymentSelector';
import { PaymentMethod } from '@/lib/pricing/fee-config';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface MenuItem {
  id: string;
  name: string;
  priceCents: number;
}

interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export default function NewSalePage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [receiptText, setReceiptText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientConsentedWhatsApp, setClientConsentedWhatsApp] = useState<boolean>(false);

  const businessId = (session?.user as any)?.businessId as string | undefined;

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenu(data as MenuItem[]);
        }
      } catch (e) {
        console.error('Failed to load menu', e);
      }
    };
    if (status === 'authenticated') loadMenu();
  }, [status]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.unitPriceCents * it.quantity, 0) / 100;
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPriceCents: item.priceCents,
        },
      ];
    });
  };

  const updateQty = (menuItemId: string, qty: number) => {
    setCart((prev) => prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: Math.max(1, qty) } : c)));
  };

  const removeItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const submitSale = async () => {
    setSubmitting(true);
    setError(null);
    setReceiptText(null);
    try {
      const payload: any = {
        businessId,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          unitPriceCents: c.unitPriceCents,
        })),
        paymentMethod,
      };

      if (clientPhone.trim()) payload.clientPhone = clientPhone.trim();
      if (clientEmail.trim()) payload.clientEmail = clientEmail.trim();
      if (clientConsentedWhatsApp) payload.clientConsentedWhatsApp = true;

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create sale');
      setReceiptText(data?.ebm?.text || 'Sale created');
      setCart([]);
      setPaymentMethod('CASH');
      setClientPhone("");
      setClientEmail("");
      setClientConsentedWhatsApp(false);
    } catch (e: any) {
      setError(e.message || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!businessId) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center max-w-2xl mx-auto mt-12">
          <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t('sales.no_business_title', 'Business Setup Required')}</h2>
          <p className="text-slate-600 mb-4">{t('sales.no_business_desc', 'To create sales, your account must be linked to a business.')}</p>
          <p className="text-sm text-slate-500 mb-6">{t('sales.no_business_hint', 'If you just signed up, this should be resolved automatically. If the issue persists, please contact support.')}</p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-imboni-blue text-white rounded-lg hover:bg-primary-700 transition"
          >
            {t('common.go_to_settings', 'Go to Settings')}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-dark">{t('dashboard.sales.new_sale', 'New Sale')}</h1>
          <p className="text-gray-600">{t('dashboard.sales.subtitle', 'Create a quick order and select payment method.')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menu.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="text-left p-3 border rounded hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-gray-600"><CurrencyDisplay amount={m.priceCents / 100} /></div>
                  </div>
                  <div className="text-primary-dark font-semibold">Add</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Payment */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Cart</h2>
            {cart.length === 0 ? (
              <div className="text-sm text-gray-600">No items yet. Click a menu item to add.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((c) => (
                  <div key={c.menuItemId} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-600"><CurrencyDisplay amount={c.unitPriceCents / 100} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={c.quantity}
                        onChange={(e) => updateQty(c.menuItemId, parseInt(e.target.value || '1', 10))}
                        className="w-16 border rounded p-1 text-center"
                      />
                      <button onClick={() => removeItem(c.menuItemId)} className="text-red-600 text-sm">Remove</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2">
                  <span>Subtotal</span>
                  <span><CurrencyDisplay amount={subtotal} /></span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Payment</h3>
              <DigitalPaymentSelector
                subtotal={subtotal}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Customer (optional)</h3>
              <div className="space-y-3">
                <input
                  type="tel"
                  placeholder="Client WhatsApp phone e.g. +2507..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full border rounded p-2"
                />
                <input
                  type="email"
                  placeholder="Client email (optional)"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full border rounded p-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={clientConsentedWhatsApp}
                    onChange={(e) => setClientConsentedWhatsApp(e.target.checked)}
                  />
                  <span>Customer consented to receive Smart Dining Slip™ via WhatsApp</span>
                </label>
                <p className="text-xs text-gray-500">Consent is required for WhatsApp delivery. If disabled in settings or cap reached, the slip won’t be sent.</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">{error}</div>
            )}

            <button
              onClick={submitSale}
              disabled={submitting || cart.length === 0}
              className="mt-4 w-full bg-primary-dark text-white py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Create Sale'}
            </button>

            {receiptText && (
              <pre className="mt-4 p-3 bg-gray-50 border rounded text-xs whitespace-pre-wrap">{receiptText}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
