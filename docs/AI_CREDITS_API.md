# AI Credits API Reference

## Business Endpoints

### GET `/api/credits/balance`

Get the current credit wallet balance for the authenticated business.

**Auth:** Session required

**Response:**
```json
{
  "data": {
    "balance": 450,
    "reservedBalance": 5,
    "availableBalance": 445,
    "monthlyAllocation": 500,
    "purchasedCredits": 0,
    "bonusCredits": 0,
    "lifetimeConsumed": 50,
    "lifetimePurchased": 0,
    "lifetimeAllocated": 500,
    "lastRenewalAt": "2024-01-01T00:00:00.000Z",
    "nextRenewalAt": "2024-02-01T00:00:00.000Z"
  }
}
```

---

### GET `/api/credits/usage`

Get usage analytics for the authenticated business.

**Auth:** Session required

**Query Parameters:**
- `days` (optional, default: 30) — Number of days for trend data

**Response:**
```json
{
  "data": {
    "balance": 450,
    "availableBalance": 445,
    "monthlyAllocation": 500,
    "lifetimeConsumed": 50,
    "usageThisMonth": {
      "totalCredits": 50,
      "byFeature": [
        { "feature": "scanner", "count": 1, "credits": 30 },
        { "feature": "insights", "count": 10, "credits": 20 }
      ]
    },
    "usageTrend": [
      { "date": "2024-01-15", "credits": 30, "count": 1 }
    ],
    "topFeatures": [
      { "feature": "scanner", "count": 1, "credits": 30 }
    ]
  }
}
```

---

### GET `/api/credits/history`

Get paginated ledger history for the authenticated business.

**Auth:** Session required

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 100)
- `entryType` (optional) — Filter by entry type
- `feature` (optional) — Filter by feature key

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "entryType": "CONSUMPTION",
      "feature": "scanner",
      "credits": -30,
      "balanceBefore": 480,
      "balanceAfter": 450,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### GET `/api/credits/packages`

List all active credit packages available for purchase.

**Auth:** Session required

**Response:**
```json
{
  "data": [
    {
      "code": "pack_500",
      "name": "500 Credits",
      "credits": 500,
      "priceCents": 500000,
      "bonusCredits": 0
    },
    {
      "code": "pack_2000",
      "name": "2,000 Credits",
      "credits": 2000,
      "priceCents": 1800000,
      "bonusCredits": 100
    }
  ]
}
```

---

### POST `/api/credits/purchase`

Initiate a credit purchase via IremboPay.

**Auth:** Session required

**Request Body:**
```json
{
  "packageCode": "pack_2000"
}
```

**Response:**
```json
{
  "data": {
    "invoiceNumber": "INV-...",
    "paymentLinkUrl": "https://...",
    "transactionId": "tx_...",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "amount": 18000,
    "credits": 2000,
    "bonusCredits": 100,
    "packageName": "2,000 Credits"
  },
  "message": "AI credits purchase initiated (2,000 Credits)"
}
```

---

## Admin Endpoints

All admin endpoints require `PLATFORM_ADMIN` role.

### GET `/api/credits/admin/wallets`

List all business wallets with pagination and search.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `search` (optional) — Search by business name

---

### POST `/api/credits/admin/adjust`

Grant or revoke credits for a business.

**Request Body:**
```json
{
  "businessId": "biz_123",
  "action": "grant",
  "credits": 100,
  "reason": "Promotional bonus for feedback"
}
```

Actions: `grant` | `revoke`

---

### GET `/api/credits/admin/ledger`

Search ledger entries across all businesses.

**Query Parameters:**
- `businessId` (optional)
- `entryType` (optional)
- `feature` (optional)
- `page`, `limit` (optional)

---

### GET/POST/PUT `/api/credits/admin/feature-costs`

- **GET:** List all feature costs
- **POST:** Create a new feature cost
- **PUT:** Update an existing feature cost

**POST Body:**
```json
{
  "featureKey": "new_feature",
  "featureName": "New Feature",
  "creditsCost": 10,
  "category": "generation"
}
```

**PUT Body:**
```json
{
  "featureKey": "scanner",
  "creditsCost": 25
}
```

---

### GET/POST/PUT `/api/credits/admin/policies`

- **GET:** List all policies
- **POST:** Create a new policy
- **PUT:** Update an existing policy

**PUT Body:**
```json
{
  "policyKey": "max_balance",
  "value": "5000"
}
```

---

### GET `/api/credits/admin/analytics`

Get platform-wide analytics.

**Query Parameters:**
- `days` (optional, default: 30)

**Response includes:** total businesses, total credits consumed, revenue, top features, top businesses, daily trends, consumption by plan.

---

## Error Responses

All endpoints use standard error format:

```json
{
  "error": "Error message",
  "details": {}
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 402 | Insufficient credits |
| 403 | Forbidden (admin only) |
| 404 | Not found |
| 405 | Method not allowed |
| 500 | Internal server error |
