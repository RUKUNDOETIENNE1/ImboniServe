# OEC-001C External Dependency Assessment

## Area 7: External Dependencies

---

## 1. Payment Providers

### InTouch (Mobile Money Aggregator)
- **Files**: `intouch.provider.ts` (canonical), `intouch.service.ts` (legacy)
- **Webhook**: `src/pages/api/webhooks/intouch.ts`
- **Timeout**: ✅ 30 seconds (FIXED in OEC-001C)
- **Retry**: ❌ No retry (single attempt)
- **Webhook security**: ✅ Basic Auth + HMAC signature validation
- **Idempotency**: ✅ webhookVerified flag + status check
- **Failure handling**: Returns error response, doesn't block operations
- **Watchdog**: PaymentWatchdog monitors failure rates

### IremboPay (Card Payments)
- **Files**: `irembopay.provider.ts` (canonical), `irembopay.service.ts`
- **Webhook**: `src/pages/api/payments/irembo/webhook.ts`
- **Timeout**: ✅ 30s initiation, 15s verification (FIXED in OEC-001C)
- **Retry**: ❌ No retry (single attempt)
- **Webhook security**: ✅ HMAC signature with timestamp tolerance (5 min)
- **Idempotency**: ✅ Status checks prevent reprocessing
- **Failure handling**: Returns error response, doesn't block operations
- **Watchdog**: PaymentWatchdog monitors failure rates

### Legacy Providers (Deprecated)
- Pesapal, MTN Mobile Money, Airtel Money
- **Status**: Deprecated — use PaymentProviderFactory instead
- **Timeout**: ❌ No timeout
- **Retry**: ❌ No retry

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Timeout handling | ✅ | Fixed in OEC-001C (30s/15s) |
| Webhook security | ✅ | HMAC + Basic Auth |
| Idempotency | ✅ | webhookVerified + status checks |
| Retry strategy | ❌ | No retry on transient failures |
| Circuit breaker | ❌ | Not implemented (REL-HIGH-002) |
| Fallback provider | ❌ | Not implemented (REL-LOW-005) |
| Failure monitoring | ✅ | PaymentWatchdog |

---

## 2. Email Service

- **File**: `src/lib/services/email.service.ts`
- **Provider**: Nodemailer (SMTP)
- **Configuration**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
- **Timeout**: ❌ No explicit timeout (nodemailer default)
- **Retry**: ❌ No retry (port fallback 465 → 587 only)
- **Failure handling**: Logs error, returns `{ success: false }`, does NOT throw
- **Behavior**: Best-effort — email failure doesn't block business logic
- **Functions**: sendOrderConfirmation, sendLoginOTP, other notifications

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Timeout | ❌ | No explicit timeout |
| Retry | ❌ | Port fallback only (REL-HIGH-003) |
| Graceful degradation | ✅ | Returns success if SMTP not configured |
| Failure handling | ✅ | Best-effort, doesn't block |

---

## 3. SMS/WhatsApp Service

- **Files**: `src/lib/services/notification.service.ts`, `whatsapp.service.ts`
- **Provider**: Twilio API
- **Configuration**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
- **Timeout**: ❌ No explicit timeout
- **Retry**: ❌ No retry (single attempt)
- **Failure handling**: Logs error, returns `{ success: false }`, does NOT throw
- **Behavior**: Best-effort
- **Daily cap**: ✅ Restaurant-level daily cap for client slips
- **Opt-in/Out**: ✅ Consent tracking, preference management

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Timeout | ❌ | No explicit timeout |
| Retry | ❌ | No retry (REL-HIGH-003) |
| Graceful degradation | ✅ | Returns success if not configured |
| Daily cap | ✅ | Prevents spam/overuse |
| Consent management | ✅ | Opt-in/out tracking |

---

## 4. AI Providers

### Azure Document Intelligence
- **File**: `src/lib/die/provider/azure.ts`
- **Timeout**: ✅ AbortController with configurable timeout
- **Retry**: ✅ Retry-After header + exponential backoff
- **Failure handling**: Strong error typing (AzureDITimeoutError, AzureDINetworkError, AzureDIServiceError)
- **Fallback**: ✅ ProviderRouter can fallback to OpenAI

### OpenAI (GPT-4 Vision)
- **Files**: `smart-menu-builder.service.ts`, `die/provider/openai.ts`
- **Timeout**: ❌ No explicit timeout (OpenAI SDK default)
- **Retry**: ❌ No retry
- **Failure handling**: Throws error if API key not configured
- **Fallback**: ❌ No fallback (blocking — AI failure blocks menu extraction)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Azure DI timeout | ✅ | AbortController |
| Azure DI retry | ✅ | Exponential backoff |
| Azure DI fallback | ✅ | ProviderRouter → OpenAI |
| OpenAI timeout | ❌ | No explicit timeout |
| OpenAI retry | ❌ | No retry |
| OpenAI fallback | ❌ | No fallback (blocking) |

---

## 5. Storage Service

- **File**: `src/lib/services/storage.service.ts`
- **Provider**: Supabase Storage (primary), local filesystem (fallback)
- **Timeout**: ❌ No explicit timeout
- **Retry**: ❌ No retry
- **Failure handling**: Throws error on upload failure, falls back to local storage
- **File size limits**: Video 50MB, Image 10MB, Generic 15MB, DIE docs 25MB
- **Behavior**: Blocking — storage failure blocks operation

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Timeout | ❌ | No explicit timeout |
| Retry | ❌ | No retry |
| Fallback | ✅ | Local filesystem fallback |
| File size limits | ✅ | Enforced |

---

## 6. Timeout Handling Summary (After OEC-001C)

| Service | Timeout | Status |
|---------|---------|--------|
| InTouch (initiation) | 30s | ✅ Fixed |
| IremboPay (initiation) | 30s | ✅ Fixed |
| IremboPay (verification) | 15s | ✅ Fixed |
| Azure DI | Configurable | ✅ Already had |
| Email (SMTP) | ❌ | Pre-Launch |
| WhatsApp (Twilio) | ❌ | Pre-Launch |
| OpenAI | ❌ | Pre-Launch |
| Storage (Supabase) | ❌ | Pre-Launch |

---

## 7. Retry Strategy Summary

| Service | Retry | Status |
|---------|-------|--------|
| InTouch | ❌ | Pre-Launch |
| IremboPay | ❌ | Pre-Launch |
| Email | ❌ (port fallback only) | Pre-Launch |
| WhatsApp | ❌ | Pre-Launch |
| OpenAI | ❌ | Pre-Launch |
| Azure DI | ✅ Exponential backoff | Already had |
| Storage | ❌ | Pre-Launch |
| BullMQ jobs | ✅ 3 attempts | Already had |

---

## Overall External Dependency Score: 6.0/10 — Moderate (Improved)

**Strengths**: Payment provider timeouts (OEC-001C fix), Azure DI timeout+retry+fallback, webhook security, payment watchdog  
**Gaps**: No retry for payment/email/SMS/AI, no circuit breakers, no fallback payment provider, email/SMS/OpenAI lack timeouts
