# Imboni Serve - Mobile (PWA) Deployment Checklist

**Platform:** Progressive Web App (PWA)  
**Target Devices:** Android & iOS mobile browsers  
**Distribution:** Direct install from website (no app store required)  
**Last Updated:** Feb 17, 2026

---

## PWA Deployment Strategy

Imboni Serve is deployed as a **Progressive Web App (PWA)** that users install directly from the website via their mobile browser. No separate native app build or app store submission required.

**Future Option:** Google Play Store via Trusted Web Activity (TWA) wrapper (see notes at end).

---

## Pre-Deployment Verification

### 1. PWA Assets
- [ ] Manifest file exists: `/manifest.json`
- [ ] Manifest includes:
  - [ ] `name`: "Imboni Serve"
  - [ ] `short_name`: "Imboni"
  - [ ] `start_url`: "/dashboard"
  - [ ] `display`: "standalone"
  - [ ] `icons`: 192x192 and 512x512 PNG
  - [ ] `theme_color` and `background_color` set
- [ ] App icons present:
  - [ ] `/imgs/imboni-serve-favicon-192.png` (192x192)
  - [ ] `/imgs/imboni-serve-favicon.png` (512x512)

### 2. Service Worker
- [ ] Service worker file exists: `/sw.js`
- [ ] Service worker registers in production (`_app.tsx`)
- [ ] Caches critical routes:
  - [ ] `/`, `/dashboard`, `/dashboard/sales`, `/dashboard/inventory`
  - [ ] `/offline.html`
- [ ] Offline fallback page exists and styled
- [ ] Cache strategy configured (network-first for API, cache-first for static)

### 3. Offline Support
- [ ] Outbox service implemented (`outbox.service.ts`)
- [ ] IndexedDB initialized for offline queue
- [ ] Offline indicator component present
- [ ] Sync triggers on reconnection (`online` event listener)

### 4. Mobile Optimization
- [ ] Viewport meta tag configured
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scrolling on mobile viewports
- [ ] Forms optimized for mobile (correct input types)
- [ ] Loading states for slow connections

---

## Installation Testing

### Android (Chrome)

#### Prerequisites
- Android device or emulator
- Chrome browser (latest version)
- HTTPS-enabled website (required for PWA)

#### Installation Steps
1. **Open website in Chrome**
   - Navigate to `https://imboni.rw` (or your domain)
   
2. **Trigger install prompt**
   - Chrome shows "Add to Home Screen" banner automatically
   - Or: Menu → Add to Home Screen
   
3. **Verify installation**
   - [ ] App icon appears on home screen
   - [ ] Splash screen shows on launch
   - [ ] App opens in standalone mode (no browser chrome)
   - [ ] Status bar color matches theme

#### Testing Checklist
- [ ] Install prompt appears within 30 seconds of browsing
- [ ] Icon displays correctly on home screen
- [ ] App launches in standalone mode
- [ ] Navigation works without browser UI
- [ ] Back button behavior correct
- [ ] Offline mode works (airplane mode test)
- [ ] Outbox queues actions when offline
- [ ] Auto-sync triggers when back online

---

### iOS (Safari)

#### Prerequisites
- iPhone or iPad
- Safari browser (iOS 15+)
- HTTPS-enabled website

#### Installation Steps
1. **Open website in Safari**
   - Navigate to `https://imboni.rw`
   
2. **Manual install**
   - Tap Share button (square with arrow)
   - Scroll and tap "Add to Home Screen"
   - Confirm name and tap "Add"
   
3. **Verify installation**
   - [ ] App icon appears on home screen
   - [ ] App opens in standalone mode
   - [ ] Status bar integrated

#### Testing Checklist
- [ ] Share → Add to Home Screen option available
- [ ] Icon displays correctly on home screen
- [ ] App launches in standalone mode
- [ ] Navigation works (no Safari UI)
- [ ] Offline mode works (limited compared to Android)
- [ ] Local storage persists across sessions

#### iOS Limitations (Known)
- No automatic install prompt (manual only)
- Service worker limited capabilities
- Push notifications not supported
- Background sync not supported
- 50MB storage limit (vs ~6% disk on Android)

---

## User Installation Guide

### Create Installation Instructions Page

Add to website: `/install` or `/get-app`

**Content:**

```markdown
# Install Imboni Serve on Your Phone

## Android (Chrome)
1. Visit imboni.rw in Chrome
2. Tap "Add to Home Screen" when prompted
3. Or: Menu (⋮) → Add to Home Screen
4. Tap "Install" or "Add"

## iPhone/iPad (Safari)
1. Visit imboni.rw in Safari
2. Tap Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

## Benefits
- Works offline
- Faster than website
- No app store required
- Automatic updates
```

### Marketing Materials
- [ ] Create installation tutorial video (30-60 seconds)
- [ ] Add "Install App" CTA on home page
- [ ] Include installation guide in onboarding emails
- [ ] Train support staff on installation process

---

## Post-Deployment Testing

### Functional Testing
- [ ] Login/logout works in standalone mode
- [ ] Dashboard loads all modules
- [ ] Sales creation works
- [ ] Inventory updates persist
- [ ] Reports generate correctly
- [ ] Payment flow redirects work (IremboPay)

### Offline Testing
- [ ] Enable airplane mode
- [ ] Navigate to cached pages (dashboard, sales)
- [ ] Create a sale (should queue in outbox)
- [ ] Disable airplane mode
- [ ] Verify sale syncs automatically
- [ ] Check outbox cleared

### Performance Testing
- [ ] App loads in < 3 seconds on 3G
- [ ] Smooth scrolling and animations
- [ ] No memory leaks (long session test)
- [ ] Battery usage acceptable

### Cross-Device Testing
- [ ] Test on multiple Android devices (Samsung, Xiaomi, etc.)
- [ ] Test on multiple iOS devices (iPhone, iPad)
- [ ] Test on different screen sizes (small, medium, large)
- [ ] Test on different OS versions (Android 10+, iOS 15+)

---

## Monitoring & Analytics

### Track PWA Metrics
- [ ] Install rate (how many visitors install)
- [ ] Retention rate (daily/weekly active users)
- [ ] Offline usage (how often app used offline)
- [ ] Sync success rate (outbox items synced successfully)

### Tools
- Google Analytics 4 (PWA events)
- Vercel Analytics (if deployed on Vercel)
- Custom logging for offline/sync events

---

## Troubleshooting

### Install Prompt Not Showing (Android)
- **Cause:** PWA criteria not met
- **Check:**
  - [ ] HTTPS enabled
  - [ ] Manifest valid
  - [ ] Service worker registered
  - [ ] User has not dismissed prompt 3+ times
- **Fix:** Use Chrome DevTools → Application → Manifest to debug

### App Not Opening in Standalone Mode
- **Cause:** `start_url` or `scope` misconfigured
- **Check:** Manifest `start_url` and `scope` fields
- **Fix:** Ensure `start_url` is within `scope`

### Offline Mode Not Working
- **Cause:** Service worker not caching correctly
- **Check:** DevTools → Application → Cache Storage
- **Fix:** Verify cache strategy in `sw.js`

### iOS Install Not Working
- **Cause:** User not using Safari or iOS < 11.3
- **Fix:** Instruct user to use Safari (not Chrome/Firefox on iOS)

---

## Future: Google Play Store (TWA)

If you want Play Store presence later:

### Trusted Web Activity (TWA) Wrapper
1. Use **Bubblewrap** CLI to generate Android wrapper
2. Configure Digital Asset Links (`.well-known/assetlinks.json`)
3. Build APK/AAB
4. Submit to Google Play Console

### Estimated Effort
- Setup: 4-8 hours
- Play Store listing: 2-4 hours
- Review time: 1-7 days

### Cost
- Google Play Console: $25 USD (one-time)
- No ongoing fees

### Benefits
- Discoverability via Play Store search
- User trust (official app store presence)
- Automatic updates still via web

### When to Consider
- After 100+ active PWA users
- When marketing budget allows Play Store promotion
- If competitors are on Play Store

---

## Sign-Off

- [ ] PWA assets deployed and verified
- [ ] Installation tested on Android
- [ ] Installation tested on iOS
- [ ] Offline mode verified
- [ ] User installation guide published
- [ ] Tested by: _______________
- [ ] Date: _______________

---

**PWA ready for users! 📱**
