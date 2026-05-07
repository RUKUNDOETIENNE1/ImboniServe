# 🔌 Imboni Serve - API Documentation

**Version:** 3.0  
**Base URL:** `https://imboniserve.com/api`  
**Authentication:** Session-based (NextAuth.js)

---

## 📋 **Table of Contents**

1. [Authentication](#authentication)
2. [CRM Endpoints](#crm-endpoints)
3. [Staff Performance](#staff-performance)
4. [Reservations](#reservations)
5. [Inventory Alerts](#inventory-alerts)
6. [A/B Testing](#ab-testing)
7. [Campaigns](#campaigns)
8. [Currency](#currency)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## 🔐 **Authentication**

All API endpoints require authentication via session cookies.

### **Login**

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER"
  },
  "session": {
    "expires": "2026-05-21T12:00:00.000Z"
  }
}
```

### **Logout**

```http
POST /api/auth/signout
```

**Response:**
```json
{
  "success": true
}
```

---

## 👥 **CRM Endpoints**

### **Get All Customers**

```http
GET /api/crm/customers
```

**Query Parameters:**
- `segment` (optional): Filter by segment (Champions, Loyal, etc.)
- `search` (optional): Search by name, phone, or email
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "customers": [
    {
      "id": "cust_123",
      "name": "John Doe",
      "phone": "+250788123456",
      "email": "john@example.com",
      "segment": "Champions",
      "rfmScore": {
        "recency": 5,
        "frequency": 5,
        "monetary": 5
      },
      "stats": {
        "totalOrders": 25,
        "totalSpent": 750000,
        "avgOrderValue": 30000,
        "lastVisit": "2026-04-20T14:30:00.000Z"
      }
    }
  ],
  "total": 150,
  "segments": {
    "Champions": 20,
    "Loyal": 45,
    "New": 30,
    "At Risk": 25,
    "Lost": 15,
    "Promising": 15
  }
}
```

### **Get Customer by ID**

```http
GET /api/crm/customers/:id
```

**Response:**
```json
{
  "customer": {
    "id": "cust_123",
    "name": "John Doe",
    "phone": "+250788123456",
    "email": "john@example.com",
    "segment": "Champions",
    "rfmScore": {
      "recency": 5,
      "frequency": 5,
      "monetary": 5
    },
    "orders": [
      {
        "id": "order_456",
        "date": "2026-04-20T14:30:00.000Z",
        "total": 45000,
        "items": 3
      }
    ],
    "lifetimeValue": 750000,
    "retentionRate": 0.92
  }
}
```

---

## 🏅 **Staff Performance**

### **Get Performance Metrics**

```http
GET /api/staff/performance
```

**Query Parameters:**
- `period`: `today` | `week` | `month`
- `staffId` (optional): Filter by staff member

**Response:**
```json
{
  "staff": [
    {
      "id": "staff_123",
      "name": "Alice Johnson",
      "role": "WAITER",
      "score": 95,
      "badge": "Gold",
      "rank": 1,
      "metrics": {
        "ordersServed": 52,
        "avgServiceTime": 120,
        "customerRating": 4.9,
        "tips": 65000
      },
      "breakdown": {
        "orderScore": 30,
        "speedScore": 28,
        "ratingScore": 24,
        "tipScore": 13
      }
    }
  ],
  "topPerformer": {
    "id": "staff_123",
    "name": "Alice Johnson",
    "score": 95
  },
  "averageScore": 72
}
```

---

## 📅 **Reservations**

### **Create Reservation**

```http
POST /api/reservations
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerPhone": "+250788123456",
  "customerEmail": "john@example.com",
  "partySize": 4,
  "reservationDate": "2026-04-25",
  "reservationTime": "19:00",
  "tableId": "table_1",
  "specialRequests": "Window seat preferred"
}
```

**Response:**
```json
{
  "reservation": {
    "id": "resv_123",
    "confirmationCode": "ABC123",
    "customerName": "John Doe",
    "customerPhone": "+250788123456",
    "partySize": 4,
    "reservationDate": "2026-04-25",
    "reservationTime": "19:00",
    "tableId": "table_1",
    "status": "PENDING",
    "depositAmount": 20000,
    "depositStatus": "PENDING",
    "createdAt": "2026-04-21T10:00:00.000Z"
  },
  "message": "Reservation created. SMS sent to customer."
}
```

### **Get All Reservations**

```http
GET /api/reservations
```

**Query Parameters:**
- `status`: `PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`
- `date`: Filter by date (YYYY-MM-DD)
- `tableId`: Filter by table

**Response:**
```json
{
  "reservations": [
    {
      "id": "resv_123",
      "confirmationCode": "ABC123",
      "customerName": "John Doe",
      "partySize": 4,
      "reservationDate": "2026-04-25",
      "reservationTime": "19:00",
      "status": "CONFIRMED",
      "depositStatus": "PAID"
    }
  ],
  "total": 15
}
```

### **Update Reservation**

```http
PATCH /api/reservations/:id
Content-Type: application/json

{
  "status": "CONFIRMED",
  "depositStatus": "PAID"
}
```

**Response:**
```json
{
  "reservation": {
    "id": "resv_123",
    "status": "CONFIRMED",
    "depositStatus": "PAID",
    "updatedAt": "2026-04-21T10:30:00.000Z"
  }
}
```

### **Cancel Reservation**

```http
DELETE /api/reservations/:id
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "amount": 20000,
    "status": "REFUNDED"
  }
}
```

---

## 📦 **Inventory Alerts**

### **Get Active Alerts**

```http
GET /api/inventory/alerts
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_123",
      "itemId": "item_456",
      "itemName": "Tomatoes",
      "currentStock": 8,
      "threshold": 10,
      "severity": "CRITICAL",
      "daysUntilOut": 1.5,
      "createdAt": "2026-04-21T08:00:00.000Z"
    }
  ],
  "summary": {
    "critical": 3,
    "warning": 7,
    "total": 10
  }
}
```

### **Dismiss Alert**

```http
POST /api/inventory/alerts/:id/dismiss
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": "alert_123",
    "dismissed": true,
    "dismissedAt": "2026-04-21T10:00:00.000Z"
  }
}
```

### **Get/Update Alert Settings**

```http
GET /api/inventory/alert-settings
```

**Response:**
```json
{
  "settings": {
    "criticalThreshold": 10,
    "warningThreshold": 20,
    "emailEnabled": true,
    "whatsappEnabled": true,
    "pushEnabled": true
  }
}
```

```http
POST /api/inventory/alert-settings
Content-Type: application/json

{
  "criticalThreshold": 15,
  "warningThreshold": 25,
  "emailEnabled": true,
  "whatsappEnabled": false,
  "pushEnabled": true
}
```

---

## 🧪 **A/B Testing**

### **Create Test**

```http
POST /api/ab-testing/tests
Content-Type: application/json

{
  "name": "Burger Price Test",
  "itemId": "item_123",
  "variants": [
    {
      "name": "Control",
      "price": 8000,
      "description": "Classic beef burger",
      "image": "/images/burger.jpg"
    },
    {
      "name": "Variant A",
      "price": 7500,
      "description": "Classic beef burger - Special price!",
      "image": "/images/burger.jpg"
    }
  ],
  "trafficSplit": 50,
  "duration": 14
}
```

**Response:**
```json
{
  "test": {
    "id": "test_123",
    "name": "Burger Price Test",
    "status": "ACTIVE",
    "startDate": "2026-04-21T00:00:00.000Z",
    "endDate": "2026-05-05T00:00:00.000Z",
    "variants": [...]
  }
}
```

### **Get Test Results**

```http
GET /api/ab-testing/tests/:id
```

**Response:**
```json
{
  "test": {
    "id": "test_123",
    "name": "Burger Price Test",
    "status": "COMPLETED",
    "variants": [
      {
        "name": "Control",
        "views": 500,
        "orders": 75,
        "conversion": 0.15,
        "revenue": 600000
      },
      {
        "name": "Variant A",
        "views": 500,
        "orders": 95,
        "conversion": 0.19,
        "revenue": 712500
      }
    ],
    "winner": "Variant A",
    "improvement": "26.7%"
  }
}
```

### **Apply Winner**

```http
POST /api/ab-testing/tests/:id/winner
Content-Type: application/json

{
  "variantId": "variant_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Winner applied to menu"
}
```

---

## 📱 **Campaigns**

### **Create Campaign**

```http
POST /api/campaigns
Content-Type: application/json

{
  "name": "Weekend Special",
  "segment": "Champions",
  "message": "Hi {name}! Enjoy 20% OFF this weekend. Show this message.",
  "scheduledFor": "2026-04-26T10:00:00.000Z"
}
```

**Response:**
```json
{
  "campaign": {
    "id": "camp_123",
    "name": "Weekend Special",
    "segment": "Champions",
    "status": "SCHEDULED",
    "recipients": 20,
    "scheduledFor": "2026-04-26T10:00:00.000Z"
  }
}
```

### **Get Campaign Stats**

```http
GET /api/campaigns/:id
```

**Response:**
```json
{
  "campaign": {
    "id": "camp_123",
    "name": "Weekend Special",
    "status": "SENT",
    "metrics": {
      "sent": 20,
      "delivered": 19,
      "read": 15,
      "clicked": 8,
      "converted": 5
    },
    "roi": {
      "cost": 1000,
      "revenue": 75000,
      "roi": 7400
    }
  }
}
```

---

## 💱 **Currency**

### **Get Exchange Rates**

```http
GET /api/currency/rates
```

**Response:**
```json
{
  "rates": {
    "RWF": 1,
    "USD": 0.001,
    "EUR": 0.0009
  },
  "lastUpdated": "2026-04-21T00:00:00.000Z"
}
```

### **Set Default Currency**

```http
POST /api/currency/default
Content-Type: application/json

{
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "defaultCurrency": "USD"
}
```

---

## ⚠️ **Error Handling**

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "customerPhone",
      "expected": "+250XXXXXXXXX"
    }
  }
}
```

### **Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 🚦 **Rate Limiting**

- **Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1619000000

**When exceeded:**
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## 📝 **Best Practices**

1. **Always check authentication** before making requests
2. **Handle errors gracefully** with try-catch
3. **Respect rate limits** - implement exponential backoff
4. **Use pagination** for large datasets
5. **Cache responses** when appropriate
6. **Validate input** on client-side before sending

---

## 🔗 **SDKs & Libraries**

### **JavaScript/TypeScript**

```typescript
import { ImboniClient } from '@imboni/sdk'

const client = new ImboniClient({
  apiKey: process.env.IMBONI_API_KEY
})

// Get customers
const customers = await client.crm.getCustomers({
  segment: 'Champions'
})

// Create reservation
const reservation = await client.reservations.create({
  customerName: 'John Doe',
  partySize: 4,
  date: '2026-04-25',
  time: '19:00'
})
```

---

**Need help?** Contact: api@imboniserve.com
