import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Settings, AlertTriangle, Info, Clock, TrendingUp, Share2 } from 'lucide-react';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import MenuItemDetailModal from '@/components/MenuItemDetailModal';
import PreferencesSettings from '@/components/PreferencesSettings';
import CallWaiterButton from '@/components/CallWaiterButton';
import OTPVerification from '@/components/order/OTPVerification';
import UpsellRecommendations from '@/components/order/UpsellRecommendations';
import SeatSelectionModal from '@/components/SeatSelectionModal';
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
  const { branchId, tableId, version, signature, mode, postId } = router.query as Record<string, string | undefined>;

  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(getUserPreferences());
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [popularItems, setPopularItems] = useState<string[]>([]);
  const [userLanguage, setUserLanguage] = useState<'en' | 'rw' | 'fr'>('en');

  // Table session & analytics state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [participantInput, setParticipantInput] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<any | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
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

  useEffect(() => {
    // Fetch recommendations when item is selected
    if (selectedItem && branchId) {
      fetchRecommendations(selectedItem.id);
    }
  }, [selectedItem, branchId]);

  // Track menu item views when modal is opened
  useEffect(() => {
    if (!selectedItem) return;
    trackIfAllowed({
      type: 'view_item',
      entityType: 'MenuItem',
      entityId: selectedItem.id,
      sessionId: session?.sessionId,
    })
  }, [selectedItem, session?.sessionId]);

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

  async function fetchRecommendations(excludeItemId: string) {
    try {
      const response = await fetch('/api/menu/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          excludeItemId,
          userPreferences: {
            allergies: preferences.allergies,
            dietaryPreferences: preferences.dietaryPreferences,
          },
          limit: 3,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        try {
          const ids = (data.recommendations || []).map((r: any) => r.id);
          if (ids.length > 0) {
            trackIfAllowed({
              type: 'recommendation_shown',
              metadata: { menuItemIds: ids, context: 'modal_recommendations' },
              sessionId: session?.sessionId,
            })
          }
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  }

  function getLocalizedName(item: MenuItem): string {
    if (!item.translations || item.translations.length === 0) return item.name;
    const translation = item.translations.find(t => t.locale === userLanguage);
    return translation?.name || item.name;
  }

  function getLocalizedDescription(item: MenuItem): string | null | undefined {
    if (!item.translations || item.translations.length === 0) return item.description;
    const translation = item.translations.find(t => t.locale === userLanguage);
    return translation?.description || item.description;
  }

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

      alert('Order confirmed and sent to kitchen!');
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

  function formatRwf(cents: number) {
    // Deprecated: kept for compatibility; use <CurrencyDisplay inCents /> instead
    return `${Math.round(cents).toLocaleString()}`;
  }

  if (showConfirmation) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <h1 style={{ marginBottom: 16 }}>Confirm Your Order</h1>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Order Summary</h2>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {cartItems.map(ci => (
              <div key={ci.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{ci.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{ci.quantity} × <CurrencyDisplay amount={ci.priceCents} inCents /></div>
                </div>
                <div style={{ fontWeight: 700 }}><CurrencyDisplay amount={ci.priceCents * ci.quantity} inCents /></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #e5e7eb', fontSize: 18, fontWeight: 700 }}>
            <div>Total</div>
            <div><CurrencyDisplay amount={cartTotalCents} inCents /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <button
              onClick={cancelOrder}
              disabled={loading}
              style={{ padding: 12, background: '#f3f4f6', color: '#374151', borderRadius: 8, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmOrder}
              disabled={loading}
              style={{ padding: 12, background: '#111827', color: 'white', borderRadius: 8, fontWeight: 600 }}
            >
              {loading ? 'Confirming...' : 'Confirm & Pay'}
            </button>
          </div>
          {error && (
            <div style={{ color: '#b91c1c', marginTop: 12, fontSize: 14 }}>{error}</div>
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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      {/* Modals */}
      {selectedItem && (
        <MenuItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={(item) => addToCart(item)}
          recommendations={recommendations}
        />
      )}
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
      {lastOrderId && kitchenMessages.length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', padding: 10, borderRadius: 8, fontSize: 14 }}>
            <strong>Kitchen update:</strong> {kitchenMessages[0].message}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Order{branchName ? ` @ ${branchName}` : ''}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
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
                alert('Link copied! Share it to earn 500 RWF when friends order.');
              }
            }}
            style={{
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <Share2 size={18} />
            Share & Earn 500 RWF
          </button>
          <button
            onClick={() => setShowPreferences(true)}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Settings size={18} />
            Preferences
          </button>
        </div>
      </div>

      {/* Table Session Banner */}
      {tableId && session && (
        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 14, color: '#0c4a6e' }}>
              Joined table session <strong>{session.tableName || session.tableId}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                style={{ padding: 6, border: '1px solid #bae6fd', borderRadius: 6 }}
              />
              <button
                onClick={() => {
                  setParticipantName(participantInput);
                  if (session) setSession({ ...session, participantName: participantInput });
                }}
                style={{ padding: '6px 10px', background: '#0369a1', color: 'white', borderRadius: 6 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {!loading && error && (
        <div style={{ color: 'white', background: '#b91c1c', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Active Preferences Banner */}
      {!loading && !error && (preferences.allergies.length > 0 || preferences.dietaryPreferences.length > 0) && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Active Preferences:</div>
          <div style={{ fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {preferences.allergies.map(a => (
              <span key={a} style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 999 }}>
                {a}
              </span>
            ))}
            {preferences.dietaryPreferences.map(p => (
              <span key={p} style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 999 }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 999 }}>
                {isRemote ? 'Remote Pre-Order' : 'In-Venue QR'}
              </span>
              {tokenLoading || menuLoading ? <small>Syncing...</small> : null}
            </div>

            {/* Menu Items by Category */}
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#111827' }}>{category}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {items.map(item => {
                    const safety = isMenuItemSafe(item, preferences);
                    const localizedName = getLocalizedName(item);
                    const localizedDesc = getLocalizedDescription(item);
                    
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: safety.safe ? '1px solid #e5e7eb' : '2px solid #fca5a5',
                          borderRadius: 8,
                          padding: 12,
                          background: safety.safe ? 'white' : '#fef2f2',
                          position: 'relative',
                        }}
                      >
                        {/* Image */}
                        {item.imageReal && (
                          <img
                            src={item.imageReal}
                            alt={localizedName}
                            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                          />
                        )}

                        {/* Safety Warning */}
                        {!safety.safe && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#b91c1c', fontSize: 12, marginBottom: 6 }}>
                            <AlertTriangle size={14} />
                            <span>Not suitable for you</span>
                          </div>
                        )}

                        {/* Name */}
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{localizedName}</div>

                        {/* Dietary Tags */}
                        {item.dietaryTags && item.dietaryTags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                            {item.dietaryTags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: 11,
                                  padding: '2px 6px',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  borderRadius: 999,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        {localizedDesc && (
                          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>
                            {localizedDesc.length > 60 ? `${localizedDesc.substring(0, 60)}...` : localizedDesc}
                          </div>
                        )}

                        {/* Prep Time & Spice Level */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#6b7280' }}>
                          {item.prepTimeMinutes && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} />
                              {item.prepTimeMinutes}min
                            </div>
                          )}
                          {item.spiceLevel && item.spiceLevel !== 'none' && (
                            <div>
                              {item.spiceLevel === 'mild' && '🌶️'}
                              {item.spiceLevel === 'medium' && '🌶️🌶️'}
                              {item.spiceLevel === 'hot' && '🌶️🌶️🌶️'}
                            </div>
                          )}
                        </div>

                        {/* Price & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <div style={{ fontWeight: 600 }}><CurrencyDisplay amount={item.priceCents} inCents /></div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                setSelectedItem(item)
                                try {
                                  const ab = abAssignments[item.id]
                                  if (ab && visitorId) {
                                    abTrackEvent({ testId: ab.testId, variantId: ab.variantId, type: 'CLICK', metadata: { action: 'learn_more' }, visitorId })
                                  }
                                } catch {}
                              }}
                              style={{
                                padding: '6px 10px',
                                background: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Info size={14} />
                              Learn More
                            </button>
                            <button
                              onClick={() => addToCart(item)}
                              style={{
                                padding: '6px 12px',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Order</div>

              {cartItems.length === 0 ? (
                <div style={{ color: '#6b7280' }}>No items yet. Add from the menu.</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {cartItems.map(ci => (
                      <div key={ci.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{ci.name}</div>
                          <div style={{ color: '#6b7280', fontSize: 13 }}>{ci.quantity} × <CurrencyDisplay amount={ci.priceCents} inCents /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => decFromCart(ci.menuItemId)}>-</button>
                          <div>{ci.quantity}</div>
                          <button onClick={() => incInCart(ci.menuItemId)}>+</button>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                      <div>Total</div>
                      <div style={{ fontWeight: 700 }}><CurrencyDisplay amount={cartTotalCents} inCents /></div>
                    </div>
                  </div>

                  {/* Upsell Recommendations */}
                  {!showConfirmation && !lastOrderId && (
                    <UpsellRecommendations
                      cartItems={cartItems}
                      menu={menu}
                      onAddToCart={addToCart}
                    />
                  )}
                </>
              )}

              {isRemote && (
                <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                  {!phoneVerified ? (
                    <OTPVerification
                      branchId={branchId || ''}
                      phone={phone}
                      onVerified={() => setPhoneVerified(true)}
                      onPhoneChange={setPhone}
                    />
                  ) : (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 8, fontSize: 13, color: '#166534' }}>
                        ✓ Phone verified: {phone}
                      </div>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                      />
                      <label style={{ fontSize: 14, color: '#374151' }}>Schedule pickup time (optional)</label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                      />
                    </>
                  )}
                </div>
              )}

              <button
                disabled={cartItems.length === 0 || loading || !!lastOrderId || (isRemote && !phoneVerified)}
                onClick={createDraftOrder}
                style={{ marginTop: 12, width: '100%', padding: 10, background: (isRemote && !phoneVerified) ? '#9ca3af' : '#111827', color: 'white', borderRadius: 6, cursor: (isRemote && !phoneVerified) ? 'not-allowed' : 'pointer' }}
              >
                {lastOrderId ? 'Order Submitted' : loading ? 'Processing...' : (isRemote && !phoneVerified) ? 'Verify phone to continue' : 'Review Order'}
              </button>

              <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
                Digital orders include a platform fee shown at checkout. Pricing is finalized server-side.
              </div>

              {/* Group Order Summary */}
              {session && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Group Order Summary</div>
                    <button
                      onClick={async () => {
                        if (!session) return;
                        setSummaryLoading(true);
                        const data = await getGroupOrderSummary(session.sessionId);
                        setSummary(data);
                        setSummaryLoading(false);
                      }}
                      style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 12 }}
                    >
                      {summaryLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  {!summary && <div style={{ color: '#6b7280', fontSize: 13 }}>No group orders yet.</div>}
                  {summary && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {(summary.ordersByParticipant || []).map((p: any) => (
                        <div key={p.participantId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                          <div>{p.participantName || 'Guest'}</div>
                          <div style={{ fontWeight: 700 }}>RWF {Math.round((p.totalSpent || 0)).toLocaleString()}</div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                        <div>Total</div>
                        <div style={{ fontWeight: 700 }}>RWF {Math.round((summary.totalAmountCents || 0)).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Track My Order */}
              {lastOrderId && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e5e7eb' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Track My Order</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    <div>Order #{orderStatus?.orderNumber || lastOrderId}</div>
                    <div style={{ marginTop: 4 }}>ETA: {orderStatus?.eta || '—'}</div>
                    <div style={{ marginTop: 4 }}>Payment: {orderStatus?.paymentStatus || '—'}</div>
                    <div style={{ marginTop: 4 }}>Prep started: {orderStatus?.prepStarted ? 'Yes' : 'No'}</div>
                    <div style={{ marginTop: 4 }}>Ready: {orderStatus?.readyForPickup ? 'Yes' : 'No'}</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!lastOrderId) return;
                      try {
                        const r = await fetch(`/api/public/order/status?orderId=${lastOrderId}`);
                        if (r.ok) setOrderStatus(await r.json());
                      } catch {}
                    }}
                    style={{ marginTop: 8, width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, background: 'white' }}
                  >
                    Refresh Status
                  </button>
                  
                  {/* Add More Items Button */}
                  {!showAddMore && (
                    <button
                      onClick={() => {
                        setShowAddMore(true);
                        setLastOrderId(null); // Allow adding to cart again
                      }}
                      style={{ marginTop: 8, width: '100%', padding: 10, background: '#f97316', color: 'white', borderRadius: 6, fontWeight: 600 }}
                    >
                      ➕ Add More Items
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Call Waiter Button - Always visible for in-venue orders */}
      {tableId && <CallWaiterButton tableId={tableId} sessionId={session?.sessionId} />}
      
      {/* Footer Branding */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
        Powered by <a href="https://imboniserve.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>ImboniServe</a>
      </div>
    </div>
  );
}
