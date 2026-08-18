# CONTENT-001 — Content-Product Relationship Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Content-Product Relationship Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define how editorial content relates to ImboniServe product features and capabilities — without hardcoding product names into content logic.

## 2. Design Principle

> **Flexible string-key references, not foreign keys to product tables.**

Content references products via `productKey` (a string like `"qr-ordering"`, `"inventory"`, `"analytics"`). This avoids coupling content to product schema and allows content to reference features that may not have database representations.

## 3. Relationship Model

### 3.1 ArticleProductLink

```
ArticleProductLink
├── id: String
├── articleId: String (FK to EditorialArticle)
├── productKey: String (e.g., "qr-ordering", "inventory", "analytics")
├── productLabel: String? (display override)
├── linkType: String (FEATURED | MENTIONED | COMPARED | TUTORIAL)
├── sortOrder: Int
├── createdAt: DateTime
├── @@unique([articleId, productKey])
```

### 3.2 Link Types

| Type | Meaning | Use Case |
|------|---------|----------|
| **FEATURED** | Article primarily about this product feature | "Inside Smart Dining Slips™" |
| **MENTIONED** | Article mentions this product feature | "How technology helps restaurants" mentions QR ordering |
| **COMPARED** | Article compares product features | "QR ordering vs. traditional menus" |
| **TUTORIAL** | Article is a how-to guide for this feature | "How to set up inventory par levels" |

## 4. Product Key Registry

### 4.1 Purpose

A lightweight registry of known product keys with display metadata. Not a product database — just a mapping for UI display.

### 4.2 Implementation

```typescript
// src/config/product-keys.ts
export const PRODUCT_KEYS: Record<string, { label: string; url: string; icon?: string }> = {
  'qr-ordering': { label: 'QR Code Ordering', url: '/features#qr-ordering', icon: 'QrCode' },
  'inventory': { label: 'Inventory & Procurement', url: '/features#inventory', icon: 'Package' },
  'analytics': { label: 'Reports & Analytics', url: '/features#analytics', icon: 'BarChart3' },
  'smart-analytics': { label: 'Smart Analytics', url: '/features#smart-analytics', icon: 'BrainCircuit' },
  'discovery': { label: 'Discovery Listing', url: '/features#discovery', icon: 'Globe' },
  'dining-slips': { label: 'Smart Dining Slips™', url: '/features#dining-slips', icon: 'Receipt' },
  'whatsapp': { label: 'WhatsApp Integration', url: '/features#whatsapp', icon: 'MessageCircle' },
  'payments': { label: 'Mobile Money Payments', url: '/features#payments', icon: 'Smartphone' },
  'roles': { label: 'Role-Based Access', url: '/features#roles', icon: 'Shield' },
  'cms': { label: 'Content & Discovery Feed', url: '/features#cms', icon: 'Megaphone' },
  'procurement': { label: 'Procurement & Suppliers', url: '/features#procurement', icon: 'Package' },
  'reservations': { label: 'Reservations', url: '/features#reservations', icon: 'Calendar' },
  'group-ordering': { label: 'Group Ordering', url: '/features#group-ordering', icon: 'Users' },
  'tap-leave': { label: 'Tap & Leave™', url: '/features#tap-leave', icon: 'CreditCard' },
}
```

### 4.3 Design Rules

- Product keys are **strings**, not database IDs
- Registry is a **configuration file**, not a database table
- New product keys can be added to the config file without migration
- `productLabel` in ArticleProductLink can override the registry label
- Unknown product keys (not in registry) are displayed as-is (no error)

## 5. Content Display

### 5.1 On Article Page

- "Related features" section showing product links with labels and URLs
- Links go to feature pages (`/features#qr-ordering`)
- FEATURED links shown prominently; MENTIONED links shown subtly

### 5.2 On Feature Pages

- "Related articles" section showing articles that link to this product key
- Query: `ArticleProductLink.where(productKey = "qr-ordering")` joined to published articles

### 5.3 On Product Pages (LATER)

- If product pages exist at `/product/{key}`, show related content
- Cross-linking between product pages and content

## 6. Bidirectional Query

### 6.1 Articles → Products

```typescript
const links = await prisma.articleProductLink.findMany({
  where: { articleId },
  include: { article: { select: { title: true, slug: true, type: true } } }
})
```

### 6.2 Products → Articles

```typescript
const articles = await prisma.articleProductLink.findMany({
  where: { productKey: 'qr-ordering' },
  include: { article: true },
  // filter to published only
})
```

## 7. What We Do NOT Build

- **No FK to product tables** — product keys are strings
- **No automated product mention extraction** (LATER: AI-assisted)
- **No product-specific content rules** — all content types can link to any product
- **No product content templates** — content about products uses same templates as all content

---

*End of Content-Product Relationship Architecture*
