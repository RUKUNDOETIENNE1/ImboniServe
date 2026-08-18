# CONTENT-001 — Content Distribution Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Content Distribution Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the architecture for distributing editorial content across multiple channels — web, newsletter, and social media — from a single master content object.

## 2. Design Principle

> **One master content object, multiple distribution channels.**

Content is authored once in `EditorialArticle` and distributed to channels via `distributionMeta` metadata. Each channel receives content in the appropriate format.

## 3. Channel Architecture

### 3.1 Channel Status

| Channel | Status | Distribution Mechanism |
|---------|--------|----------------------|
| **Web** | NOW | Public pages with SSR + SEO |
| **Newsletter** | NOW | Email campaign via provider |
| **LinkedIn** | LATER | API integration or manual |
| **X/Twitter** | LATER | API integration or manual |
| **Facebook** | LATER | API integration or manual |
| **Instagram** | LATER | Manual (content repurposing) |
| **YouTube** | LATER | Video content distribution |
| **TikTok** | LATER | Manual (short-form video) |
| **WhatsApp** | LATER | WhatsApp Channel or status |

### 3.2 Distribution Metadata

Stored in `EditorialArticle.distributionMeta` (Json):

```json
{
  "channels": ["web", "newsletter"],
  "web": {
    "publishedAt": "2025-01-20T10:00:00Z",
    "featured": true,
    "homepageHighlight": false
  },
  "newsletter": {
    "issueNumber": 12,
    "subjectLine": "QR ordering cuts wait times by 40%",
    "segmentId": "seg_abc",
    "scheduledSendAt": "2025-01-21T08:00:00Z"
  },
  "social": {
    "linkedin": {
      "enabled": false,
      "customText": null,
      "scheduledAt": null
    },
    "twitter": {
      "enabled": false,
      "customText": null,
      "thread": false
    }
  }
}
```

## 4. Web Distribution (NOW)

### 4.1 Publishing Flow

1. Article status → PUBLISHED
2. Article appears on public pages at `/{type-path}/{slug}`
3. Article added to dynamic sitemap
4. Article appears in listing pages
5. Article appears in topic/tag pages
6. Article appears in "latest articles" on homepage

### 4.2 Web-Specific Formatting

- Full article body rendered as HTML
- Cover image displayed
- Related articles shown
- Social share buttons
- Newsletter signup inline
- SEO metadata in `<head>`

## 5. Newsletter Distribution (NOW)

### 5.1 Publishing Flow

1. Newsletter issue (EditorialArticle + NewsletterIssue) created
2. Goes through editorial workflow → APPROVED
3. Publisher selects segment and schedules send
4. At scheduled time:
   - Article → PUBLISHED (archive page goes live)
   - NewsletterCampaign created
   - Email sent to segment subscribers
5. Metrics tracked (opens, clicks, bounces, unsubscribes)

### 5.2 Newsletter-Specific Formatting

- Article body rendered as HTML email
- Subject line and preheader from NewsletterIssue
- Unsubscribe link in footer
- ImboniServe branding
- Plain text alternative

## 6. Social Distribution (LATER)

### 6.1 Design Foundation

Each social channel has:
- `enabled`: Boolean — whether to distribute to this channel
- `customText`: String? — channel-specific text (override article title)
- `scheduledAt`: DateTime? — when to post
- `postedAt`: DateTime? — when actually posted
- `externalId`: String? — platform post ID for tracking

### 6.2 Social Content Adaptation

| Channel | Content Format | Character Limit |
|---------|---------------|-----------------|
| LinkedIn | Article excerpt + link | 3000 chars |
| X/Twitter | Title + link (or thread) | 280 chars per tweet |
| Facebook | Excerpt + link + image | No limit |
| Instagram | Image + caption + link in bio | 2200 chars |
| WhatsApp | Short text + link | 4096 chars |

### 6.3 Implementation Approach

- **LATER**: API integrations with social platforms
- **Manual fallback**: "Copy to clipboard" buttons for each channel with pre-formatted text
- **No auto-publishing**: Social posts require human review before publishing

## 7. Content Repurposing (LATER)

### 7.1 AI-Assisted Repurposing

Extension point for AI to generate channel-specific content:
- Generate LinkedIn post from article
- Generate Twitter thread from article
- Generate Instagram caption from article
- Generate newsletter teaser from article

### 7.2 Design

```json
{
  "repurposing": {
    "aiSuggestions": {
      "linkedin": "AI-generated LinkedIn post text",
      "twitter": ["Tweet 1", "Tweet 2", "Tweet 3"],
      "instagram": "AI-generated Instagram caption"
    }
  }
}
```

- AI suggestions are **drafts**, not auto-published
- Editor reviews and edits before publishing
- No automatic publishing of AI-generated content

## 8. Distribution API

### 8.1 NOW Scope

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/content/articles/[id]/distribute` | GET | Get distribution status |
| `/api/admin/content/articles/[id]/distribute` | PUT | Update distribution metadata |
| `/api/admin/content/newsletter/issues/[id]/send` | POST | Send newsletter issue |

### 8.2 LATER Scope

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/content/articles/[id]/distribute/social` | POST | Distribute to social channel |
| `/api/admin/content/articles/[id]/repurpose` | POST | Generate AI repurposing suggestions |

## 9. What We Do NOT Build

- **No automated social media posting** (LATER, with human review)
- **No content syndication to external platforms** (LATER)
- **No RSS feed** (LATER — simple to add but not needed for NOW)
- **No content embedding/widget for third-party sites** (LONG-TERM)
- **No multi-channel content versioning** (content is authored once, adapted per channel)

---

*End of Content Distribution Architecture*
