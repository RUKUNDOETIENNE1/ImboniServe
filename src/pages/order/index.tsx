import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Settings, Share2, AlertTriangle, Loader2, Utensils } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import PreferencesSettings from '@/components/PreferencesSettings';
import CallWaiterButton from '@/components/CallWaiterButton';
import OTPVerification from '@/components/order/OTPVerification';
import SeatSelectionModal from '@/components/SeatSelectionModal';
import HospitalityHero from '@/components/order/HospitalityHero';
import MenuCard from '@/components/order/MenuCard';
import CartPanel from '@/components/order/CartPanel';
import OrderTimeline from '@/components/order/OrderTimeline';
import PaymentOptions from '@/components/order/PaymentOptions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';
import type { BusinessProfileData } from '@/components/order/HospitalityHero';
import { getUserPreferences, isMenuItemSafe, detectUserLanguage } from '@/lib/userPreferences';
import { abServeForMenuItem, abTrackEvent } from '@/lib/ab-testing/client';
import type { MenuItemDetail } from '@/components/MenuItemDetailModal';
import type { SessionInfo } from '@/lib/sessionManager';
import { getSessionInfo, joinTableSession, getGroupOrderSummary, validateSession, setParticipantName } from '@/lib/sessionManager';

type MenuItem = MenuItemDetail & {
  translations?: Array<{
    locale: string;
    name: string;
    description: string | null;
  }>;
};

type CartItem = {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export default function OrderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { branchId, tableId, version, signature, mode, postId } = router.query as Record<string, string | undefined>;

  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [businessCity, setBusinessCity] = useState<string | null>(null);
  const [businessAddress, setBusinessAddress] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableCapacity, setTableCapacity] = useState<number | null>(null);
  const [serverName, setServerName] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [abAssignments, setAbAssignments] = useState<Record<string, { testId: string; variantId: string }>>({});
  const [visitorId, setVisitorId] = useState<string>('');

  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);

  // Smart menu intelligence state
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(getUserPreferences());
  const [userLanguage, setUserLanguage] = useState<'en' | 'rw' | 'fr'>('en');

  // Table session & analytics state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [participantInput, setParticipantInput] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<any | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [kitchenMessages, setKitchenMessages] = useState<Array<{ id: string; message: string | null; createdAt: string }>>([]);

  // Seat selection state
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [seatSessionToken, setSeatSessionToken] = useState<string | null>(null);
  const [selectedSeatLabel, setSelectedSeatLabel] = useState<string | null>(null);
  const [tempId, setTempId] = useState<string>('');

  const isRemote = useMemo(() => (mode === 'preorder' || mode === 'pickup'), [mode]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotalCents = useMemo(
    () => cartItems.reduce((sum, it) => sum + it.priceCents * it.quantity, 0),
    [cartItems]
  );

  // Consent-aware analytics tracker (client-side guard)
  async function trackIfAllowed(event: any) {
    try {
      if (typeof window === 'undefined') return
      const { hasConsent, ensureGlobalConsentCached } = await import('@/lib/consent')
      ensureGlobalConsentCached()
      if (!hasConsent('analytics')) return
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    } catch {}
  }

  function addToCart(item: MenuItem) {
    if (showConfirmation || !!lastOrderId) return;
    setCart(prev => {
      const existing = prev[item.id];
      const nextQty = (existing?.quantity || 0) + 1;
      return {
        ...prev,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          priceCents: item.priceCents,
          quantity: nextQty,
        },
      };
    });

    // Fire-and-forget analytics tracking (consent-aware)
    trackIfAllowed({
      type: 'add_to_cart',
      entityType: 'MenuItem',
      entityId: item.id,
      metadata: { quantity: 1 },
      sessionId: session?.sessionId,
    })
    // AB Testing: Track click
    try {
      const ab = abAssignments[item.id];
      if (ab && visitorId) {
        abTrackEvent({ testId: ab.testId, variantId: ab.variantId, type: 'CLICK', metadata: { action: 'add_to_cart' }, visitorId });
      }
    } catch {}
  }

  function decFromCart(itemId: string) {
    if (showConfirmation || !!lastOrderId) return;
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      const copy = { ...prev } as Record<string, CartItem>;
      if (nextQty <= 0) delete copy[itemId];
      else copy[itemId] = { ...existing, quantity: nextQty };
      return copy;
    });
  }

  function incInCart(itemId: string) {
    if (showConfirmation || !!lastOrderId) return;
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  }

  async function obtainTokenAndMenu() {
    if (!branchId || !signature) {
      setError('Invalid or incomplete QR link.');
      setLoading(false);
      return;
    }

    try {
      setTokenLoading(true);
      const resp = await fetch('/api/public/order/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          tableId: tableId || null,
          version: version || '1',
          signature,
          mode: mode || (tableId ? 'invenue' : 'preorder'),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to obtain access token');
      }

      const data = await resp.json();
      setAccessToken(data.accessToken);
      setBranchName(data.branchName || null);
      setTableNumber(data.tableNumber || null);
      setTableCapacity(data.tableCapacity || null);
      setServerName(data.serverName || null);
    } catch (e: any) {
      setError(e.message || 'Failed to obtain access token');
      setLoading(false);
      setTokenLoading(false);
      return;
    }

    try {
      setMenuLoading(true);
      const m = await fetch(`/api/public/menu?branchId=${encodeURIComponent(branchId)}`);
      if (!m.ok) {
        const data = await m.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load menu');
      }
      const menuData = await m.json();
      const rawMenu: MenuItem[] = menuData.menu || [];
      setBusinessProfile(menuData.businessProfile || null);
      setBusinessCity(menuData.city || null);
      setBusinessAddress(menuData.address || null);
      // Establish stable visitor id for A/B assignment
      try {
        const stored = localStorage.getItem('ab_visitor_id');
        let vid = stored || '';
        if (!vid) {
          vid = `v-${Math.random().toString(36).slice(2)}-${Date.now()}`;
          localStorage.setItem('ab_visitor_id', vid);
        }
        setVisitorId(vid);
        if (branchId) {
          // Apply A/B variants to visible menu items
          const updated: MenuItem[] = [...rawMenu];
          const mapping: Record<string, { testId: string; variantId: string }> = {};
          await Promise.all(updated.map(async (item, idx) => {
            try {
              const served = await abServeForMenuItem({ businessId: String(branchId), menuItemId: item.id, visitorId: vid });
              if (served && served.testId && served.variantId) {
                mapping[item.id] = { testId: served.testId, variantId: served.variantId };
                const ch: any = served.changes || {};
                const copy = { ...updated[idx] } as MenuItem;
                if (typeof ch.priceCents === 'number') copy.priceCents = ch.priceCents;
                if (typeof ch.description === 'string') copy.description = ch.description;
                updated[idx] = copy;
              }
            } catch {}
          }));
          setAbAssignments(mapping);
          setMenu(updated);
        } else {
          setMenu(rawMenu);
        }
      } catch {
        setMenu(rawMenu);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load menu');
      setLoading(false);
      setMenuLoading(false);
      return;
    }

    setLoading(false);
    setTokenLoading(false);
    setMenuLoading(false);
  }

  useEffect(() => {
    if (!router.isReady) return;
    obtainTokenAndMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, branchId, tableId, version, signature, mode]);

  // Auto-join table session (in-venue) and keep participant name
  useEffect(() => {
    if (!router.isReady) return;
    if (!tableId || !branchId) return;

    // Generate or retrieve tempId
    const storedTempId = localStorage.getItem('user_temp_id');
    const currentTempId = storedTempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!storedTempId) {
      localStorage.setItem('user_temp_id', currentTempId);
    }
    setTempId(currentTempId);

    // Check for existing seat session
    const storedSeatToken = localStorage.getItem('seat_session_token');
    const storedSeatExpires = localStorage.getItem('seat_session_expires');
    
    if (storedSeatToken && storedSeatExpires && new Date(storedSeatExpires) > new Date()) {
      // Validate existing seat session
      fetch('/api/seats/session/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: storedSeatToken })
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setSeatSessionToken(storedSeatToken);
            setSelectedSeatLabel(data.seatSession.seatLabel);
            localStorage.setItem('seat_session_expires', data.seatSession.lockExpiresAt);
          } else {
            localStorage.removeItem('seat_session_token');
            localStorage.removeItem('seat_session_expires');
          }
        }
      }).catch(() => {
        localStorage.removeItem('seat_session_token');
        localStorage.removeItem('seat_session_expires');
      });
    }

    const existing = getSessionInfo();
    if (existing && existing.tableId === tableId) {
      setSession(existing);
      setParticipantInput(existing.participantName || '');
      validateSession(existing.sessionId).then(active => {
        if (!active) setSession(null);
      });
      
      // Show seat selection if no seat session exists
      if (!storedSeatToken || !storedSeatExpires || new Date(storedSeatExpires) <= new Date()) {
        setShowSeatSelection(true);
      }
      return;
    }

    joinTableSession(tableId, branchId, participantInput || undefined).then(info => {
      if (info) {
        setSession(info);
        if (info.participantName) setParticipantInput(info.participantName);
        
        // Show seat selection after joining session
        if (!storedSeatToken || !storedSeatExpires || new Date(storedSeatExpires) <= new Date()) {
          setShowSeatSelection(true);
        }
      }
    });
  }, [router.isReady, tableId, branchId]);

  // Poll group order summary when in a session
  useEffect(() => {
    if (!session?.sessionId) return;
    let active = true;
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const data = await getGroupOrderSummary(session.sessionId);
        if (active) setSummary(data);
      } finally {
        if (active) setSummaryLoading(false);
      }
    };
    fetchSummary();
    const id = setInterval(fetchSummary, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [session?.sessionId]);

  useEffect(() => {
    // Load user preferences and language
    setPreferences(getUserPreferences());
    setUserLanguage(detectUserLanguage());
  }, []);

  // Poll order status after confirmation
  useEffect(() => {
    if (!lastOrderId) return;
    let active = true;
    let intervalId: any;

    const fetchStatus = async () => {
      try {
        const r = await fetch(`/api/public/order/status?orderId=${lastOrderId}`);
        if (!r.ok) return;
        const data = await r.json();
        if (!active) return;
        setOrderStatus(data);
        if (data?.readyForPickup) {
          clearInterval(intervalId);
        }
      } catch {}
    };

    const fetchMessages = async () => {
      try {
        const r = await fetch(`/api/public/order/messages?orderId=${lastOrderId}`);
        if (!r.ok) return;
        const data = await r.json();
        if (!active) return;
        setKitchenMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch {}
    };

    fetchStatus();
    fetchMessages();
    intervalId = setInterval(fetchStatus, 10000);
    const msgInterval = setInterval(fetchMessages, 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
      clearInterval(msgInterval);
    };
  }, [lastOrderId]);

  // Seat selection handlers
  const handleSeatSelected = (seatId: string, sessionToken: string, seatLabel: string) => {
    setSeatSessionToken(sessionToken);
    setSelectedSeatLabel(seatLabel);
    setShowSeatSelection(false);
    
    // Persist to localStorage
    localStorage.setItem('seat_session_token', sessionToken);
    localStorage.setItem('seat_session_expires', new Date(Date.now() + 10 * 60 * 1000).toISOString());
  };

  const handleSkipSeat = () => {
    setShowSeatSelection(false);
  };

  async function createDraftOrder() {
    if (!accessToken) {
      setError('Missing access token');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        accessToken,
        items: cartItems.map(ci => ({ menuItemId: ci.menuItemId, quantity: ci.quantity })),
        mode: isRemote ? 'preorder' : 'invenue',
        phone: isRemote ? phone : undefined,
        customerName: isRemote ? customerName : undefined,
        branchId,
      };
      if (isRemote && scheduledAt) payload.scheduledAt = scheduledAt;
      if (postId) payload.postId = postId;
      if (session?.sessionId) payload.tableSessionId = session.sessionId;
      if (session?.participantId) payload.participantId = session.participantId;
      if (seatSessionToken) payload.sessionToken = seatSessionToken;

      const resp = await fetch('/api/public/order/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to create order');

      setDraftOrderId(data.orderId);
      setShowConfirmation(true);
    } catch (e: any) {
      setError(e.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder() {
    if (!draftOrderId) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/public/order/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: draftOrderId, confirmed: true })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to confirm order');

      // AB Testing: Track ORDER/REVENUE per item
      try {
        for (const ci of cartItems) {
          const ab = abAssignments[ci.menuItemId];
          if (ab && visitorId) {
            await abTrackEvent({
              testId: ab.testId,
              variantId: ab.variantId,
              type: 'ORDER',
              valueCents: ci.priceCents * ci.quantity,
              metadata: { quantity: ci.quantity },
              visitorId,
            });
            // Also record revenue for per-variant revenue aggregation
            await abTrackEvent({
              testId: ab.testId,
              variantId: ab.variantId,
              type: 'REVENUE',
              valueCents: ci.priceCents * ci.quantity,
              metadata: { quantity: ci.quantity },
              visitorId,
            });
          }
        }
      } catch {}

      // Start tracking this order's status
      setLastOrderId(draftOrderId);

      const paymentResp = await fetch(`/api/public/order/status?orderId=${draftOrderId}`);
      const paymentData = await paymentResp.json();

      if (paymentData.paymentLinkUrl) {
        window.location.href = paymentData.paymentLinkUrl;
        return;
      }

      showToast('success', 'Order confirmed and sent to kitchen!');
      setShowConfirmation(false);
      setCart({});
    } catch (e: any) {
      setError(e.message || 'Failed to confirm order');
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder() {
    if (!draftOrderId) return;

    setLoading(true);
    try {
      await fetch('/api/public/order/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: draftOrderId, confirmed: false })
      });

      setShowConfirmation(false);
      setDraftOrderId(null);
    } catch (e: any) {
      setError(e.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-6">
            {businessProfile?.logoUrl && (
              <img
                src={businessProfile.logoUrl}
                alt={branchName || ''}
                className="w-12 h-12 rounded-full object-cover mx-auto mb-3 shadow-md"
              />
            )}
            <h1 className="text-2xl font-bold text-imboni-dark">Review Your Selections</h1>
            <p className="text-sm text-gray-400 mt-1">{branchName}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6">
            <h3 className="font-bold text-imboni-dark text-sm mb-4">Your Selections</h3>
            <div className="space-y-3">
              {cartItems.map(ci => (
                <div key={ci.menuItemId} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-imboni-dark">{ci.quantity}×</span>
                    <span className="text-gray-600 ml-1.5">{ci.name}</span>
                  </div>
                  <span className="font-semibold text-imboni-dark">
                    <CurrencyDisplay amount={ci.priceCents * ci.quantity} inCents />
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold text-imboni-dark">
                <CurrencyDisplay amount={cartTotalCents} inCents />
              </span>
            </div>
          </div>

          {/* Payment Options */}
          <PaymentOptions
            totalCents={cartTotalCents}
            onMoMo={() => {
              confirmOrder();
            }}
            onCash={() => {
              confirmOrder();
            }}
            onOnline={() => {
              confirmOrder();
            }}
            loading={loading}
            businessName={branchName || undefined}
          />

          {/* Cancel */}
          <button
            onClick={cancelOrder}
            disabled={loading}
            className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Back to Menu
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filter menu based on preferences
  const filteredMenu = useMemo(() => {
    if (!preferences.hideUnsafeItems) return menu;
    return menu.filter(item => {
      const safety = isMenuItemSafe(item, preferences);
      return safety.safe;
    });
  }, [menu, preferences]);

  // Group menu by category
  const menuByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    filteredMenu.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });
    return grouped;
  }, [filteredMenu]);

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Modals */}
      {showPreferences && (
        <PreferencesSettings
          onClose={() => setShowPreferences(false)}
          onSave={() => setPreferences(getUserPreferences())}
        />
      )}
      {showSeatSelection && tableId && tempId && (
        <SeatSelectionModal
          tableId={tableId}
          tempId={tempId}
          tableSessionId={session?.sessionId}
          onSeatSelected={handleSeatSelected}
          onSkip={handleSkipSeat}
          onClose={() => setShowSeatSelection(false)}
        />
      )}

      {/* Loading State — Hospitality Skeleton */}
      {loading && (
        <div className="min-h-screen">
          <div className="w-full h-[42dvh] min-h-[280px] max-h-[420px] bg-gradient-to-br from-imboni-blue via-imboni-dark to-accent animate-pulse" />
          <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="w-full h-32 bg-gray-100 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className="text-center pb-8">
            <Loader2 className="w-6 h-6 animate-spin text-imboni-blue mx-auto" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-imboni-dark mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-imboni-dark text-white rounded-xl text-sm font-medium hover:bg-imboni-blue transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-blue/30"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Experience */}
      {!loading && !error && (
        <>
          {/* Hospitality Hero */}
          <HospitalityHero
            restaurantName={branchName || ''}
            profile={businessProfile}
            city={businessCity}
            address={businessAddress}
            tableNumber={tableNumber}
            tableCapacity={tableCapacity}
            serverName={serverName || undefined}
            isRemote={isRemote}
          />

          {/* Body */}
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-gray-400 px-3 py-1 bg-gray-100 rounded-full" aria-label="Order mode">
                {isRemote ? 'Pre-Order' : 'In-Venue'}
                {tokenLoading || menuLoading ? ' · Syncing...' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `Menu${branchName ? ` @ ${branchName}` : ''}`,
                          text: `Check out this menu! Order now and we both earn 500 RWF:`,
                          url: window.location.href,
                        });
                      } catch {}
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('info', 'Link copied! Share it to earn 500 RWF when friends order.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-imboni-dark bg-white border border-gray-200 rounded-full hover:border-imboni-blue/30 transition-all focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                  aria-label="Share menu and earn rewards"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share & Earn
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                  aria-label="Set dietary preferences"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Preferences
                </button>
              </div>
            </div>

            {/* Active Preferences */}
            {(preferences.allergies.length > 0 || preferences.dietaryPreferences.length > 0) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4" role="status">
                <p className="text-xs font-medium text-blue-700 mb-1.5">Active Preferences</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.allergies.map(a => (
                    <span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs">{a}</span>
                  ))}
                  {preferences.dietaryPreferences.map(p => (
                    <span key={p} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Kitchen Messages */}
            {lastOrderId && kitchenMessages.length > 0 && kitchenMessages[0]?.message && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 text-sm text-indigo-800" role="alert" aria-live="polite">
                <strong>Kitchen update:</strong> {kitchenMessages[0].message}
              </div>
            )}

            {/* Table Session */}
            {tableId && session && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-cyan-800">
                    Joined table session <strong>{session.tableName || session.tableId}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      className="px-2 py-1 text-xs border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                      aria-label="Your name"
                    />
                    <button
                      onClick={() => {
                        setParticipantName(participantInput);
                        if (session) setSession({ ...session, participantName: participantInput });
                      }}
                      className="px-2.5 py-1 text-xs bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                      aria-label="Save your name"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline (when order submitted) */}
            {lastOrderId && orderStatus && (
              <div className="mb-6" role="region" aria-label="Order status timeline">
                <OrderTimeline
                  kitchenStatus={orderStatus.kitchenStatus}
                  receivedAt={orderStatus.receivedAt}
                  acceptedAt={orderStatus.acceptedAt}
                  preparingAt={orderStatus.preparingAt}
                  almostReadyAt={orderStatus.almostReadyAt}
                  readyAt={orderStatus.readyAt}
                  servedAt={orderStatus.servedAt}
                  estimatedMinutes={orderStatus.eta}
                  orderNumber={orderStatus.orderNumber}
                />
                {!showAddMore && (
                  <button
                    onClick={() => {
                      setShowAddMore(true);
                      setLastOrderId(null);
                    }}
                    className="w-full mt-3 py-2.5 bg-imboni-orange text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-orange/30"
                    aria-label="Add more items to your order"
                  >
                    Add More Items
                  </button>
                )}
              </div>
            )}

            {/* Menu + Cart Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              {/* Menu */}
              <div>
                {/* Empty Menu State */}
                {menu.length === 0 && !menuLoading && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                      <Utensils className="w-7 h-7 text-gray-300" />
                    </div>
                    <h3 className="text-base font-semibold text-imboni-dark mb-1">Menu Coming Soon</h3>
                    <p className="text-sm text-gray-400">The restaurant is preparing their menu. Please check back shortly or ask your server for today's selections.</p>
                  </div>
                )}

                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h2 className="text-lg font-bold text-imboni-dark mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-imboni-orange rounded-full" />
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map(item => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          userLanguage={userLanguage}
                          onAddToCart={addToCart}
                          inCart={cart[item.id]?.quantity || 0}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Sidebar */}
              <div className="lg:sticky lg:top-4 lg:self-start">
                <CartPanel
                  cartItems={cartItems}
                  cartTotalCents={cartTotalCents}
                  menu={menu}
                  onAddToCart={addToCart}
                  onInc={incInCart}
                  onDec={decFromCart}
                  onSubmit={createDraftOrder}
                  loading={loading}
                  submitted={!!lastOrderId}
                  disabled={isRemote && !phoneVerified}
                  disabledReason={isRemote && !phoneVerified ? 'Verify phone to continue' : undefined}
                  showUpsell={!showConfirmation && !lastOrderId}
                  footerNote="Digital orders include a platform fee shown at checkout. Pricing is finalized server-side."
                />

                {/* Remote Pre-Order Fields */}
                {isRemote && (
                  <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    {!phoneVerified ? (
                      <OTPVerification
                        branchId={branchId || ''}
                        phone={phone}
                        onVerified={() => setPhoneVerified(true)}
                        onPhoneChange={setPhone}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                          ✓ Phone verified: {phone}
                        </div>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                          aria-label="Your name"
                        />
                        <label className="text-xs text-gray-500" htmlFor="scheduledAt">Schedule pickup time (optional)</label>
                        <input
                          id="scheduledAt"
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Group Order Summary */}
                {session && (
                  <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-imboni-dark">Group Order</span>
                      <button
                        onClick={async () => {
                          if (!session) return;
                          setSummaryLoading(true);
                          const data = await getGroupOrderSummary(session.sessionId);
                          setSummary(data);
                          setSummaryLoading(false);
                        }}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-600 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-blue/20"
                        aria-label="Refresh group order summary"
                      >
                        {summaryLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    {!summary && <p className="text-xs text-gray-400">No group orders yet.</p>}
                    {summary && (
                      <div className="space-y-2">
                        {(summary.ordersByParticipant || []).map((p: any) => (
                          <div key={p.participantId} className="flex justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">{p.participantName || 'Guest'}</span>
                            <span className="font-semibold text-imboni-dark">RWF {Math.round((p.totalSpent || 0)).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-gray-100 text-xs">
                          <span className="text-gray-500">Total</span>
                          <span className="font-bold text-imboni-dark">RWF {Math.round((summary.totalAmountCents || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call Waiter — Always visible for in-venue orders */}
          {tableId && <CallWaiterButton tableId={tableId} sessionId={session?.sessionId} />}
        </>
      )}
    </div>
    </ErrorBoundary>
  );
}
