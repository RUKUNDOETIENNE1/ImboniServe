# CONTENT-001A — Newsletter Implementation Plan

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Newsletter Implementation Scope  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the minimum newsletter foundation for Phase A and the full newsletter platform for Phase B. Determine exactly what exists, what to extend, and what to defer.

## 2. Current State

**Existing infrastructure:**
- `NewsletterSubscriber` model: `id`, `createdAt`, `emailOrPhone` (unique), `sourcePage`, `isActive`, `unsubscribedAt`
- `NewsletterService` (`src/lib/services/newsletter.service.ts`): subscribe, unsubscribe, getAllSubscribers, getStats, exportToCSV
- Public API: `/api/growth/newsletter-subscribe` (POST), `/api/growth/newsletter-unsubscribe` (POST)
- Admin API: `/api/admin/growth/newsletter` (GET, with CSV export)
- Admin UI: `/admin/newsletter` (subscriber list, stats, CSV export)
- Public component: `NewsletterSignup` (footer + inline variants)
- Unsubscribe page: `/unsubscribe`
- **No email delivery provider**
- **No campaign creation/sending**
- **No consent tracking**
- **No segmentation**
- **No preferences**

## 3. Phase A Scope (Minimum Foundation)

### 3.1 What Phase A Does

| Item | Action |
|------|--------|
| NewsletterSubscriber model | EXTEND with additive nullable fields |
| NewsletterService | EXTEND subscribe method to accept new fields |
| Newsletter subscribe API | EXTEND input to accept name, email, phone, consentSource |
| Admin newsletter page | EXTEND to display new fields |
| NewsletterSignup component | EXTEND to optionally capture name |
| Email provider interface | DEFINE interface only (no implementation) |
| NewsletterIssue model | DEFER to Phase B |
| NewsletterCampaign model | DEFER to Phase B |
| NewsletterSegment model | DEFER to Phase B |
| Email sending | DEFER to Phase B |
| Campaign tracking | DEFER to Phase B |

### 3.2 Why This Scope

Phase A goal: "genuinely usable editorial operation." The editorial operation needs to **capture richer subscriber data** for future use, but does not need to **send email campaigns** yet. Email delivery requires:
- Selecting and configuring an email provider (deployment decision)
- Building email templates
- Implementing webhook handlers for delivery tracking
- Compliance setup (unsubscribe headers, etc.)

These are Phase B concerns. Phase A ensures the subscriber model is ready for campaigns when they arrive.

### 3.3 Field Additions to NewsletterSubscriber

| Field | Type | Default | Purpose |
|------|------|---------|---------|
| name | String? | null | Subscriber name |
| email | String? | null | Separate email (for email delivery) |
| phone | String? | null | Separate phone (for WhatsApp/SMS future) |
| consentAt | DateTime? | null | When consent was given |
| consentSource | String? | null | Where consent was captured |
| preferences | Json? | null | Content preferences, frequency, language |
| lastEngagedAt | DateTime? | null | Last open/click (populated in Phase B) |
| bounceCount | Int | 0 | Email bounce count (populated in Phase B) |
| suppressedAt | DateTime? | null | Suppression timestamp (populated in Phase B) |

### 3.4 Migration Approach

- Add nullable columns with defaults to existing table
- Existing records: null for new fields, 0 for bounceCount
- `consentAt` for existing subscribers: set to `createdAt` in a post-migration script (grandfathered consent)
- No downtime — additive migration

### 3.5 API Changes

**`/api/growth/newsletter-subscribe` (extended)**:

Current input:
```json
{ "emailOrPhone": "user@example.com", "sourcePage": "/blog" }
```

Extended input (backward compatible):
```json
{
  "emailOrPhone": "user@example.com",
  "sourcePage": "/blog",
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+250788123456",
  "consentSource": "footer"
}
```

- New fields are optional — existing callers continue to work
- `consentAt` is set automatically to `now()` on subscribe
- If `email` or `phone` provided, they're stored separately from `emailOrPhone`

### 3.6 Email Provider Interface (Define Only)

```typescript
// src/lib/services/email-provider.interface.ts
export interface EmailProvider {
  sendCampaign(params: {
    subjectLine: string
    preheader?: string
    htmlBody: string
    textBody?: string
    recipients: { email: string; name?: string }[]
    metadata?: Record<string, any>
  }): Promise<{ providerId: string; sentCount: number }>

  trackDelivery(campaignId: string): Promise<{
    opens: number
    clicks: number
    bounces: number
    unsubscribes: number
  }>
}
```

Phase A: Interface file created. No implementation.
Phase B: Logging provider (dev) + real provider (production).

## 4. Phase B Scope (Full Newsletter Platform)

### 4.1 Models

| Model | Purpose |
|-------|---------|
| NewsletterIssue | Newsletter issue metadata (1:1 with EditorialArticle type=Newsletter) |
| NewsletterCampaign | Delivery tracking |
| NewsletterSegment | Subscriber segmentation |
| NewsletterSubscriberSegment | Join: subscriber ↔ segment |

### 4.2 Features

- Newsletter issue creation (as EditorialArticle with type=Newsletter)
- Campaign creation and scheduling
- Email template (responsive HTML + plain text)
- Segment management (rules-based subscriber grouping)
- Campaign sending via email provider
- Delivery tracking (opens, clicks, bounces, unsubscribes)
- Webhook handlers for email provider events
- Newsletter archive page (`/newsletter`, `/newsletter/[slug]`)
- Subscriber preferences page (`/preferences`)
- Suppression management (hard bounces, spam complaints)

### 4.3 Provider Selection

**Deployment configuration decision** (not architecture decision):
- Evaluate: SendGrid, AWS SES, Resend, Postmark
- Criteria: Rwanda/East Africa deliverability, cost, API quality, webhook support
- Configured via environment variables: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, etc.

## 5. Privacy & PII Protection

| Requirement | Implementation |
|------------|---------------|
| Subscriber data is PII | Admin-only access (ADMIN role) |
| No PII in analytics | Analytics provider configured for privacy |
| No PII in ContentEvent | ContentEvent stores sessionId, not email/phone |
| CSV export | Admin-only, existing functionality preserved |
| Unsubscribe | Existing mechanism preserved, always works |
| Consent tracking | consentAt + consentSource fields |
| Suppression | suppressedAt field (populated in Phase B) |
| Data retention | Subscriber data retained until unsubscribe. No auto-deletion. |

## 6. What We Do NOT Build

- **No email sending in Phase A** — interface only
- **No email provider configuration** — deployment decision
- **No newsletter issue creation** — Phase B
- **No campaign tracking** — Phase B
- **No segmentation** — Phase B
- **No subscriber preferences UI** — Phase B
- **No A/B testing subject lines** — Phase C
- **No automated drip campaigns** — Phase C
- **No behavioral triggers** — Phase C

---

*End of Newsletter Implementation Plan*
