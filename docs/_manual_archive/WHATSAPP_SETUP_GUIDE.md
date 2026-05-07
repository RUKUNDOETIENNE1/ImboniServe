# WhatsApp Staff-Assisted Ordering Setup Guide

## Overview
Enable staff to take orders via WhatsApp and send them directly to the kitchen.

---

## Prerequisites
- Twilio account (https://www.twilio.com/console)
- WhatsApp Business API access (via Twilio)

---

## Step 1: Twilio Account Setup

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/try-twilio
   - Create account and verify email/phone

2. **Get Account Credentials**
   - Go to Console Dashboard
   - Copy **Account SID**
   - Copy **Auth Token**

3. **Get WhatsApp Number**
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow sandbox setup instructions
   - Copy WhatsApp number (e.g., `whatsapp:+14155238886`)

---

## Step 2: Configure Environment Variables

Add to `.env`:

```env
TWILIO_ACCOUNT_SID="your_account_sid_here"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

---

## Step 3: Configure Webhook

1. **Get Your Webhook URL**
   - Production: `https://yourdomain.com/api/webhooks/twilio/whatsapp`
   - Development: Use ngrok for testing
     ```bash
     ngrok http 3000
     ```
   - Copy ngrok URL: `https://abc123.ngrok.io/api/webhooks/twilio/whatsapp`

2. **Set Webhook in Twilio**
   - Go to Twilio Console > Messaging > Settings > WhatsApp Sandbox Settings
   - Under "When a message comes in", paste your webhook URL
   - Method: POST
   - Save

---

## Step 4: Register Staff Phone Numbers

Staff must be registered in the system with their phone numbers:

1. Go to Dashboard > Staff
2. Add staff member with phone number (format: +250788123456)
3. Assign role: WAITER, CASHIER, MANAGER, or OWNER

---

## Step 5: WhatsApp Sandbox Activation (Development)

Each staff member must join the WhatsApp sandbox:

1. Send WhatsApp message to Twilio sandbox number
2. Message: `join [your-sandbox-code]`
3. Example: `join happy-tiger`
4. Wait for confirmation

---

## Step 6: Test Order Flow

**Basic order (staff sends):**
```
ORDER T5 2x Brochette, 1x Primus
```

**With per-item instructions (staff sends):**
```
ORDER T5 2x Brochette [no onions], 1x Primus
```

**With order-level notes (staff sends):**
```
ORDER T5 2x Brochette, 1x Primus NOTES: pack to-go
```

**With both (staff sends):**
```
ORDER T5 2x Brochette [no onions; extra spicy], 1x Primus NOTES: agaceri gake
```

**System responds:**
```
✅ Order confirmed!

📍 Table: T5
🆔 Order: #abc12345

Items:
2x Brochette - RWF 3,000
1x Primus - RWF 1,500

💰 Total: RWF 4,500

Order sent to kitchen 🍳
```

---

## Order Format Rules

### Valid Formats:
- `ORDER T5 2x Brochette, 1x Primus`
- `ORDER T5 2 Brochette, 1 Primus`
- `ORDER T5 Brochette, Primus` (defaults to 1x each)

### Table Identifiers:
- Table number: `T5`, `T10`, `TABLE5`
- Any string matching table number or QR code

### Item Matching:
- Fuzzy matching enabled
- Case-insensitive
- Partial names work: "Broch" matches "Brochette"

---

## Staff Notifications

When order is ready, staff receives:
```
🔔 Order Ready!

📍 Table: T5
🆔 Order: #abc12345

Items ready to serve:
2x Brochette
1x Primus
```

---

## Troubleshooting

### "Unauthorized" Error
- Staff phone not registered in system
- Check phone format: +250788123456
- Verify staff has WAITER/CASHIER/MANAGER/OWNER role

### "Table not found" Error
- Table number doesn't exist
- Check table setup in Dashboard > Tables
- Verify table number matches

### "No menu items matched" Error
- Item names don't match menu
- Check menu item availability
- Use exact or partial item names

### Webhook Not Receiving Messages
- Verify webhook URL in Twilio console
- Check ngrok is running (development)
- Verify webhook endpoint is accessible
- Check Twilio logs for errors

### Messages Not Sending
- Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
- Check Twilio account balance
- Verify WhatsApp number format

---

## Production Deployment

### 1. WhatsApp Business API
- Apply for WhatsApp Business API access
- Get approved phone number
- Update TWILIO_WHATSAPP_NUMBER

### 2. Webhook URL
- Use production domain
- Ensure HTTPS enabled
- Update webhook in Twilio console

### 3. Staff Onboarding
- No sandbox join required in production
- Staff can message directly
- Provide training on order format

---

## Cost Estimates

**Twilio Pricing (as of 2026):**
- WhatsApp messages: $0.005 per message
- Estimated: 100 orders/day = 200 messages = $1/day = $30/month

**Free Tier:**
- $15 trial credit
- ~3,000 messages free

---

## Security Best Practices

1. **Signature Verification**
   - Webhook validates Twilio signature
   - Prevents unauthorized requests

2. **Staff Authentication**
   - Only registered staff can create orders
   - Phone number verification

3. **Environment Variables**
   - Never commit credentials to git
   - Use .env for secrets

---

## Monitoring

### Check Order Status
Staff can query: `STATUS #abc12345`

### View Logs
- Twilio Console > Monitor > Logs
- Application logs: Check server logs for WhatsApp service

### Metrics to Track
- Orders per day via WhatsApp
- Average response time
- Error rate
- Staff adoption rate

---

## Support

**Twilio Support:**
- https://support.twilio.com
- support@twilio.com

**Imboni Serve Support:**
- dev@imboni.serve
- +250788917126

---

**Last Updated:** March 15, 2026  
**Version:** 1.0
