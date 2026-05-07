# MenuTiger-Inspired Features Implementation

## Overview
This document describes the three MenuTiger-inspired features added to ImboniServe, plus MTN MoMo API integration preparation.

## 1. QR Code Popover with Customizer

### Components
- **`QRCodePopover.tsx`** - Modal popover with QR preview, customization, and download
- **`DashboardQRButton.tsx`** - Button component to trigger QR popover from dashboard

### Features
- **Live QR Preview**: Real-time QR code generation with customizable options
- **Customization Options**:
  - Size (128px - 512px)
  - Foreground/background colors
  - Error correction level (L/M/Q/H)
  - Logo overlay (optional image URL)
- **Download Formats**: SVG (vector) and PNG (raster)
- **Analytics**: QR URLs include `?qr={context}-{id}` parameter for tracking

### Usage
```tsx
import { DashboardQRButton } from '@/components/dashboard/DashboardQRButton'

<DashboardQRButton 
  businessId={businessId} 
  menuId={menuId} // optional
/>
```

### Integration Points
- Dashboard: Add QR button near "Open App" area
- Stores page: Add to each store row
- Table Management: Add to table rows (future)

---

## 2. Top-bar Quick Actions

### Component
- **`TopbarQuickActions.tsx`** - Compact toolbar with language, dark mode, fullscreen, and notifications

### Features
- **Language Switcher**: Dropdown for en/fr/rw with flag icons; uses Next.js i18n
- **Dark Mode Toggle**: Persists to localStorage; adds/removes `dark` class on `<html>`
- **Fullscreen Toggle**: Browser Fullscreen API with graceful fallback
- **Notifications**: Badge counter + dropdown (currently shows empty state; ready for real events)

### Usage
```tsx
import { TopbarQuickActions } from '@/components/layout/TopbarQuickActions'

// In your app shell/layout:
<TopbarQuickActions />
```

### Integration Points
- Add to main app layout header (top-right corner)
- Ensure Tailwind dark mode is configured: `darkMode: 'class'` in `tailwind.config.js`

### Dark Mode Setup
Add to `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class',
  // ... rest of config
}
```

---

## 3. Menu Import + Builder

### Components
- **`MenuImportWizard.tsx`** - Multi-step wizard for CSV/Google Sheets import
- **`MenuBuilder.tsx`** - Visual menu builder with categories and items

### Service
- **`menu-import.service.ts`** - CSV parsing, Google Sheets fetching, validation

### Features

#### Import Flow
1. **Method Selection**: Choose CSV upload or Google Sheets URL
2. **Upload/Fetch**: Parse and validate data
3. **Preview**: Review categories and items before import
4. **Validation**: Check for duplicates, missing fields, invalid prices

#### Builder Flow
- Add/edit/delete categories
- Add/edit/delete items within categories
- Inline editing for all fields
- Real-time preview

#### CSV Template
Download sample template via `MenuImportService.downloadSampleCSV()`

**Required columns**:
- `category` - Category name
- `name` - Item name
- `price` - Price in RWF (e.g., 5.99)

**Optional columns**:
- `description` - Item description
- `imageUrl` - Image URL
- `available` - true/false (default: true)

### Usage
```tsx
import { MenuImportWizard } from '@/components/menu/MenuImportWizard'
import { MenuBuilder } from '@/components/menu/MenuBuilder'

// Import flow:
<MenuImportWizard
  businessId={businessId}
  onComplete={(items) => {
    // Save items to database
  }}
  onCancel={() => setShowImport(false)}
/>

// Builder flow:
<MenuBuilder
  businessId={businessId}
  onSave={(categories) => {
    // Save categories to database
  }}
  onCancel={() => setShowBuilder(false)}
/>
```

### Google Sheets Setup
1. Create a Google Sheet with the required columns
2. Set sharing to "Anyone with the link can view"
3. Copy the sheet URL
4. Paste into the import wizard

---

## 4. MTN MoMo API Integration (Sandbox Ready)

### Service
- **`mtn-momo.service.ts`** - MTN MoMo Collection API wrapper

### Endpoint
- **`/api/payments/mtn-momo/callback`** - Webhook for payment status updates

### Environment Variables
Add to `.env`:
```bash
MTN_MOMO_ENVIRONMENT="sandbox" # or "production"
MTN_MOMO_SUBSCRIPTION_KEY="your-subscription-key"
MTN_MOMO_API_USER="uuid-from-apiuser-endpoint"
MTN_MOMO_API_KEY="api-key-for-user"
MTN_MOMO_CALLBACK_HOST="https://yourdomain.com"
MTN_MOMO_CURRENCY="RWF"
MTN_MOMO_TARGET_ENVIRONMENT="mtnrwanda"
```

### Features
- **Access Token Management**: Auto-refresh with 60s buffer
- **Request to Pay**: Initiate MoMo payment with phone number
- **Transaction Status**: Poll payment status
- **Account Balance**: Check MoMo account balance
- **Phone Validation**: Rwanda-specific MSISDN validation
- **Webhook Callback**: Async payment status updates

### Usage
```ts
import { MTNMoMoService } from '@/lib/services/mtn-momo.service'

// Initiate payment
const referenceId = await MTNMoMoService.requestToPay({
  amount: 10000, // RWF
  currency: 'RWF',
  externalId: 'ORDER-123',
  payer: {
    partyIdType: 'MSISDN',
    partyId: '250788123456'
  },
  payerMessage: 'Payment for subscription',
  payeeNote: 'ImboniServe subscription'
})

// Check status
const status = await MTNMoMoService.getTransactionStatus(referenceId)
```

### Integration with IremboPay
- IremboPay remains the primary payment gateway
- MTN MoMo API can be used as a direct alternative or fallback
- Both services update the same `PaymentTransaction` model
- Choose provider via `PAYMENTS_PROVIDER` env var or per-transaction logic

---

## Dependencies Installed

```bash
npm install qrcode.react papaparse uuid
npm install --save-dev @types/papaparse @types/uuid
```

---

## Next Steps

### Immediate
1. **Integrate components into existing pages**:
   - Add `DashboardQRButton` to dashboard
   - Add `TopbarQuickActions` to app layout
   - Add menu import/builder to menus page

2. **Configure dark mode**:
   - Update `tailwind.config.js` with `darkMode: 'class'`
   - Add dark mode styles to existing components as needed

3. **Test MTN MoMo sandbox**:
   - Register for MTN Developer Portal
   - Generate API user and key
   - Test payment flow in sandbox environment

### Future Enhancements
- **QR Analytics**: Track scans in database
- **Notifications**: Wire to real events (orders, low stock, etc.)
- **Menu Versioning**: Track menu changes over time
- **MTN MoMo Production**: Switch to production credentials when ready
- **Airtel Money**: Add similar service for Airtel Money API

---

## Testing Checklist

- [ ] QR code generates correctly with custom styles
- [ ] QR code downloads as SVG and PNG
- [ ] Language switcher changes locale
- [ ] Dark mode persists across page reloads
- [ ] Fullscreen toggle works (browser support varies)
- [ ] CSV import validates and previews correctly
- [ ] Google Sheets import fetches public sheets
- [ ] Menu builder saves categories and items
- [ ] MTN MoMo sandbox payment initiates successfully
- [ ] MTN MoMo callback updates transaction status

---

## Support

For questions or issues:
1. Check component props and service method signatures
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Test in sandbox before production
