# Mobile Testing Checklist - Imboni Serve

## Pre-Deployment Testing

### 📱 Device Testing

#### iOS Testing
- [ ] Safari on iPhone (iOS 15+)
- [ ] Safari on iPad
- [ ] PWA install on iOS
- [ ] Offline mode on iOS
- [ ] Touch gestures (tap, swipe, pinch)
- [ ] Landscape orientation
- [ ] Safe area insets (notch compatibility)

#### Android Testing
- [ ] Chrome on Android (v90+)
- [ ] PWA install on Android
- [ ] Offline mode on Android
- [ ] Touch gestures
- [ ] Landscape orientation
- [ ] Back button behavior

### 🎨 UI/UX Testing

#### Touch Targets
- [ ] All buttons minimum 44x44px
- [ ] Adequate spacing between interactive elements
- [ ] No accidental taps on adjacent buttons
- [ ] Form inputs easily tappable

#### Typography
- [ ] Text readable at default zoom (16px minimum for body text)
- [ ] Headings properly sized for mobile
- [ ] Line height adequate for readability
- [ ] No horizontal scrolling required

#### Layout
- [ ] Responsive breakpoints work (sm, md, lg, xl)
- [ ] No content cutoff on small screens
- [ ] Proper padding/margins on mobile
- [ ] Tables scroll horizontally if needed
- [ ] Images scale properly

#### Navigation
- [ ] Mobile menu accessible
- [ ] Navigation clear and intuitive
- [ ] Back navigation works
- [ ] Deep links work correctly

### ⚡ Performance Testing

#### Load Times
- [ ] Initial page load < 3 seconds on 3G
- [ ] Time to interactive < 5 seconds
- [ ] Lighthouse mobile score > 80

#### Network Conditions
- [ ] Test on 3G network
- [ ] Test on 4G network
- [ ] Test on WiFi
- [ ] Test offline mode
- [ ] Test intermittent connectivity

#### Resource Usage
- [ ] No memory leaks
- [ ] Battery usage acceptable
- [ ] Data usage reasonable
- [ ] No excessive API calls

### 🔌 PWA Features

#### Installation
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] App icon displays correctly
- [ ] Splash screen shows
- [ ] App name correct in launcher

#### Offline Functionality
- [ ] Service worker registers
- [ ] Critical pages cached
- [ ] Offline indicator shows
- [ ] Data syncs when back online
- [ ] Pending sync count accurate

#### Manifest
- [ ] Theme color applied
- [ ] Display mode: standalone
- [ ] Orientation settings correct
- [ ] Icons (192x192, 512x512) present

### � Payments (IremboPay)

#### Hosted Checkout (paymentLinkUrl)
- [ ] "Pay" button opens hosted checkout reliably (new tab or in-app browser)
- [ ] Correct plan price shown (VAT inclusive, e.g., 105,000 RWF)
- [ ] "No extra charges" messaging visible where applicable
- [ ] Success flow returns to app and shows confirmation
- [ ] Cancel flow returns to app with retry option
- [ ] Expired invoice shows clear message and allows re-create

#### MoMo Push (MTN/AIRTEL)
- [ ] Phone number validation (12 digits, starts with 07)
- [ ] Provider selection (MTN/AIRTEL) required and validated
- [ ] Initiation success path updates UI to "Awaiting approval on your phone"
- [ ] Declined/cancelled on phone shows clear error in app
- [ ] Handles API errors gracefully (e.g., INVOICE_EXPIRED, BAD_PHONE_NUMBER, INVOICE_ALREADY_PAID)
- [ ] Currency validation (RWF only for MoMo push)

#### Webhook & Status
- [ ] Payment status reflects webhook-confirmed result (authoritative)
- [ ] UI does not rely solely on client callbacks
- [ ] Duplicate webhook events handled idempotently (no double updates)
- [ ] Graceful polling or refresh shows up-to-date status
- [ ] Status transitions (NEW → PAID/EXPIRED) display correctly

#### Copy & Compliance
- [ ] "VAT inclusive" displayed where price is shown to the user
- [ ] No extra charges or surcharge line items shown
- [ ] Totals match the advertised plan price exactly
- [ ] Error messages are human-friendly and actionable
- [ ] Invoice expiry (15 min default) communicated clearly

#### Affiliate Commissions (Mobile View)
- [ ] Recruiter welcome bonus displays correctly (5,000 RWF non-STARTER, 2,000 RWF STARTER)
- [ ] No customer bonus shown anywhere in UI
- [ ] Recurring commissions (15% ex-VAT) tracked and visible
- [ ] 12-invoice cap enforced per recruited business
- [ ] 14-day lock period displayed correctly
- [ ] Commission status updates (LOCKED → AVAILABLE → PAID)
- [ ] Self-referral blocked with appropriate message
- [ ] Affiliate dashboard responsive on mobile
- [ ] Payout history accessible and readable

### 🔐 Security & Privacy

#### HTTPS
- [ ] All resources served over HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

#### Permissions
- [ ] Location permission (if needed)
- [ ] Camera permission (if needed)
- [ ] Notification permission (if needed)
- [ ] Permissions requested contextually

### 📊 Forms & Input

#### Form Fields
- [ ] Correct input types (email, tel, number)
- [ ] Autocomplete attributes set
- [ ] Virtual keyboard appropriate for field
- [ ] Validation messages clear
- [ ] Error states visible

#### User Input
- [ ] Copy/paste works
- [ ] Auto-fill works
- [ ] Date pickers mobile-friendly
- [ ] Dropdowns accessible
- [ ] File uploads work

### 🌐 Cross-Browser Testing

#### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet
- [ ] Opera Mobile

### 🔔 Notifications

- [ ] Push notifications work (if implemented)
- [ ] Notification permission requested appropriately
- [ ] Notifications display correctly
- [ ] Notification actions work

### 📍 Location Services

- [ ] Location permission requested when needed
- [ ] Geolocation API works
- [ ] Fallback for denied permission
- [ ] Location accuracy acceptable

### 🎯 Accessibility

#### Screen Readers
- [ ] VoiceOver (iOS) navigation works
- [ ] TalkBack (Android) navigation works
- [ ] All interactive elements labeled
- [ ] Focus order logical

#### Visual
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Text resizable to 200%
- [ ] No reliance on color alone
- [ ] Focus indicators visible

#### Motor
- [ ] All features accessible via touch
- [ ] No time-sensitive interactions
- [ ] Gestures have alternatives

### 🔄 Sync & Data

#### Offline Sync
- [ ] Data saves locally when offline
- [ ] Sync triggers when online
- [ ] Conflict resolution works
- [ ] No data loss
- [ ] Sync status visible to user

#### Data Persistence
- [ ] IndexedDB works
- [ ] LocalStorage works
- [ ] Data persists across sessions
- [ ] Clear data option works

### 🐛 Error Handling

- [ ] Network errors handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Retry mechanisms work
- [ ] Fallback content displays
- [ ] Error boundaries catch crashes

### 📈 Analytics & Monitoring

- [ ] Page views tracked
- [ ] User interactions tracked
- [ ] Errors logged
- [ ] Performance metrics collected
- [ ] PWA install events tracked

## Testing Tools

### Recommended Tools
- **Chrome DevTools**: Device emulation, network throttling
- **Lighthouse**: Performance, PWA, accessibility audits
- **BrowserStack**: Real device testing
- **WebPageTest**: Performance testing
- **axe DevTools**: Accessibility testing

### Testing Commands
```bash
# Run Lighthouse audit
npx lighthouse https://your-app.com --view

# Test PWA
npx pwa-asset-generator [logo.svg] ./public/icons

# Check bundle size
npm run build
npx next-bundle-analyzer
```

## Sign-Off

### Tester Information
- **Tester Name**: _______________
- **Date**: _______________
- **Build Version**: _______________

### Results
- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Ready for production

### Notes
_______________________________________
_______________________________________
_______________________________________
