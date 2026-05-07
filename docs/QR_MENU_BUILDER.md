# QR Menu Builder - Feature Documentation

## Overview

The QR Menu Builder is a powerful feature that enables restaurants, hotels, cafes, and other hospitality businesses to create professional, branded QR codes in minutes. These QR codes can direct customers to menus, stores, or specific tables with automatic scan tracking.

## Key Features

### 1. **Professional Templates**
- 6 ready-to-use SVG templates:
  - **Menu Poster** (A4) - Full menu display for walls/windows
  - **Table Tent** - Folding stand for table placement
  - **Coaster** (90mm) - Circular drink coaster design
  - **Sticker** (Square/Circle) - Brand stickers for packaging
  - **A-Frame** - Outdoor sidewalk sign
  - **Business Card** - Contact card with QR code

### 2. **Dynamic QR Codes**
- Short, trackable URLs (`/q/:token`)
- Automatic scan count tracking
- Last scanned timestamp
- Updateable target URLs (change destination without reprinting)

### 3. **Form-Based Editor**
- Auto-prefills business data (name, phone, address)
- Customizable fields:
  - Primary color
  - Custom message/tagline
  - QR type (Menu, Store, Table)
  - Table number (for table QR codes)
- Live SVG preview

### 4. **Export Options**
- **Primary**: 1-click PNG download (high-res, print-ready)
- **Secondary**: SVG export for further editing
- Print-ready sizes (A4, A5, Coaster, etc.)

### 5. **Design Management**
- List all saved designs
- View scan counts and last scanned date
- Duplicate designs for quick variations
- Delete designs with confirmation
- Copy short links to clipboard

## Database Schema

### QrTemplate
Stores reusable SVG templates with token placeholders.

```prisma
model QrTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String   // menu_poster, table_tent, coaster, sticker, aframe, business_card
  svgTemplate String   @db.Text
  previewUrl  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  designs     QrDesign[]
}
```

### QrDesign
User-created designs with customization data.

```prisma
model QrDesign {
  id          String   @id @default(cuid())
  businessId  String
  templateId  String
  name        String
  customData  Json     // { logo, primaryColor, message, qrType, tableNumber? }
  previewUrl  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  template    QrTemplate @relation(fields: [templateId], references: [id])
  qrCode      QrCode?
}
```

### QrCode
Generated QR codes with scan tracking.

```prisma
model QrCode {
  id            String   @id @default(cuid())
  businessId    String
  designId      String   @unique
  token         String   @unique
  type          String   // menu, store, table
  targetUrl     String
  metadata      Json?    // { tableNumber? }
  scanCount     Int      @default(0)
  lastScannedAt DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  design        QrDesign @relation(fields: [designId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Templates
- `GET /api/qr/templates` - List all active templates
- `GET /api/qr/templates/:id` - Get template details with SVG

### Designs
- `GET /api/qr/designs` - List user's designs (auth required)
- `POST /api/qr/designs` - Create design + auto-create QR code
- `POST /api/qr/designs/:id` - Duplicate design
- `DELETE /api/qr/designs/:id` - Delete design

### QR Resolver
- `GET /api/q/:token` - Dynamic QR redirect with scan tracking

### Business
- `GET /api/business/current` - Get current user's business data

## User Flow

### Creating a QR Design

1. **Navigate** to `/dashboard/qr-builder`
2. **Select** a template from the gallery
3. **Customize** fields:
   - Choose QR type (Menu/Store/Table)
   - Set primary color
   - Add custom message
   - For table QR: enter table number
4. **Preview** live rendering with business data
5. **Save Design** - automatically creates QR code with short link
6. **Download** PNG (primary) or SVG (secondary)

### Using the QR Code

1. Print the downloaded design
2. Place in venue (table, wall, window, etc.)
3. Customers scan → redirected to `/q/:token`
4. System tracks scan count and timestamp
5. Redirects to target URL (menu, store, or table-specific page)

### Managing Designs

- View all designs in "My Designs" panel
- See scan counts and last scanned date
- Open short link to test
- Copy link to clipboard
- Duplicate for variations
- Delete when no longer needed

## Token Replacement System

Templates use double-brace syntax for dynamic content:

```svg
<text>{{business.name}}</text>
<text>{{business.phone}}</text>
<text>{{business.address}}</text>
<text fill="{{custom.primaryColor}}">{{custom.message}}</text>
<image href="{{qr.dataUrl}}" />
```

Available tokens:
- `{{business.name}}` - Business name
- `{{business.phone}}` - Business phone
- `{{business.address}}` - Business address
- `{{custom.primaryColor}}` - User-selected color
- `{{custom.message}}` - Custom tagline
- `{{custom.tableNumber}}` - Table number (table QR only)
- `{{qr.dataUrl}}` - Base64 PNG of QR code

## Seeding Templates

Run the seeder to populate initial templates:

```bash
npm run seed:qr-templates
```

This creates 6 professional templates in the database.

## Technical Implementation

### Rendering Engine
Located at `src/lib/qr/render.ts`:
- `generateQrDataUrl()` - Creates QR code as base64 PNG
- `renderSvg()` - Replaces tokens in template with actual values

### Frontend
- Page: `src/pages/dashboard/qr-builder.tsx`
- Form-based editor with live preview
- Client-side QR generation using `qrcode` library
- Canvas-based PNG export (2x scale for print quality)

### Backend
- Raw SQL queries to avoid Prisma client regeneration issues
- UUID generation via Node.js `crypto.randomUUID()`
- Short token generation using base64url encoding

## Analytics

Basic analytics tracked per QR code:
- `scanCount` - Total number of scans
- `lastScannedAt` - Timestamp of most recent scan

Future enhancements could include:
- Device type tracking
- Geographic location
- UTM parameters
- Time-series scan data

## Security Considerations

- All design operations require authentication
- Business ownership verified on all mutations
- QR codes can be deactivated without deletion
- Soft delete support via `isActive` flag

## Limitations (MVP)

- No batch export (ZIP downloads)
- No advanced analytics (device, geo, UTM)
- Manual table number entry only (no range generation)
- Logo upload not yet implemented
- Templates are pre-designed (not customizable layouts)

## Future Enhancements

1. **Logo Upload** - Allow custom logo in designs
2. **Batch Table QR** - Generate QR codes for tables 1-50 in one click
3. **Advanced Analytics** - Device type, location, time-series charts
4. **Custom Templates** - Template builder with drag-and-drop
5. **Batch Export** - Download multiple designs as ZIP
6. **QR Styles** - Different QR code visual styles (rounded, dotted, etc.)
7. **Expiration Dates** - Set QR codes to expire after a date
8. **A/B Testing** - Test different designs and track performance

## Troubleshooting

### Templates not showing
- Ensure seeder has been run: `npm run seed:qr-templates`
- Check database connection to Supabase
- Verify `QrTemplate` table exists

### QR codes not redirecting
- Check token is correct
- Verify QR code is active (`isActive = true`)
- Ensure business is active
- Check target URL is valid

### Scan count not incrementing
- Verify `/api/q/:token` endpoint is working
- Check database write permissions
- Ensure QR code record exists

### PNG export fails
- Check browser canvas support
- Verify SVG is valid
- Try SVG export as fallback

## Support

For issues or questions:
- Check application logs for errors
- Verify database schema is up to date
- Test with a fresh design
- Contact support with QR token for debugging
