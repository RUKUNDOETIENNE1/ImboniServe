# Supplier Marketplace Implementation Guide

## Overview
Complete B2B procurement system enabling restaurants to order from suppliers with unified document management (Smart Dining Slip for restaurants, Invoice for suppliers).

## Architecture

### Unified Document Model
- **Single Entity**: `SmartDiningSlip` with `domain` field
  - `DINING`: Restaurant sales (existing)
  - `PROCUREMENT`: Supplier invoices (new)
- **Role-Based Labeling**:
  - Restaurant users see: "Smart Dining Slip"
  - Supplier/Admin see: "Invoice"
- **Same Data**: ID, amounts, VAT, line items, payment status

### Data Models

#### PurchaseOrder
- PO lifecycle: DRAFT → SUBMITTED → ACCEPTED → PACKED → SHIPPED → DELIVERED → COMPLETED
- Includes items, totals, delivery details, status history
- Approval/rejection tracking

#### GoodsReceivedNote (GRN)
- Created when restaurant receives delivery
- Tracks ordered vs received quantities
- Condition tracking (GOOD/DAMAGED/EXPIRED)
- Partial/complete status
- Triggers unified document generation

#### SupplierPayout
- 7.5% platform fee on all invoices
- Manual MTN/Airtel payouts
- Admin marks as paid with reference
- Period-based calculations

### Services Implemented

1. **PurchaseOrderService** (`src/lib/services/purchase-order.service.ts`)
   - Create, submit, accept/reject POs
   - Status updates (packed, shipped, delivered)
   - Cancel POs
   - Get POs by restaurant/supplier

2. **GoodsReceivedNoteService** (`src/lib/services/goods-received-note.service.ts`)
   - Create GRN with received quantities
   - Generate unified document on GRN completion
   - Track partial/complete deliveries
   - Update PO status on completion

3. **SmartDiningSlipService** (extended)
   - `generateProcurementDocument()`: Creates invoice/slip from GRN
   - Unified document with procurement context
   - Same numbering sequence (SDS-...)

4. **SupplierPayoutService** (`src/lib/services/supplier-payout.service.ts`)
   - Calculate payouts with 7.5% fee
   - Create payout requests
   - Mark as paid (admin)
   - Earnings summary

## Key Features

### Marketplace Fee: 7.5%
- Applied to all supplier invoices
- Deducted from gross amount before payout
- Transparent in supplier dashboard

### Supplier Lead Times
- Configurable per supplier (24-72h default)
- Shown during PO creation
- Delivery date suggestions

### Delivery Coverage
- Suppliers define coverage cities
- Restaurants see only available suppliers
- JSON array of cities

### Payout Methods
- MTN Mobile Money
- Airtel Money
- Bank Transfer
- Manual admin processing

## Notifications

### Email (Default)
- New PO to supplier
- PO status updates
- Delivery confirmations
- Payout notifications

### WhatsApp (New PO Only)
- Short template with PO summary
- Secure link to accept/reject
- Respects daily caps

## Database Migration

### Migration File
`prisma/migrations/20260207_supplier_marketplace/migration.sql`

### New Tables
- PurchaseOrder
- PurchaseOrderItem
- PurchaseOrderStatusHistory
- GoodsReceivedNote
- GoodsReceivedNoteItem
- SupplierPayout

### Extended Tables
- Supplier: leadTimeDays, minOrderCents, deliveryCoverageCities, payoutMethod, payoutDetails
- SmartDiningSlip: domain, purchaseOrderId, goodsReceivedNoteId, supplierId, buyerRestaurantId
- Restaurant: purchaseOrders, buyerDocuments relations

## Setup & Testing

### Autopilot Setup
```bash
scripts\autopilot-setup.bat
```
This will:
1. Install dependencies (npm install)
2. Generate Prisma client
3. Run marketplace migration
4. Regenerate Prisma client with new models

### Start Dev Server
```bash
scripts\autopilot-run-dev.bat
```

### Testing Checklist

#### 1. Supplier Onboarding
- [ ] Create supplier account
- [ ] Set lead time (24-72h)
- [ ] Add delivery coverage cities
- [ ] Configure payout method (MTN/Airtel)
- [ ] Add catalog products

#### 2. Purchase Order Flow
- [ ] Restaurant browses marketplace
- [ ] Add items to cart
- [ ] Create PO with delivery details
- [ ] Submit PO to supplier
- [ ] Supplier receives email notification
- [ ] Supplier accepts PO
- [ ] Supplier updates status (PACKED → SHIPPED)

#### 3. Goods Received Note
- [ ] Restaurant receives delivery
- [ ] Create GRN with received quantities
- [ ] Mark items as GOOD/DAMAGED/EXPIRED
- [ ] Add discrepancy notes if needed
- [ ] System generates unified document
- [ ] Restaurant sees "Smart Dining Slip"
- [ ] Supplier sees "Invoice" with same data

#### 4. Invoicing & Payouts
- [ ] Verify invoice amounts match GRN
- [ ] Check 7.5% fee calculation
- [ ] Supplier requests payout
- [ ] Admin reviews pending payouts
- [ ] Admin marks payout as paid (MTN/Airtel reference)
- [ ] Supplier sees updated payout status

#### 5. Edge Cases
- [ ] Reject PO (supplier)
- [ ] Cancel PO (restaurant)
- [ ] Partial delivery (GRN with less than ordered)
- [ ] Multiple GRNs for single PO
- [ ] Damaged goods tracking
- [ ] Zero invoices in period (payout error)

## UI Routes (To Be Built)

### Supplier Dashboard (`/supplier/*`)
- `/supplier/dashboard` - Overview, pending POs, earnings
- `/supplier/catalog` - Product management
- `/supplier/orders` - PO list and details
- `/supplier/orders/[id]` - PO detail with accept/reject
- `/supplier/deliveries` - Delivery tracking
- `/supplier/invoices` - Invoice list (unified documents)
- `/supplier/payouts` - Payout history and requests
- `/supplier/settings` - Profile, coverage, payout method

### Restaurant Marketplace (`/store/*`)
- `/store` - Browse suppliers and products
- `/store/cart` - Shopping cart
- `/store/checkout` - Create PO
- `/dashboard/procurement/orders` - PO list
- `/dashboard/procurement/orders/[id]` - PO detail
- `/dashboard/procurement/receiving` - GRN creation
- `/dashboard/procurement/invoices` - Invoice list (unified documents)

### Admin (`/admin/*`)
- `/admin/suppliers` - Supplier management
- `/admin/payouts` - Pending payouts, mark as paid
- `/admin/marketplace` - Marketplace settings, fees

## API Routes (To Be Built)

### Purchase Orders
- `POST /api/purchase-orders` - Create PO
- `GET /api/purchase-orders` - List POs
- `GET /api/purchase-orders/[id]` - Get PO details
- `POST /api/purchase-orders/[id]/submit` - Submit PO
- `POST /api/purchase-orders/[id]/accept` - Accept PO (supplier)
- `POST /api/purchase-orders/[id]/reject` - Reject PO (supplier)
- `POST /api/purchase-orders/[id]/status` - Update status
- `POST /api/purchase-orders/[id]/cancel` - Cancel PO

### Goods Received Notes
- `POST /api/grn` - Create GRN
- `GET /api/grn` - List GRNs
- `GET /api/grn/[id]` - Get GRN details

### Supplier Catalog
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/[id]` - Get supplier details
- `GET /api/suppliers/[id]/products` - Get supplier products
- `POST /api/suppliers/[id]/products` - Add product (supplier)
- `PUT /api/suppliers/[id]/products/[productId]` - Update product
- `DELETE /api/suppliers/[id]/products/[productId]` - Delete product

### Payouts
- `GET /api/supplier-payouts` - List payouts
- `POST /api/supplier-payouts` - Create payout request
- `POST /api/supplier-payouts/[id]/mark-paid` - Mark as paid (admin)
- `GET /api/supplier-payouts/earnings` - Earnings summary

## Environment Variables
No new API keys required. Uses existing:
- `DATABASE_URL` - Supabase PostgreSQL
- `NEXTAUTH_SECRET` - Authentication
- `TWILIO_*` - WhatsApp notifications (optional)

## Known Issues & Notes

### TypeScript Errors (Expected)
All Prisma-related TypeScript errors will resolve after running:
```bash
npx prisma migrate dev --name supplier_marketplace
npx prisma generate
```

The autopilot script handles this automatically.

### Migration Safety
- Uses `migrate dev` for development
- Creates new tables, doesn't modify existing data
- Safe to run on existing database
- Adds nullable fields to existing tables

### Performance Considerations
- Indexed fields: restaurantId, supplierId, status, domain
- Efficient queries for PO/GRN lists
- Payout calculations cached in SupplierPayout table

## Next Steps

After autopilot setup completes:

1. **Week 1**: Build supplier dashboard UI
2. **Week 2**: Build restaurant marketplace UI
3. **Week 3**: Create all API routes
4. **Week 4**: Add notifications, QA, pilot testing

## Support & Troubleshooting

### Migration Fails
- Check DATABASE_URL in `.env`
- Ensure Supabase connection is active
- Run `npx prisma migrate reset` to start fresh (dev only)

### TypeScript Errors Persist
- Restart TypeScript server in IDE
- Run `npx prisma generate` manually
- Check that migration completed successfully

### Payout Calculations Wrong
- Verify 7.5% fee in `SupplierPayoutService`
- Check that GRNs have associated documents
- Ensure `domain: 'PROCUREMENT'` filter is applied

## Documentation
- Prisma schema: `prisma/schema.prisma`
- Services: `src/lib/services/*.service.ts`
- Migration: `prisma/migrations/20260207_supplier_marketplace/`
