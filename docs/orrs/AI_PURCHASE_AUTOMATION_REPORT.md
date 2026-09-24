# AI Purchase Order Automation Report

**Platform:** ImboniServe  
**Restaurant:** Café Imboni, Kigali, Rwanda  
**Sprint:** Operational Readiness Remediation Sprint (ORRS)  
**Date:** July 26, 2026  

---

## 1. IOS Finding

The IOS identified that the AI reorder system generated suggestions but required manual order creation. No draft purchase orders were automatically generated from reorder triggers, causing delays in procurement and requiring managers to manually translate AI suggestions into formal purchase orders.

**IOS Recommendation:** Auto-generate draft purchase orders from AI reorder triggers, preserving manager approval, including supplier, products, quantities, cost, justification, and inventory impact.

---

## 2. Implementation Details

### 2.1 New Service Method

Added `generateDraftPurchaseOrders()` to `ReorderAutopilotService` in `src/lib/services/reorder-autopilot.service.ts`.

**Method Signature:**
```typescript
static async generateDraftPurchaseOrders(
  businessId: string,
  userId: string
): Promise<{
  created: number
  skipped: number
  purchaseOrders: Array<{
    id: string
    poNumber: string
    supplierName: string
    totalCents: number
    itemCount: number
    justification: string
  }>
}>
```

### 2.2 Workflow

1. **Detect low stock:** Calls `getAutopilotDashboard()` which runs `detectLowStock()` and `generateReorderSuggestions()` — the existing AI-powered detection and supplier recommendation engine.
2. **Check for existing drafts:** Queries all existing DRAFT PurchaseOrders for the business and builds a set of already-drafted item names (case-insensitive).
3. **Filter duplicates:** Skips suggestions for items that already have a DRAFT PO line item — prevents duplicate draft POs.
4. **Group by supplier:** Groups remaining suggestions by recommended supplier ID — one draft PO per supplier.
5. **Create draft PO:** For each supplier group:
   - Fetches supplier details (name, lead time)
   - Calculates subtotal, VAT (18%), and total
   - Generates unique PO number (`DRAFT-{timestamp}-{random}`)
   - Creates `PurchaseOrder` record with status `DRAFT`
   - Creates `PurchaseOrderItem` records for each suggestion with:
     - Product name and ID
     - Quantity and unit
     - Unit price and total price (in cents)
     - Notes with urgency and stock information
   - Creates `PurchaseOrderStatusHistory` entry documenting auto-generation
   - PO notes include full justification and inventory impact projection
6. **Log reorder actions:** Logs each suggestion as 'approved' in `SupplierRecommendationLog` for audit trail.

### 2.3 Draft PO Contents

Each generated draft PO includes:

| Field | Source | Description |
|------|--------|-------------|
| `poNumber` | Auto-generated | Unique identifier with DRAFT prefix |
| `supplierId` | AI recommendation | Best-match supplier from AISupplierRecommendationService |
| `status` | Fixed | `DRAFT` — requires manager approval |
| `subtotalCents` | Calculated | Sum of all line item totals |
| `vatCents` | Calculated | 18% of subtotal |
| `totalCents` | Calculated | Subtotal + VAT |
| `notes` | Auto-generated | Full justification + inventory impact projection |
| `createdById` | User context | ID of user who triggered generation |
| `approvedById` | null | Not yet approved — manager must approve |
| `approvedAt` | null | Not yet approved |

### 2.4 Line Item Contents

| Field | Source | Description |
|------|--------|-------------|
| `productName` | Inventory item name | Name of the inventory item |
| `productId` | Supplier product ID | Linked to SupplierProduct |
| `quantity` | AI suggestion | Calculated reorder quantity |
| `unit` | Inventory item unit | kg, L, pieces, etc. |
| `unitPriceCents` | Supplier pricing | Recommended supplier's unit price |
| `totalPriceCents` | Calculated | quantity × unitPriceCents |
| `notes` | Auto-generated | Urgency level + current/min stock |

### 2.5 Justification and Inventory Impact

**Justification format:**
```
{item name}: stock {current} {unit} (min {min}), reorder {qty} {unit} — {supplier reasoning}
```

**Inventory impact format:**
```
{item name}: +{qty} {unit} → projected {current + qty} {unit}
```

Both are included in the PO `notes` field for full traceability.

### 2.6 API Endpoint

Added `generate-drafts` action to `POST /api/autopilot/reorder-suggestions`:

```json
{
  "action": "generate-drafts"
}
```

**Response (201 Created):**
```json
{
  "created": 2,
  "skipped": 1,
  "purchaseOrders": [
    {
      "id": "po-id",
      "poNumber": "DRAFT-1234567890-ABC123",
      "supplierName": "Fresh Foods Ltd",
      "totalCents": 45000,
      "itemCount": 3,
      "justification": "Tomatoes: stock 5 kg (min 10), reorder 15 kg — Nearby location • Best price; ..."
    }
  ]
}
```

---

## 3. Manager Approval Workflow

The draft PO workflow preserves the existing approval process:

1. **Draft created** → Status: `DRAFT`, `approvedById`: null, `approvedAt`: null
2. **Manager reviews** → Reviews PO details, line items, costs, justification
3. **Manager approves** → Existing PO approval flow updates status, sets `approvedById` and `approvedAt`
4. **Manager rejects** → Existing PO rejection flow updates status, sets `rejectedById` and `rejectionReason`

No changes were made to the existing approval/rejection endpoints or UI.

---

## 4. Duplicate Prevention

- Before creating draft POs, the system queries all existing DRAFT PurchaseOrders for the business
- Item names in existing drafts are collected (case-insensitive)
- Suggestions for items already in a DRAFT PO are skipped and counted in the `skipped` field
- This prevents duplicate draft POs from repeated generation calls

---

## 5. Audit Trail

- **SupplierRecommendationLog:** Each suggestion used in a draft PO is logged with action 'approved', including urgency, suggested quantity, estimated cost, and supplier reasoning
- **PurchaseOrderStatusHistory:** Initial DRAFT status entry created with `changedByName: 'AI Reorder Autopilot'` and notes documenting auto-generation
- **PurchaseOrder notes:** Full justification and inventory impact projection embedded in PO record

---

## 6. Verification

- **No duplicate purchase orders:** Deduplication logic verified — items in existing DRAFT POs are skipped ✅
- **Drafts traceable and auditable:** Each draft has PO number, status history, and recommendation logs ✅
- **Manager approval preserved:** Drafts start as DRAFT, no auto-approval ✅
- **Supplier information included:** Each draft linked to recommended supplier with line items ✅
- **Justification included:** Full reasoning embedded in PO notes ✅
- **Inventory impact included:** Projected stock levels after reorder included in PO notes ✅
- **No regressions:** Existing reorder suggestion and approval flows unchanged ✅

---

*Report generated: July 26, 2026*
