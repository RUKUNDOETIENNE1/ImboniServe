# InTouch Payment Integration Guide

## ✅ Implementation Complete

The InTouch provider has been implemented according to the official API documentation.

---

## API Specification Compliance

### ✅ RequestPayment API

**Endpoint:** `POST https://www.intouchpay.co.rw/api/requestpayment/`

**Request Format:** HTTP Form POST (application/x-www-form-urlencoded)

**Parameters:**
- ✅ `username` - InTouch account username
- ✅ `timestamp` - UTC timestamp in format `yyyymmddhhmmss`
- ✅ `amount` - Amount in RWF (no cents)
- ✅ `password` - SHA256(username + accountno + partnerpassword + timestamp)
- ✅ `mobilephone` - Phone number (format: 250788123456, no +)
- ✅ `requesttransactionid` - Unique transaction ID from our system
- ✅ `accountno` - InTouch account number
- ✅ `callbackurl` - Webhook URL for payment status updates

**Response:**
```json
{
  "status": "Pending",
  "requesttransactionid": "IMBONI-xxx-1234567890",
  "success": true,
  "responsecode": "1000",
  "transactionid": 1425,
  "message": "Transaction Pending"
}
```

### ✅ Webhook Callback

**InTouch sends to:** Your `callbackurl`

**Format:** HTTP POST with JSON payload

**Payload:**
```json
{
  "jsonpayload": {
    "requesttransactionid": "IMBONI-xxx-1234567890",
    "transactionid": "6004994884",
    "responsecode": "01",
    "status": "Successfull",
    "statusdesc": "Successfully Processed Transaction",
    "referenceno": "312333883"
  }
}
```

**Optional Authentication:**
- Basic Auth: `requests.post(url, auth=(username, password))`
- Configured via `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD`

---

## Environment Variables

Add to `.env.local` or Vercel:

```bash
# InTouch API Configuration
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="your-username"
INTOUCH_ACCOUNT_NO="your-account-number"
INTOUCH_PARTNER_PASSWORD="your-partner-password"
INTOUCH_CALLBACK_URL="https://imboniserve.com/api/webhooks/intouch"

# Optional: Webhook Basic Auth
INTOUCH_WEBHOOK_USERNAME="webhook-user"
INTOUCH_WEBHOOK_PASSWORD="webhook-password"
```

---

## Payment Flow

### 1. **User Initiates Payment**

```typescript
POST /api/subscriptions/initiate-payment
{
  "planId": "plan_xxx",
  "billingCycle": "MONTHLY",
  "paymentMethod": "MOBILE_MONEY_MTN",
  "customerPhone": "+250788123456"
}
```

**What happens:**
1. Generate unique `requesttransactionid`
2. Generate UTC timestamp
3. Generate password: `SHA256(username + accountno + partnerpassword + timestamp)`
4. Send form POST to InTouch `/requestpayment/`
5. InTouch returns `status: "Pending"` with `transactionid`
6. Save transaction in database with status `INITIATED`

### 2. **Customer Completes Payment**

1. Customer receives SMS/USSD push on their phone
2. Customer dials `*182#` (MTN) or similar (Airtel)
3. Selects pending approvals
4. Enters PIN to approve payment

### 3. **InTouch Sends Webhook**

```
POST https://imboniserve.com/api/webhooks/intouch
Content-Type: application/json

{
  "jsonpayload": {
    "requesttransactionid": "IMBONI-xxx-1234567890",
    "transactionid": "6004994884",
    "responsecode": "01",
    "status": "Successfull",
    "statusdesc": "Successfully Processed Transaction",
    "referenceno": "312333883"
  }
}
```

**Webhook handler:**
1. Validates basic auth (if configured)
2. Extracts `jsonpayload`
3. Finds transaction by `requesttransactionid`
4. Updates status to `COMPLETED`
5. Activates subscription
6. Returns 200 OK

### 4. **User Checks Payment Status**

```typescript
POST /api/subscriptions/verify-payment
{
  "transactionId": "txn_xxx"
}
```

**For InTouch:**
- Checks database status (updated by webhook)
- Returns current status
- Activates subscription if not already activated

---

## Testing

### Sandbox Credentials

Contact InTouch support to get sandbox credentials:
- Email: support@intouchpay.co.rw
- Website: https://www.intouchpay.co.rw

### Test Flow

1. **Set sandbox credentials** in `.env.local`

2. **Expose webhook endpoint** (development):
   ```bash
   ngrok http 3000
   ```
   Update `INTOUCH_CALLBACK_URL` to ngrok URL

3. **Initiate test payment:**
   ```bash
   curl -X POST http://localhost:3000/api/subscriptions/initiate-payment \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION" \
     -d '{
       "planId": "plan_xxx",
       "billingCycle": "MONTHLY",
       "paymentMethod": "MOBILE_MONEY_MTN",
       "customerPhone": "+250788123456"
     }'
   ```

4. **Check phone** for payment prompt

5. **Approve payment** on phone

6. **Webhook received** - check logs:
   ```
   [InTouch Webhook] Received: { jsonpayload: { ... } }
   [InTouch Webhook] Parsed: { transactionId: ..., status: SUCCESS }
   [Subscription Payment] Subscription activated: sub_xxx
   ```

7. **Verify status:**
   ```bash
   curl -X POST http://localhost:3000/api/subscriptions/verify-payment \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION" \
     -d '{"transactionId": "txn_xxx"}'
   ```

---

## Key Implementation Details

### Password Generation

```typescript
// Format: SHA256(username + accountno + partnerpassword + timestamp)
const concatenated = username + accountNo + partnerPassword + timestamp
const password = crypto.createHash('sha256').update(concatenated).digest('hex')
```

### Timestamp Format

```typescript
// yyyymmddhhmmss in UTC
const now = new Date()
const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`
// Example: 20161231115242
```

### Phone Number Format

```typescript
// Remove + and spaces: +250 788 123 456 → 250788123456
const mobilephone = customerPhone.replace(/^\+/, '').replace(/\s/g, '')
```

### Amount Format

```typescript
// Convert cents to RWF (no decimals)
const amount = Math.round(amountCents / 100)
// Example: 50000 cents → 500 RWF
```

### Status Mapping

| InTouch Status | Our Status | Description |
|---|---|---|
| `Pending` | `PROCESSING` | Awaiting customer approval |
| `Successfull` | `SUCCESS` | Payment completed |
| `Successful` | `SUCCESS` | Payment completed (alt spelling) |
| `Failed` | `FAILED` | Payment failed |
| `Cancelled` | `CANCELLED` | Payment cancelled |

---

## Webhook Security

### Option 1: Basic Auth (Recommended)

Configure in InTouch dashboard:
```
Callback URL: https://username:password@imboniserve.com/api/webhooks/intouch
```

Or set environment variables:
```bash
INTOUCH_WEBHOOK_USERNAME="webhook-user"
INTOUCH_WEBHOOK_PASSWORD="strong-password-here"
```

### Option 2: IP Whitelisting

Add InTouch's IP addresses to your firewall/CDN.

### Option 3: Request Validation

Webhook handler validates:
- Transaction exists in database
- `requesttransactionid` matches our records
- Idempotency (ignore duplicates)

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|---|---|---|
| `CONFIG_ERROR` | Missing credentials | Set `INTOUCH_USERNAME`, `INTOUCH_ACCOUNT_NO`, `INTOUCH_PARTNER_PASSWORD` |
| `HTTP_ERROR` | API unreachable | Check `INTOUCH_API_URL`, network connectivity |
| `PAYMENT_FAILED` | Customer declined | User needs to retry payment |
| `Transaction not found` | Invalid webhook | Check `requesttransactionid` format |

### Retry Logic

- InTouch retries webhook delivery if we return non-200 status
- Our webhook handler returns 200 even for unknown transactions (prevents infinite retries)
- Failed payments can be retried by initiating new payment

---

## Production Checklist

- [ ] Get production credentials from InTouch
- [ ] Set production `INTOUCH_API_URL` (if different from sandbox)
- [ ] Configure webhook URL in InTouch dashboard
- [ ] Set up webhook basic auth
- [ ] Test with small amount first
- [ ] Monitor webhook logs
- [ ] Set up alerting for failed payments
- [ ] Configure Vercel cron for subscription reminders
- [ ] Test full flow: initiate → approve → webhook → activation

---

## Differences from Initial Implementation

### ✅ Fixed

1. **API Endpoint:** Changed from generic `/api` to `/api/requestpayment/`
2. **Request Format:** Changed from JSON to form-urlencoded
3. **Password Generation:** Implemented SHA256(username+accountno+partnerpassword+timestamp)
4. **Timestamp:** Added UTC timestamp in yyyymmddhhmmss format
5. **Parameter Names:** Updated to match docs (mobilephone, requesttransactionid, accountno)
6. **Callback URL:** Added callbackurl parameter
7. **Webhook Format:** Handle jsonpayload wrapper
8. **Status Check:** Removed (InTouch uses webhook-only)
9. **Basic Auth:** Added webhook authentication support

---

## Next Steps

1. **Get InTouch Credentials** - Contact support for sandbox/production access
2. **Test Payment Flow** - Use ngrok for local webhook testing
3. **Deploy to Vercel** - Set environment variables
4. **Configure Webhook** - Set callback URL in InTouch dashboard
5. **Monitor & Iterate** - Watch logs, handle edge cases

---

## Support

- **InTouch Support:** support@intouchpay.co.rw
- **Documentation:** This file + `docs/PAYMENT_SYSTEM.md`
- **Code:** `src/lib/payments/providers/intouch.provider.ts`
