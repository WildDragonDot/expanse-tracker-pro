# Utility APIs

## Health Check

**Endpoint:** `GET /api/health`  
**Access:** Public

### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-04-02T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

---

## AI Chat Query

**Endpoint:** `POST /api/chat/query`  
**Access:** Protected

### Request Body
```json
{
  "message": "How much did I spend on food last month?"
}
```

### Response (200 OK)
```json
{
  "response": "You spent ₹8,500 on food last month, which is 15% less than the previous month.",
  "data": {
    "amount": 8500,
    "category": "Food",
    "month": 3,
    "year": 2026
  }
}
```

---

## Intelligent Chat

**Endpoint:** `POST /api/chat/intelligent`  
**Access:** Protected

### Request Body
```json
{
  "message": "Give me spending insights for this month",
  "context": {
    "year": 2026,
    "month": 4
  }
}
```

### Response (200 OK)
```json
{
  "response": "Based on your spending patterns...",
  "insights": [
    "Food expenses are 20% higher than average",
    "You're on track to save 30% this month"
  ],
  "recommendations": [
    "Consider meal planning to reduce food costs",
    "Increase emergency fund by ₹5,000"
  ]
}
```

---

## Detect Subscriptions

**Endpoint:** `POST /api/subscriptions/detect`  
**Access:** Protected

### Response (200 OK)
```json
{
  "subscriptions": [
    {
      "name": "Netflix",
      "amount": 649,
      "interval": "monthly",
      "nextDueDate": "2026-05-01",
      "detectedFrom": [
        {
          "expenseId": "exp123",
          "date": "2026-04-01"
        }
      ]
    }
  ]
}
```

---

## Category Expiry Check

**Endpoint:** `GET /api/category-expiry-check`  
**Access:** Protected

### Response (200 OK)
```json
{
  "expiring": [
    {
      "id": "cat123",
      "name": "Diwali Shopping",
      "expiryDate": "2026-04-10",
      "daysRemaining": 8,
      "expectedCost": 10000,
      "realCost": 7500
    }
  ]
}
```

---

## Export Category

**Endpoint:** `POST /api/category-export/email`  
**Access:** Protected

### Request Body
```json
{
  "categoryId": "cat123",
  "email": "john@example.com",
  "format": "pdf"
}
```

### Response (200 OK)
```json
{
  "message": "Category exported and sent to john@example.com"
}
```
