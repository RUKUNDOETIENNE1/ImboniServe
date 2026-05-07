# API Documentation - Imboni Serve

## Base URL
```
Production: https://serve.imboni.rw/api
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a valid session cookie from NextAuth.

### Headers
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

### Rate Limits
- **Signup**: 5 requests per 15 minutes per IP
- **Sales/Inventory**: 100 requests per minute per user
- **Batch Sync**: 10 requests per minute per user
- **General**: 100 requests per minute per user

Rate limit headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
Retry-After: 30
```

---

## Endpoints

### Authentication

#### `POST /api/auth/signup`
Create new account and restaurant.

**Rate Limit**: 5 per 15 minutes per IP

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+250788123456",
  "restaurantName": "Nyama Cafe",
  "city": "Kigali",
  "planCode": "STARTER"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "cuid123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "restaurant": {
    "id": "cuid456",
    "name": "Nyama Cafe"
  }
}
```

#### `POST /api/auth/[...nextauth]`
NextAuth authentication endpoint. Use NextAuth client for login.

---

### Sales

#### `GET /api/sales`
List sales with pagination and filters.

**Rate Limit**: 100 per minute

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `restaurantId` (string, optional) - Filter by restaurant
- `startDate` (ISO date, optional) - Filter from date
- `endDate` (ISO date, optional) - Filter to date
- `paymentMethod` (string, optional) - CASH | MTN_MONEY | AIRTEL_MONEY | PESAPAL
- `paymentStatus` (string, optional) - PENDING | COMPLETED | FAILED | REFUNDED

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid123",
      "orderNumber": "ORD-1234567890",
      "totalAmountCents": 15000,
      "paymentMethod": "CASH",
      "paymentStatus": "COMPLETED",
      "items": [...],
      "createdAt": "2026-02-10T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `POST /api/sales`
Create a new sale.

**Request**:
```json
{
  "restaurantId": "cuid456",
  "items": [
    {
      "menuItemId": "cuid789",
      "quantity": 2,
      "unitPriceCents": 5000
    }
  ],
  "paymentMethod": "CASH",
  "notes": "Table 5"
}
```

**Response** (201):
```json
{
  "sale": {
    "id": "cuid123",
    "orderNumber": "ORD-1234567890",
    "totalAmountCents": 10000,
    "items": [...]
  },
  "ebm": {
    "receipt": {...},
    "text": "...",
    "json": {...}
  }
}
```

---

### Inventory

#### `GET /api/inventory`
List inventory items with pagination.

**Rate Limit**: 100 per minute

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid123",
      "name": "Tomatoes",
      "unit": "kg",
      "currentStock": 50.5,
      "minStockLevel": 10,
      "costCents": 800,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `POST /api/inventory`
Create inventory item.

**Request**:
```json
{
  "name": "Tomatoes",
  "unit": "kg",
  "currentStock": 50,
  "minStockLevel": 10,
  "costCents": 800
}
```

---

### Offline Sync

#### `POST /api/sync/batch`
Batch sync offline data.

**Rate Limit**: 10 per minute

**Request**:
```json
{
  "items": [
    {
      "id": "SALE-123",
      "type": "SALE",
      "payload": {
        "restaurantId": "cuid456",
        "items": [...],
        "paymentMethod": "CASH"
      },
      "timestamp": 1707577200000
    }
  ]
}
```

**Response** (200):
```json
{
  "success": ["SALE-123"],
  "failed": []
}
```

**Limits**:
- Maximum 100 items per batch
- Items processed sequentially
- Failed items returned with error details

---

### AI Features

#### `GET /api/ai/reorder`
Get smart reorder suggestions.

**Query Parameters**:
- `restaurantId` (string, optional) - Inferred from session if not provided
- `supplierId` (string, optional)
- `limit` (number, default: 10)

**Response** (200):
```json
{
  "suggestions": [
    {
      "inventoryItemId": "cuid123",
      "name": "Tomatoes",
      "currentStock": 5,
      "suggestedQty": 20,
      "demandPerDay": 3.5,
      "leadTimeDays": 2,
      "explanation": {...}
    }
  ]
}
```

#### `POST /api/ai/reorder`
Log reorder decision (accept/dismiss).

**Request**:
```json
{
  "inventoryItemId": "cuid123",
  "suggestedQty": 20,
  "action": "ACCEPTED",
  "explanation": {...}
}
```

#### `GET /api/ai/cost-anomalies`
Get cost anomaly alerts.

**Response** (200):
```json
{
  "alerts": [
    {
      "id": "cuid123",
      "productName": "Tomatoes",
      "observedUnitPriceCents": 1200,
      "trailingAvgUnitPriceCents": 800,
      "deltaPercent": 50,
      "severity": "HIGH",
      "status": "OPEN"
    }
  ]
}
```

#### `POST /api/ai/cost-anomalies`
Update alert status.

**Request**:
```json
{
  "alertId": "cuid123",
  "status": "ACKNOWLEDGED"
}
```

---

### Reports

#### `GET /api/reports/daily`
Get daily report.

**Query Parameters**:
- `date` (ISO date, optional) - Defaults to today
- `restaurantId` (string, optional)

**Response** (200):
```json
{
  "date": "2026-02-10",
  "totalSalesCents": 500000,
  "totalCostCents": 200000,
  "profitCents": 300000,
  "profitMargin": 60,
  "salesCount": 45,
  "topItems": [...]
}
```

#### `GET /api/reports/weekly`
Get weekly report.

**Query Parameters**:
- `startDate` (ISO date, required)

#### `GET /api/reports/monthly`
Get monthly report.

**Query Parameters**:
- `year` (number, required)
- `month` (number, required)

---

### Marketplace

#### `GET /api/marketplace/products`
List marketplace products.

**Query Parameters**:
- `supplierId` (string, optional)
- `category` (string, optional)
- `search` (string, optional)

#### `POST /api/marketplace/orders`
Create marketplace order.

**Request**:
```json
{
  "items": [
    {
      "productId": "cuid123",
      "quantity": 10
    }
  ],
  "deliveryAddress": "KG 123 St, Kigali",
  "paymentMethod": "MTN_MONEY"
}
```

---

### Admin

#### `GET /api/admin/overview`
Get platform overview (admin only).

**Response** (200):
```json
{
  "totalRestaurants": 150,
  "activeRestaurants": 142,
  "totalRevenueCents": 50000000,
  "monthlyGrowth": 15.5
}
```

#### `GET /api/admin/restaurants`
List all restaurants (admin only).

#### `GET /api/admin/subscriptions`
List all subscriptions (admin only).

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed: email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 30
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Pagination

All list endpoints support pagination via query parameters:

**Request**:
```
GET /api/sales?page=2&limit=50
```

**Response Structure**:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  }
}
```

**Defaults**:
- `page`: 1
- `limit`: 20
- `max limit`: 100

---

## Offline Sync

### How It Works

1. **Offline**: Actions queued in IndexedDB
2. **Online**: Automatic sync via `/api/sync/batch`
3. **Conflicts**: Last-write-wins strategy

### Supported Types
- `SALE` - Sales transactions
- `INVENTORY` - Inventory updates
- `PAYMENT` - Payment records
- `SLIP` - Smart Dining Slips
- `CONSENT` - Customer consent records

### Batch Sync Flow

```
Client (IndexedDB) → POST /api/sync/batch → Server (PostgreSQL)
                           ↓
                    { success: [...], failed: [...] }
                           ↓
                    Remove success, retry failed
```

---

## Webhooks (Future)

### Planned Webhooks
- `payment.completed` - Payment successful
- `order.delivered` - Marketplace order delivered
- `subscription.renewed` - Subscription renewed
- `alert.triggered` - Cost anomaly detected

---

## Versioning

**Current Version**: v1 (no prefix)

**Future**: `/api/v2/...` for breaking changes

---

## Best Practices

### 1. Use Pagination
Always use `limit` parameter to avoid large responses:
```
GET /api/sales?limit=20
```

### 2. Handle Rate Limits
Check `X-RateLimit-Remaining` header and implement exponential backoff:
```javascript
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get('Retry-After'))
  await sleep(retryAfter * 1000)
  // Retry request
}
```

### 3. Offline Support
Use batch sync for efficiency:
```javascript
// Queue multiple items
await outboxService.add('SALE', sale1)
await outboxService.add('SALE', sale2)

// Sync all at once
await fetch('/api/sync/batch', {
  method: 'POST',
  body: JSON.stringify({ items: [...] })
})
```

### 4. Error Handling
Always handle errors gracefully:
```javascript
try {
  const response = await fetch('/api/sales')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  // Queue for offline sync if network error
  if (error.message.includes('Failed to fetch')) {
    await outboxService.add('SALE', saleData)
  }
}
```

---

## Support

- **Email**: api-support@imboni.serve
- **Docs**: https://docs.imboni.serve
- **Status**: https://status.imboni.serve

---

**Last Updated**: February 10, 2026  
**API Version**: 1.0.0
