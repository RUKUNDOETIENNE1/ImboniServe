# Manual Tasks for Non-Programmers
**Imboni Serve Platform Setup & Maintenance**  
**Date:** March 23, 2026

---

> IMPORTANT: This is the ONLY manual you need. All other Markdown guides have been archived to avoid confusion. If you find any other .md files, please ignore them and use this document only. See docs/_manual_archive/ARCHIVE_INDEX.md for archived references.

## Quick Start (5 steps)

- **[Step 1]** Fill `.env` with the few required values in Section 1.
- **[Step 2]** Run the seed: `npm run seed` (creates demo data and flags).
- **[Step 3]** Log in as Admin and review Feature Flags (Section 3).
- **[Step 4]** For custom domains, follow DNS instructions (Section 5).
- **[Step 5]** Use the Daily/Weekly/Monthly checklists (Section 6) to operate.

---

## Overview
This document contains all manual tasks that need to be completed by non-technical team members to fully activate and maintain the Imboni Serve platform.

---

## 1. Environment Variables Setup

### Required Actions
Open the `.env` file in the project root and fill in the following values:

#### A) OpenAI API Key (For AI Features)
```env
OPENAI_API_KEY="your-openai-api-key-here"
```

**How to get it:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in `.env`
5. Set monthly spending limit to $50 in OpenAI dashboard

**Cost:** ~$0.10-$1.00 per business per month for AI copy generation

---

#### B) Twilio WhatsApp (For Notifications)
```env
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

**How to get it:**
1. Go to https://www.twilio.com/console
2. Sign up for Twilio account
3. Find Account SID and Auth Token on dashboard
4. For WhatsApp: Go to Messaging > Try it out > Send a WhatsApp message
5. Copy the WhatsApp number provided

**Cost:** Pay-as-you-go, ~$0.005 per message

---

#### C) Payment Gateway (InTouch Mobile Money - PRIMARY)
**NEW: 5% All-Inclusive Payment Fee** ✅

```env
# InTouch Mobile Money (MTN & Airtel) — PRIMARY
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="your_intouch_username"
INTOUCH_ACCOUNT_NO="your_intouch_account_number"
INTOUCH_PASSWORD="your_intouch_partner_password"

# IremboPay (Cards) — FALLBACK
IREMBO_PUBLIC_KEY="your_public_key_here"
IREMBO_SECRET_KEY="your_secret_key_here"
PAYMENTS_PROVIDER="intouch"
```

**How to get InTouch credentials:**
1. Contact InTouch: https://www.intouchpay.co.rw
2. Request business account setup
3. Provide business registration documents
4. Receive username, account number, and partner password
5. Add credentials to `.env` file

**Customer-Facing Pricing:**
- **All digital payments: 5% fee** (simple, transparent)
- Cash: 0% fee
- No hidden fees, no surprises

**Internal Cost Structure (for your reference):**
- InTouch (Mobile Money): 3% gateway cost → 2% platform margin
- IremboPay (Cards): 3.42% gateway cost → 1.58% platform margin
- **Smart routing:** System defaults to InTouch (better margin)

**Why 5% All-Inclusive?**
- ✅ Customer-friendly (5% vs 8% perception)
- ✅ Competitive (industry standard)
- ✅ Simple (one fee, no confusion)
- ✅ Higher conversion (lower visible fee = more adoption)

---

#### D) Email Service (Optional)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Imboni Serve <noreply@imboni.serve>"
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy 16-character password and paste in `.env`

---

## 2. Database Seeding

### Required Actions
Run the database seed to populate initial data:

**Windows:**
```powershell
npm run seed
```

**What this does:**
- Creates subscription plans (Starter, Essentials, Professional, Growth)
- Creates demo users (admin, owner, cashier, kitchen, supplier)
- Creates sample menu items
- Creates feature flags with autopilot settings
- Creates demo affiliate code

**Login Credentials (After Seeding):**
- Admin: `admin@imboni.resto` / `Admin123!`
- Owner: `jean@nyamacafe.rw` / `Owner123!`
- Cashier: `marie@nyamacafe.rw` / `Cashier123!`

---

## 3. Feature Flags Configuration

### Required Actions
1. Log in as Admin
2. Go to `/dashboard/admin/feature-flags`
3. Review and enable/disable features as needed

**Recommended Initial Settings:**
- ✅ Enable: `site_builder_templates_v1`
- ✅ Enable: `site_builder_ai_copy_v1`
- ✅ Enable: `site_builder_custom_domain_v1`
- ✅ Enable: `site_builder_badge_enforcement`
- ❌ Disable: Phase 2 and Phase 3 flags (will auto-enable via autopilot)
- ❌ Disable: `site_builder_kill_switch` (only use in emergencies)

**Autopilot Thresholds:**
- Phase 2 enables at: 30 published sites, 1,000 visits, 98% AI success
- Phase 3 enables at: 100 published sites, 25 domains, 10,000 visits

---

## 4. Site Builder Templates

### Required Actions
No manual action needed. Templates are pre-configured in code.

**Available Templates (Phase 1):**
- Restaurant: Casual Dining, Fine Dining, Quick Service
- Café: Modern Café, Cozy Corner
- Bar: Upscale Lounge, Sports Bar
- Hotel: Boutique Hotel, Resort & Spa
- Specialty: Spa & Wellness, Event Venue, Food Truck, Artisan Bakery

**Template Expansion:**
- Phase 2: 50-60 templates (auto-unlocks)
- Phase 3: 100+ templates (auto-unlocks)

---

## 5. Custom Domain DNS Configuration

### Required Actions (For Each Custom Domain Request)

When a business requests a custom domain:

1. **Verify Domain Ownership**
   - Check that business owns the domain
   - Confirm domain is not .tk or .ml (blocked)

2. **Provide DNS Instructions**
   ```
   Add these DNS records:
   
   Type: CNAME
   Name: www (or @)
   Value: verify.imboni.serve
   
   Type: TXT
   Name: _imboni-verify
   Value: [verification-token-from-system]
   ```

3. **Wait for Verification**
   - System checks DNS every 5 minutes
   - Verification window: 24 hours
   - Status updates automatically in dashboard

4. **SSL Certificate**
   - System provisions Let's Encrypt SSL automatically
   - No manual action needed

---

## 6. Monitoring & Maintenance

### Daily Tasks
- [ ] Check error logs in `/dashboard/admin/logs` (if implemented)
- [ ] Review new business signups
- [ ] Monitor payment gateway status (InTouch + IremboPay)
- [ ] Check payment reconciliation dashboard (`/admin/reconciliation`)
- [ ] Review InTouch Mobile Money transactions (`/admin/analytics`)

### Weekly Tasks
- [ ] Review feature flag autopilot status
- [ ] Check AI API usage and costs
- [ ] Review customer support tickets
- [ ] Check domain verification queue

### Monthly Tasks
- [ ] Review OpenAI spending (should be < $50/month)
- [ ] Review Twilio spending
- [ ] Backup database (automated, verify success)
- [ ] Review feature adoption metrics
- [ ] Update templates if needed
- [ ] Review reconciliation logs for any unresolved issues

---

## 6b. Automated Payment Reconciliation (NEW)

### What It Does
The system automatically runs **every night at 2:00 AM** to:
- Detect payment-order mismatches (payment succeeded but order not marked as paid)
- **Auto-fix** mismatches by updating orders to PAID status
- Expire stale payments (pending for >24 hours)
- Flag amount mismatches for manual review
- Log all issues in the reconciliation dashboard

### Why This Matters
Prevents financial losses from:
- Customers charged but order shows as unpaid
- Duplicate payment attempts
- Orphan payments without matching orders

### How to Monitor
1. Go to `/admin/reconciliation` (Admin Dashboard)
2. Review the **Reconciliation Logs** table
3. Check for entries with status:
   - **STILL_PENDING**: Payment stuck for >24 hours (needs manual check)
   - **AMOUNT_MISMATCH**: Payment amount ≠ order amount (needs review)
   - **Auto-fixed**: System corrected a mismatch automatically ✅

### What You Need to Do
**Daily (5 minutes):**
- Check reconciliation dashboard for new issues
- Review any "STILL_PENDING" or "AMOUNT_MISMATCH" entries
- Click "Resolve" after investigating each issue

**Weekly:**
- Verify the nightly job is running (check logs for entries dated today)
- Confirm auto-fixes are working (look for "auto-fixed" notes)

### No Setup Needed
- The reconciliation job runs automatically via the existing cron system
- Uses the same `CRON_SECRET` from Section 23 (Invite & Earn cron)
- No additional configuration required

### Troubleshooting
**Q: No reconciliation logs appearing**
- Check the cron job is running (Section 23)
- Verify `CRON_SECRET` is set in `.env`
- Check server logs for errors

**Q: Too many "STILL_PENDING" entries**
- May indicate payment gateway issues
- For Mobile Money: Contact InTouch support: support@intouchpay.co.rw
- For Cards: Contact IremboPay support: support@irembopay.com
- Review network connectivity

**Q: Amount mismatches appearing**
- Check if menu prices were changed after order creation
- Verify 5% payment fee is calculated correctly
- Verify tax calculations are correct
- Contact development team if recurring

**Q: InTouch payments not working**
- Verify InTouch credentials in `.env` are correct
- Check InTouch account balance (minimum balance required)
- Confirm customer phone number format (07XXXXXXXX)
- Test with MTN (078/079) and Airtel (073) numbers separately

---

## 7. Customer Support Scripts

### Site Builder Issues

**Q: How do I create a mini-site?**
A: Go to Dashboard > Site Builder > Choose a template > Customize branding > Add content > Publish

**Q: Can I use my own domain?**
A: Yes! In Site Builder > Publish tab > Enter your domain > Follow DNS instructions. Note: .tk and .ml domains are not supported.

**Q: How much does AI copy generation cost?**
A: It's included in your plan. We have a $5/month limit per business to prevent abuse.

**Q: My domain verification is stuck**
A: DNS propagation can take up to 24 hours. Check your DNS settings and try "Verify Domain" again.

---

### Referral Program Issues

**Q: How do I get my referral code?**
A: Visit https://yoursite.com/refer > Enter your phone number > Get your unique code

**Q: When do I get my reward?**
A: You'll receive RWF 5,000 dining credit once the restaurant you referred signs up and completes their first payment.

**Q: Where can I use my dining credits?**
A: At any restaurant using Imboni Serve across Rwanda.

---

### Payment Issues (NEW)

**Q: What is the payment fee?**
A: All digital payments have a simple 5% all-inclusive fee. Cash payments have no fee.

**Q: Why is the fee 5%?**
A: This covers secure payment processing, instant settlement, and fraud protection. It's competitive with industry standards and includes everything—no hidden fees.

**Q: Can I pay with Mobile Money?**
A: Yes! We support MTN Mobile Money and Airtel Money via InTouch. You'll receive a USSD prompt on your phone (*182#) to approve the payment.

**Q: Can I pay with a card?**
A: Yes! We accept Visa and Mastercard via IremboPay. Same 5% fee applies.

**Q: My Mobile Money payment is stuck on "Pending"**
A: 
1. Check your phone for the USSD prompt (*182#)
2. Approve the payment within 5 minutes
3. If expired, try again with a new payment
4. Contact support if issues persist

**Q: I was charged but my order shows unpaid**
A: Our system auto-reconciles every night. If urgent:
1. Take a screenshot of your Mobile Money confirmation
2. Note your order ID
3. Contact restaurant support
4. We'll manually verify and update within 1 hour

**Q: What's the difference between InTouch and IremboPay?**
A: 
- **InTouch**: Mobile Money (MTN, Airtel) - Recommended
- **IremboPay**: Credit/Debit cards (Visa, Mastercard)
- Both have the same 5% fee for customers

---

## 8. Emergency Procedures

### Site Builder Issues (Critical)

**If AI is generating inappropriate content:**
1. Go to `/dashboard/admin/feature-flags`
2. Disable `site_builder_ai_copy_v1`
3. Contact development team

**If sites are causing problems:**
1. Go to `/dashboard/admin/feature-flags`
2. Enable `site_builder_kill_switch`
3. All site builder features will be disabled immediately
4. Existing published sites remain live (read-only)

**If custom domains are failing:**
1. Go to `/dashboard/admin/feature-flags`
2. Disable `site_builder_custom_domain_v1`
3. New domain requests will be blocked
4. Existing domains continue to work

---

### Payment Issues

**If IremboPay is down:**
1. Check https://api.irembopay.com status
2. Contact IremboPay support: support@irembopay.com
3. Notify customers via WhatsApp/Email
4. Switch to manual cash payments temporarily

---

### Database Issues

**If database is slow:**
1. Check Supabase dashboard: https://app.supabase.com
2. Review connection pool usage
3. Contact Supabase support if needed

**If data is corrupted:**
1. DO NOT PANIC
2. Contact development team immediately
3. Daily backups are available (last 30 days)
4. Restore from backup if needed

---

## 9. Growth Milestones

### Track These Metrics

**Site Builder Adoption:**
- Published sites count
- Unique visits (last 14 days)
- AI copy generation success rate
- Custom domains connected
- Domain verification success rate

**Where to check:**
- `/dashboard/admin/feature-flags` (shows autopilot status)
- `/dashboard/analytics` (overall metrics)
- `/dashboard/referrals` (referral leaderboard)

**Autopilot Milestones:**
- 🎯 30 sites → Phase 2 auto-enables
- 🎯 100 sites → Phase 3 auto-enables

---

## 10. Content Management

### Template Thumbnails (Future)

When adding template thumbnails:
1. Create 800x600px images
2. Save as WebP format
3. Upload to `/public/templates/`
4. Name: `{template-id}.webp`
5. Update template config in code

---

### AI Prompt Tuning (Advanced)

If AI-generated content needs improvement:
1. Edit prompts in `src/lib/services/site-builder.service.ts`
2. Test with sample inputs
3. Deploy changes
4. Monitor quality

**Example prompts to tune:**
- Menu item descriptions
- Business taglines
- Promotional text

---

## 11. Legal & Compliance

### Required Actions

**Privacy Policy:**
- [ ] Add privacy policy link to footer
- [ ] Include data collection disclosure
- [ ] GDPR compliance (if serving EU customers)

**Terms of Service:**
- [ ] Add terms of service link
- [ ] Include "Powered by Imboni Serve" badge policy
- [ ] Custom domain usage terms

**Payment Terms:**
- [ ] Refund policy
- [ ] Subscription cancellation policy
- [ ] Payment failure handling

---

## 12. Marketing Materials

### Recommended Actions

**For Site Builder:**
- [ ] Create demo video (2-3 minutes)
- [ ] Screenshot gallery of templates
- [ ] Case study: "Restaurant X went live in 10 minutes"
- [ ] Social media posts announcing feature

**For Referral Program:**
- [ ] Design referral cards (print/digital)
- [ ] WhatsApp message templates
- [ ] Leaderboard showcase
- [ ] Success stories

---

## 13. Training Materials

### For Restaurant Owners

**Site Builder Training (30 minutes):**
1. Introduction to templates
2. Branding customization
3. Using AI copy assistant
4. Publishing your site
5. Custom domain setup (optional)

**Referral Program Training (15 minutes):**
1. How to get your code
2. Sharing your code
3. Tracking referrals
4. Redeeming rewards

---

## 14. Checklist: Go-Live Readiness

### Before Launching Site Builder

- [ ] OpenAI API key configured and tested
- [ ] All Phase 1 feature flags enabled
- [ ] Database seeded with templates
- [ ] Admin account created and tested
- [ ] Test site published successfully
- [ ] Custom domain flow tested (optional)
- [ ] AI copy generation tested
- [ ] "Powered by Imboni Serve" badge verified
- [ ] Support team trained
- [ ] Marketing materials ready
- [ ] Legal pages updated

### Before Launching Referral Program

- [ ] Referral code generation tested
- [ ] Reward calculation verified
- [ ] Smart Dining Slip CTAs visible
- [ ] Leaderboard functional
- [ ] Customer support scripts ready
- [ ] Marketing campaign prepared

---

## 15. Contact Information

### For Technical Issues
- Development Team: dev@imboni.serve
- Emergency Hotline: +250788917126

### For Service Providers
- OpenAI Support: https://help.openai.com
- Twilio Support: https://support.twilio.com
- Supabase Support: https://supabase.com/support
- IremboPay Support: support@irembopay.com

---

## 16. Monthly Reporting Template

### Site Builder Metrics (Month: _______)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Published Sites | 30 | ___ | ⚪ |
| Unique Visits | 1,000 | ___ | ⚪ |
| AI Success Rate | 98% | ___ | ⚪ |
| Custom Domains | 10 | ___ | ⚪ |
| Domain Verification | 95% | ___ | ⚪ |

### Costs

| Service | Budget | Actual | Variance |
|---------|--------|--------|----------|
| OpenAI | $50 | $__ | $__ |
| Twilio | $20 | $__ | $__ |
| Supabase | $25 | $__ | $__ |
| **Total** | **$95** | **$__** | **$__** |

### Issues Encountered
1. _______________
2. _______________
3. _______________

### Action Items for Next Month
1. _______________
2. _______________
3. _______________

---

## Appendix: Quick Reference

### Important URLs
- Admin Dashboard: `/dashboard/admin/feature-flags`
- Site Builder: `/dashboard/site-builder`
- Referral Leaderboard: `/dashboard/referrals`
- Customer Referral Page: `/refer`
- Discovery Map: `/discover/map`
- Sales Pipeline: `/admin/sales-pipeline`
- Content Management (CMS): `/dashboard/cms`
- Discovery Feed: `/discover/feed`
- CMS Settings (Notifications): `/dashboard/cms/settings`

### Important Commands
- Seed Database: `npm run seed`
- Start Dev Server: `npm run dev`
- Build Production: `npm run build`
- Build Local (RAM-friendly): `npm run build:local`
- Build CI (strict, minified): `npm run build:ci`
- Database Push: `npx prisma db push`

### Feature Flag Keys
- `site_builder_templates_v1`
- `site_builder_ai_copy_v1`
- `site_builder_custom_domain_v1`
- `site_builder_badge_enforcement`
- `site_builder_kill_switch`

---

**Document Version:** 1.5  
**Last Updated:** March 22, 2026  
**Next Review:** April 22, 2026

---

## 17. Contact Information Update

The official support phone number has been updated across all pages:

- **Support / WhatsApp:** +250 788 917 126
- **Email:** support@imboni.rw

This number appears in Terms, Privacy, Cookies, Service Terms, and FAQ pages. No action needed — already updated in code.

---

## 17b. Sales & Trial Management System

### Purpose
Track leads, demos, trials, follow-ups, and conversions for each business within the Admin Dashboard. No external tools required.

### Where to Access
- Go to: Admin Sidebar → Sales Pipeline
- List view: `/admin/sales-pipeline`
- Detail view: click the eye icon on any row or visit `/admin/sales-pipeline/[businessId]`

### What You Can Do
- Set trial start and end dates
- View auto-calculated “days left” (trial = 14 days from start by default)
- Update status: Lead, Demo Done, Trial Active, Trial Ending Soon, Converted, Lost
- Set next_action and next_action_date
- Mark next_action as completed
- Tick follow-up checkpoints: Day 2, 5, 10, 13
- Add internal sales notes
- Log activities (e.g., “Called owner”, “Demo done”)

### Alerts (Daily)
- Banner shows two categories:
  - Actions Due Today: next_action_date is today and not completed
  - Trials Ending Soon: trials ending in ≤ 3 days
- Use the detail view to complete the action or extend the trial

### Data Rules
- trial_end = trial_start + 14 days (system calculates days_left using this if end date empty)
- days_left ≤ 3 auto-classifies status to “Trial Ending Soon” (if currently “Trial Active”)
- orders_today and orders_this_week come from existing analytics (no manual input)

### Recommended Daily Flow
1) Open Sales Pipeline → Review alerts banner
2) Filter by status “Trial Active” and “Trial Ending Soon”
3) Open each business → Update next_action or mark completed
4) Check follow-up boxes for Day 2/5/10/13 as you engage
5) Add a short activity log after each touchpoint

### When a Business Converts
- Change status to “Converted” in the Trial tab
- Optionally add a note with the plan chosen or special terms

### When a Business is Lost
- Change status to “Lost” and add a brief reason in notes

### No External Setup Needed
- This system is fully internal. No new environment variables or third-party accounts are required.

---

## 18. Content Management System (CMS) & Discovery Feed

### Purpose
Create and publish content (posts, photos, videos, promotions, combos) to engage customers through a shoppable discovery feed. Drive orders directly from content.

### Where to Access
- **CMS Dashboard**: `/dashboard/cms` (create, manage, schedule posts)
- **Customer Feed**: `/discover/feed` (public-facing vertical feed)
- **Admin Approval**: `/dashboard/cms` (pending review section)

### What You Can Do (CMS Dashboard)
- Create posts: Microblog, Photo, Short Video, Promotion, Combo
- Schedule publish and expiration dates
- Submit drafts for review (DRAFT → PENDING_REVIEW)
- Approve/reject posts (Admin only, or Manager if self-approve enabled)
- Track post analytics: views, clicks, orders generated

### Post Lifecycle
1. **DRAFT**: Created but not submitted
2. **PENDING_REVIEW**: Submitted, awaiting approval
3. **APPROVED**: Approved, will publish at scheduled time (or immediately)
4. **SCHEDULED**: Approved with future publish date
5. **PUBLISHED**: Live on discovery feed
6. **EXPIRED**: Past expiration date (if set)
7. **REJECTED**: Not approved

### Customer Feed Features
- Vertical scroll (mobile-first)
- Filters: All, Nearby, Trending, Featured
- Shoppable CTAs: "Order via WhatsApp", "View Menu"
- Engagement: Like, Comment, Share
- Deep links to business profiles (`/discover/[slug]`)

### Media Limits (Enforced Server-Side)
- **Videos**: Max 30 seconds, max 25MB, formats MP4/H.264 or HEVC
- **Images**: Max 8MB

### Moderation Policy
- **Default**: PLATFORM_ADMIN must approve all PENDING_REVIEW posts
- **Self-Approve**: BUSINESS_MANAGER can approve if `cms_self_approve_v1` flag is ON for that business

### Scheduling
- Posts auto-publish at `publishAt` time (cron runs every minute)
- Posts auto-expire at `expireAt` time (if set)
- Leave `publishAt` empty to publish immediately after approval
- Leave `expireAt` empty for no expiration

### Attribution & Analytics
- WhatsApp CTAs include `[Post:<id>]` in prefilled message
- Web/QR orders can include `postId` query param for attribution
- Track: views, clicks, likes, shares, comments, saves, orders per post

### Notifications (Opt-In)
- WhatsApp ping for trending posts: **Default OFF**
- Enable per business in CMS Settings → `/dashboard/cms/settings`
- Engagement threshold: 20+ engagements in the last hour triggers a ping
- Requires Twilio WhatsApp configuration (business phone set); otherwise silently skipped

### Feature Flags to Enable
- `cms_v1`: Enable CMS dashboard and APIs
- `feed_v1`: Enable customer discovery feed at `/discover/feed`
- `feed_engagement_v1`: Enable likes, shares, comments, saves
- `feed_recommendations_v1`: Enable personalized ranking (Phase 1: location + popularity)
- `cms_self_approve_v1`: Allow BUSINESS_MANAGER to self-approve posts

### Daily Workflow
1. Log in as ADMIN or MANAGER
2. Go to `/dashboard/cms`
3. Review pending posts (if any)
4. Approve/reject or create new posts
5. Schedule posts for peak engagement times
6. Monitor analytics to see which posts drive orders

### Customer Experience
1. Visit `/discover/feed`
2. Scroll through posts (nearby, trending, featured)
3. Tap "Order via WhatsApp" or "View Menu"
4. Like, comment, share posts
5. Orders attributed back to posts for business analytics

---

## 19. Quick Testing — CMS, Feed, Attribution, Notifications

### Goal
Confirm the CMS and Discovery Feed work end-to-end and that orders are attributed back to posts.

### Pre-checks
- Build locally: `npm run build:local`
- Ensure you are logged in as ADMIN or MANAGER.
- Optional (first time only): `npx prisma db push` to create new tables.

### 1) Enable feature flags
- Go to `/dashboard/admin/feature-flags`
- Enable: `cms_v1`, `feed_v1`, `feed_engagement_v1`
- Optional: `cms_self_approve_v1` (lets MANAGER approve without Admin)

### 2) Create and approve a test post
- Go to `/dashboard/cms/new`
- Type: Microblog
- Title: "Test Lunch Promo"
- Body: any short text
- Submit for review
- Approve it from `/dashboard/cms` (or Self-approve if enabled)
- If you set a future time, wait until `publishAt` passes

### 3) Verify it appears in the feed
- Visit `/discover/feed`
- You should see the post with:
  - "Order via WhatsApp" button
  - "View Menu" link (if profile exists)

### 4) Test WhatsApp order attribution
- Click "Order via WhatsApp" to open a chat with prefilled text that contains `[Post:<id>]`.
- As a seeded staff phone (Owner/Cashier), send a single message in this exact format:
  `ORDER T1 1x Primus [Post:<id>]`
  - Replace `T1` and `Primus` with any valid table and item
  - Keep the `[Post:<id>]` exactly as provided
- Result: Order is created and a `PostAttribution` record is saved with channel `WHATSAPP_AI`.

### 5) (Optional) Test Web order attribution
- If you have a valid QR order link, open it with an added `postId` parameter:
  `https://your-app/order?accessToken=...&postId=<id>`
- Place a small order; result: `PostAttribution` record with channel `WEB`.

### 6) (Optional) Trending notification ping
- Go to `/dashboard/cms/settings` and enable "Trending Notifications".
- On `/discover/feed`, click Like on your post ~20 times (or interact across buttons).
- The system checks hourly; if Twilio is configured, a WhatsApp ping is sent to the business phone when the post passes the threshold.

### 7) Verify data
- Open Prisma Studio: `npx prisma studio`
- Check tables:
  - `ContentPost`: your test post is `PUBLISHED`
  - `PostEngagement`: interactions recorded
  - `PostAttribution`: row created for your order with correct `channel` and `orderId`

---

## 20. Short Video Uploads (New)

### What it does
Business owners can upload short videos (up to 30 seconds) as CMS posts. The system automatically:
- **Validates duration server-side** using ffprobe — videos longer than 30 seconds are rejected with a clear error message
- **Generates a thumbnail** at the 1-second mark using ffmpeg (no manual screenshot needed)
- Stores the video and thumbnail in Supabase Storage (or local `/public/uploads/` as fallback)

### How to upload a video (as a business owner)
1. Log in → go to `/dashboard/cms/new`
2. Select **Post Type: Short Video**
3. Click the video upload area and select your `.mp4`, `.mov`, or `.webm` file
4. The system checks duration automatically — if over 30 seconds, you'll see an error before anything is uploaded
5. On success, a thumbnail is generated automatically
6. Fill in title, body, and scheduling as normal
7. Submit for review → Approve → Published

### Limits (enforced server-side — cannot be bypassed)
| Rule | Limit |
|---|---|
| Maximum duration | 30 seconds |
| Maximum file size | 50 MB |
| Allowed formats | MP4, MOV (QuickTime), WebM |

### No setup needed
ffmpeg and ffprobe are **bundled with the application** — no system installation required. The binaries download automatically when you run `npm install`.

### Optional .env settings
Add these to `.env` if you want to change the defaults:
```env
MAX_VIDEO_DURATION_SEC=30
MAX_VIDEO_SIZE_MB=50
```

---

## 21. Video Analytics Dashboard (New)

### What it does
Shows how your Short Video posts are performing on the discovery feed — views, average watch time, top videos, and a daily views chart.

### Where to find it
- **Sidebar:** Dashboard → **Video Analytics**
- **Direct URL:** `/dashboard/video-analytics`

### What you'll see
| Card | What it means |
|---|---|
| **Total Views** | How many times videos were watched for 3+ seconds in the selected period |
| **Videos with Views** | How many of your videos received at least one view |
| **Avg Watch Time** | Average seconds watched per view across all videos |
| **Period** | The date range you selected (7, 30, or 90 days) |

### Views Over Time chart
- Bar chart showing daily view counts
- Switch between Last 7 days / Last 30 days / Last 90 days using the dropdown

### Top Videos table
- Ranked by total views in the selected period
- Shows: video title, view count, average watch time, publish status, and post date

### How views are tracked (automatic)
- A view is counted after a customer watches a video for **3 seconds or more**
- Watch duration is recorded each time the video is paused or ends
- No manual setup needed — tracking is built into the video player

### Tips
- **Promote top-performing videos** by sharing their feed link on WhatsApp
- **Best posting times:** Thursday–Sunday evenings tend to perform best in Rwanda
- If a video has 0 views, check that its status is `PUBLISHED` in `/dashboard/cms`

---

## 22. Invite & Earn — Free Month for Both Parties (Updated)

### What changed
The reward has been upgraded from a fixed RWF 5,000 credit to **1 free month of subscription** for both you and the business you invite.

### How it works (step by step)
1. **Get your invite link** → Dashboard → **Invite & Earn** (`/dashboard/invite`)
2. Click **Generate Invite Link** → copy the link or click **Share via WhatsApp**
3. Send the link to another restaurant, café, bar, or hotel owner
4. They sign up using your link
5. They generate **30 Smart Dining Slips™** within 30 days of signing up
6. They make their **first subscription payment**
7. After a **14-day lock period**, both of you receive 1 free month credited to your next invoice

### Rewards breakdown
| Who | Reward |
|---|---|
| **You (referrer)** | 1 free month at your plan price |
| **The business you invited** | 1 free month at their plan price |

### Rules (anti-fraud, automatic)
- You cannot refer yourself (same email or phone = blocked)
- Each invite code can only be used once
- Maximum 10 free months earned per year
- Credits expire after 6 months if unused
- High-velocity suspicious activity is flagged automatically for review

### Invite status meanings
| Status | Meaning |
|---|---|
| **Not used yet** | Link shared but nobody signed up |
| **Signed up** | Business registered using your link |
| **Qualifying** | They're generating slips (progress toward 30) |
| **Qualified — credit locked** | Milestone reached, 14-day lock starts |
| **Credit applied** | Free month credited to both invoices ✅ |
| **Expired** | 30-day window passed without qualifying |
| **Under review** | Flagged by anti-fraud system — contact support |

### Where to see your earnings
Go to `/dashboard/invite` → the **Free Months Earned** card shows your total.  
If credits are ready to use, the RWF value appears below the count in green.

### Database Migration Required
Before using the Business Revenue Scanner for the first time, run:
```bash
.\run-business-scans-migration.bat
```
This creates the required database table. Only needs to be done once.

---

## 23. Cron Job Setup (Required for Invite Credits)

### What it does
A scheduled task that runs **once a day** and:
1. **Unlocks** invite credits that have passed their 14-day lock period (makes them available on the next invoice)
2. **Expires** invite invitations that were not completed within 30 days

### Why it matters
Without this running, earned credits stay "locked" forever and stale invites are never cleaned up.

### How to set it up

#### Option A — Vercel Cron (Recommended for Vercel deployment)
Add this to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/invite-maintenance",
      "schedule": "0 2 * * *"
    }
  ]
}
```
This runs at 2:00 AM every day. Vercel sends the request automatically — no extra service needed.

#### Option B — External ping service (e.g. cron-job.org — free)
1. Go to https://cron-job.org and create a free account
2. Create a new cron job:
   - **URL:** `https://your-domain.com/api/cron/invite-maintenance`
   - **Method:** POST
   - **Schedule:** Once daily (e.g. 02:00 AM)
   - **Header:** `x-cron-secret` = *(your CRON_SECRET value from .env)*
3. Save

#### Required .env variable
```env
CRON_SECRET=pick-a-long-random-string-here
```
> **Important:** Use a long random string (20+ characters). This protects the cron endpoint from being triggered by anyone else. Example: `CRON_SECRET=xK9mP2qR7nL4wJ8vB3tF6yD1sA5eH0cG`

#### How to test manually (optional)
Open PowerShell in the project folder and run:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/invite-maintenance" `
  -Method POST `
  -Headers @{ "x-cron-secret" = "your-cron-secret-here" }
```
Expected response: `{"ok":true,"unlockedCredits":0}` (0 is fine if no credits were due)

---

## 24. Updated Dashboard Navigation

The sidebar now includes two new links:

| Link | Where | Icon |
|---|---|---|
| **Video Analytics** | Between "Content (CMS)" and "Reports" | 🎬 |
| **Invite & Earn** | Between "Referrals" and "Loyalty" | 👤+ |

No setup needed — they appear automatically for all logged-in business owners.

---

## 25. Go-Live Checklist (Updated — March 2026)

### Core Platform
- [ ] Node.js LTS installed
- [ ] `npm install` completed successfully
- [ ] `.env` filled in (see Section 1 and sections below)
- [ ] `npx prisma db push` run (database synced)
- [ ] Admin account seeded and working
- [ ] Business scans migration run (`.\run-business-scans-migration.bat`)

### Payments
- [ ] IremboPay credentials in `.env` (production keys)
- [ ] Webhook URL registered: `https://your-domain/api/payments/irembo/webhook`

### WhatsApp
- [ ] Twilio credentials in `.env`
- [ ] WhatsApp template approved by Meta

### Video Features
- [ ] `MAX_VIDEO_DURATION_SEC=30` in `.env` (or leave default)
- [ ] Test video upload at `/dashboard/cms/new` (Short Video type)
- [ ] Confirm thumbnail generated and appears in preview
- [ ] Confirm video over 30s is rejected with an error

### Invite & Earn
- [ ] `CRON_SECRET` set in `.env`
- [ ] Daily cron configured (Vercel Cron or cron-job.org)
- [ ] Test invite flow: generate code → sign up with it → check status shows "Signed up"

### Video Analytics
- [ ] Publish at least one Short Video post
- [ ] Open `/dashboard/video-analytics` — confirm page loads
- [ ] Watch a video on the feed for 3+ seconds → refresh analytics → confirm view counted

### Optional
- [ ] `OPENAI_API_KEY` for AI copy generation
- [ ] Custom domain DNS configured

---

## 26. Quick Reference — New URLs (March 2026 additions)

| Page | URL | Who can access |
|---|---|---|
| Video Analytics | `/dashboard/video-analytics` | Business owners |
| Invite & Earn | `/dashboard/invite` | Business owners |
| CMS New Post | `/dashboard/cms/new` | Business owners / managers |
| Discovery Feed | `/discover/feed` | Public |
| Cron Endpoint | `/api/cron/invite-maintenance` | Cron service only (POST + secret header) |
| Video Analytics API | `/api/cms/analytics` | Authenticated users |
| Business Revenue Scanner | `/dashboard` (orange button) | Business owners |
| Scan API | `/api/business/scan` | Authenticated users |

---

## 27. Business Revenue Scanner (NEW — April 2026)

### What it does
Analyzes your menu and identifies where you're losing revenue. Gets you professional insights in **under 10 seconds**.

### How to use it
1. Go to **Dashboard** (main page after login)
2. Click the **"Scan My Business"** button (orange, top right)
3. Click **"Run Scan"**
4. Wait 5-10 seconds while AI analyzes your menu
5. View your **Revenue Leak Score** and **Primary Issue**
6. Click **"View Full Report"** for detailed breakdown

### What you'll see

#### Revenue Leak Score (0-100)
- **80-100 (Green):** Excellent — minor optimizations only
- **60-79 (Yellow):** Good — some improvements needed
- **0-59 (Red):** Needs attention — significant revenue leaks

#### Primary Issue
The SINGLE biggest problem affecting your revenue, using real numbers from your menu.

**Example:** "26 of 40 menu items lack images — this reduces ordering confidence by 40%"

#### Full Report Sections
1. **🔴 Critical Issues** — Fix these immediately (biggest revenue impact)
2. **🟠 Medium Issues** — Address these soon (moderate impact)
3. **🟢 Opportunities** — Ideas to increase revenue
4. **💡 Quick Wins** — Easy fixes you can do today

### Understanding your results

#### Score calculation (automatic)
Your score is reduced if you have:
- Too many menu items (>35 increases decision fatigue)
- Missing images (>40% of items hurts conversions)
- Missing descriptions (>40% of items reduces confidence)
- Too few categories (poor menu organization)

#### What affects ordering confidence
- **Photos:** Items with photos sell 40% more
- **Descriptions:** Detailed descriptions increase average order value by 20%
- **Menu size:** Menus with 25-30 items perform best
- **Categories:** Clear grouping helps customers find items faster

### Action steps after scanning

#### If your score is 0-59 (Red)
1. **Start with images:** Photograph your top 10 selling items today (smartphone is fine)
2. **Remove slow sellers:** If you have >35 items, remove the bottom 5-10 performers
3. **Add descriptions:** Write 2-3 sentences for each item (ingredients, preparation, taste)
4. **Re-scan in 1 week** to see improvement

#### If your score is 60-79 (Yellow)
1. Focus on Quick Wins from the report
2. Add descriptions to items missing them
3. Improve photo quality for top sellers
4. Re-scan in 2 weeks

#### If your score is 80-100 (Green)
1. Maintain your current menu quality
2. Review Opportunities section for growth ideas
3. Re-scan monthly to catch small issues early

### Tips for best results
- **Run scans regularly:** Monthly scans help you track improvement
- **Take action:** Scanning alone doesn't increase revenue — implementing fixes does
- **Focus on photos first:** This has the biggest immediate impact
- **Keep menu lean:** 25-30 well-described items outperform 50+ basic items

### Troubleshooting

**"Scan failed" error**
- Check your internet connection
- Try again in 30 seconds
- Contact support if problem persists

**"No business associated" error**
- Make sure you've completed business profile setup
- Go to Dashboard → Profile and fill in business details

**Score seems too low**
- The score reflects real data from your menu
- Check the specific issues listed
- Each issue includes the exact numbers affecting your score

### Where scans are saved
All scans are automatically saved to your database. You can view them in your Dashboard under the scans history (coming soon).

---

## 28. Troubleshooting — New Features

### Video upload fails with "Video too long"
- The video is over 30 seconds. Trim it using any free tool (e.g. https://clideo.com/cut-video) and re-upload.

### Video upload fails with "Upload failed"
- Check your internet connection
- Confirm Supabase Storage is configured (`SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_KEY` in `.env`)
- If those are empty, videos save to the local `/public/uploads/video/` folder instead — this works for local dev but not production

### Video Analytics shows 0 views
- Ensure the post is `PUBLISHED` (not Draft/Pending)
- Views require the viewer to watch for **3 seconds or more**
- The view period filter defaults to **Last 30 days** — switch to **Last 90 days** if needed

### Invite credit stays "locked"
- The 14-day lock period has not passed yet — this is normal
- If it has been more than 14 days, check the cron job is running (Section 23)
- Run the cron manually once to force unlock (see Section 23 test instructions)

### Invite shows "Under review"
- The anti-fraud system flagged unusual activity (3+ new invites converting in 30 days)
- Contact the development team to review: dev@imboni.serve / +250 788 917 126

### Cron returns 401 Unauthorized
- The `x-cron-secret` header value doesn't match `CRON_SECRET` in `.env`
- Double-check both values match exactly (no spaces, no quotes)
