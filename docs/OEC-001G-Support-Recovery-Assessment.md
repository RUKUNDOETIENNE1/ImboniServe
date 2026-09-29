# OEC-001G — Support & Recovery Assessment

**Certification:** OEC-001G — Customer Trust Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

The Support & Recovery Assessment evaluates whether customers can recover safely from mistakes, whether help is available when needed, and whether the support experience reduces uncertainty. A customer should never feel abandoned.

**Support & Recovery Trust Score: 7.5/10**

---

## 1. Error Handling

### Centralized Error Middleware
- `withErrorHandler` wrapper for API handlers (`src/lib/middleware/error-handler.middleware.ts`)
- Consistent error logging with context (method, URL, userId, businessId)
- Zod validation errors handled specifically (400 status)
- Error-to-status-code mapping: not found → 404, unauthorized → 401, forbidden → 403, invalid → 400, unique constraint → 409, foreign key → 400, default → 500

### Standardized Response Helpers
- `errorResponse(error, details?)` — Standard error shape
- `validationErrorResponse(details)` — Form validation failures
- `notFoundResponse(resource)` — 404 with resource name
- `unauthorizedResponse(message)` — 401
- `forbiddenResponse(message)` — 403
- `internalServerErrorResponse()` — Generic 500

### React Error Boundary
- User-friendly message: "Oops! Something went wrong"
- Reassurance: "Your data is safe"
- Recovery actions: "Refresh Page" button, "Go to Dashboard" link
- Support contact: support@imboniserve.com
- Development mode shows stack traces

### Toast Notification System
- 4 types: success, error, warning, info
- Auto-dismiss after 5 seconds (configurable)
- Color-coded by type with icons
- Used extensively across 60+ files

**Score: 7.5/10** — Good error handling, limited next-step guidance

---

## 2. Recovery Flows

### Payment Failure Recovery
- Payment status tracking: PENDING → PROCESSING → PAID/FAILED
- Failed payments logged with billing events
- User can retry payment via payment link
- "Complete Payment Now" button
- Real-time updates via WebSocket when payment succeeds
- Payment feedback component collects failure reasons

### Inventory Recovery
- Low stock alerts (red banner) with actionable guidance
- Color-coded stock status: green (good), yellow (medium), red (low)
- `reverseConsumption` service for correcting consumption mistakes
- Auto-reorder suggestions available
- Low stock WhatsApp alerts to owners

### Reservation Recovery
- Idempotent confirmation (returns if already confirmed)
- Auto-reserves table on confirmation (OEC-001F fix)
- Cancellation releases table to AVAILABLE
- No-show handling with deposit forfeiture

### Destructive Action Protection
- ConfirmModal component with 4 variants: danger, warning, info, primary
- Used for: session revocation, QR deletion, table deletion, inventory deletion, partnership rejection, founder code revocation
- "This action cannot be undone" warning
- Cancel/Confirm buttons

### Session Recovery
- Password reset revokes all sessions
- Users can revoke individual or all sessions from security dashboard
- Security event logged for session revocation

**Gaps:**
- No general-purpose undo system
- No systematic retry mechanism for failed API calls
- No explicit order retry UI for customers
- Limited offline support (only CallWaiterButton)

**Score: 7.5/10** — Good recovery for critical paths, limited general undo

---

## 3. Support Experience

### Support Widget (`SupportWidget.tsx`)
- Floating chat widget with real-time messaging
- Real-time via Pusher/WebSocket
- Conversation list with unread counts
- Status tracking: OPEN, PENDING, RESOLVED, CLOSED
- Priority levels: LOW, NORMAL, HIGH, URGENT
- File attachment support
- Auto-refresh every 5 seconds
- Keyboard navigation (Escape to close, Tab trap)
- Accessibility: ARIA labels, focus management
- Dismissible with localStorage persistence

### Partner Support (`portal/support.tsx`)
- Ticket creation form with subject, category, message
- Categories: General, Payout, Campaign, Technical, Other
- Ticket history with status badges
- Color-coded status icons
- Timestamps for each ticket
- Loading and error states with retry button
- Toast notifications on success/failure

### FAQ Page (`faq.tsx`)
- Multilingual: English, French, Kinyarwanda
- Accordion-style Q&A
- Topics: convenience fees, payment methods, VAT, receipts, marketplace commissions
- Dynamic fee percentage from API
- Contact info: support@imboniserve.com, +250 788 917 126

### Support API Endpoints
- `/api/support/conversations` — List/create conversations
- `/api/support/conversations/{id}/messages` — Send/receive messages
- `/api/support/conversations/{id}/mark-read` — Mark as read
- `/api/support/upload` — Upload attachments
- `/api/portal` — Partner support tickets

### Support Contact Methods
- Email: support@imboniserve.com
- Phone: +250 788 917 126
- In-app support widget (real-time chat)
- Support ticket system (partners)

**Gaps:**
- No dedicated business support portal (only partner portal)
- No searchable knowledge base
- No contextual tooltips or guided tours
- No onboarding walkthroughs
- No customer success pathway for regular users (executive-level only)

**Score: 7.5/10** — Good support channels, knowledge base needed

---

## 4. Notification System

### WhatsApp Notifications (Twilio)
- Order notifications: new order alerts to business WhatsApp
- Low stock alerts: "Action required: Reorder supplies"
- Daily reports: sales, orders, profit metrics
- Payment confirmations: "✅ PAYMENT CONFIRMED"
- Smart Dining Slips: PDF attachment with consent checking

### Notification Quality
- Use of emojis for visual context (🍽️, ⚠️, 📊, ✅)
- Structured format with sections
- Specific amounts and item details
- Action items included
- Timely: real-time for orders/payments, scheduled for daily reports

### Notification Preferences (`dashboard/notifications.tsx`)
- Daily report enabled/disabled
- Daily report time (local timezone)
- Timezone selection (12 options)
- WhatsApp owner reports enabled/disabled
- WhatsApp client slips enabled/disabled
- Daily cap for client messages (1-500)
- "Send Now" button for testing

**Score: 8.5/10** — Excellent notification system

---

## Support & Recovery Trust Summary

| Domain | Score | Status |
|--------|-------|--------|
| Error Handling | 7.5/10 | Good — centralized, limited guidance |
| Recovery Flows | 7.5/10 | Good — critical paths covered |
| Support Experience | 7.5/10 | Good — widget + tickets, no KB |
| Notifications | 8.5/10 | Excellent — WhatsApp, timely, actionable |

**Overall Support & Recovery Score: 7.5/10** — Good support with room for knowledge base
