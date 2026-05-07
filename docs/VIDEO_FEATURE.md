# Short Video Feature (TikTok-style for Hospitality)

## Overview
Businesses can upload 30-second videos to their content feed to showcase dishes, ambiance, events, and promotions. Videos appear in the Discovery Feed (`/discover/feed`) where customers can view, like, share, and order directly.

## Technical Implementation

### 1. Content Types
- **SHORT_VIDEO** — 30-second max videos (MP4, MOV, WebM)
- **PHOTO** — Images (JPEG, PNG, WebP, GIF)
- **MICROBLOG** — Text posts
- **PROMO** — Promotional offers
- **COMBO** — Meal combos

### 2. Upload Flow
1. Business goes to `/dashboard/cms/new`
2. Selects "Video" post type
3. Uploads video file (client-side validates ≤30 seconds)
4. Video uploads to storage (Supabase or local)
5. `MediaAsset` record created with `durationSec`, `storageKey`, `sizeBytes`
6. Post created with `mediaIds` array referencing the asset
7. Post goes through approval workflow: DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED

### 3. Storage Options

#### Option A: Local Storage (Development)
- Files saved to `public/uploads/videos/` and `public/uploads/images/`
- Served directly via Next.js static file serving
- **Pros:** No external dependencies, free
- **Cons:** Not scalable, no CDN, files lost on redeploy

#### Option B: Supabase Storage (Production)
- Files uploaded to Supabase Storage bucket
- Public URLs generated automatically
- **Pros:** CDN-backed, scalable, persistent
- **Cons:** Requires Supabase project + storage bucket setup
- **Setup:**
  ```bash
  # In Supabase Dashboard:
  # 1. Create bucket: "media-uploads"
  # 2. Set public access policy
  # 3. Copy bucket URL and anon key to .env
  ```

### 4. Environment Variables
```bash
STORAGE_PROVIDER="local" # or "supabase"
SUPABASE_STORAGE_BUCKET="media-uploads"
SUPABASE_STORAGE_URL="https://xxxxx.supabase.co"
SUPABASE_STORAGE_KEY="your-anon-key"

MAX_VIDEO_DURATION_SEC="30"
MAX_VIDEO_SIZE_MB="50"
MAX_IMAGE_SIZE_MB="10"
```

### 5. Video Validation

#### Client-Side (Enforced)
- Duration: ≤30 seconds (HTML5 video metadata check)
- File type: video/mp4, video/quicktime, video/webm
- File size: ≤50MB

#### Server-Side (Future Enhancement)
- **TODO:** Add ffprobe integration for server-side duration validation
- **TODO:** Add ffmpeg for thumbnail generation
- **TODO:** Add video transcoding for consistent format/quality

### 6. Feed Display
- Videos auto-play on scroll (muted, looped)
- Custom video player with controls (play/pause, mute, fullscreen)
- Progress bar shows playback position
- Tap to play/pause
- Engagement tracking: VIEW, CLICK, LIKE, SHARE

### 7. Attribution & Analytics
- Every video view tracked in `PostEngagement` table
- Orders placed via video post tracked in `PostAttribution`
- Businesses get trending notifications when video hits 20+ engagements in 1 hour
- Attribution channel: `WHATSAPP_AI` or `WEB` depending on order source

## API Endpoints

### Upload Media
```
POST /api/cms/media/upload
Content-Type: multipart/form-data

Body:
- file: File (video or image)
- type: "VIDEO" | "IMAGE"

Response:
{
  "success": true,
  "data": {
    "id": "media_123",
    "type": "VIDEO",
    "storageKey": "videos/business_id/timestamp-hash.mp4",
    "publicUrl": "https://...",
    "durationSec": 28,
    "sizeBytes": 12345678
  }
}
```

### Get Media
```
GET /api/cms/media/[id]

Response: 302 Redirect to public URL
```

### Create Post with Video
```
POST /api/cms/posts

Body:
{
  "type": "SHORT_VIDEO",
  "title": "Our signature dish",
  "body": "Watch how we prepare it!",
  "mediaIds": ["media_123"],
  "publishAt": "2026-03-22T12:00:00Z",
  "expireAt": null
}
```

## Feature Flags
- **`cms_v1`** — Enables CMS dashboard for businesses
- **`feed_v1`** — Enables Discovery Feed for customers
- **`feed_engagement_v1`** — Enables likes, shares, comments
- **`feed_recommendations_v1`** — Enables personalized ranking

## Usage Example

### Business Flow
1. Go to `/dashboard/cms/new`
2. Select "Video" type
3. Upload 25-second video of signature dish
4. Add title: "Our Famous Brochettes"
5. Add description: "Grilled to perfection every time 🔥"
6. Schedule for tomorrow at 6 PM
7. Click "Save Draft"
8. Submit for review (or self-approve if enabled)
9. Post goes live at scheduled time

### Customer Flow
1. Visit `/discover/feed`
2. Scroll through videos from nearby restaurants
3. See 25-second brochette video auto-playing
4. Tap to unmute and watch
5. Like the video
6. Tap "Order via WhatsApp" button
7. WhatsApp opens with pre-filled message including `?ref_post=post_123`
8. Order is attributed to the video post

## Roadmap

### Phase 1 (Current) ✅
- [x] Schema for SHORT_VIDEO posts
- [x] Upload API with client-side validation
- [x] Storage service (Supabase + local fallback)
- [x] Video player component
- [x] Feed display with video support
- [x] Engagement tracking

### Phase 2 (Future)
- [ ] Server-side duration validation (ffprobe)
- [ ] Automatic thumbnail generation (ffmpeg)
- [ ] Video transcoding for consistent quality
- [ ] Multiple video formats/resolutions
- [ ] Video analytics dashboard (views, completion rate, drop-off points)
- [ ] Video editing tools (trim, filters, text overlays)

### Phase 3 (Advanced)
- [ ] Live video streaming
- [ ] Video responses/comments
- [ ] Duet/stitch features (TikTok-style)
- [ ] AI-generated captions
- [ ] Automatic translation of video text

## Notes
- Videos are muted by default (better UX for auto-play)
- Loop enabled for continuous playback
- Mobile-optimized with `playsInline` attribute
- Fullscreen support for immersive viewing
- Progress bar shows playback position
- All videos served via CDN (Supabase) or Next.js static serving (local)
