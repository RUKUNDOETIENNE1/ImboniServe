# IremboPay Integration Implementation Plan

## Overview
Complete implementation plan for integrating IremboPay payment gateway into Imboni Serve, replacing Pesapal with a VAT-inclusive pricing model, affiliate commission tracking, and comprehensive admin reporting.

## Confirmed Policy & Economics

### Pricing Model
- **VAT-inclusive single price** (e.g., Pro Plan = 105,000 RWF)
- **No surcharges or line items** shown to customers
- **"No extra charges"** messaging
- **Gateway fee (3.42%)** absorbed by platform, not passed to customer
- **Rounding**: Nearest-integer RWF everywhere

### Fee Breakdown (Example: 105,000 RWF Pro Plan)
```
Customer pays:           105,000 RWF (VAT inclusive)
VAT (18/118):             16,017 RWF
Ex-VAT revenue:           88,983 RWF
Gateway fee (3.42%):       3,591 RWF
Settlement received:     101,409 RWF
Cash after VAT:           85,392 RWF
Affiliate commission:     13,347 RWF (15% of ex-VAT)
Recruiter welcome bonus:   5,000 RWF (first conversion only, non-STARTER)
Net cash (first month):   67,045 RWF
Net cash (renewals):      72,045 RWF (no bonuses)
```

### Affiliate Program
- **Commission**: 15% of ex-VAT revenue
- **Duration**: Up to 12 paid invoices per recruited business (within 12-month window)
- **Welcome bonus** (recruiter only):
  - 5,000 RWF for non-STARTER plans
  - 2,000 RWF for STARTER plan
  - No customer bonus
- **Paid**: Once after first PAID invoice (post 14-day trial)
- **Clawback**: Yes, if refund within 14-day lock period
- **Lock period**: 14 days before commissions become withdrawable
- **Payout schedule**: Monthly on the 5th
- **Anti-fraud**: Self-referral detection, unique business per bonus

### IremboPay Configuration
- **Hosted checkout**: Primary flow via `paymentLinkUrl`
- **MoMo push**: MTN/AIRTEL server-initiated (POS/admin)
- **Webhook**: HMAC signature verification (timestamp tolerance: 5 min)
- **Invoice expiry**: 15 minutes default
- **Language**: Mapped from business/user preference
- **Currency**: RWF only

## Implementation Tasks

### 1. Environment Configuration
**File**: `.env`

Add:
```env
# IremboPay Configuration
IREMBO_PUBLIC_KEY=your_public_key_here
IREMBO_SECRET_KEY=your_secret_key_here
IREMBO_PAYMENT_ACCOUNT=LOYALTECH-RWF
IREMBO_PAYMENT_ITEM_CODE=PC-2157edb8bd
IREMBO_API_BASE=https://api.sandbox.irembopay.com
IREMBO_API_VERSION=2
IREMBO_WEBHOOK_TOLERANCE_SECONDS=300

# Feature Flags
PAYMENTS_PROVIDER=irembo
```

### 2. Prisma Schema Updates
**File**: `prisma/schema.prisma`

#### Add PaymentTransaction Model
```prisma
model PaymentTransaction {
  id                        String   @id @default(cuid())
  businessId                String
  business                  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Invoice & Transaction IDs
  invoiceNumber             String   @unique
  transactionId             String   @unique
  referenceId               String?  // IremboPay referenceId for MoMo
  
  // Payment Details
  gateway                   PaymentGateway
  paymentMethod             PaymentMethod
  paymentProvider           PaymentProvider?
  status                    PaymentStatus
  
  // Amounts (all in cents/smallest currency unit)
  amountCents               Int
  currency                  String   @default("RWF")
  vatAmountCents            Int
  exVatAmountCents          Int
  gatewayFeeEstimatedCents  Int
  gatewayFeeActualCents     Int?
  platformFeeCents          Int      @default(0)
  netToBusinessCents        Int
  
  // URLs & Links
  paymentLinkUrl            String?
  callbackUrl               String?
  
  // Payer Information
  payerName                 String?
  payerEmail                String?
  payerPhone                String?
  
  // Timestamps
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  paidAt                    DateTime?
  expiryAt                  DateTime?
  
  // Webhook & Audit
  webhookSignature          String?
  webhookTimestamp          BigInt?
  webhookVerified           Boolean  @default(false)
  rawRequest                Json?
  rawCallback               Json?
  rawStatus                 Json?
  
  // Relations
  subscriptionId            String?
  subscription              Subscription? @relation(fields: [subscriptionId], references: [id])
  
  @@index([businessId])
  @@index([invoiceNumber])
  @@index([status])
  @@index([gateway])
  @@index([createdAt])
}

enum PaymentGateway {
  IREMBO_PAY
  CASH
  MTN_MONEY
  AIRTEL_MONEY
  BANK_TRANSFER
}

enum PaymentMethod {
  WEB
  MOMO_PUSH
  CASH
  BANK_TRANSFER
}

enum PaymentProvider {
  MTN
  AIRTEL
}

enum PaymentStatus {
  INITIATED
  PENDING
  PAID
  FAILED
  EXPIRED
  CANCELLED
}
```

#### Add AffiliateCommission Model
```prisma
model AffiliateCommission {
  id                    String   @id @default(cuid())
  affiliateId           String
  affiliate             User     @relation("AffiliateCommissions", fields: [affiliateId], references: [id])
  
  businessId            String
  business              Business @relation(fields: [businessId], references: [id])
  
  subscriptionId        String
  subscription          Subscription @relation(fields: [subscriptionId], references: [id])
  
  paymentTransactionId  String
  paymentTransaction    PaymentTransaction @relation(fields: [paymentTransactionId], references: [id])
  
  // Commission Details
  commissionType        CommissionType
  commissionRate        Float    // e.g., 0.15 for 15%
  baseAmountCents       Int      // ex-VAT amount
  commissionAmountCents Int
  
  // Status & Timing
  status                CommissionStatus
  accrualDate           DateTime @default(now())
  lockUntil             DateTime // 14-day lock
  payoutDate            DateTime?
  payoutBatchId         String?
  
  // Clawback
  clawbackReason        String?
  clawbackDate          DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([affiliateId])
  @@index([businessId])
  @@index([status])
  @@index([lockUntil])
}

enum CommissionType {
  RECURRING
  WELCOME_RECRUITER
}

enum CommissionStatus {
  ACCRUED
  LOCKED
  AVAILABLE
  PAID
  CLAWBACK
}
```

#### Update User Model
Add affiliate relations:
```prisma
model User {
  // ... existing fields
  
  // Affiliate Relations
  referredByAffiliateId     String?
  referredByAffiliate       User?     @relation("AffiliateReferrals", fields: [referredByAffiliateId], references: [id])
  referrals                 User[]    @relation("AffiliateReferrals")
  affiliateCommissions      AffiliateCommission[] @relation("AffiliateCommissions")
  
  affiliateCode             String?   @unique
  affiliateEnabled          Boolean   @default(false)
  affiliateCookieExpiry     DateTime?
}
```

#### Update Subscription Model
Add payment tracking:
```prisma
model Subscription {
  // ... existing fields
  
  paymentTransactions   PaymentTransaction[]
  affiliateCommissions  AffiliateCommission[]
}
```

### 3. API Endpoints

#### 3.1 Create Invoice
**File**: `src/pages/api/payments/irembo/create-invoice.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { subscriptionId, planCode, businessId } = req.body

  try {
    // Get subscription or create invoice details
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { business: true, plan: true }
    })

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // Calculate amounts (VAT-inclusive)
    const grossAmountCents = subscription.plan.priceRwf * 100
    const vatAmountCents = Math.round(grossAmountCents * 18 / 118)
    const exVatAmountCents = grossAmountCents - vatAmountCents
    const gatewayFeeEstimatedCents = Math.round(grossAmountCents * 0.0342)

    // Create invoice via IremboPay
    const invoice = await IremboPayService.createInvoice({
      businessId,
      subscriptionId,
      amountCents: grossAmountCents,
      description: `${subscription.plan.name} Plan - ${subscription.business.name}`,
      customer: {
        email: req.session.user.email,
        phoneNumber: req.session.user.phone,
        name: req.session.user.name
      }
    })

    // Store transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        businessId,
        subscriptionId,
        invoiceNumber: invoice.invoiceNumber,
        transactionId: invoice.transactionId,
        gateway: 'IREMBO_PAY',
        paymentMethod: 'WEB',
        status: 'INITIATED',
        amountCents: grossAmountCents,
        currency: 'RWF',
        vatAmountCents,
        exVatAmountCents,
        gatewayFeeEstimatedCents,
        netToBusinessCents: grossAmountCents - gatewayFeeEstimatedCents - vatAmountCents,
        paymentLinkUrl: invoice.paymentLinkUrl,
        expiryAt: invoice.expiryAt,
        rawRequest: invoice
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        paymentLinkUrl: invoice.paymentLinkUrl,
        transactionId: transaction.id,
        expiresAt: invoice.expiryAt
      }
    })
  } catch (error) {
    console.error('Create invoice error:', error)
    return res.status(500).json({ error: 'Failed to create invoice' })
  }
}

export default withRateLimit(requireAuth(handler), { maxRequests: 10, windowMs: 60000 })
```

#### 3.2 Webhook Handler
**File**: `src/pages/api/payments/irembo/webhook.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'
import { buffer } from 'micro'

export const config = {
  api: {
    bodyParser: false // Need raw body for HMAC verification
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get raw body
    const rawBody = await buffer(req)
    const bodyString = rawBody.toString('utf8')
    
    // Verify HMAC signature
    const signature = req.headers['irembopay-signature'] as string
    const isValid = IremboPayService.verifyWebhookSignature(signature, bodyString)
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const payload = JSON.parse(bodyString)
    const { invoiceNumber, paymentStatus, paidAt, paymentMethod, paymentReference } = payload.data

    // Fetch invoice status from IremboPay API (server-to-server verification)
    const invoiceStatus = await IremboPayService.getInvoiceStatus(invoiceNumber)

    // Update transaction idempotently
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { invoiceNumber },
      include: { subscription: true }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Only update if status changed
    if (transaction.status === 'PAID') {
      return res.status(200).json({ success: true, message: 'Already processed' })
    }

    const updateData: any = {
      status: invoiceStatus.paymentStatus === 'PAID' ? 'PAID' : 'FAILED',
      webhookSignature: signature,
      webhookTimestamp: Date.now(),
      webhookVerified: true,
      rawCallback: payload,
      rawStatus: invoiceStatus,
      updatedAt: new Date()
    }

    if (invoiceStatus.paymentStatus === 'PAID') {
      updateData.paidAt = new Date(paidAt)
      updateData.paymentMethod = paymentMethod
      
      // Update subscription status
      await prisma.subscription.update({
        where: { id: transaction.subscriptionId },
        data: { status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      })

      // Create affiliate commissions
      await createAffiliateCommissions(transaction)
    }

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: updateData
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function createAffiliateCommissions(transaction: any) {
  // Implementation for affiliate commission creation
  // 15% recurring + welcome bonuses logic
}
```

#### 3.3 MoMo Push Initiation
**File**: `src/pages/api/payments/irembo/initiate-momo.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { invoiceNumber, phoneNumber, provider } = req.body

  // Validate inputs
  if (!invoiceNumber || !phoneNumber || !provider) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!/^07\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format (must be 07XXXXXXXX)' })
  }

  if (!['MTN', 'AIRTEL'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider (must be MTN or AIRTEL)' })
  }

  try {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { invoiceNumber }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    if (transaction.currency !== 'RWF') {
      return res.status(400).json({ error: 'MoMo push only supports RWF currency' })
    }

    // Initiate MoMo push
    const result = await IremboPayService.initiateMomoPush({
      invoiceNumber,
      accountIdentifier: phoneNumber,
      paymentProvider: provider
    })

    // Update transaction
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        paymentMethod: 'MOMO_PUSH',
        paymentProvider: provider,
        payerPhone: phoneNumber,
        referenceId: result.referenceId,
        status: 'PENDING'
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        referenceId: result.referenceId,
        message: 'MoMo push initiated. Please approve on your phone.'
      }
    })
  } catch (error: any) {
    console.error('MoMo push error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to initiate MoMo push' 
    })
  }
}

export default requireAuth(handler)
```

### 4. IremboPay Service
**File**: `src/lib/services/irembopay.service.ts`

```typescript
import crypto from 'crypto'

export class IremboPayService {
  private static readonly API_BASE = process.env.IREMBO_API_BASE!
  private static readonly SECRET_KEY = process.env.IREMBO_SECRET_KEY!
  private static readonly PUBLIC_KEY = process.env.IREMBO_PUBLIC_KEY!
  private static readonly PAYMENT_ACCOUNT = process.env.IREMBO_PAYMENT_ACCOUNT!
  private static readonly PAYMENT_ITEM_CODE = process.env.IREMBO_PAYMENT_ITEM_CODE!
  private static readonly API_VERSION = process.env.IREMBO_API_VERSION || '2'

  static async createInvoice(params: CreateInvoiceParams) {
    const transactionId = `IMBONI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const payload = {
      transactionId,
      paymentAccountIdentifier: this.PAYMENT_ACCOUNT,
      paymentItems: [{
        code: this.PAYMENT_ITEM_CODE,
        quantity: 1,
        unitAmount: params.amountCents / 100 // Convert cents to RWF
      }],
      expiryAt,
      description: params.description,
      customer: params.customer,
      language: params.language || 'EN'
    }

    const response = await fetch(`${this.API_BASE}/payments/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create invoice')
    }

    const result = await response.json()
    return result.data
  }

  static async getInvoiceStatus(invoiceNumber: string) {
    const response = await fetch(`${this.API_BASE}/payments/invoices/${invoiceNumber}`, {
      headers: {
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch invoice status')
    }

    const result = await response.json()
    return result.data
  }

  static async initiateMomoPush(params: MomoPushParams) {
    const response = await fetch(`${this.API_BASE}/payments/transactions/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'irembopay-secretKey': this.SECRET_KEY,
        'X-API-Version': this.API_VERSION
      },
      body: JSON.stringify({
        accountIdentifier: params.accountIdentifier,
        paymentProvider: params.paymentProvider,
        invoiceNumber: params.invoiceNumber
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to initiate MoMo push')
    }

    const result = await response.json()
    return result.data
  }

  static verifyWebhookSignature(signatureHeader: string, rawBody: string): boolean {
    try {
      const parts = signatureHeader.split(',')
      const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
      const signature = parts.find(p => p.startsWith('s='))?.split('=')[1]

      if (!timestamp || !signature) return false

      // Check timestamp tolerance (5 minutes)
      const now = Date.now()
      const webhookTime = parseInt(timestamp)
      const tolerance = parseInt(process.env.IREMBO_WEBHOOK_TOLERANCE_SECONDS || '300') * 1000
      
      if (Math.abs(now - webhookTime) > tolerance) {
        console.error('Webhook timestamp outside tolerance')
        return false
      }

      // Compute expected signature
      const signedPayload = `${timestamp}#${rawBody}`
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(signedPayload)
        .digest('hex')

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }
}

interface CreateInvoiceParams {
  businessId: string
  subscriptionId: string
  amountCents: number
  description: string
  customer: {
    email?: string
    phoneNumber?: string
    name?: string
  }
  language?: string
}

interface MomoPushParams {
  invoiceNumber: string
  accountIdentifier: string
  paymentProvider: 'MTN' | 'AIRTEL'
}
```

### 5. Client-Side Payment Flow
**File**: `src/components/PaymentFlow.tsx`

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PaymentFlow({ subscriptionId, planName, amount }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/irembo/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      // Redirect to hosted checkout
      window.open(result.data.paymentLinkUrl, '_blank')
      
      // Start polling for status
      pollPaymentStatus(result.data.transactionId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (transactionId: string) => {
    // Poll every 5 seconds for up to 5 minutes
    const maxAttempts = 60
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      
      const response = await fetch(`/api/payments/irembo/status?transactionId=${transactionId}`)
      const result = await response.json()

      if (result.data.status === 'PAID') {
        clearInterval(interval)
        window.location.href = '/dashboard?payment=success'
      } else if (result.data.status === 'FAILED' || result.data.status === 'EXPIRED') {
        clearInterval(interval)
        setError('Payment failed or expired. Please try again.')
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        setError('Payment status check timed out. Please refresh to check status.')
      }
    }, 5000)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold">{planName}</h3>
        <p className="text-3xl font-bold mt-2">{amount.toLocaleString()} RWF</p>
        <p className="text-sm text-gray-600 mt-1">VAT inclusive • No extra charges</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          {error}
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  )
}
```

### 6. Admin Reporting
**File**: `src/pages/api/admin/payments/overview.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { startDate, endDate, gateway } = req.query

  try {
    const where: any = {
      status: 'PAID',
      paidAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    if (gateway) {
      where.gateway = gateway
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        business: true,
        subscription: { include: { plan: true } }
      }
    })

    // Calculate totals
    const grossRevenue = transactions.reduce((sum, t) => sum + t.amountCents, 0)
    const vatCollected = transactions.reduce((sum, t) => sum + t.vatAmountCents, 0)
    const gatewayFees = transactions.reduce((sum, t) => sum + t.gatewayFeeEstimatedCents, 0)
    const exVatRevenue = transactions.reduce((sum, t) => sum + t.exVatAmountCents, 0)

    // Get affiliate commissions for this period
    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        accrualDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      }
    })

    const affiliateCommissionsTotal = commissions.reduce((sum, c) => sum + c.commissionAmountCents, 0)
    const welcomeBonusesTotal = commissions
      .filter(c => c.commissionType !== 'RECURRING')
      .reduce((sum, c) => sum + c.commissionAmountCents, 0)

    const netCash = grossRevenue - vatCollected - gatewayFees - affiliateCommissionsTotal

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          grossRevenue: grossRevenue / 100,
          vatCollected: vatCollected / 100,
          exVatRevenue: exVatRevenue / 100,
          gatewayFees: gatewayFees / 100,
          affiliateCommissions: affiliateCommissionsTotal / 100,
          welcomeBonuses: welcomeBonusesTotal / 100,
          netCash: netCash / 100,
          transactionCount: transactions.length
        },
        transactions: transactions.map(t => ({
          id: t.id,
          businessName: t.business.name,
          planName: t.subscription?.plan.name,
          amount: t.amountCents / 100,
          gateway: t.gateway,
          method: t.paymentMethod,
          paidAt: t.paidAt
        }))
      }
    })
  } catch (error) {
    console.error('Payment overview error:', error)
    return res.status(500).json({ error: 'Failed to fetch payment overview' })
  }
}

export default requireAuth(handler)
```

## Testing Plan

### Unit Tests
- [ ] IremboPayService.createInvoice
- [ ] IremboPayService.verifyWebhookSignature
- [ ] IremboPayService.initiateMomoPush
- [ ] Fee calculation functions
- [ ] Affiliate commission calculations

### Integration Tests
- [ ] Create invoice → webhook → status update flow
- [ ] MoMo push initiation
- [ ] Webhook signature verification
- [ ] Idempotent webhook handling
- [ ] Affiliate commission creation

### End-to-End Tests
- [ ] Complete payment flow (sandbox)
- [ ] Expired invoice handling
- [ ] Failed payment handling
- [ ] Admin reporting accuracy

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Prisma schema updated and migrated
- [ ] Webhook URL registered in Irembo portal
- [ ] Sandbox testing completed
- [ ] Production credentials obtained
- [ ] Monitoring and alerts configured
- [ ] Documentation updated
- [ ] Team trained on new flow

## Success Metrics
- Payment success rate > 95%
- Webhook processing < 2 seconds
- Invoice creation < 1 second
- Zero duplicate payments
- Accurate affiliate commission tracking
- Admin reports match settlement reports

---

**Status**: Ready for implementation  
**Estimated Time**: 16-20 hours  
**Priority**: High
