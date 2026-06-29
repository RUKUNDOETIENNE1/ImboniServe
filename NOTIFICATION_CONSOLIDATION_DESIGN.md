# Notification System Consolidation Design

## Current State (Phase 0.6)

### Existing Notification Services (9 services)

#### 1. **EmailService** (`email.service.ts`)
- **Purpose**: Transactional emails via SMTP
- **Capabilities**: Order confirmations, OTPs, security alerts, invoices, password resets
- **Provider**: SMTP (Nodemailer)
- **Status**: Active, well-structured

#### 2. **NotificationService** (`notification.service.ts`)
- **Purpose**: SMS notifications via Twilio
- **Capabilities**: Order confirmations, payment receipts, reservation confirmations
- **Provider**: Twilio SMS
- **Status**: Active, legacy naming

#### 3. **WhatsAppService** (`whatsapp.service.ts`)
- **Purpose**: WhatsApp messages via generic API
- **Capabilities**: Payout status, commission earned, weekly summaries, marketer welcome
- **Provider**: Generic WhatsApp API + Twilio fallback
- **Status**: Active

#### 4. **WhatsAppCloudService** (`whatsapp-cloud.service.ts`)
- **Purpose**: WhatsApp via Meta Cloud API
- **Capabilities**: Text + template messages, webhook verification
- **Provider**: Meta Cloud API + Twilio fallback
- **Status**: Active, modern

#### 5. **WhatsAppOrderService** (`whatsapp-order.service.ts`)
- **Purpose**: Order-specific WhatsApp notifications
- **Capabilities**: Order confirmations, status updates
- **Provider**: Delegates to WhatsAppCloudService
- **Status**: Active, domain-specific

#### 6. **SplitPaymentWhatsAppService** (`split-payment-whatsapp.service.ts`)
- **Purpose**: Split payment link delivery via WhatsApp
- **Capabilities**: Auto-trigger split payment links with conditions
- **Provider**: Delegates to NotificationService
- **Status**: Active, domain-specific

#### 7. **AlertDeliveryService** (`alert-delivery.service.ts`)
- **Purpose**: System alerts (email + Slack)
- **Capabilities**: Payment failures, provider outages, stuck payments
- **Provider**: Email + Slack webhooks
- **Status**: Active, critical for monitoring

#### 8. **RevenueNotificationService** (`revenue-notification.service.ts`)
- **Purpose**: Revenue milestone notifications
- **Capabilities**: Daily revenue alerts, milestone celebrations
- **Provider**: Delegates to NotificationService
- **Status**: Active, domain-specific

#### 9. **RevenueAlertService** (`revenue-alert.service.ts`)
- **Purpose**: Revenue anomaly detection alerts
- **Capabilities**: Sudden drops, unusual patterns
- **Provider**: Delegates to AlertDeliveryService
- **Status**: Active, domain-specific

---

## Notification Architecture Analysis

### Current Architecture (Fragmented)

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Payment APIs  │  Order APIs  │  Cron Jobs  │  Webhooks     │
└────────┬────────┴──────┬───────┴──────┬──────┴──────┬────────┘
         │               │              │             │
         ▼               ▼              ▼             ▼
┌────────────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────┐
│ EmailService   │ │ WhatsApp     │ │ SMS     │ │ Alert    │
│                │ │ CloudService │ │ (Twilio)│ │ Delivery │
└────────────────┘ └──────────────┘ └─────────┘ └──────────┘
         │               │              │             │
         ▼               ▼              ▼             ▼
┌────────────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────┐
│ SMTP           │ │ Meta Cloud   │ │ Twilio  │ │ Slack    │
│ (Nodemailer)   │ │ API          │ │ API     │ │ Webhook  │
└────────────────┘ └──────────────┘ └─────────┘ └──────────┘

Domain-Specific Wrappers:
- WhatsAppOrderService → WhatsAppCloudService
- SplitPaymentWhatsAppService → NotificationService
- RevenueNotificationService → NotificationService
- RevenueAlertService → AlertDeliveryService
```

### Issues with Current Architecture
1. **No unified interface** - Each service has different method signatures
2. **No consent management** - No centralized opt-in/opt-out checking
3. **Inconsistent logging** - Each service logs differently
4. **Provider coupling** - Domain services tightly coupled to specific providers
5. **No retry strategy** - Each service handles failures differently
6. **No rate limiting** - No centralized throttling

---

## Proposed Unified Architecture (Design Only - No Implementation Yet)

### Canonical Notification Model

```typescript
// lib/notifications/types.ts (DESIGN ONLY)

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  SLACK = 'SLACK',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationPriority {
  LOW = 'LOW',        // Marketing, newsletters
  NORMAL = 'NORMAL',  // Order confirmations, receipts
  HIGH = 'HIGH',      // Payment failures, alerts
  CRITICAL = 'CRITICAL', // Security alerts, system outages
}

export interface NotificationRecipient {
  userId?: string
  businessId?: string
  email?: string
  phone?: string
  whatsappPhone?: string
  slackWebhook?: string
}

export interface NotificationPayload {
  channel: NotificationChannel
  priority: NotificationPriority
  recipient: NotificationRecipient
  subject?: string
  body: string
  templateId?: string
  templateData?: Record<string, any>
  metadata?: Record<string, any>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  provider?: string
  error?: string
  sentAt?: Date
}
```

### Unified Notification Service (Design)

```typescript
// lib/notifications/core.service.ts (DESIGN ONLY)

export class NotificationCoreService {
  /**
   * Send notification via appropriate channel
   * Handles provider selection, consent checking, logging
   */
  static async send(payload: NotificationPayload): Promise<NotificationResult> {
    // 1. Check consent (if applicable)
    if (await this.isOptedOut(payload.recipient, payload.channel)) {
      return { success: false, error: 'Recipient opted out' }
    }

    // 2. Select provider based on channel
    const provider = this.selectProvider(payload.channel)

    // 3. Apply rate limiting
    if (await this.isRateLimited(payload.recipient, payload.channel)) {
      return { success: false, error: 'Rate limit exceeded' }
    }

    // 4. Send via provider
    const result = await provider.send(payload)

    // 5. Log notification
    await this.logNotification(payload, result)

    // 6. Handle retry if needed
    if (!result.success && payload.priority >= NotificationPriority.HIGH) {
      await this.scheduleRetry(payload)
    }

    return result
  }

  /**
   * Send email notification
   */
  static async sendEmail(
    recipient: NotificationRecipient,
    subject: string,
    body: string,
    options?: { templateId?: string; priority?: NotificationPriority }
  ): Promise<NotificationResult> {
    return this.send({
      channel: NotificationChannel.EMAIL,
      priority: options?.priority || NotificationPriority.NORMAL,
      recipient,
      subject,
      body,
      templateId: options?.templateId,
    })
  }

  /**
   * Send WhatsApp notification
   */
  static async sendWhatsApp(
    recipient: NotificationRecipient,
    message: string,
    options?: { templateId?: string; priority?: NotificationPriority }
  ): Promise<NotificationResult> {
    return this.send({
      channel: NotificationChannel.WHATSAPP,
      priority: options?.priority || NotificationPriority.NORMAL,
      recipient,
      body: message,
      templateId: options?.templateId,
    })
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(
    recipient: NotificationRecipient,
    message: string,
    options?: { priority?: NotificationPriority }
  ): Promise<NotificationResult> {
    return this.send({
      channel: NotificationChannel.SMS,
      priority: options?.priority || NotificationPriority.NORMAL,
      recipient,
      body: message,
    })
  }

  /**
   * Send system alert (email + Slack)
   */
  static async sendAlert(
    subject: string,
    message: string,
    options?: { slackWebhook?: string; priority?: NotificationPriority }
  ): Promise<NotificationResult[]> {
    const results = await Promise.all([
      this.sendEmail(
        { email: process.env.ALERT_EMAIL },
        subject,
        message,
        { priority: options?.priority || NotificationPriority.HIGH }
      ),
      options?.slackWebhook
        ? this.send({
            channel: NotificationChannel.SLACK,
            priority: options?.priority || NotificationPriority.HIGH,
            recipient: { slackWebhook: options.slackWebhook },
            subject,
            body: message,
          })
        : Promise.resolve({ success: false, error: 'No Slack webhook' }),
    ])
    return results
  }

  // Private helper methods (design only)
  private static async isOptedOut(
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ): Promise<boolean> {
    // Check user preferences in database
    // Return true if user opted out of this channel
    return false
  }

  private static selectProvider(channel: NotificationChannel): any {
    // Route to appropriate provider based on channel
    // EMAIL → EmailService
    // SMS → NotificationService (Twilio)
    // WHATSAPP → WhatsAppCloudService
    // SLACK → Slack webhook
    return null
  }

  private static async isRateLimited(
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ): Promise<boolean> {
    // Check Redis for rate limit
    // Example: Max 10 WhatsApp messages per hour per user
    return false
  }

  private static async logNotification(
    payload: NotificationPayload,
    result: NotificationResult
  ): Promise<void> {
    // Log to NotificationLog table
    // Include: channel, recipient, status, provider, timestamp
  }

  private static async scheduleRetry(payload: NotificationPayload): Promise<void> {
    // Add to retry queue (BullMQ)
    // Exponential backoff: 1min, 5min, 15min
  }
}
```

### Provider Abstraction Layer (Design)

```typescript
// lib/notifications/providers/base.ts (DESIGN ONLY)

export interface INotificationProvider {
  readonly name: string
  readonly channel: NotificationChannel

  send(payload: NotificationPayload): Promise<NotificationResult>
  verify?(signature: string, payload: any): Promise<boolean>
}

// lib/notifications/providers/email.provider.ts
export class EmailProvider implements INotificationProvider {
  readonly name = 'SMTP'
  readonly channel = NotificationChannel.EMAIL

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Delegate to EmailService
    return EmailService.sendTransactional(...)
  }
}

// lib/notifications/providers/whatsapp.provider.ts
export class WhatsAppProvider implements INotificationProvider {
  readonly name = 'Meta Cloud API'
  readonly channel = NotificationChannel.WHATSAPP

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Delegate to WhatsAppCloudService
    return WhatsAppCloudService.sendMessage(...)
  }
}

// lib/notifications/providers/sms.provider.ts
export class SMSProvider implements INotificationProvider {
  readonly name = 'Twilio'
  readonly channel = NotificationChannel.SMS

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Delegate to NotificationService (Twilio)
    return NotificationService.sendSMS(...)
  }
}

// lib/notifications/providers/slack.provider.ts
export class SlackProvider implements INotificationProvider {
  readonly name = 'Slack Webhook'
  readonly channel = NotificationChannel.SLACK

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Send to Slack webhook
    return fetch(payload.recipient.slackWebhook, ...)
  }
}
```

---

## Migration Strategy (Future Phase)

### Phase 1: Implement Core Service (No Breaking Changes)
1. Create `NotificationCoreService` with unified interface
2. Implement provider abstraction layer
3. Add consent management hooks (no enforcement yet)
4. Add centralized logging

### Phase 2: Migrate Domain Services (Incremental)
1. Update `WhatsAppOrderService` to use core service
2. Update `SplitPaymentWhatsAppService` to use core service
3. Update `RevenueNotificationService` to use core service
4. Update `RevenueAlertService` to use core service

### Phase 3: Migrate Direct Callers (Incremental)
1. Update payment webhooks to use core service
2. Update cron jobs to use core service
3. Update API routes to use core service

### Phase 4: Add Advanced Features
1. Implement retry queue
2. Implement rate limiting
3. Implement consent enforcement
4. Add notification preferences UI

### Phase 5: Deprecate Legacy Services (After Full Migration)
1. Mark old services as deprecated
2. Remove after all callers migrated

---

## Consent Management Design

```typescript
// lib/notifications/consent.service.ts (DESIGN ONLY)

export class NotificationConsentService {
  /**
   * Check if user has consented to receive notifications on this channel
   */
  static async hasConsent(
    userId: string,
    channel: NotificationChannel
  ): Promise<boolean> {
    // Check UserNotificationPreferences table
    // Default: true for transactional, false for marketing
    return true
  }

  /**
   * Update user notification preferences
   */
  static async updateConsent(
    userId: string,
    channel: NotificationChannel,
    consented: boolean
  ): Promise<void> {
    // Update UserNotificationPreferences table
    // Log consent change for audit
  }

  /**
   * Get all user preferences
   */
  static async getPreferences(userId: string): Promise<Record<NotificationChannel, boolean>> {
    // Return all channel preferences
    return {
      [NotificationChannel.EMAIL]: true,
      [NotificationChannel.SMS]: true,
      [NotificationChannel.WHATSAPP]: false,
      [NotificationChannel.SLACK]: false,
      [NotificationChannel.PUSH]: true,
      [NotificationChannel.IN_APP]: true,
    }
  }
}
```

---

## Logging Standardization Design

```typescript
// Prisma schema addition (DESIGN ONLY)

model NotificationLog {
  id            String              @id @default(cuid())
  channel       NotificationChannel
  priority      NotificationPriority
  recipientId   String?
  businessId    String?
  recipientEmail String?
  recipientPhone String?
  subject       String?
  body          String              @db.Text
  templateId    String?
  provider      String?
  messageId     String?
  status        String              // 'sent', 'failed', 'bounced', 'delivered'
  error         String?
  metadata      Json?
  sentAt        DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime            @default(now())

  @@index([recipientId, channel])
  @@index([businessId, channel])
  @@index([status, createdAt])
}
```

---

## Current Status

### ✅ Completed
- Notification services mapped and categorized
- Architecture issues identified
- Unified design created

### 🔄 In Progress (Design Phase)
- Canonical notification model designed
- Provider abstraction layer designed
- Consent management designed
- Logging standardization designed

### ⏳ Pending (Future Phases)
- Core service implementation
- Provider migration
- Consent enforcement
- Rate limiting
- Retry queue

---

## Risk Assessment

| Component | Risk Level | Impact if Broken | Mitigation |
|-----------|-----------|------------------|------------|
| Email notifications | MEDIUM | Customers miss order confirmations | Keep EmailService as-is during migration |
| WhatsApp messages | MEDIUM | Customers miss payment links | Gradual migration with fallback |
| SMS alerts | LOW | Operations miss alerts | Dual-send during migration |
| Slack alerts | LOW | Team misses system alerts | Keep AlertDeliveryService active |
| Domain services | LOW | Wrapper services break | Thin wrappers, easy to fix |

---

## Success Criteria

### Must Be True
- ✅ All notification services mapped
- ✅ Unified architecture designed
- ⏳ No breaking changes to existing services
- ⏳ Core service provides unified interface

### Should Be True
- ⏳ Consent management hooks in place
- ⏳ Centralized logging implemented
- ⏳ Provider abstraction layer complete
- ⏳ Domain services migrated incrementally

---

## Next Steps (Future Phase 1.0)

1. Implement `NotificationCoreService` (no breaking changes)
2. Implement provider abstraction layer
3. Add consent management hooks (no enforcement)
4. Migrate 1-2 domain services as pilot
5. Verify no regressions in notification delivery
