# CONTENT-001 — Media Library Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Media Library Architecture Design  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the platform-level media library architecture for editorial content. This is separate from the existing business-scoped `MediaAsset` model and reuses the existing `StorageService` for Supabase storage.

## 2. Current State

**Existing** (from forensic audit):
- `MediaAsset` model: business-scoped (`businessId` required), IMAGE/VIDEO types, storage key, dimensions, duration, thumbnail, size, MIME type
- `StorageService`: Supabase Storage backend, video/image validation, thumbnail generation, quota enforcement
- Upload via `/api/cms/media/upload` (multipart, 50MB max, ffprobe validation)
- No alt text, caption, attribution, or usage tracking
- No platform-level media library

## 3. Design Principle

> **Platform media library is separate from business-scoped media.**

Editorial content uses `PlatformMediaAsset` (no `businessId`). Business CMS content uses existing `MediaAsset` (with `businessId`). Both use the same `StorageService` for upload/storage.

## 4. PlatformMediaAsset Model

```
PlatformMediaAsset
├── id: String (cuid)
├── type: String (IMAGE | VIDEO | DOCUMENT | ICON | ILLUSTRATION)
├── storageKey: String
├── filename: String
├── altText: String? (accessibility + SEO)
├── caption: String? (display caption)
├── attribution: String? (credit/source)
├── width: Int?
├── height: Int?
├── durationSec: Int?
├── thumbnailKey: String?
├── sizeBytes: Int
├── mimeType: String
├── tags: String[] (for search/organization)
├── metadata: Json? (EXIF, color palette, etc.)
├── usageCount: Int (denormalized)
├── uploadedById: String?
├── createdAt: DateTime
├── updatedAt: DateTime
```

## 5. Storage Strategy

### 5.1 Supabase Bucket

- Platform media stored in a dedicated Supabase bucket: `platform-media` (configurable via `PLATFORM_MEDIA_BUCKET` env var)
- Business media remains in existing bucket
- Access: public read (for public content images), authenticated write

### 5.2 Storage Key Convention

```
platform-media/
├── articles/
│   ├── covers/
│   │   └── {articleId}/{filename}
│   └── inline/
│     └── {articleId}/{filename}
├── newsletter/
│   └── {issueId}/{filename}
├── og-images/
│   └── {articleId}/{filename}
└── general/
    └── {filename}
```

### 5.3 Upload Validation

Reuse existing `StorageService` validation:
- **Images**: jpeg, png, webp, gif (max 10MB)
- **Videos**: mp4, quicktime, webm (max 50MB, max 30s for short-form)
- **Documents**: pdf (max 15MB) — for Resource type content
- **Icons**: svg, png (max 1MB)

### 5.4 Image Optimization

- **NOW**: Store original + auto-generate thumbnail (existing StorageService capability)
- **NEXT**: Generate multiple sizes (thumbnail, small, medium, large, original) for responsive images
- **LATER**: On-the-fly image transformation via Supabase Image Transformations or CDN

## 6. Media Management

### 6.1 Upload

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/media/upload` | POST | Upload platform media (multipart) |
| `/api/admin/media` | GET | List media (with filters: type, tags, search) |
| `/api/admin/media/[id]` | GET, PATCH, DELETE | Get/update/delete media |

### 6.2 Admin UI

| Page | Purpose |
|------|---------|
| `/admin/media` | Media library grid/list view |
| `/admin/media/upload` | Upload interface (drag-and-drop, multi-file) |
| `/admin/media/[id]` | Media detail/edit (alt text, caption, attribution, tags) |

### 6.3 Media Features

- **Search**: by filename, alt text, caption, tags
- **Filter**: by type (IMAGE, VIDEO, DOCUMENT, etc.)
- **Sort**: by date, size, usage count
- **Bulk actions**: tag, delete, update attribution
- **Usage tracking**: `usageCount` denormalized counter (incremented when media is used in an article)

## 7. Media Usage in Articles

### 7.1 Cover Image

- `EditorialArticle.coverImageId` references `PlatformMediaAsset.id` (loose reference, not Prisma relation)
- Displayed at top of article, in listings, and as OG image fallback

### 7.2 Inline Images

- Article body (Markdown) references media by storage key or public URL
- Markdown image syntax: `![alt text](/imgs/articles/{articleId}/{filename})`
- Rich text: embedded media references

### 7.3 OG Images

- `seoMeta.ogImageId` references `PlatformMediaAsset.id`
- If not set, falls back to cover image
- If no cover image, falls back to site default OG image

## 8. What We Do NOT Build

- **No complex DAM (Digital Asset Management)** — this is a media library, not an enterprise DAM
- **No automated image tagging** (LATER scope for AI)
- **No version control for media** (replace, not version)
- **No media approval workflow** (editors can upload directly)
- **No external CDN integration** (Supabase Storage is sufficient for NOW)
- **No video transcoding** (beyond thumbnail generation)

## 9. Security

- Upload requires `EDITOR` or `ADMIN` editorial role
- Delete requires `ADMIN` editorial role
- File type validation (MIME type + extension)
- File size limits enforced
- No executable file types allowed
- Alt text encouraged for accessibility and SEO (not required for NOW, validated in NEXT)

---

*End of Media Library Architecture*
