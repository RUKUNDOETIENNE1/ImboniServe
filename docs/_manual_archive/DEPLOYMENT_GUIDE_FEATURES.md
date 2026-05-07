# Deployment Guide: Split Bill, Tipping & Reservations

**Date:** March 22, 2026  
**Status:** Ready for Deployment  
**Version:** 1.0

---

## 🎯 Features Ready for Production

### ✅ Backend Services (Complete)
1. Split Bill Progress Indicator
2. WhatsApp Auto-Trigger
3. Digital Tipping Phase 1
4. Reservations Phase 1

### ✅ Frontend UI (Complete)
1. Tip Suggestion Modal
2. Split Bill Progress Display
3. Reservation Confirmation Page

### ✅ API Endpoints (Complete)
1. `GET /api/tips/suggestion?saleId=...`
2. `POST /api/tips/record`
3. `GET /api/split-payment/[id]/progress`
4. `POST /api/reservation/[id]/confirm`
5. `POST /api/cron/reservation-reminders`

---

## 📋 Pre-Deployment Checklist

### Environment Variables

Add to `.env`:

```bash
# Cron Job Security
CRON_SECRET=your-random-secret-here-min-32-chars

# WhatsApp (already configured)
WHATSAPP_CLOUD_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...

# SMS (for reservation reminders)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# App URL (for confirmation links)
NEXT_PUBLIC_APP_URL=https://imboni.rw
```

### Database

```bash
# Already pushed - verify schema is synced
npx prisma db push

# Verify new models exist
npx prisma studio
# Check: SplitPaymentWhatsAppTrigger, TipChoice, Reservation fields
```

### Dependencies

All dependencies already installed. Verify:

```bash
npm list lucide-react  # UI icons
npm list next-auth     # Authentication
npm list @prisma/client # Database
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Code

```bash
# Commit all changes
git add .
git commit -m "feat: Add split bill progress, tipping, and reservations"
git push origin main

# Deploy to Vercel/production
vercel --prod
```

### Step 2: Set Up Cron Job

**Option A: Vercel Cron (Recommended)**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reservation-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Option B: External Cron Service**

Use cron-job.org or similar:
- URL: `https://imboni.rw/api/cron/reservation-reminders?secret=YOUR_CRON_SECRET`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Method: POST
- Headers: `x-cron-secret: YOUR_CRON_SECRET`

**Option C: GitHub Actions**

Create `.github/workflows/reservation-reminders.yml`:

```yaml
name: Reservation Reminders
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron
        run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            https://imboni.rw/api/cron/reservation-reminders
```

### Step 3: Enable Features for Pilot Businesses

```sql
-- Enable digital tipping for 5 pilot businesses
UPDATE "Restaurant" 
SET "enableDigitalTipping" = true 
WHERE id IN ('business1', 'business2', 'business3', 'business4', 'business5');

-- Verify
SELECT id, name, "enableDigitalTipping" 
FROM "Restaurant" 
WHERE "enableDigitalTipping" = true;
```

### Step 4: Test in Production

**Test Split Bill Progress:**
```bash
# Create a sale with split payments
# Visit: https://imboni.rw/split-bill/[saleId]
# Verify progress indicator shows correct counts
```

**Test WhatsApp Auto-Trigger:**
```bash
# Create sale with table capacity > 1
# Make partial payment
# Check customer phone for WhatsApp message
# Verify trigger logged in database
```

**Test Digital Tipping:**
```bash
# Complete a payment for enabled business
# Check if tip suggestion appears
# Accept tip and verify StaffTip record created
# Skip tip and verify TipChoice logged
```

**Test Reservations:**
```bash
# Create reservation 2 hours in future
# Wait for cron job (or trigger manually)
# Check customer phone for reminder SMS
# Click confirmation link
# Verify confirmedAt timestamp updated
```

---

## 🔧 Integration Guide

### For Existing Payment Flow

Add tip suggestion after payment completion:

```typescript
// In your payment success handler
import { useState } from 'react';
import TipSuggestionModal from '@/components/TipSuggestionModal';

const [showTipModal, setShowTipModal] = useState(false);
const [tipData, setTipData] = useState(null);

// After payment succeeds
const handlePaymentSuccess = async (saleId: string) => {
  // Fetch tip suggestion
  const response = await fetch(`/api/tips/suggestion?saleId=${saleId}`);
  const data = await response.json();
  
  if (data.enabled && data.suggestion) {
    setTipData(data.suggestion);
    setShowTipModal(true);
  }
};

// Render modal
<TipSuggestionModal
  isOpen={showTipModal}
  onClose={() => setShowTipModal(false)}
  billAmountCents={tipData?.originalAmountCents}
  suggestedAmountCents={tipData?.suggestedAmountCents}
  tipAmountCents={tipData?.tipAmountCents}
  staffName="John"
  currency="RWF"
  onAccept={async () => {
    await fetch('/api/tips/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId,
        accepted: true,
        tipAmountCents: tipData.tipAmountCents,
        staffId: 'staff-id-here'
      })
    });
    setShowTipModal(false);
  }}
  onSkip={async () => {
    await fetch('/api/tips/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId,
        accepted: false
      })
    });
    setShowTipModal(false);
  }}
/>
```

### For Split Bill Page

Add progress indicator:

```typescript
import SplitBillProgress from '@/components/SplitBillProgress';

// In your split bill page
<SplitBillProgress
  saleId={saleId}
  currency="RWF"
  autoRefresh={true}
  refreshInterval={5000}
/>
```

### For WhatsApp Auto-Trigger

Add to split payment creation:

```typescript
import { autoTriggerWhatsAppSplitPaymentOnce } from '@/lib/services/split-payment-whatsapp.service';

// After creating split payment
const result = await autoTriggerWhatsAppSplitPaymentOnce(saleId);

if (result.sent) {
  console.log('WhatsApp split payment link sent');
} else {
  console.log('WhatsApp not sent:', result.reason);
}
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

**Dashboard Queries:**

```sql
-- Tip acceptance rate (last 30 days)
SELECT 
  COUNT(CASE WHEN accepted = true THEN 1 END)::float / COUNT(*) * 100 as acceptance_rate,
  COUNT(*) as total_choices
FROM "TipChoice"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- WhatsApp trigger effectiveness
SELECT 
  COUNT(*) as total_triggers,
  AVG("tablePersonCount") as avg_table_size,
  SUM("unpaidBalanceCents") / 100 as total_unpaid_rwf
FROM "SplitPaymentWhatsAppTrigger"
WHERE "triggeredAt" >= NOW() - INTERVAL '30 days';

-- Reservation confirmation rate
SELECT 
  COUNT(CASE WHEN "confirmedAt" IS NOT NULL THEN 1 END)::float / COUNT(*) * 100 as confirmation_rate,
  COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_shows,
  SUM("forfeitCents") / 100 as total_forfeit_rwf
FROM "Reservation"
WHERE "reminderSentAt" >= NOW() - INTERVAL '30 days';

-- Top tipped staff (last 30 days)
SELECT 
  u.name,
  COUNT(st.id) as tip_count,
  SUM(st."amountCents") / 100 as total_tips_rwf,
  SUM(st."netToStaffCents") / 100 as net_to_staff_rwf,
  SUM(st."platformFeeCents") / 100 as platform_fee_rwf
FROM "StaffTip" st
JOIN "User" u ON st."staffId" = u.id
WHERE st."createdAt" >= NOW() - INTERVAL '30 days'
  AND st.status = 'PAID'
GROUP BY u.id, u.name
ORDER BY total_tips_rwf DESC
LIMIT 10;

-- Split payment completion rates
SELECT 
  COUNT(DISTINCT s.id) as total_sales_with_splits,
  COUNT(DISTINCT CASE WHEN s."isPaid" = true THEN s.id END) as fully_paid,
  COUNT(DISTINCT CASE WHEN s."isPaid" = true THEN s.id END)::float / 
    COUNT(DISTINCT s.id) * 100 as completion_rate
FROM "Sale" s
JOIN "SalePayment" sp ON sp."saleId" = s.id
WHERE s."createdAt" >= NOW() - INTERVAL '30 days';
```

### Error Monitoring

Monitor these endpoints for errors:

```bash
# Check logs for errors
grep "Error" /var/log/app.log | grep -E "(tip|split|reservation)"

# Monitor API response times
# /api/tips/suggestion - should be < 200ms
# /api/split-payment/[id]/progress - should be < 300ms
# /api/reservation/[id]/confirm - should be < 500ms
```

### Alert Thresholds

Set up alerts for:

- **Tip acceptance rate < 10%** - Suggestion amounts may be too high
- **WhatsApp delivery failure > 5%** - Check WhatsApp API status
- **Reservation confirmation rate < 40%** - Reminder message may need improvement
- **Cron job failures** - Check `/api/cron/reservation-reminders` logs

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Tipping Flow

1. Enable tipping for test business
2. Create sale with amount RWF 4,300
3. Complete payment
4. Verify tip modal shows RWF 4,500 suggestion (RWF 200 tip)
5. Accept tip
6. Verify `StaffTip` record created with:
   - `amountCents`: 20000
   - `platformFeeCents`: 500 (2.5%)
   - `netToStaffCents`: 19500
7. Verify `TipChoice` record with `accepted: true`

### Scenario 2: Split Bill with WhatsApp

1. Create sale with table capacity = 4
2. Create split payment for 1 person (RWF 5,000)
3. Verify WhatsApp message sent to customer
4. Check `SplitPaymentWhatsAppTrigger` record created
5. Try to trigger again - should skip (duplicate prevention)
6. Create 3 more split payments
7. Verify progress shows "Paid: 4 of 4 people"

### Scenario 3: Reservation Confirmation

1. Create reservation 2 hours in future
2. Trigger cron manually: `POST /api/cron/reservation-reminders`
3. Verify reminder SMS sent
4. Check `reminderSentAt` timestamp updated
5. Click confirmation link
6. Verify `confirmedAt` timestamp updated
7. Verify status changed to `CONFIRMED`

### Scenario 4: No-Show Handling

1. Create reservation with deposit RWF 10,000
2. Send reminder (2 hours before)
3. Don't confirm
4. After reservation time passes, call `handleNoShow()`
5. Verify `forfeitCents` = 5000 (50%)
6. Verify `noShowReason` = "Unconfirmed after reminder - 50% forfeit"

---

## 🔒 Security Considerations

### API Endpoint Security

All endpoints require authentication except:
- `POST /api/reservation/[id]/confirm` - Public confirmation link
- `POST /api/cron/reservation-reminders` - Protected by CRON_SECRET

### Data Privacy

- Customer phone numbers encrypted at rest
- WhatsApp messages sent via secure API
- Tip amounts visible only to staff and business owner
- Reservation confirmations use unique, non-guessable IDs

### Rate Limiting

Implement rate limiting for:
- `/api/tips/record` - Max 10 requests/minute per user
- `/api/reservation/[id]/confirm` - Max 5 requests/minute per IP
- `/api/cron/reservation-reminders` - Max 1 request/5 minutes

---

## 🐛 Troubleshooting

### Issue: Tip modal not showing

**Check:**
1. Is `enableDigitalTipping` true for business?
2. Is tip suggestion API returning data?
3. Check browser console for errors

**Fix:**
```sql
-- Enable tipping
UPDATE "Restaurant" SET "enableDigitalTipping" = true WHERE id = 'business-id';
```

### Issue: WhatsApp not sending

**Check:**
1. Table capacity > 1?
2. Unpaid balance exists?
3. Already triggered?
4. Customer has phone number?

**Debug:**
```typescript
const conditions = await checkWhatsAppTriggerConditions(saleId);
console.log('Trigger conditions:', conditions);
```

### Issue: Reservation reminders not sending

**Check:**
1. Is cron job running?
2. Check cron endpoint logs
3. Verify `reservedAt` is exactly 2 hours away

**Test manually:**
```bash
curl -X POST \
  -H "x-cron-secret: YOUR_SECRET" \
  https://imboni.rw/api/cron/reservation-reminders
```

### Issue: Confirmation link not working

**Check:**
1. Is reservation ID valid?
2. Is reservation already confirmed?
3. Is reservation cancelled?

**Debug:**
```sql
SELECT id, status, "confirmedAt", "reminderSentAt" 
FROM "Reservation" 
WHERE id = 'reservation-id';
```

---

## 📈 Gradual Rollout Plan

### Week 1: Pilot (5-10 businesses)

- Enable features for selected businesses
- Monitor metrics daily
- Collect feedback
- Fix critical bugs

**Success Criteria:**
- 0 critical errors
- Tip acceptance rate > 15%
- WhatsApp delivery rate > 95%
- Reservation confirmation rate > 50%

### Week 2-3: Expanded Pilot (50 businesses)

- Enable for more businesses
- Optimize based on Week 1 data
- Refine messaging
- Improve UI based on feedback

**Success Criteria:**
- Tip acceptance rate > 20%
- Split payment completion rate > 80%
- Reservation no-show rate < 20%

### Week 4+: Full Rollout

- Enable for all businesses
- Monitor system performance
- Scale infrastructure if needed
- Continue optimization

**Success Criteria:**
- System uptime > 99.5%
- All metrics stable or improving
- Positive user feedback

---

## 💰 Revenue Tracking

### Monthly Revenue Report Query

```sql
-- Platform revenue from new features (last 30 days)
WITH tip_revenue AS (
  SELECT SUM("platformFeeCents") / 100 as tip_fees_rwf
  FROM "StaffTip"
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    AND status = 'PAID'
),
split_revenue AS (
  SELECT 
    COUNT(*) * 10000 * 0.015 as split_fees_rwf  -- Assuming avg RWF 10k per split, 1.5% fee
  FROM "SalePayment"
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    AND status = 'PAID'
),
reservation_revenue AS (
  SELECT SUM("forfeitCents") / 100 as forfeit_rwf
  FROM "Reservation"
  WHERE status = 'NO_SHOW'
    AND "createdAt" >= NOW() - INTERVAL '30 days'
)
SELECT 
  t.tip_fees_rwf,
  s.split_fees_rwf,
  r.forfeit_rwf,
  (t.tip_fees_rwf + s.split_fees_rwf + r.forfeit_rwf) as total_new_revenue_rwf
FROM tip_revenue t, split_revenue s, reservation_revenue r;
```

---

## ✅ Post-Deployment Checklist

### Day 1
- [ ] Verify all API endpoints responding
- [ ] Check cron job executed successfully
- [ ] Monitor error logs
- [ ] Test one complete flow for each feature

### Week 1
- [ ] Review tip acceptance rates
- [ ] Check WhatsApp delivery rates
- [ ] Monitor reservation confirmation rates
- [ ] Collect user feedback
- [ ] Fix any critical bugs

### Month 1
- [ ] Analyze revenue impact
- [ ] Review system performance
- [ ] Optimize based on data
- [ ] Plan Phase 2 enhancements

---

## 🚀 Next Phase Features

### Digital Tipping Phase 2
- Staff avatars and photos
- Performance-based tip suggestions
- Custom tip amounts
- Tip history and leaderboards

### Split Bill Phase 2
- Live shared cart (real-time polling)
- Item-level splitting
- Multiple payment methods per split

### Reservations Phase 2
- Forfeit dispute resolution
- Admin override interface
- Advanced analytics dashboard
- Automated no-show handling

---

## 📞 Support & Escalation

### Critical Issues
Contact: dev-team@imboni.rw
Response Time: < 1 hour

### Non-Critical Issues
Contact: support@imboni.rw
Response Time: < 24 hours

### Feature Requests
Submit via: GitHub Issues or Notion board

---

## 📚 Additional Resources

- **API Documentation:** `/docs/api`
- **Component Storybook:** `/storybook`
- **Database Schema:** `prisma/schema.prisma`
- **Service Documentation:** 
  - `src/lib/services/digital-tipping.service.ts`
  - `src/lib/services/split-payment-whatsapp.service.ts`
  - `src/lib/services/reservation-reminder.service.ts`

---

**Deployment Status:** ✅ READY  
**Documentation:** ✅ COMPLETE  
**Testing:** ⏳ PENDING PRODUCTION  
**Rollout:** ⏳ PENDING PILOT

**All systems ready for production deployment!** 🚀
