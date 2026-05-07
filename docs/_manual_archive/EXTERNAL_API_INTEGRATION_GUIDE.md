# External API Integration Guide

## Overview
Imboni Resto integrates with three critical external services:
1. **IremboPay** - Payment processing (MTN Mobile Money, Airtel Money, Card payments)
2. **WhatsApp Business API** - Customer notifications and Smart Dining Slip™ delivery
3. **Rwanda Revenue Authority (RRA) EBM** - Electronic Billing Machine compliance

---

## 1. IremboPay Integration

### Purpose
- Process digital payments (MTN MoMo, Airtel Money, Card)
- Generate payment invoices with QR codes
- Handle webhook callbacks for payment status updates
- Apply 5% digital convenience fee (configurable per business)

### Required Environment Variables
```env
IREMBO_API_KEY=your_api_key_here
IREMBO_API_SECRET=your_api_secret_here
IREMBO_BASE_URL=https://api.irembo.com/v1
IREMBO_WEBHOOK_SECRET=your_webhook_secret_here
```

### Setup Steps
1. **Register with IremboPay**
   - Visit https://irembo.com/business
   - Complete KYC verification
   - Obtain API credentials from dashboard

2. **Configure Webhook URL**
   - Set webhook URL: `https://yourdomain.com/api/payments/irembo/webhook`
   - Webhook receives payment status updates (PENDING, COMPLETED, FAILED)
   - Signature verification using HMAC-SHA256

3. **Test Integration**
   ```bash
   # Test invoice creation
   curl -X POST https://yourdomain.com/api/payments/irembo/create-invoice \
     -H "Content-Type: application/json" \
     -d '{
       "businessId": "your_business_id",
       "amountRWF": 5000,
       "description": "Test Payment"
     }'
   ```

### Implementation Files
- `src/lib/services/irembopay.service.ts` - Core service
- `src/pages/api/payments/irembo/create-invoice.ts` - Invoice creation
- `src/pages/api/payments/irembo/initiate-momo.ts` - MoMo push payments
- `src/pages/api/payments/irembo/webhook.ts` - Payment callbacks
- `src/components/PaymentFlow.tsx` - UI component

### Key Features
- **Hosted Payment Links**: Primary checkout flow
- **Server-Initiated MoMo Push**: Direct mobile money transfers
- **Payment Status Polling**: Real-time status updates
- **Invoice Expiry**: Default 15 minutes (configurable)
- **Multi-language Support**: Maps from business settings

### Error Handling
- Network failures: Retry with exponential backoff
- Invalid signatures: Log and reject webhook
- Expired invoices: Notify user to retry
- Insufficient funds: Display clear error message

---

## 2. WhatsApp Business API Integration

### Purpose
- Send Smart Dining Slip™ to customers after bill payment
- Deliver daily reports to business owners
- Send low stock alerts to managers
- Notify about cost anomalies and reorder suggestions

### Required Environment Variables
```env
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_BASE_URL=https://graph.facebook.com/v18.0
```

### Setup Steps
1. **Create Meta Business Account**
   - Visit https://business.facebook.com
   - Create business account
   - Add WhatsApp Business API

2. **Configure Phone Number**
   - Register business phone number
   - Verify ownership
   - Enable messaging permissions

3. **Set Message Templates**
   - Create approved templates for:
     - Smart Dining Slip delivery
     - Daily reports
     - Low stock alerts
     - Payment confirmations

4. **Configure Business Settings**
   - Enable/disable owner reports: `/api/settings/whatsapp`
   - Enable/disable client slips: `/api/settings/whatsapp`
   - Set daily cap (10-500 messages): Prevents excessive costs
   - Set monthly budget (in cents): Optional spending limit

### Implementation Files
- `src/lib/services/notification.service.ts` - Core notification service
- `src/pages/api/settings/whatsapp.ts` - Settings management
- `src/lib/services/smart-dining-slip.service.ts` - Slip generation & delivery

### Message Types
1. **Smart Dining Slip™** (Customer)
   - Sent after bill confirmation
   - Contains: Order details, itemized list, VAT, total, referral link
   - Format: PDF or image attachment
   - Requires customer consent (GDPR compliant)

2. **Daily Reports** (Owner)
   - Sent at 11 PM daily
   - Contains: Sales summary, profit, top items
   - Configurable per business

3. **Low Stock Alerts** (Manager)
   - Sent when inventory below minimum
   - Includes reorder suggestions
   - Hourly check via cron

4. **Cost Anomaly Alerts** (Manager)
   - Sent when GRN price exceeds historical average
   - Includes severity and delta percentage

### Rate Limits & Costs
- **Daily Cap**: Configurable per business (default 50 client messages)
- **Monthly Budget**: Optional spending limit in RWF
- **Cost Tracking**: Logged per message for billing
- **Throttling**: Automatic when approaching limits

### Error Handling
- Invalid phone numbers: Validate format before sending
- Template not approved: Fall back to basic text
- Rate limit exceeded: Queue for next day
- Delivery failures: Log and retry once

---

## 3. Rwanda Revenue Authority (RRA) EBM Integration

### Purpose
- Generate compliant electronic receipts
- Include VAT calculations (18%)
- Format receipts per RRA specifications
- Support future EBM device integration

### Required Environment Variables
```env
EBM_ENABLED=true
EBM_TIN=your_business_tin
EBM_DEVICE_ID=your_device_id (optional for now)
```

### Setup Steps
1. **Register with RRA**
   - Obtain Tax Identification Number (TIN)
   - Register business for VAT
   - Apply for EBM certification (future)

2. **Configure Receipt Format**
   - Business name and TIN
   - VAT breakdown (18%)
   - Unique receipt numbers
   - Timestamp and payment method

3. **Test Receipt Generation**
   ```bash
   # Create sale with EBM receipt
   curl -X POST https://yourdomain.com/api/sales \
     -H "Content-Type: application/json" \
     -d '{
       "businessId": "your_business_id",
       "items": [{"menuItemId": "item_id", "quantity": 2, "unitPriceCents": 5000}],
       "paymentMethod": "CASH"
     }'
   ```

### Implementation Files
- `src/lib/pricing/ebm-formatter.ts` - Receipt formatting
- `src/lib/pricing/fee-calculator.ts` - Fee and VAT calculations
- `src/pages/api/sales/index.ts` - Receipt generation on sale

### Receipt Format
```
========================================
        IMBONI RESTO
    Business Name Here
    TIN: 123456789
========================================
Date: 2026-02-17 18:30:45
Order: ORD-1234567890-ABC123
Payment: CASH

ITEMS:
----------------------------------------
Item Name                    Qty    Total
Brochette                     2   10,000
Chips                         1    3,000
----------------------------------------
Subtotal:                        13,000
VAT (18%):                        2,340
Convenience Fee (5%):               650
----------------------------------------
TOTAL:                           15,990
========================================
Thank you for your business!
Powered by Imboni Resto
========================================
```

### Compliance Requirements
- **VAT Registration**: Business must be VAT-registered
- **TIN Display**: Must appear on all receipts
- **Sequential Numbering**: Receipts must have unique IDs
- **Retention**: Keep records for 10 years
- **Audit Trail**: All edits logged with user ID and timestamp

### Future EBM Device Integration
- Phase 2: Connect to physical EBM devices
- Real-time submission to RRA servers
- Device certificate management
- Offline mode with sync when online

---

## Integration Testing Checklist

### IremboPay
- [ ] Create invoice successfully
- [ ] Generate payment link with QR code
- [ ] Initiate MoMo push payment
- [ ] Receive webhook callback
- [ ] Verify webhook signature
- [ ] Update payment transaction status
- [ ] Handle expired invoices
- [ ] Test with insufficient funds
- [ ] Verify convenience fee calculation
- [ ] Test refund flow

### WhatsApp
- [ ] Send Smart Dining Slip to customer
- [ ] Verify PDF/image attachment
- [ ] Send daily report to owner
- [ ] Send low stock alert
- [ ] Send cost anomaly alert
- [ ] Respect daily cap limits
- [ ] Respect monthly budget
- [ ] Handle invalid phone numbers
- [ ] Test consent verification
- [ ] Verify message delivery status

### EBM
- [ ] Generate receipt for cash sale
- [ ] Generate receipt for digital payment
- [ ] Verify VAT calculation (18%)
- [ ] Verify convenience fee display
- [ ] Check TIN appears on receipt
- [ ] Verify unique order numbers
- [ ] Test receipt formatting
- [ ] Verify JSON export format
- [ ] Test with multiple items
- [ ] Test with discounts (future)

---

## Monitoring & Logging

### Key Metrics to Track
1. **IremboPay**
   - Payment success rate
   - Average payment time
   - Failed payment reasons
   - Webhook delivery latency

2. **WhatsApp**
   - Message delivery rate
   - Daily message count per business
   - Monthly spend per business
   - Failed delivery reasons

3. **EBM**
   - Receipts generated per day
   - VAT collected
   - Average transaction value
   - Receipt generation errors

### Log Files
- `logs/irembo-payments.log` - Payment transactions
- `logs/whatsapp-messages.log` - Message delivery
- `logs/ebm-receipts.log` - Receipt generation
- `logs/webhooks.log` - All webhook callbacks

### Alerts to Configure
- Payment failure rate > 5%
- WhatsApp delivery failure rate > 10%
- Daily message cap reached
- Monthly budget 80% consumed
- EBM receipt generation errors
- Webhook signature verification failures

---

## Security Considerations

### API Keys
- Store in environment variables (never commit)
- Rotate keys quarterly
- Use different keys for dev/staging/production
- Implement key expiry monitoring

### Webhook Security
- Verify HMAC signatures on all webhooks
- Reject requests with invalid signatures
- Log all webhook attempts
- Rate limit webhook endpoints

### Data Protection
- Encrypt customer phone numbers at rest
- Mask payment card details (PCI compliance)
- Anonymize logs after 90 days
- GDPR-compliant consent management

### Network Security
- Use HTTPS for all API calls
- Implement request timeouts (30s max)
- Retry with exponential backoff
- Circuit breaker for failing services

---

## Troubleshooting

### IremboPay Issues
**Problem**: Invoice creation fails
- Check API credentials are correct
- Verify business is active in IremboPay dashboard
- Check amount is within limits (min 100 RWF, max 10M RWF)
- Review error logs for specific error codes

**Problem**: Webhook not received
- Verify webhook URL is publicly accessible
- Check firewall allows IremboPay IPs
- Test webhook endpoint manually
- Review webhook logs in IremboPay dashboard

### WhatsApp Issues
**Problem**: Messages not delivered
- Verify phone number format (+250...)
- Check WhatsApp Business API status
- Verify message template is approved
- Check daily cap not exceeded
- Verify monthly budget not exhausted

**Problem**: Template rejected
- Review Meta template guidelines
- Remove promotional language
- Ensure clear opt-out instructions
- Resubmit for approval

### EBM Issues
**Problem**: Receipt formatting incorrect
- Verify VAT rate is 18%
- Check TIN is configured
- Review receipt template
- Test with sample data

**Problem**: Sequential numbering gaps
- Check for failed transactions
- Review order number generation logic
- Verify database constraints
- Check for concurrent requests

---

## Support Contacts

### IremboPay
- Email: support@irembo.com
- Phone: +250 788 123 456
- Portal: https://business.irembo.com/support

### WhatsApp Business API
- Meta Business Support: https://business.facebook.com/help
- Developer Docs: https://developers.facebook.com/docs/whatsapp

### RRA EBM
- Email: info@rra.gov.rw
- Phone: +250 788 999 999
- Portal: https://www.rra.gov.rw

---

## Next Steps After Integration

1. **Load Testing**
   - Test with 100 concurrent payments
   - Verify webhook handling under load
   - Test WhatsApp rate limiting

2. **User Acceptance Testing**
   - Test with real business owners
   - Verify receipt readability
   - Confirm WhatsApp message clarity

3. **Compliance Audit**
   - RRA receipt format review
   - GDPR consent verification
   - PCI compliance check (if storing cards)

4. **Production Deployment**
   - Update environment variables
   - Configure monitoring alerts
   - Set up log aggregation
   - Enable error tracking (Sentry)

5. **Post-Launch Monitoring**
   - Monitor payment success rates
   - Track WhatsApp delivery rates
   - Review customer feedback
   - Optimize based on metrics
