# 🎁 Referral & Rewards System Documentation

## Overview

Complete affiliate marketing system with welcome bonuses, commission tracking, table invite rewards, and fraud prevention.

---

## 📊 System Architecture

### **Core Components**

1. **Referral Tracking Service** (`src/lib/services/referral-tracking.service.ts`)
   - Click tracking
   - Welcome bonus distribution
   - Commission calculation
   - Monthly earnings aggregation

2. **Fraud Detection Service** (`src/lib/services/fraud-detection.service.ts`)
   - IP-based abuse detection
   - Device fingerprinting
   - Bot detection
   - Self-referral prevention

3. **Table Invite Service** (`src/lib/services/table-invite.service.ts`)
   - Invite code generation
   - Invite acceptance tracking
   - Reward qualification checking

---

## 🗄️ Database Schema

### **New Tables**

#### `ReferralClick`
Tracks every click on a referral link
```prisma
- id: Unique identifier
- referralLinkId: Which link was clicked
- ipAddress: Visitor IP (for fraud detection)
- userAgent: Browser info
- deviceId: Browser fingerprint
- clickedAt: Timestamp
- convertedAt: When they signed up (null if not yet)
- customerId: Set when conversion happens
- orderId: First order that converted
```

#### `ReferralReward`
Tracks all types of rewards
```prisma
- id: Unique identifier
- referralLinkId: Who earned it
- customerId: Who it's for
- type: "WELCOME_BONUS" | "COMMISSION" | "MILESTONE"
- amountCents: Reward amount
- status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
- triggeredBy: Order ID or event
- description: Human-readable
- approvedAt, paidAt, rejectedAt: Timestamps
```

#### `AffiliateEarnings`
Monthly aggregated earnings
```prisma
- id: Unique identifier
- referralLinkId: Affiliate
- month: "2026-04" format
- totalEarnings: Sum of all rewards
- orderCount: Number of orders
- conversionCount: Number of signups
- commissionRate: 5% default
- status: "PENDING" | "APPROVED" | "PAID"
- paidAt: When paid out
- paymentMethod: "MOMO" | "BANK_TRANSFER"
- paymentRef: Transaction reference
```

#### `TableSessionInvite`
Table sharing invites
```prisma
- id: Unique identifier
- sessionId: Table session
- inviterId: Who sent invite
- inviteeId: Who accepted (null until accepted)
- inviteCode: Unique 8-char code
- status: "PENDING" | "ACCEPTED" | "EXPIRED"
- rewardCents: 500 RWF default
- rewardStatus: "PENDING" | "EARNED" | "PAID"
- expiresAt: 24 hours from creation
- acceptedAt: When invite was accepted
```

#### `FraudDetectionLog`
Audit trail for fraud detection
```prisma
- id: Unique identifier
- entityType: "REFERRAL_CLICK" | "SIGNUP" | "ORDER"
- entityId: ID of the entity
- riskScore: 0.0 to 1.0
- riskFactors: Array of detected issues
- action: "ALLOWED" | "FLAGGED" | "BLOCKED"
- ipAddress, deviceId: For tracking
- metadata: Additional context
```

---

## 🔄 User Flows

### **Flow 1: Customer Referral (Smart Dining Slip)**

1. **Customer Orders & Pays**
   - Order completed successfully
   - Smart Dining Slip generated with referral link

2. **Customer Shares Slip**
   - PDF shows: `imboniserve.com/r/ABC123`
   - QR code embedded in slip
   - Clear "Share & Earn 500 RWF" messaging

3. **Friend Clicks Link**
   - Redirected to `/api/r/ABC123`
   - Click tracked in `ReferralClick` table
   - Fraud check performed (IP, device, user agent)
   - Cookie set: `referral_code=ABC123` (30 days)
   - Redirected to home page

4. **Friend Signs Up & Orders**
   - Places first order
   - System checks for `referral_code` cookie
   - **Welcome Bonus Awarded:**
     - 500 RWF to new customer
     - 500 RWF to referrer (as DiningCredit)
   - `ReferralClick` marked as converted

5. **Commission on Future Orders**
   - Every order from referred customer
   - 5% commission to referrer
   - Tracked in `ReferralReward` table
   - Status: APPROVED (if not flagged) or PENDING (if suspicious)

---

### **Flow 2: Table Invite (Share Your Table)**

1. **Customer Orders at Table**
   - Scans QR code, joins table session
   - Places order, completes payment

2. **Customer Clicks "Share Table Link"**
   - Frontend calls `/api/session/generate-invite`
   - Backend generates unique 8-char code
   - Returns shareable URL: `/t/{tableId}?invite=XYZ12345`

3. **Friend Receives Invite**
   - Clicks link
   - Redirected to table menu
   - URL contains `invite=XYZ12345` parameter

4. **Friend Joins Table**
   - Scans QR or uses link
   - Calls `/api/session/join` with `inviteCode`
   - Backend:
     - Validates invite (not expired, not used)
     - Creates participant
     - Marks invite as ACCEPTED
     - Checks if inviter has 2+ accepted invites

5. **Reward Qualification**
   - If inviter has 2+ accepted invites:
     - Mark invites as EARNED
     - Apply 10% discount to inviter's next order
   - Tracked in `TableSessionInvite` table

---

## 🛡️ Fraud Prevention

### **Risk Factors & Scores**

| Risk Factor | Severity | Score | Threshold |
|-------------|----------|-------|-----------|
| 5+ clicks from same IP (24h) | HIGH | 0.4 | Block at 0.8 |
| 3+ clicks from same device (24h) | CRITICAL | 0.6 | Flag at 0.5 |
| Bot user agent detected | HIGH | 0.5 | |
| 3+ signups from same IP (24h) | CRITICAL | 0.7 | |
| Duplicate phone number | HIGH | 0.6 | |
| Order < 5,000 RWF | MEDIUM | 0.3 | |
| 5+ orders in 24h | HIGH | 0.5 | |
| Order within 5 min of signup | MEDIUM | 0.3 | |
| Same IP for referrer & referee | CRITICAL | 0.8 | |

### **Actions**

- **ALLOWED** (score < 0.5): Process normally
- **FLAGGED** (0.5 ≤ score < 0.8): Process but mark for review
- **BLOCKED** (score ≥ 0.8): Reject the action

### **Fraud Detection Checks**

1. **On Referral Click:**
   - IP abuse (max 5 clicks/day)
   - Device abuse (max 3 clicks/day)
   - Bot detection

2. **On Signup:**
   - Multiple signups from same IP
   - Duplicate phone number
   - Rapid signups from same device

3. **On Order:**
   - Minimum order value (5,000 RWF)
   - Order frequency abuse
   - Rapid conversion (< 5 min after signup)
   - Same IP as referrer

---

## 📡 API Endpoints

### **Referral Link Redirect**
```
GET /api/r/{code}
```
- Tracks click
- Sets referral cookie
- Redirects to home page

**Response:** 302 redirect

---

### **Generate Table Invite**
```
POST /api/session/generate-invite
Body: {
  sessionId: string
  inviterId: string
}
```

**Response:**
```json
{
  "inviteCode": "XYZ12345",
  "shareUrl": "https://imboniserve.com/t/abc123?invite=XYZ12345"
}
```

---

### **Join Table Session (with invite)**
```
POST /api/session/join
Body: {
  tableId: string
  tempId: string
  name?: string
  inviteCode?: string  // NEW
}
```

**Response:**
```json
{
  "sessionId": "...",
  "participantId": "...",
  "tableName": "Table 5",
  "participantName": "Guest 1",
  "isNewSession": false
}
```

---

### **Referral Dashboard**
```
GET /api/referrals/dashboard?code={referralCode}
```

**Response:**
```json
{
  "referralLink": {
    "id": "...",
    "code": "ABC123",
    "clickCount": 150,
    "signupCount": 12,
    "qualifiedCount": 8
  },
  "stats": {
    "totalClicks": 150,
    "totalSignups": 12,
    "totalQualified": 8,
    "totalEarnings": 125000,  // 1,250 RWF
    "pendingEarnings": 25000,  // 250 RWF
    "recentClicks": 15
  },
  "monthlyEarnings": [
    {
      "month": "2026-04",
      "totalEarnings": 75000,
      "orderCount": 15,
      "conversionCount": 3,
      "status": "PENDING"
    }
  ]
}
```

---

## 💰 Reward Structure

### **Welcome Bonus**
- **Amount:** 500 RWF
- **Trigger:** First order from referred customer
- **Recipients:** 
  - New customer: 500 RWF (as ReferralReward)
  - Referrer: 500 RWF (as DiningCredit, 90-day expiry)
- **Status:** Auto-approved (unless flagged)

### **Commission**
- **Rate:** 5% of order total
- **Trigger:** Every order from referred customer
- **Recipient:** Referrer
- **Status:** 
  - APPROVED (if fraud score < 0.5)
  - PENDING (if fraud score ≥ 0.5)

### **Table Invite Reward**
- **Amount:** 10% discount on next order
- **Trigger:** 2+ friends accept invite and join table
- **Recipient:** Inviter
- **Status:** EARNED when qualification met

---

## 🧪 Testing Guide

### **Test 1: Referral Link Click & Tracking**

1. Get a referral code from database:
   ```sql
   SELECT code FROM "ReferralLink" LIMIT 1;
   ```

2. Visit: `http://localhost:3000/api/r/{code}`

3. Check cookie is set:
   ```
   referral_code={code}
   ```

4. Verify click tracked:
   ```sql
   SELECT * FROM "ReferralClick" 
   WHERE "referralLinkId" = (SELECT id FROM "ReferralLink" WHERE code = '{code}')
   ORDER BY "clickedAt" DESC LIMIT 1;
   ```

---

### **Test 2: Welcome Bonus**

1. Click referral link (sets cookie)

2. Sign up as new customer

3. Place first order (> 5,000 RWF)

4. Check rewards created:
   ```sql
   SELECT * FROM "ReferralReward" 
   WHERE "customerId" = '{customerId}'
   AND type = 'WELCOME_BONUS';
   ```

5. Check DiningCredit for referrer:
   ```sql
   SELECT * FROM "DiningCredit" 
   WHERE "referralLinkId" = (SELECT id FROM "ReferralLink" WHERE code = '{code}')
   ORDER BY "createdAt" DESC LIMIT 1;
   ```

---

### **Test 3: Commission Tracking**

1. Place second order from referred customer

2. Check commission reward:
   ```sql
   SELECT * FROM "ReferralReward" 
   WHERE type = 'COMMISSION'
   AND "triggeredBy" = '{orderId}';
   ```

3. Verify amount is 5% of order total

---

### **Test 4: Table Invite**

1. Join a table session

2. Generate invite:
   ```bash
   curl -X POST http://localhost:3000/api/session/generate-invite \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "...", "inviterId": "..."}'
   ```

3. Use invite code to join as second participant

4. Check invite status:
   ```sql
   SELECT * FROM "TableSessionInvite" 
   WHERE "inviteCode" = '{code}';
   ```

5. Repeat with third participant

6. Check reward qualification:
   ```sql
   SELECT COUNT(*) as accepted_count 
   FROM "TableSessionInvite" 
   WHERE "inviterId" = '{participantId}' 
   AND status = 'ACCEPTED';
   ```

---

### **Test 5: Fraud Detection**

1. Click same referral link 6 times from same IP

2. Check fraud log:
   ```sql
   SELECT * FROM "FraudDetectionLog" 
   WHERE "entityType" = 'REFERRAL_CLICK'
   AND action = 'BLOCKED'
   ORDER BY "createdAt" DESC LIMIT 1;
   ```

3. Verify 6th click was blocked

---

## 🚀 Deployment Checklist

- [ ] Run setup script: `.\scripts\setup-referral-system.ps1`
- [ ] Verify all tables created in database
- [ ] Test referral link redirect
- [ ] Test welcome bonus flow
- [ ] Test commission tracking
- [ ] Test table invite generation
- [ ] Test fraud detection
- [ ] Configure APP_URL environment variable
- [ ] Set up monitoring for fraud detection logs
- [ ] Create admin dashboard for reviewing flagged rewards

---

## 📈 Monitoring & Analytics

### **Key Metrics to Track**

1. **Referral Performance**
   - Click-to-signup conversion rate
   - Signup-to-order conversion rate
   - Average commission per referred customer
   - Total referral revenue

2. **Fraud Detection**
   - Block rate (% of actions blocked)
   - Flag rate (% of actions flagged)
   - False positive rate (manual review)

3. **Table Invites**
   - Invite acceptance rate
   - Average invites per session
   - Reward qualification rate

### **SQL Queries**

**Referral Conversion Funnel:**
```sql
SELECT 
  COUNT(DISTINCT rc.id) as total_clicks,
  COUNT(DISTINCT CASE WHEN rc."convertedAt" IS NOT NULL THEN rc.id END) as conversions,
  COUNT(DISTINCT rr.id) as rewards_earned
FROM "ReferralClick" rc
LEFT JOIN "ReferralReward" rr ON rc."customerId" = rr."customerId"
WHERE rc."clickedAt" >= NOW() - INTERVAL '30 days';
```

**Top Performing Referrers:**
```sql
SELECT 
  rl.code,
  rl."clientName",
  rl."signupCount",
  rl."qualifiedCount",
  SUM(rr."amountCents") as total_earnings
FROM "ReferralLink" rl
LEFT JOIN "ReferralReward" rr ON rl.id = rr."referralLinkId"
WHERE rr.status IN ('APPROVED', 'PAID')
GROUP BY rl.id
ORDER BY total_earnings DESC
LIMIT 10;
```

**Fraud Detection Stats:**
```sql
SELECT 
  action,
  COUNT(*) as count,
  AVG("riskScore") as avg_risk_score
FROM "FraudDetectionLog"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY action;
```

---

## 🔧 Troubleshooting

### **Issue: TypeScript errors about missing Prisma models**

**Solution:** Run `npx prisma generate` to regenerate the Prisma client

---

### **Issue: Referral cookie not being set**

**Check:**
1. Verify `/api/r/{code}` endpoint is working
2. Check browser console for errors
3. Verify cookie settings (HttpOnly, SameSite)

---

### **Issue: Welcome bonus not awarded**

**Debug:**
1. Check if referral cookie exists
2. Verify customer is making first order
3. Check fraud detection log for blocks
4. Verify order total > 5,000 RWF

---

### **Issue: Commission not tracked**

**Debug:**
1. Verify customer was referred (check ReferralClick)
2. Check fraud detection log
3. Verify order completed successfully
4. Check ReferralReward table for PENDING status

---

## 📞 Support

For issues or questions:
1. Check fraud detection logs: `SELECT * FROM "FraudDetectionLog" ORDER BY "createdAt" DESC LIMIT 50`
2. Review service logs in console
3. Verify database schema is up to date
4. Test with fresh browser session (clear cookies)

---

**Last Updated:** April 2026
**Version:** 1.0.0
