# 🎨 Tap & Leave™ Frontend Integration Guide

## ✅ What's Been Built

All frontend components are ready for integration:

### **Components Created**
1. ✅ `TapAndLeaveButton.tsx` - Main checkout button with payment modal
2. ✅ `LiveOrderSummary.tsx` - Real-time order display with kitchen status
3. ✅ `useDiningSession.ts` - React hook for session management
4. ✅ `checkout.tsx` - Complete checkout page example

### **API Endpoints Created**
1. ✅ `POST /api/session/initialize` - Create session when QR scanned
2. ✅ `GET /api/session/slip/[sessionId]` - Fetch live order data
3. ✅ `POST /api/checkout/tap-and-leave` - Initiate checkout
4. ✅ `POST /api/checkout/tap-and-leave/webhook` - Payment confirmation
5. ✅ `GET /api/checkout/tap-and-leave/status/[id]` - Poll payment status

---

## 🚀 Quick Start Integration

### **Step 1: Initialize Session on QR Scan**

When a customer scans a QR code, initialize the dining session:

```typescript
// Example: In your QR landing page (e.g., /order/index.tsx)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function OrderPage() {
  const router = useRouter()
  const { tableId, businessId } = router.query
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (tableId && businessId) {
      initializeSession()
    }
  }, [tableId, businessId])

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/session/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          businessId,
          participantName: 'Guest', // Optional
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSessionId(data.data.sessionId)
        // Store in localStorage for persistence
        localStorage.setItem('currentSessionId', data.data.sessionId)
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  // Rest of your menu/ordering UI...
}
```

---

### **Step 2: Add Live Order Summary**

Show real-time order status to customers:

```typescript
import { LiveOrderSummary } from '@/components/LiveOrderSummary'

export default function OrderPage() {
  const sessionId = localStorage.getItem('currentSessionId')

  return (
    <div>
      {/* Your menu UI */}
      
      {/* Live Order Summary */}
      {sessionId && (
        <LiveOrderSummary 
          sessionId={sessionId} 
          showKitchenStatus={true} 
        />
      )}
    </div>
  )
}
```

---

### **Step 3: Add Items to Dining Slip**

When customer places an order, add it to the dining slip:

```typescript
// After creating Sale record in your order creation flow

import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'

// In your API endpoint (e.g., /api/public/order/draft.ts)

// After sale is created:
const sale = await createDraftOrder(...)

// Get the dining slip for this session
const slip = await prisma.diningSessionSlip.findUnique({
  where: { sessionId: tableSessionId }
})

if (slip) {
  // Add items to slip
  await DiningSessionSlipService.addOrderToSlip({
    slipId: slip.id,
    saleId: sale.id,
    items: sale.items.map(item => ({
      saleItemId: item.id,
      itemName: item.menuItem.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      notes: item.notes,
      instructionTags: item.instructionTags,
    })),
  })
}
```

---

### **Step 4: Add Checkout Button**

Use the pre-built checkout page or integrate the button directly:

**Option A: Use the checkout page**
```typescript
// Add a "Checkout" button that navigates to /order/checkout

<button onClick={() => router.push(`/order/checkout?sessionId=${sessionId}`)}>
  Go to Checkout
</button>
```

**Option B: Integrate button directly**
```typescript
import { TapAndLeaveButton } from '@/components/TapAndLeaveButton'
import { useDiningSession } from '@/hooks/useDiningSession'

export default function YourPage() {
  const sessionId = localStorage.getItem('currentSessionId')
  const { total, itemCount, canCheckout } = useDiningSession({ sessionId })
  const [phone, setPhone] = useState('')

  return (
    <div>
      {/* Phone input */}
      <input 
        type="tel" 
        value={phone} 
        onChange={(e) => setPhone(e.target.value)}
        placeholder="078 XXX XXXX"
      />

      {/* Tap & Leave Button */}
      <TapAndLeaveButton
        sessionId={sessionId}
        phone={phone}
        amount={total}
        itemCount={itemCount}
        disabled={!canCheckout}
        onSuccess={(data) => {
          console.log('Payment successful!', data)
          router.push('/order/receipt')
        }}
        onError={(error) => {
          console.error('Payment failed:', error)
        }}
      />
    </div>
  )
}
```

---

### **Step 5: Integrate Kitchen Dispatch**

**CRITICAL**: Every order MUST be dispatched to kitchen:

```typescript
// In your order creation API (e.g., /api/public/order/draft.ts)

import { KitchenDispatchService } from '@/lib/services/kitchen-dispatch.service'

// After creating Sale record:
const sale = await prisma.sale.create({ ... })

// MANDATORY: Dispatch to kitchen
const dispatchResult = await KitchenDispatchService.dispatchToKitchen({
  saleId: sale.id,
  businessId: business.id,
  orderNumber: sale.orderNumber,
  orderSource: sale.orderSource,
  tableId: sale.tableId,
  tableNumber: table?.number,
  participantName: participant?.name,
  items: sale.items.map(item => ({
    menuItemName: item.menuItem.name,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    notes: item.notes,
    instructionTags: item.instructionTags,
  })),
})

if (!dispatchResult.success) {
  console.error('Kitchen dispatch failed:', dispatchResult.error)
  // Log but don't fail order - can retry later
}
```

---

## 📱 Component API Reference

### **TapAndLeaveButton**

```typescript
interface TapAndLeaveButtonProps {
  sessionId: string        // Required: Current dining session ID
  phone: string           // Required: Customer's mobile money number
  amount: number          // Required: Total amount in RWF
  itemCount: number       // Required: Number of items
  disabled?: boolean      // Optional: Disable button
  onSuccess?: (data) => void  // Optional: Success callback
  onError?: (error) => void   // Optional: Error callback
}
```

**Features**:
- ✅ Automatic payment modal
- ✅ Real-time status polling
- ✅ USSD prompt instructions
- ✅ Success/failure states
- ✅ Auto-timeout after 5 minutes

---

### **LiveOrderSummary**

```typescript
interface LiveOrderSummaryProps {
  sessionId: string           // Required: Current dining session ID
  showKitchenStatus?: boolean // Optional: Show kitchen status badges (default: true)
}
```

**Features**:
- ✅ Auto-refreshes every 5 seconds
- ✅ Real-time kitchen status updates
- ✅ Running total calculation
- ✅ Item-by-item breakdown
- ✅ Manual refresh button

---

### **useDiningSession Hook**

```typescript
const {
  slip,              // Full slip data
  loading,           // Loading state
  error,             // Error message
  refresh,           // Manual refresh function
  total,             // Total in RWF (number)
  subtotal,          // Subtotal in RWF
  vat,               // VAT in RWF
  itemCount,         // Number of items
  orderCount,        // Number of orders
  canCheckout,       // Boolean: ready for checkout
  isCheckoutInProgress, // Boolean: checkout started
  isCompleted,       // Boolean: session closed
} = useDiningSession({
  sessionId: 'session_xxx',
  autoRefresh: true,        // Optional: auto-refresh (default: true)
  refreshInterval: 5000,    // Optional: refresh interval in ms (default: 5000)
})
```

---

## 🔄 Complete User Flow

```
1. Customer scans QR code
   ↓
2. Call POST /api/session/initialize
   - Creates TableSession
   - Creates DiningSessionSlip
   - Returns sessionId
   ↓
3. Customer browses menu and orders
   ↓
4. For each order:
   - Create Sale record
   - Dispatch to kitchen (MANDATORY)
   - Add to DiningSessionSlip
   ↓
5. Customer views LiveOrderSummary
   - See items
   - See kitchen status
   - See running total
   ↓
6. Customer clicks "Checkout" or "Tap & Leave™"
   ↓
7. Enter phone number
   ↓
8. Click "Tap & Leave™" button
   - Freezes session
   - Triggers InTouch payment
   - Shows payment modal
   ↓
9. Customer approves on phone (*182#)
   ↓
10. Frontend polls payment status
    - Every 3 seconds
    - Max 5 minutes
    ↓
11. Payment confirmed
    - Modal shows success
    - Receipt generated
    - Session closed
    ↓
12. Redirect to receipt page
```

---

## 🎨 Styling

All components use Tailwind CSS and are fully responsive. Key classes:

- **Primary Color**: `bg-blue-600`, `text-blue-600`
- **Success**: `bg-green-600`, `text-green-600`
- **Error**: `bg-red-600`, `text-red-600`
- **Rounded**: `rounded-2xl`, `rounded-xl`
- **Shadows**: `shadow-lg`, `shadow-xl`

To customize, update the Tailwind classes in the components.

---

## ⚠️ Important Notes

### **1. Kitchen Dispatch is MANDATORY**
Every order MUST call `KitchenDispatchService.dispatchToKitchen()`. This is not optional.

### **2. Session Persistence**
Store `sessionId` in `localStorage` to persist across page refreshes:
```typescript
localStorage.setItem('currentSessionId', sessionId)
```

### **3. Phone Number Validation**
The checkout page validates Rwandan phone numbers (078/079/072/073). Adjust regex if needed.

### **4. Payment Fee**
5% payment fee is automatically calculated and displayed. This is configurable in the API.

### **5. Polling Timeout**
Payment status polling auto-stops after 5 minutes. Adjust in `TapAndLeaveButton.tsx` if needed.

---

## 🐛 Debugging

### **Check Session Status**
```typescript
const slip = await fetch(`/api/session/slip/${sessionId}`).then(r => r.json())
console.log('Session status:', slip.data.status)
console.log('Running total:', slip.data.runningTotalCents / 100)
```

### **Check Kitchen Dispatch**
```typescript
const sale = await prisma.sale.findUnique({
  where: { id: saleId },
  select: { kitchenDispatchStatus: true }
})
console.log('Kitchen dispatch:', sale.kitchenDispatchStatus) // "dispatched" | "failed" | "pending"
```

### **Check Payment Status**
```typescript
const payment = await fetch(`/api/checkout/tap-and-leave/status/${paymentId}`)
  .then(r => r.json())
console.log('Payment status:', payment.data.status)
```

---

## 📚 Files Reference

### **Components**
- `src/components/TapAndLeaveButton.tsx`
- `src/components/LiveOrderSummary.tsx`

### **Hooks**
- `src/hooks/useDiningSession.ts`

### **Pages**
- `src/pages/order/checkout.tsx` (example)

### **API Endpoints**
- `src/pages/api/session/initialize.ts`
- `src/pages/api/session/slip/[sessionId].ts`
- `src/pages/api/checkout/tap-and-leave.ts`
- `src/pages/api/checkout/tap-and-leave/webhook.ts`
- `src/pages/api/checkout/tap-and-leave/status/[id].ts`

---

## ✅ Integration Checklist

- [ ] Initialize session on QR scan
- [ ] Store sessionId in localStorage
- [ ] Add LiveOrderSummary to order page
- [ ] Integrate kitchen dispatch in order creation
- [ ] Add items to DiningSessionSlip after order
- [ ] Add checkout button/page
- [ ] Test complete flow end-to-end
- [ ] Test payment success scenario
- [ ] Test payment failure scenario
- [ ] Test session persistence across refreshes
- [ ] Monitor kitchen dispatch success rate

---

## 🆘 Common Issues

### **Issue: Session not found**
**Solution**: Ensure you're calling `/api/session/initialize` before trying to access the session.

### **Issue: Kitchen dispatch failing**
**Solution**: Check Pusher configuration and ensure `kitchenDispatchStatus` is being set.

### **Issue: Payment polling not working**
**Solution**: Verify InTouch webhook URL is correct and accessible.

### **Issue: Items not showing in slip**
**Solution**: Ensure you're calling `addOrderToSlip()` after creating the Sale record.

---

**Status**: ✅ **All Frontend Components Ready**  
**Next**: Integrate into your existing order flow  
**Support**: Check `TAP_AND_LEAVE_IMPLEMENTATION.md` for backend details
