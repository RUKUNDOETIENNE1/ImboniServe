# CONTENT-001 — Knowledge, Signal, Evidence & Narrative Model

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Domain Model — Knowledge, Signals, Evidence, Narratives  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the foundation models for knowledge entities, market signals, content truth/evidence, and strategic narratives. These are **foundation models** — designed to capture and store data without building inference engines, graph databases, or complex AI systems now.

## 2. Design Principle

> **Capture everything, infer nothing (yet).**

The foundation models must be rich enough to feed future intelligence systems, but the NOW-scope implementation only captures, stores, and surfaces data. No automated inference, no graph traversal, no predictive analytics.

---

## 3. Knowledge Model

### 3.1 Knowledge Entity Types

| Type | Description | Example |
|------|-------------|---------|
| **PROBLEM** | A hospitality business problem | "High food waste from over-ordering" |
| **QUESTION** | A question hospitality operators ask | "How do I calculate food cost percentage?" |
| **CONCEPT** | A domain concept | "Inventory par level" |
| **CAPABILITY** | A product capability | "Real-time stock tracking" |
| **ROLE** | A hospitality role | "Restaurant manager" |
| **BUSINESS_TYPE** | A type of hospitality business | "Quick-service restaurant" |
| **TOPIC** | A broad knowledge topic | "Inventory management" |

### 3.2 Knowledge Entity Structure

```
KnowledgeEntity
├── id: String
├── type: String (PROBLEM | QUESTION | CONCEPT | CAPABILITY | ROLE | BUSINESS_TYPE | TOPIC)
├── name: String
├── slug: String (unique)
├── description: String?
├── parentId: String? (self-referencing hierarchy)
├── metadata: Json? (type-specific)
├── isActive: Boolean
├── createdAt, updatedAt
```

### 3.3 Hierarchy

Knowledge entities form a **tree structure** via `parentId`. Example:

```
TOPIC: Inventory Management
├── CONCEPT: Par Level
├── CONCEPT: Food Cost Percentage
├── PROBLEM: Over-ordering
│   ├── QUESTION: How to set reorder points?
│   └── QUESTION: How to reduce food waste?
└── CAPABILITY: Real-time stock tracking
```

### 3.4 Knowledge ↔ Content

Articles link to knowledge entities via `ArticleKnowledgeLink`:

| Link Type | Meaning |
|-----------|---------|
| **ADDRESSES** | Article addresses this problem/question |
| **EXPLAINS** | Article explains this concept |
| **DEMONSTRATES** | Article demonstrates this capability |
| **REFERENCES** | Article references this knowledge entity |

### 3.5 NOW Scope

- Create KnowledgeEntity model (schema only)
- Admin UI to create/edit knowledge entities
- Link articles to knowledge entities (manual)
- Display related knowledge on article pages

### 3.6 NOT NOW

- Automated knowledge graph traversal
- Automated content recommendations based on knowledge
- Inference engine for knowledge gaps
- Graph database
- Automated ontology building

---

## 4. Signal Engine Foundation

### 4.1 Signal Types

| Type | Description | Source Examples |
|------|-------------|-----------------|
| **CUSTOMER_QUESTION** | Questions from potential/current customers | Demo requests, support chats, sales calls |
| **SALES_OBJECTION** | Objections raised during sales process | Sales calls, demo follow-ups |
| **SUPPORT_QUESTION** | Questions from existing users | Support chat, WhatsApp, email |
| **FEATURE_REQUEST** | Requests for new features | Support, feedback, sales |
| **CONTENT_INTEREST** | Signals about what content resonates | Analytics, social engagement, newsletter opens |
| **INDUSTRY_TREND** | Observed trends in hospitality | News, market observation, customer conversations |
| **PRODUCT_OBSERVATION** | Observations about product usage | Internal analytics, user behavior |

### 4.2 Signal Structure

```
Signal
├── id: String
├── type: String (CUSTOMER_QUESTION | SALES_OBJECTION | ...)
├── source: String (DEMO_REQUEST | SUPPORT_CHAT | SALES_CALL | ...)
├── content: String (the signal text/summary)
├── metadata: Json? (additional context)
├── status: String (NEW | TRIAGED | ACTED_ON | ARCHIVED)
├── capturedById: String?
├── articleId: String? (if signal led to content)
├── createdAt, updatedAt
```

### 4.3 Signal Sources

| Source | Capture Mechanism |
|--------|-------------------|
| **DEMO_REQUEST** | Auto-capture from DemoRequest submissions |
| **SUPPORT_CHAT** | Manual entry from support interactions |
| **SALES_CALL** | Manual entry after sales calls |
| **NEWSLETTER_REPLY** | Manual entry from newsletter replies |
| **SOCIAL_COMMENT** | Manual entry from social media |
| **INTERNAL_OBSERVATION** | Manual entry from team observations |

### 4.4 Signal → Content Pipeline

```
Signal (NEW) → Triaged → EditorialIdea → EditorialArticle → Published
```

1. Signal captured with status `NEW`
2. Editor triages signal → status `TRIAGED`
3. If signal warrants content, create `EditorialIdea` with `sourceType: SIGNAL` and `sourceId: signal.id`
4. Idea progresses through idea pipeline → article
5. Article created → signal `articleId` set, status `ACTED_ON`

### 4.5 NOW Scope

- Create Signal model (schema only)
- Admin UI to capture/view/triage signals
- Manual signal entry (no automated capture from support chat yet)
- Auto-capture from DemoRequest (existing data → signal)
- Link signals to editorial ideas

### 4.6 NOT NOW

- Automated signal extraction from chat transcripts
- Signal clustering or trend detection
- Predictive signal analysis
- Automated content recommendations from signals
- Real-time signal streaming

---

## 5. Content Truth / Evidence Layer

### 5.1 Design Principle

> **Lightweight, not a scientific citation platform.**

Every claim in editorial content can have a verification level and optional evidence references. This is metadata on the article, not a separate evidence management system.

### 5.2 Verification Levels

| Level | Meaning | Display |
|-------|---------|---------|
| **VERIFIED** | Verified by ImboniServe team through direct testing | Green badge |
| **TESTED** | Tested in production or controlled environment | Blue badge |
| **CUSTOMER-VERIFIED** | Verified by customer experience/case study | Purple badge |
| **DATA-BACKED** | Supported by internal data/analytics | Teal badge |
| **EXTERNAL-SOURCE** | Supported by external research/publication | Orange badge |
| **HYPOTHESIS** | Proposed but not yet verified | Yellow badge |
| **UNVERIFIED** | No verification status assigned | No badge |

### 5.3 Evidence Metadata Structure

Stored as `EditorialArticle.contentTruth` (Json):

```json
{
  "claims": [
    {
      "id": "claim_1",
      "text": "QR ordering reduces wait times by 40%",
      "verificationLevel": "CUSTOMER-VERIFIED",
      "evidence": [
        {
          "type": "case-study",
          "reference": "Restaurant X Case Study",
          "url": "/stories/restaurant-x"
        },
        {
          "type": "data",
          "reference": "Internal analytics Q3 2024",
          "url": null
        }
      ]
    },
    {
      "id": "claim_2",
      "text": "Mobile money adoption in Rwanda exceeds 70%",
      "verificationLevel": "EXTERNAL-SOURCE",
      "evidence": [
        {
          "type": "external",
          "reference": "Rwanda ICT Report 2024",
          "url": "https://example.com/report"
        }
      ]
    }
  ],
  "overallVerification": "CUSTOMER-VERIFIED"
}
```

### 5.4 Evidence Types

| Type | Description |
|------|-------------|
| **case-study** | Links to a CaseStudy article |
| **data** | Internal data/analytics reference |
| **external** | External research/report/publication |
| **testimonial** | Customer testimonial |
| **observation** | Direct observation by team |
| **product-data** | Product usage data |

### 5.5 NOW Scope

- `contentTruth` Json field on EditorialArticle
- Admin UI to add/edit claims and verification levels
- Public display of verification badges on article pages
- Overall verification level shown in article listings

### 5.6 NOT NOW

- Automated claim verification
- Evidence chain validation
- Peer review system
- External source verification API
- Contradiction detection

---

## 6. Narrative Engine Foundation

### 6.1 Design Principle

> **Lightweight narrative tracking, not an elaborate AI narrative engine.**

Narratives are strategic storylines that connect multiple pieces of content. The foundation model tracks which narratives exist and which articles belong to them.

### 6.2 Narrative Structure

```
Narrative
├── id: String
├── name: String (e.g., "Hospitality Empowerment")
├── slug: String (unique)
├── description: String?
├── theme: String? (core theme)
├── status: String (DRAFT | ACTIVE | RETIRED)
├── metadata: Json? (key messages, audience, tone)
├── createdAt, updatedAt
```

### 6.3 Narrative ↔ Content

Articles link to narratives via `ArticleNarrativeLink`:

| Link Type | Meaning |
|-----------|---------|
| **PART_OF** | Article is part of this narrative |
| **INTRODUCES** | Article introduces this narrative |
| **CONTINUES** | Article continues this narrative |
| **CONCLUDES** | Article concludes this narrative |

### 6.4 Narrative Metadata Structure

```json
{
  "keyMessages": [
    "ImboniServe empowers hospitality businesses with technology",
    "Local solutions for local challenges"
  ],
  "audience": ["restaurant-owners", "hotel-managers"],
  "tone": "inspiring",
  "startDate": "2025-01-01",
  "endDate": null
}
```

### 6.5 NOW Scope

- Create Narrative model (schema only)
- Admin UI to create/edit narratives
- Link articles to narratives (manual)
- Display narrative context on article pages

### 6.6 NOT NOW

- AI-generated narrative suggestions
- Automated narrative consistency checking
- Narrative performance analytics
- Narrative-driven content recommendations
- Multi-narrative conflict detection

---

## 7. Idea Pipeline

### 7.1 Pipeline Flow

```
IDEA → RESEARCH → READY → DRAFTED → PUBLISHED → ARCHIVED
```

| State | Meaning |
|-------|---------|
| **IDEA** | Raw idea captured |
| **RESEARCH** | Being researched |
| **READY** | Ready to be drafted |
| **DRAFTED** | Article created from idea |
| **PUBLISHED** | Article published |
| **ARCHIVED** | Idea no longer relevant |

### 7.2 Idea Sources

| Source | Description |
|--------|-------------|
| **SIGNAL** | From a market signal |
| **EDITORIAL** | Editor's own idea |
| **CUSTOMER_FEEDBACK** | From customer feedback |
| **INDUSTRY_TREND** | From industry trend observation |
| **SPONTANEOUS** | Spontaneous idea |

### 7.3 NOW Scope

- Create EditorialIdea model (schema only)
- Admin UI to capture/manage ideas
- Link ideas to signals (when source is SIGNAL)
- Link ideas to articles (when idea becomes content)
- Priority and assignment tracking

---

## 8. Integration Points

```
Signal ──→ EditorialIdea ──→ EditorialArticle ──→ KnowledgeEntity
                                    │
                                    ├──→ Narrative
                                    ├──→ ContentTruth (evidence)
                                    ├──→ ArticleProductLink
                                    └──→ NewsletterIssue
```

| From | To | Relationship |
|------|----|-------------|
| Signal | EditorialIdea | `sourceId` reference (loose) |
| EditorialIdea | EditorialArticle | `articleId` reference (loose) |
| EditorialArticle | KnowledgeEntity | `ArticleKnowledgeLink` (FK) |
| EditorialArticle | Narrative | `ArticleNarrativeLink` (FK) |
| EditorialArticle | ContentTruth | `contentTruth` Json field |
| EditorialArticle | Product | `ArticleProductLink` (string key) |
| EditorialArticle | NewsletterIssue | `NewsletterIssue.articleId` (1:1) |

---

## 9. Summary: What We Build vs. What We Design For

| Model | NOW (Build) | NEXT (Extend) | LATER (Evolve) | LONG-TERM (Vision) |
|-------|-------------|---------------|-----------------|-------------------|
| KnowledgeEntity | Schema + admin UI + manual linking | Knowledge graph visualization | Automated gap detection | Hospitality knowledge graph |
| Signal | Schema + admin UI + manual capture + DemoRequest auto-capture | Support chat integration | Signal clustering | Predictive signal analysis |
| ContentTruth | Json metadata + admin UI + public badges | Evidence chain validation | Contradiction detection | Automated verification |
| Narrative | Schema + admin UI + manual linking | Narrative analytics | Consistency checking | AI narrative engine |
| EditorialIdea | Schema + admin UI + signal linking | Research workflow | AI idea generation | Predictive editorial intelligence |

---

*End of Knowledge, Signal, Evidence & Narrative Model*
