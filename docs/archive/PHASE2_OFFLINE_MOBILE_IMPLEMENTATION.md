# Phase 2: Offline & Mobile Implementation Guide

## Overview
This document outlines the implementation of offline-first PWA capabilities and Android mobile app for Imboni Serve.

## Architecture

### 1. PWA Offline (Web)
- **Service Worker** (`public/sw.js`): Caches static assets, handles offline requests
- **Outbox Service** (`src/lib/services/outbox.service.ts`): IndexedDB queue for offline operations
- **Manifest** (`public/manifest.json`): PWA configuration for installability
- **Background Sync**: Automatic sync when connection restored

### 2. Mobile App (React Native/Expo)
- **Platform**: Android (Rwanda Play Store)
- **Framework**: Expo with EAS Build
- **Offline Storage**: SQLite via WatermelonDB or Drizzle
- **Printing**: Bluetooth thermal printers (ESC/POS protocol)
- **Deep Links**: `Imboni Serve://` scheme for affiliate codes

### 3. Affiliate System
- **Short Codes**: `IMB-XXXXXX` format (6 chars, no ambiguous chars)
- **Links**: `https://imboni.rw/signup?aff=IMB-XXXXXX`
- **Deep Links**: `Imboni Serve://signup?aff=IMB-XXXXXX`
- **Attribution**: Last-click, 30-day cookie, 7-day lock, 20% for 12 months
- **Payout**: 10,000 RWF minimum, monthly on 5th, manual MTN/Airtel

## Implementation Status

### ✅ Completed (PWA Foundation)
1. Service Worker with cache-first strategy
2. Offline fallback page
3. Outbox service with IndexedDB
4. PWA manifest for installability
5. Service worker registration in `_app.tsx`
6. Online/offline event listeners
7. Affiliate code generation and deep link support
8. Thermal printer service (ESC/POS formatting)

### 🔄 In Progress
1. React Native app scaffold
2. Offline POS state management
3. Sync conflict resolution

### ⏳ Pending
1. Bluetooth printer integration (RN)
2. SQLite setup in mobile app
3. Play Store assets and listing
4. Beta testing with pilot restaurants

## Printer Support (Recommended Models)
Based on Rwanda market availability and ESC/POS compatibility:
- **Xprinter XP-58IIH** (58mm thermal, Bluetooth)
- **Rongta RPP02N** (58mm portable, Bluetooth)
- **Epson TM-P20** (58mm mobile, Bluetooth) - Premium option
- **Generic ESC/POS 80mm** (counter printers)

All use standard ESC/POS commands implemented in `printer.service.ts`.

## Testing Checklist

### PWA Offline Testing
1. **Install PWA**:
   - Chrome: Visit site → Menu → Install app
   - Verify manifest loads correctly
   
2. **Offline Mode**:
   - Create sale while online → verify success
   - Disconnect internet (airplane mode)
   - Create sale → verify queued in outbox
   - Reconnect → verify auto-sync
   - Check IndexedDB in DevTools → Application → Storage

3. **Service Worker**:
   - DevTools → Application → Service Workers
   - Verify registration and activation
   - Test cache updates on new deployment

### Affiliate Code Testing
1. **Code Generation**:
   - Create affiliate via admin
   - Verify code format `IMB-XXXXXX`
   - Test uniqueness

2. **Attribution**:
   - Visit signup with `?aff=IMB-XXXXXX`
   - Complete signup and setup
   - Verify `referredByAffiliateId` set on restaurant
   - Generate 1+ slips
   - Verify commission created on first invoice

3. **Deep Links** (Mobile App):
   - Tap `Imboni Serve://signup?aff=IMB-XXXXXX`
   - Verify app opens to signup with code pre-filled

### Printer Testing (Mobile App)
1. **Bluetooth Pairing**:
   - Scan for printers
   - Pair with target device
   - Save as default

2. **Test Print**:
   - Use test print function
   - Verify formatting (header, items, totals, footer)
   - Check QR code/link rendering

3. **Slip Print**:
   - Complete sale
   - Print slip
   - Verify all fields present and aligned

## Deployment

### PWA (Web)
```bash
# Run autopilot setup
scripts\autopilot-setup.bat

# Start dev server
scripts\autopilot-run-dev.bat

# Production build
npm run build
npm start
```

### Mobile App (Future)
```bash
# Initialize Expo app
npx create-expo-app imboni-serve-mobile
cd imboni-serve-mobile

# Install dependencies
npm install @react-navigation/native expo-sqlite watermelondb
npm install react-native-bluetooth-escpos-printer

# Configure deep links in app.json
# Build with EAS
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Environment Variables
Required for full functionality:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
APP_URL=https://imboni.rw
```

## Known Issues & Notes
- **TypeScript lint**: `idb` module will resolve after `npm install` runs
- **Service Worker**: Only registers in production mode (not dev)
- **Bluetooth printing**: Requires React Native; web version uses browser print dialog
- **Offline slip generation**: Creates "lite" slip; server generates canonical PDF on sync

## Next Steps
1. Run `scripts\autopilot-setup.bat` to install dependencies
2. Test PWA offline capabilities in Chrome
3. Create test affiliate code and verify attribution flow
4. Scaffold React Native app for mobile
5. Integrate Bluetooth printer library
6. Pilot with 2-3 restaurants before Play Store launch

## Support
For issues or questions:
- Check browser console for service worker logs
- Inspect IndexedDB in DevTools → Application
- Verify `.env` configuration
- Review Prisma migration status: `npx prisma migrate status`
