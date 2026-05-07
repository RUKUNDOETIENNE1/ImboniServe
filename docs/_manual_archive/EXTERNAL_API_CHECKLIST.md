# External API Integration Checklist

**Last Updated:** March 15, 2026  
**Purpose:** Complete reference for all external API integrations with setup instructions, credentials, and verification steps.

---

## Quick Status Overview

| API Service | Status | Priority | Documentation |
|------------|--------|----------|---------------|
| **IremboPay** | ✅ Implemented | Critical | See Section 1 |
| **Twilio WhatsApp** | ✅ Implemented | Critical | See Section 2 |
| **OpenAI** | ✅ Implemented | Medium | See Section 3 |
| **RRA EBM** | 🟡 Partial | High | See Section 4 |
| **Pusher** | ⚪ Optional | Low | See Section 5 |
| **MTN MoMo Direct** | ⚪ Future | Low | See Section 6 |
| **Airtel Money Direct** | ⚪ Future | Low | See Section 7 |

---

## 1. IremboPay (Payment Gateway) - CRITICAL

### Purpose
Process digital payments (MTN MoMo, Airtel Money, Card payments) for subscription billing and QR orders.

### Required Environment Variables
```env
IREMBO_PUBLIC_KEY=your_public_key_here
IREMBO_SECRET_KEY=your_secret_key_here
IREMBO_PAYMENT_ACCOUNT=LOYALTECH-RWF
IREMBO_PAYMENT_ITEM_CODE=PC-2157edb8bd
IREMBO_API_BASE=https://api.irembopay.com
IREMBO_API_VERSION=2
IREMBO_WEBHOOK_TOLERANCE_SECONDS=300
```

### Setup Steps
1. **Register Account**
   - Visit: https://irembopay.com/business
   - Complete KYC verification
   - Obtain API credentials from dashboard

2. **Configure Webhook**
   - Production URL: `https://yourdomain.com/api/payments/irembo/webhook`
   - Sandbox URL: `https://yourdomain.com/api/payments/irembo/webhook`
   - Webhook receives: PENDING, PAID, EXPIRED, FAILED status updates
   - Signature verification: HMAC-SHA256 with timestamp tolerance

3. **Test Integration**
   ```bash
   # Create test invoice
   curl -X POST https://yourdomain.com/api/payments/irembo/create-invoice \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION" \
     -d '{
       "subscriptionId": "sub_xxx",
       "businessId": "biz_xxx"
     }'
   ```

### Implementation Files
- `src/lib/services/irembopay.service.ts` - Core service
- `src/pages/api/payments/irembo/create-invoice.ts` - Invoice creation
- `src/pages/api/payments/irembo/initiate-momo.ts` - MoMo push
- `src/pages/api/payments/irembo/webhook.ts` - Payment callbacks

### Key Features
- Hosted payment links (primary flow)
- Server-initiated MoMo push (MTN/Airtel)
- Invoice expiry: 15 minutes default
- VAT calculation: 18% inclusive
- Gateway fee: 3.42% of gross amount
 - Language parameter (EN/RW) derived from business/user setting
### Verification Checklist
- [ ] API credentials configured in `.env`
- [ ] Webhook URL registered with IremboPay
- [ ] Test invoice creation succeeds
- [ ] Test MoMo push succeeds
- [ ] Webhook signature verification works
- [ ] Payment status updates correctly
- [ ] VAT calculation is accurate (18%)
- [ ] Gateway fee calculation is correct (3.42%)

### Source Documentation
- Official API Docs: https://docs.irembopay.com
- Implementation: `EXTERNAL_API_INTEGRATION_GUIDE.md` (lines 11-69)
- Service Code: `src/lib/services/irembopay.service.ts`

---

## 2. Twilio WhatsApp Business API - CRITICAL

### Purpose
Send Smart Dining Slips™, daily reports, low stock alerts, and order notifications via WhatsApp.

### Required Environment Variables
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+250788123456
TWILIO_PHONE_NUMBER=+250788123456
```

### Setup Steps
1. **Create Twilio Account**
   - Visit: https://www.twilio.com/console
   - Verify your account
   - Add WhatsApp Sandbox or production number

2. **Configure WhatsApp Sender**
   - Get WhatsApp-enabled phone number
   - Format: `+250XXXXXXXXX` (do not include `whatsapp:`; service prepends automatically)
   - Optional fallback: set `TWILIO_PHONE_NUMBER` if `TWILIO_WHATSAPP_NUMBER` is not set
   - Verify sender identity

3. **Test Message Sending**
   ```bash
   # Test WhatsApp notification
   curl -X POST https://yourdomain.com/api/test/whatsapp \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "+250788123456",
       "message": "Test message"
     }'
   ```

### Implementation Files
- `src/lib/services/notification.service.ts` - Core notification service
- `src/lib/services/smart-dining-slip.service.ts` - Slip delivery
- `src/pages/api/settings/whatsapp.ts` - Settings management

### Message Types
1. **Smart Dining Slip™** (Customer)
   - Sent after bill confirmation
   - PDF/image attachment
   - Requires customer consent
   - Daily cap: configurable (default 50)

2. **Daily Reports** (Owner)
   - Sent at 11 PM daily
   - Sales summary, profit, top items
   - Configurable per business

3. **Low Stock Alerts** (Manager)
   - Sent when inventory below minimum
   - Includes reorder suggestions

4. **Order Ready Notifications** (Customer)
   - QR order completion alerts
   - Kitchen → customer flow

### Rate Limits & Costs
- Daily cap per business: 50 client messages (configurable)
- Monthly budget: optional spending limit
- Cost tracking: logged per message
- Throttling: automatic when approaching limits

### Verification Checklist
- [ ] Twilio account created and verified
- [ ] WhatsApp sender number configured
- [ ] Test message sends successfully
- [ ] Smart Dining Slip delivery works
- [ ] Daily report scheduling works
- [ ] Low stock alerts trigger correctly
- [ ] Daily cap enforcement works
- [ ] Monthly budget tracking works

### Source Documentation
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Implementation: `EXTERNAL_API_INTEGRATION_GUIDE.md` (lines 72-149)
- Service Code: `src/lib/services/notification.service.ts`

---

## 3. OpenAI API - MEDIUM PRIORITY

### Purpose
Generate AI Business Summary insights (weekly/monthly) with KPI analysis and recommendations.

### Required Environment Variables
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL_PRIMARY=gpt-4o-mini
OPENAI_MODEL_FALLBACK=gpt-4-turbo
OPENAI_COST_INPUT_PER_1K_USD=0.00015
OPENAI_COST_OUTPUT_PER_1K_USD=0.0006
```

### Setup Steps
1. **Create OpenAI Account**
   - Visit: https://platform.openai.com
   - Create API key
   - Set usage limits

2. **Configure Cost Tracking**
   - Set per-1K token costs in `.env`
   - Monitor usage in OpenAI dashboard
   - Set monthly quota per business (default: 4 manual generations)

3. **Test Insight Generation**
   ```bash
   # Generate test insight
   curl -X POST https://yourdomain.com/api/insights/generate \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION" \
     -d '{
       "businessId": "biz_xxx",
       "period": "WEEKLY",
       "language": "en"
     }'
   ```

### Implementation Files
- `src/lib/ai/openai-insight.service.ts` - OpenAI wrapper
- `src/lib/services/insight.service.ts` - KPI computation & caching
- `src/pages/api/insights/generate.ts` - Manual generation
- `src/pages/api/insights/history.ts` - Insight history
- `src/lib/cron.ts` - Scheduled generation (Mondays 1 AM, 1st of month)

### Key Features
- Model: gpt-4o-mini (primary), gpt-4-turbo (fallback)
- Temperature: 0.2 (consistent outputs)
- Max tokens: 600
- Caching: unique per business/period/week
- Quota: 4 manual generations per business per month
- Auto-generation: Weekly (Mondays), Monthly (1st)

### Verification Checklist
- [ ] OpenAI API key configured
- [ ] Test insight generation succeeds
- [ ] Cost tracking works correctly
- [ ] Monthly quota enforcement works
- [ ] Caching prevents duplicate generations
- [ ] Scheduled cron job runs (if deployed)
- [ ] Multilingual support works (EN/RW)

### Source Documentation
- OpenAI Docs: https://platform.openai.com/docs
- Implementation: Memory `b11e9827-5658-4bd4-b565-2fa45a082842`
- Service Code: `src/lib/ai/openai-insight.service.ts`

---

## 4. Rwanda Revenue Authority (RRA) EBM - HIGH PRIORITY

### Purpose
Generate VAT-compliant receipts per RRA specifications for tax compliance.

### Required Environment Variables
```env
EBM_ENABLED=true
EBM_TIN=123456789
EBM_DEVICE_ID=optional_for_now
```

### Setup Steps
1. **Register with RRA**
   - Obtain Tax Identification Number (TIN)
   - Register business for VAT
   - Apply for EBM certification (future)

2. **Configure Receipt Format**
   - Business name and TIN on all receipts
   - VAT breakdown (18%)
   - Unique sequential receipt numbers
   - Timestamp and payment method
   - Date/time format: Africa/Kigali timezone; 'en-RW' or 'rw-RW' locale (use shared utility when available)

3. **Test Receipt Generation**
   ```bash
   # Create sale with EBM receipt
   curl -X POST https://yourdomain.com/api/sales \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION" \
     -d '{
       "businessId": "biz_xxx",
       "items": [{"menuItemId": "item_id", "quantity": 2, "unitPriceCents": 5000}],
       "paymentMethod": "CASH"
     }'
   ```

### Implementation Files
- `src/lib/pricing/ebm-formatter.ts` - Receipt formatting
- `src/lib/pricing/fee-calculator.ts` - Fee and VAT calculations
- `src/pages/api/sales/index.ts` - Receipt generation on sale

### Receipt Format
- Header: Business name, TIN
- Items: Description (EN/RW), quantity, unit price, VAT
- Totals: Subtotal, VAT (18%), convenience fee (if digital), grand total
- Footer: Payment method, timestamp, "Powered by Imboni Resto"

### Compliance Requirements
- VAT registration: Business must be VAT-registered
- TIN display: Must appear on all receipts
- Sequential numbering: Unique IDs per receipt
- Retention: Keep records for 10 years
- Audit trail: All edits logged with user ID and timestamp

### Verification Checklist
- [ ] TIN configured in `.env`
- [ ] Receipt includes business name and TIN
- [ ] VAT calculation is accurate (18%)
- [ ] Convenience fee displays correctly (5% digital)
- [ ] Unique order numbers generated
- [ ] Receipt formatting matches RRA spec
- [ ] Timestamps use Africa/Kigali timezone and correct locale
- [ ] JSON export format works
- [ ] Multilingual support (EN/RW)

### Source Documentation
- RRA Portal: https://www.rra.gov.rw
- Implementation: `EXTERNAL_API_INTEGRATION_GUIDE.md` (lines 152-236)
- Service Code: `src/lib/pricing/ebm-formatter.ts`

### Future: Physical EBM Device Integration
- Phase 2: Connect to physical EBM devices
- Real-time submission to RRA servers
- Device certificate management
- Offline mode with sync when online

---

## 5. Pusher (Real-time Updates) - OPTIONAL

### Purpose
Real-time order updates, kitchen notifications, and live dashboard updates.

### Required Environment Variables
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_public_key
PUSHER_SECRET=your_secret_key
PUSHER_CLUSTER=eu
```

### Setup Steps
1. **Create Pusher Account**
   - Visit: https://pusher.com
   - Create new app
   - Get credentials from dashboard

2. **Configure Channels**
   - Private channels for business-specific updates
   - Presence channels for kitchen staff
   - Public channels for order tracking

3. **Test Real-time Events**
   ```javascript
   // Client-side test
   const pusher = new Pusher(PUSHER_KEY, { cluster: 'eu' })
   const channel = pusher.subscribe('orders')
   channel.bind('new-order', (data) => console.log(data))
   ```

### Implementation Status
- ⚪ Not yet implemented
- Planned for Phase 2 (real-time features)

### Verification Checklist
- [ ] Pusher account created
- [ ] Credentials configured
- [ ] Test event publishing works
- [ ] Client subscription works
- [ ] Private channel auth works

### Source Documentation
- Pusher Docs: https://pusher.com/docs
- Status: Optional, not critical for MVP

---

## 6. MTN MoMo Direct API - FUTURE

### Purpose
Direct MTN Mobile Money integration (bypass IremboPay for lower fees).

### Required Environment Variables
```env
MTN_MOMO_API_KEY=your_api_key
MTN_MOMO_API_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_ENVIRONMENT=sandbox
MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key
```

### Setup Steps
1. **Register with MTN MoMo**
   - Visit: https://momodeveloper.mtn.com
   - Complete onboarding
   - Get sandbox credentials

2. **Production Approval**
   - Submit business documentation
   - Pass compliance review
   - Get production credentials

### Implementation Status
- ⚪ Scaffolding exists in `src/lib/services/payment.service.ts`
- Not actively used (IremboPay is primary)
- Future optimization for lower fees

### Source Documentation
- MTN Docs: https://momodeveloper.mtn.com/docs
- Service Code: `src/lib/services/payment.service.ts` (lines 79-135)

---

## 7. Airtel Money Direct API - FUTURE

### Purpose
Direct Airtel Money integration (bypass IremboPay for lower fees).

### Required Environment Variables
```env
AIRTEL_MONEY_API_KEY=your_api_key
AIRTEL_MONEY_API_URL=https://openapiuat.airtel.africa
```

### Setup Steps
1. **Register with Airtel Money**
   - Visit: https://developers.airtel.africa
   - Complete onboarding
   - Get sandbox credentials

2. **Production Approval**
   - Submit business documentation
   - Pass compliance review
   - Get production credentials

### Implementation Status
- ⚪ Scaffolding exists in `src/lib/services/payment.service.ts`
- Not actively used (IremboPay is primary)
- Future optimization for lower fees

### Source Documentation
- Airtel Docs: https://developers.airtel.africa/documentation
- Service Code: `src/lib/services/payment.service.ts` (lines 137-191)

---

## Environment Variables Summary

### Critical (Must Configure)
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourdomain.com

# IremboPay (Critical)
IREMBO_PUBLIC_KEY=xxx
IREMBO_SECRET_KEY=xxx
IREMBO_PAYMENT_ACCOUNT=LOYALTECH-RWF
IREMBO_PAYMENT_ITEM_CODE=PC-2157edb8bd
IREMBO_API_BASE=https://api.irembopay.com
IREMBO_API_VERSION=2
IREMBO_WEBHOOK_TOLERANCE_SECONDS=300

# Twilio WhatsApp (Critical)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+250788123456
TWILIO_PHONE_NUMBER=+250788123456

# App Settings
APP_URL=https://yourdomain.com
SUPPORT_PHONE=+250788123456
SUPPORT_WHATSAPP=+250788123456
```

### Important (Recommended)
```env
# OpenAI (AI Insights)
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL_PRIMARY=gpt-4o-mini
OPENAI_MODEL_FALLBACK=gpt-4-turbo
OPENAI_COST_INPUT_PER_1K_USD=0.00015
OPENAI_COST_OUTPUT_PER_1K_USD=0.0006

# RRA EBM (Tax Compliance)
EBM_ENABLED=true
EBM_TIN=123456789

# QR Ordering
IMBONI_QR_SECRET=strong-secret-here
```

### Optional (Future)
```env
# Pusher (Real-time)
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=eu

# MTN MoMo Direct (Future)
MTN_MOMO_API_KEY=xxx
MTN_MOMO_SUBSCRIPTION_KEY=xxx

# Airtel Money Direct (Future)
AIRTEL_MONEY_API_KEY=xxx

# Trial Anti-Fraud
TRIAL_HASH_SECRET=xxx
DISPOSABLE_EMAIL_DOMAINS=tempmail.com,guerrillamail.com
TRIAL_IP_RANGE_LIMIT=5
CAPTCHA_ENABLED=false
TRIAL_CAPTCHA_THRESHOLD=70
```

-
## Global Consistency Notes

✅ **All consistency improvements completed as of March 15, 2026**

- **Error responses**: All APIs return `{"error": string}` for failures. 500 errors default to `'Internal server error'`. Standardized across:
  - `src/pages/api/supplier/products.ts`
  - `src/pages/api/supplier/orders.ts`
  - `src/pages/api/inventory/alerts.ts`
  - `src/pages/api/reports/daily.ts`, `weekly.ts`, `monthly.ts`
  - `src/pages/api/profit/index.ts`

- **WhatsApp sender env**: Uses `TWILIO_WHATSAPP_NUMBER` (preferred) with `TWILIO_PHONE_NUMBER` fallback. Env values are plain E.164 format (e.g., `+250788...`); service handles `whatsapp:` prefix internally. Updated in:
  - `src/lib/services/notification.service.ts`
  - `.env.example`

- **Date/time formatting**: All date/time displays use `formatDateTimeRW` utility with Africa/Kigali timezone and locale-aware formatting (`en-RW` or `rw-RW`). Applied to:
  - `src/lib/pricing/ebm-formatter.ts` (EBM receipts)
  - `src/lib/services/slip-pdf-generator.service.ts` (Smart Dining Slips - all templates)
  - `src/lib/services/printer.service.ts` (thermal printer)
  - `src/lib/services/commission.service.ts` (commission invoices)
  - `src/pages/api/public/order/{status,draft}.ts` (QR order ETAs)
  - `src/pages/dashboard/{transactions,sales/index}.tsx` (UI tables)
  - `src/pages/admin/trial-eligibility/index.tsx` (admin UI)
  - Test suite: `tests/formatDateTimeRW.test.ts` (run via `npm run test:dt`)

- **Brand taglines**: Unified messaging across platform using `src/utils/taglines.ts`:
  - "Unified. Intelligent. Reliable."
  - "Scan. Order. Enjoy."
  - "The future of hospitality starts here."
  - Applied to: Home, Pricing, Store pages

## Platform Readiness

**Multi-Branch & External API Audit:** ✅ Complete  
**Multilingual Readiness:** 🟡 Partial (EN/RW for receipts; full UI i18n pending)  
**Master Upgrade Status:** 🔄 In Progress (see `MASTER_UPGRADE_ANALYSIS.md`)

## Pre-Launch Verification

### Critical Path (Must Pass)
1. **IremboPay**
   - [ ] Create invoice succeeds
   - [ ] Payment link generates
   - [ ] MoMo push works
   - [ ] Webhook receives callbacks
   - [ ] Signature verification passes
   - [ ] Payment status updates correctly

2. **WhatsApp**
   - [ ] Smart Dining Slip sends
   - [ ] Daily report sends
   - [ ] Low stock alert sends
   - [ ] Daily cap enforced
   - [ ] Phone number validation works

3. **EBM Receipts**
   - [ ] Receipt includes TIN
   - [ ] VAT calculation correct (18%)
   - [ ] Unique order numbers
   - [ ] Multilingual support (EN/RW)

### Recommended (Should Pass)
4. **OpenAI Insights**
   - [ ] Insight generation works
   - [ ] Cost tracking accurate
   - [ ] Quota enforcement works
   - [ ] Caching prevents duplicates

### Optional (Nice to Have)
5. **Pusher**
   - [ ] Real-time events work
   - [ ] Channel auth works

---

## Troubleshooting Quick Reference

### IremboPay Issues
- **Invoice creation fails**: Check API credentials, verify business is active
- **Webhook not received**: Verify URL is publicly accessible, check firewall
- **Signature verification fails**: Check secret key, verify timestamp tolerance

### WhatsApp Issues
- **Messages not delivered**: Verify phone format (+250...), check daily cap
- **Template rejected**: Remove promotional language, ensure opt-out instructions

### OpenAI Issues
- **Generation fails**: Check API key, verify quota not exceeded
- **High costs**: Review token usage, adjust max_tokens setting

### EBM Issues
- **Receipt formatting incorrect**: Verify VAT rate (18%), check TIN configured
- **Sequential numbering gaps**: Check for failed transactions, review order generation

---

## Support Contacts

- **IremboPay**: support@irembo.com | https://business.irembo.com/support
- **Twilio**: https://www.twilio.com/console/support
- **OpenAI**: https://help.openai.com
- **RRA**: info@rra.gov.rw | +250 788 999 999 | https://www.rra.gov.rw

---

## Related Documentation

- `EXTERNAL_API_INTEGRATION_GUIDE.md` - Detailed integration guide
- `NON_TECHNICAL_NEXT_STEPS.md` - Non-technical setup guide
- `.env.example` - Environment variable template
- `src/lib/services/` - Service implementations
