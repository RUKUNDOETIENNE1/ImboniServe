# CONTENT-001 — Newsletter Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Newsletter Architecture Design  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the newsletter architecture that extends the existing subscriber management system into a first-class editorial newsletter platform with campaigns, consent, preferences, and delivery tracking.

## 2. Current State

**Existing** (from forensic audit):
- `NewsletterSubscriber` model: `emailOrPhone`, `sourcePage`, `isActive`, `unsubscribedAt`
- `NewsletterService`: subscribe, unsubscribe, getAllSubscribers, getStats, exportToCSV
- Public API: `/api/growth/newsletter-subscribe`, `/api/growth/newsletter-unsubscribe`
- Admin UI: `/admin/newsletter` — subscriber list, stats, CSV export
- Public component: `NewsletterSignup` (footer + inline variants)
- Unsubscribe page: `/unsubscribe`
- **No email delivery provider**
- **No campaign creation/sending**
- **No consent tracking**
- **No segmentation**
- **No preferences**

## 3. Architecture Principle

> **Newsletter is a first-class editorial object, not just a subscriber list.**

A newsletter issue is an `EditorialArticle` with `type: "Newsletter"`. It goes through the editorial workflow, has SEO metadata (for the archive page), and has additional newsletter-specific metadata via `NewsletterIssue`.

## 4. Extended Subscriber Model

### 4.1 NewsletterSubscriber Additions

| Field | Type | Purpose |
|-------|------|---------|
| `name` | String? | Subscriber name |
| `email` | String? | Separate email (for email delivery) |
| `phone` | String? | Separate phone (for WhatsApp/SMS future) |
| `consentAt` | DateTime? | When consent was given |
| `consentSource` | String? | Where consent was captured |
| `preferences` | Json? | Content preferences, frequency |
| `lastEngagedAt` | DateTime? | Last open/click |
| `bounceCount` | Int @default(0) | Email bounce count |
| `suppressedAt` | DateTime? | Suppression timestamp |

### 4.2 Consent Model

- **Consent timestamp**: `consentAt` records when subscriber opted in
- **Consent source**: `consentSource` records where (footer, inline, landing page, etc.)
- **Implicit consent**: Existing subscribers (who opted in before this field was added) are grandfathered with `consentAt = createdAt`
- **Withdrawal**: Unsubscribe sets `isActive = false` and `unsubscribedAt = now()`

### 4.3 Suppression

- `suppressedAt` is set when:
  - Hard bounce received from email provider
  - Spam complaint received
  - Manual suppression by admin
- Suppressed subscribers are excluded from all sends regardless of `isActive`
- Suppression is separate from unsubscribe (a subscriber can be active but suppressed)

### 4.4 Preferences Structure

```json
{
  "frequency": "WEEKLY", // WEEKLY | MONTHLY | DAILY | NEVER
  "topics": ["inventory-management", "qr-ordering"],
  "format": "HTML", // HTML | TEXT
  "language": "en" // en | fr | rw
}
```

## 5. Newsletter Issue Model

### 5.1 NewsletterIssue (1:1 with EditorialArticle)

```
NewsletterIssue
├── id: String
├── articleId: String (unique, FK to EditorialArticle)
├── issueNumber: Int (sequential)
├── subjectLine: String (email subject)
├── preheader: String? (preview text)
├── segmentId: String? (target segment)
├── sentAt: DateTime?
├── sentCount: Int
├── openCount: Int
├── clickCount: Int
├── bounceCount: Int
├── unsubscribeCount: Int
```

### 5.2 Issue Lifecycle

```
DRAFT (article status) → REVIEW → APPROVED → SCHEDULED → PUBLISHED + SENT
```

1. Editor creates newsletter issue (EditorialArticle + NewsletterIssue)
2. Goes through editorial workflow (DRAFT → REVIEW → APPROVED)
3. Publisher schedules send: sets `scheduledAt` and `segmentId`
4. At `scheduledAt`, system:
   - Transitions article to PUBLISHED (archive page goes live)
   - Creates NewsletterCampaign
   - Sends to all subscribers in segment
   - Records `sentAt`, `sentCount`

## 6. Campaign & Delivery Model

### 6.1 NewsletterCampaign

```
NewsletterCampaign
├── id: String
├── issueId: String? (FK to NewsletterIssue)
├── campaignName: String
├── subjectLine: String
├── sentAt: DateTime?
├── status: String (DRAFT | SCHEDULED | SENDING | SENT | FAILED)
├── recipientCount: Int
├── providerId: String? (external provider campaign ID)
├── providerName: String? (sendgrid | ses | mailchimp | etc.)
├── metadata: Json?
```

### 6.2 Email Delivery Provider

**Design decision**: Do NOT assume a specific email provider. The architecture uses a **provider abstraction layer**:

```typescript
interface EmailProvider {
  sendCampaign(params: {
    subjectLine: string
    preheader?: string
    htmlBody: string
    textBody?: string
    recipients: Subscriber[]
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

### 6.3 NOW Scope (Provider)
- Define `EmailProvider` interface
- Implement a **logging provider** (sends to logs, not real email) for development
- Production provider selection is a deployment configuration decision
- Recommended providers to evaluate: SendGrid, AWS SES, Resend, Postmark
- Provider configured via environment variables (e.g., `EMAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY=...`)

### 6.4 NOT NOW
- No multi-provider routing
- No A/B testing subject lines
- No automated drip campaigns
- No behavioral triggers
- No template builder UI

## 7. Segmentation Model

### 7.1 NewsletterSegment

```
NewsletterSegment
├── id: String
├── name: String
├── description: String?
├── rules: Json (segmentation rules)
├── subscriberCount: Int (denormalized)
├── isActive: Boolean
```

### 7.2 Segment Rules Structure

```json
{
  "source": ["footer", "landing-page"],
  "topics": ["inventory-management"],
  "isActive": true,
  "minSubscribedDate": "2024-01-01",
  "language": "en"
}
```

### 7.3 Default Segments
- **All Active** — all subscribers with `isActive = true` and `suppressedAt = null`
- **Engaged** — subscribers with `lastEngagedAt` within last 90 days
- **New** — subscribers within last 30 days

## 8. Newsletter Templates

### 8.1 Template Structure

Newsletter issues use the article body (Markdown/HTML) as content. The email template wraps this content:

```
[Header: ImboniServe logo + issue number]
[Preheader text]
[Article body rendered as HTML]
[CTA section]
[Footer: unsubscribe link, preferences, address]
```

### 8.2 Template Requirements
- Responsive HTML email template
- Plain text alternative (auto-generated from Markdown)
- Unsubscribe link in every email (required by law)
- ImboniServe branding
- Dark mode support (where email clients support it)

## 9. API Design

### 9.1 Public API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/growth/newsletter-subscribe` | POST | Subscribe (existing, extend with name/email/phone) |
| `/api/growth/newsletter-unsubscribe` | POST | Unsubscribe (existing) |
| `/api/growth/newsletter-preferences` | GET, PUT | View/update preferences (NEXT) |

### 9.2 Admin API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/growth/newsletter` | GET | List subscribers (existing, extend) |
| `/api/admin/growth/newsletter/issues` | GET, POST | List/create newsletter issues |
| `/api/admin/growth/newsletter/issues/[id]` | GET, PATCH | Get/update issue |
| `/api/admin/growth/newsletter/issues/[id]/send` | POST | Send issue to segment |
| `/api/admin/growth/newsletter/campaigns` | GET | List campaigns |
| `/api/admin/growth/newsletter/segments` | GET, POST | List/create segments |
| `/api/admin/growth/stats` | GET | Stats (existing, extend) |

## 10. Admin UI

### 10.1 Newsletter Admin Pages

| Page | Purpose |
|------|---------|
| `/admin/newsletter` | Subscriber list + stats (existing, extend) |
| `/admin/newsletter/issues` | Newsletter issue management |
| `/admin/newsletter/issues/new` | Create new issue |
| `/admin/newsletter/issues/[id]` | Edit/send issue |
| `/admin/newsletter/campaigns` | Campaign history and tracking |
| `/admin/newsletter/segments` | Segment management |

### 10.2 Issue Editor

The issue editor is the editorial article editor with newsletter-specific fields:
- Subject line
- Preheader text
- Target segment selector
- Send/schedule controls
- Preview (rendered email)

## 11. Public Pages

| Page | URL | Purpose |
|------|-----|---------|
| Newsletter archive | `/newsletter` | List of published newsletter issues |
| Newsletter issue | `/newsletter/[slug]` | Individual issue archive page |
| Unsubscribe | `/unsubscribe` | Unsubscribe form (existing) |
| Preferences | `/preferences` | Subscriber preferences (NEXT) |

## 12. Analytics & Tracking

### 12.1 Per-Issue Metrics

| Metric | Source |
|--------|--------|
| `sentCount` | Number of emails sent |
| `openCount` | Email provider webhook |
| `clickCount` | Email provider webhook |
| `bounceCount` | Email provider webhook |
| `unsubscribeCount` | Unsubscribe link clicks |

### 12.2 Webhook Integration

Email provider webhooks update `NewsletterIssue` metrics:
- Open event → increment `openCount`, update `lastEngagedAt`
- Click event → increment `clickCount`, update `lastEngagedAt`
- Bounce event → increment `bounceCount`, set `suppressedAt` if hard bounce
- Unsubscribe event → set `isActive = false`, `unsubscribedAt`

---

*End of Newsletter Architecture*
