# Web Testing Checklist - Imboni Serve

## Pre-Deployment Testing (Desktop/Web)

### 🖥️ Browser Testing

#### Desktop Browsers
- [ ] Chrome (latest stable)
- [ ] Firefox (latest stable)
- [ ] Safari (macOS)
- [ ] Edge (latest stable)
- [ ] Opera (optional)

#### Browser Versions
- [ ] Test on current version
- [ ] Test on previous major version
- [ ] Verify graceful degradation on older browsers

### 🎨 UI/UX Testing

#### Layout & Responsiveness
- [ ] Desktop layout (1920x1080, 1366x768)
- [ ] Tablet landscape (1024x768)
- [ ] Tablet portrait (768x1024)
- [ ] Small desktop (1280x720)
- [ ] No horizontal scrolling on any viewport
- [ ] Sidebar/navigation accessible and functional
- [ ] Modals center correctly
- [ ] Tables responsive or horizontally scrollable

#### Typography & Readability
- [ ] Font sizes appropriate for desktop (16px+ body text)
- [ ] Headings hierarchy clear (h1-h6)
- [ ] Line height comfortable (1.5-1.8)
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] No text overflow or truncation issues

#### Interactive Elements
- [ ] Buttons have hover states
- [ ] Links have hover/focus states
- [ ] Form inputs have focus states
- [ ] Dropdowns open correctly
- [ ] Tooltips display on hover
- [ ] Click targets adequate (minimum 24x24px)

#### Navigation
- [ ] Main navigation accessible
- [ ] Breadcrumbs work correctly
- [ ] Back/forward browser buttons work
- [ ] Deep links work correctly
- [ ] Search functionality works
- [ ] Keyboard navigation (Tab, Enter, Esc)

### ⚡ Performance Testing

#### Load Times
- [ ] Initial page load < 2 seconds on broadband
- [ ] Time to interactive < 3 seconds
- [ ] Lighthouse desktop score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s

#### Network Conditions
- [ ] Test on fast broadband (100+ Mbps)
- [ ] Test on slow broadband (5-10 Mbps)
- [ ] Test with throttled 3G (for mobile users)
- [ ] Test offline mode (if PWA)

#### Resource Optimization
- [ ] Images optimized and lazy-loaded
- [ ] No memory leaks (check DevTools Memory)
- [ ] No excessive API calls
- [ ] Bundle size acceptable (< 500KB first load)
- [ ] Code splitting implemented

### 💳 Payments (IremboPay)

#### Hosted Checkout (paymentLinkUrl)
- [ ] "Subscribe" or "Pay" button opens hosted checkout in new tab
- [ ] Correct plan price displayed (VAT inclusive, e.g., 105,000 RWF)
- [ ] "No extra charges" messaging visible on pricing page
- [ ] Success: redirects back to app with confirmation message
- [ ] Cancel: returns to app with option to retry
- [ ] Expired invoice: shows clear message and allows re-creation
- [ ] Invoice expiry (15 min default) communicated to user

#### MoMo Push (MTN/AIRTEL) - Admin/POS
- [ ] Phone number input validates format (12 digits, starts with 07)
- [ ] Provider selection (MTN/AIRTEL) required
- [ ] Invalid phone shows immediate validation error
- [ ] Initiation success shows "Awaiting approval on customer's phone"
- [ ] Declined/cancelled shows actionable error message
- [ ] API errors handled gracefully:
  - [ ] INVOICE_EXPIRED
  - [ ] BAD_PHONE_NUMBER
  - [ ] INVOICE_ALREADY_PAID
  - [ ] PAYMENT_PROVIDER_ERROR
- [ ] Currency validation (RWF only for MoMo push)

#### Webhook & Status Verification
- [ ] Payment status updates reflect webhook-confirmed results
- [ ] UI does not show "paid" until webhook confirms
- [ ] Duplicate webhook events handled idempotently
- [ ] Status polling works if webhook delayed
- [ ] Status transitions display correctly (NEW → PAID/EXPIRED/FAILED)
- [ ] Admin can view raw webhook payloads for debugging

#### Pricing & Copy Compliance
- [ ] All plan prices show "VAT inclusive"
- [ ] No surcharge or extra fee line items visible to customer
- [ ] Totals match advertised plan prices exactly
- [ ] Checkout summary shows single price only
- [ ] Error messages are human-friendly and actionable
- [ ] Refund policy clearly stated (if applicable)

### 🔐 Security & Privacy

#### HTTPS & Certificates
- [ ] All resources served over HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid and not expired
- [ ] HSTS header present

#### Authentication & Authorization
- [ ] Login works correctly
- [ ] Logout clears session
- [ ] Password reset flow works
- [ ] Session timeout appropriate (e.g., 24 hours)
- [ ] Role-based access control enforced (Admin, Manager, Staff)
- [ ] Unauthorized access redirects to login

#### Data Protection
- [ ] Sensitive data not exposed in URLs
- [ ] API keys not visible in client code
- [ ] CSRF protection enabled
- [ ] XSS prevention verified
- [ ] SQL injection prevention verified (Prisma ORM)

### 📊 Forms & Input

#### Form Validation
- [ ] Required fields marked clearly
- [ ] Real-time validation on blur
- [ ] Clear error messages
- [ ] Success states visible
- [ ] Disabled submit until valid

#### Input Types
- [ ] Email fields use type="email"
- [ ] Phone fields use type="tel"
- [ ] Number fields use type="number"
- [ ] Date pickers functional
- [ ] Autocomplete attributes set

#### User Experience
- [ ] Copy/paste works in all fields
- [ ] Auto-fill works (browser autofill)
- [ ] Tab order logical
- [ ] Enter key submits forms
- [ ] Esc key closes modals

### 🔔 Notifications & Alerts

- [ ] Success notifications display correctly
- [ ] Error notifications display correctly
- [ ] Warning notifications display correctly
- [ ] Notifications auto-dismiss or have close button
- [ ] Toast/snackbar positioning consistent
- [ ] No notification spam

### 🎯 Accessibility (WCAG AA)

#### Keyboard Navigation
- [ ] All interactive elements accessible via Tab
- [ ] Focus indicators visible
- [ ] Skip to main content link present
- [ ] Modal traps focus correctly
- [ ] Esc closes modals/dropdowns

#### Screen Readers
- [ ] All images have alt text
- [ ] Form labels associated with inputs
- [ ] ARIA labels on icon buttons
- [ ] Landmark roles present (nav, main, aside)
- [ ] Heading hierarchy logical

#### Visual Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Text resizable to 200% without breaking layout
- [ ] No reliance on color alone for information
- [ ] Focus indicators visible (not removed)
- [ ] Sufficient spacing between interactive elements

#### Motor Accessibility
- [ ] Click targets minimum 24x24px (desktop)
- [ ] No time-sensitive interactions (or adjustable)
- [ ] Hover states don't hide critical info

### 📈 Admin Dashboard & Reporting

#### Payment Analytics
- [ ] Gross revenue displayed correctly (VAT-inclusive totals)
- [ ] VAT collected shown separately
- [ ] Gateway fees (3.42%) calculated and displayed
- [ ] Affiliate commissions (15% ex-VAT) tracked
- [ ] Recruiter welcome bonuses recorded (5,000 RWF non-STARTER, 2,000 RWF STARTER)
- [ ] No customer bonuses created
- [ ] Net cash after all deductions accurate
- [ ] Filters work: date range, gateway (IremboPay), method (WEB/MoMo)

#### Business (formerly Restaurant) Management
- [ ] Business list loads correctly
- [ ] Business details editable
- [ ] Branch management works (multi-branch businesses)
- [ ] No "restaurant" terminology visible in UI
- [ ] Search and filters functional

#### Affiliate Reporting
- [ ] Affiliate dashboard shows commissions earned
- [ ] 12-paid-invoice cap enforced per recruited business
- [ ] 12-month window enforced from business creation
- [ ] 14-day lock period before payout visible
- [ ] Recruiter welcome bonuses tracked separately (5k/2k based on plan)
- [ ] No customer bonuses visible anywhere
- [ ] Self-referral detection prevents commissions
- [ ] Clawback on refund logic works
- [ ] Monthly payout schedule (5th of month) documented

#### Data Export
- [ ] CSV export works
- [ ] PDF reports generate correctly
- [ ] Date range filters apply to exports
- [ ] Large datasets don't timeout

### 🔄 Data Sync & Offline (PWA)

#### Offline Functionality
- [ ] Service worker registers correctly
- [ ] Critical pages cached
- [ ] Offline indicator shows when disconnected
- [ ] Data queues for sync when offline
- [ ] Sync triggers automatically when back online
- [ ] Pending sync count accurate

#### Data Persistence
- [ ] IndexedDB stores data correctly
- [ ] LocalStorage used appropriately
- [ ] Data persists across sessions
- [ ] Clear data option works

### 🐛 Error Handling

- [ ] Network errors show user-friendly messages
- [ ] API errors display actionable messages
- [ ] Retry mechanisms work
- [ ] Fallback content displays on error
- [ ] Error boundaries catch React crashes
- [ ] 404 page displays for invalid routes
- [ ] 500 page displays for server errors

### 🌐 Internationalization (if applicable)

- [ ] Language switcher works
- [ ] Translations complete
- [ ] Date/time formats localized
- [ ] Currency formats correct (RWF)
- [ ] RTL support (if needed)

### 📱 Progressive Web App (Desktop)

- [ ] PWA installable on desktop (Chrome, Edge)
- [ ] App icon displays correctly in taskbar/dock
- [ ] Standalone mode works (no browser chrome)
- [ ] Splash screen shows on launch
- [ ] App updates notify user

### 🔍 SEO & Meta Tags

- [ ] Page titles descriptive and unique
- [ ] Meta descriptions present
- [ ] Open Graph tags for social sharing
- [ ] Canonical URLs set
- [ ] Sitemap.xml present
- [ ] Robots.txt configured

## Testing Tools

### Recommended Tools
- **Chrome DevTools**: Network, Performance, Lighthouse, Accessibility
- **Firefox Developer Tools**: Accessibility Inspector
- **Lighthouse**: Performance, PWA, Accessibility, SEO audits
- **axe DevTools**: Accessibility testing
- **WAVE**: Web accessibility evaluation
- **WebPageTest**: Performance testing
- **BrowserStack**: Cross-browser testing

### Testing Commands
```bash
# Run Lighthouse audit
npx lighthouse https://your-app.com --view

# Check bundle size
npm run build
npx next-bundle-analyzer

# Run accessibility audit
npx @axe-core/cli https://your-app.com
```

## Expected Results Summary

### What You Should See

#### Homepage
- Clean, professional design
- Clear value proposition
- 6-tier pricing table (STARTER → ENTERPRISE)
- VAT-inclusive prices with "No extra charges"
- Call-to-action buttons functional
- Fast load time (< 2s)

#### Pricing Page
- All 6 plans displayed clearly
- VAT-inclusive pricing (e.g., Pro Plan - 105,000 RWF)
- Feature comparison table
- "Subscribe" buttons lead to payment flow
- No hidden fees or surcharges mentioned

#### Payment Flow
- Hosted checkout opens in new tab/window
- IremboPay branding visible
- Correct amount displayed
- Success returns to app with confirmation
- Failed payment shows retry option

#### Dashboard (Admin)
- Revenue metrics accurate
- VAT, gateway fees, affiliate costs broken down
- Business (not "restaurant") terminology throughout
- Charts and graphs render correctly
- Export functions work

#### Mobile Responsiveness
- All pages adapt to mobile viewport
- Touch targets adequate
- No horizontal scrolling
- Forms usable on mobile
- PWA installable on mobile

## Sign-Off

### Tester Information
- **Tester Name**: _______________
- **Date**: _______________
- **Build Version**: _______________
- **Browsers Tested**: _______________

### Results
- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG AA)
- [ ] Security review completed
- [ ] Ready for production

### Notes
_______________________________________
_______________________________________
_______________________________________
