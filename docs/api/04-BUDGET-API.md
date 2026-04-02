# Budget APIs

## Get Monthly Budgets

**Endpoint:** `GET /api/monthly-budget`  
**Access:** Protected

### Query Parameters
- `year` (optional) - Filter by year
- `month` (optional) - Filter by month (1-12)

### Request Example
```bash
GET /api/monthly-budget?year=2026&month=4
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "budgets": [
    {
      "id": "budget123",
      "category": "Food",
      "amount": 15000,
      "spent": 8500,
      "month": 4,
      "year": 2026,
      "payableBank": "HDFC",
      "isActive": true,
      "percentage": 56.67,
      "remaining": 6500
    }
  ]
}
```

---

## Create Budget

**Endpoint:** `POST /api/monthly-budget`  
**Access:** Protected

### Request Body
```json
{
  "category": "Food",
  "amount": 15000,
  "month": 4,
  "year": 2026,
  "payableBank": "HDFC"
}
```

### Response (201 Created)
```json
{
  "budget": {
    "id": "budget123",
    "category": "Food",
    "amount": 15000,
    "spent": 0,
    "month": 4,
    "year": 2026
  }
}
```

---

## Update Budget

**Endpoint:** `PUT /api/monthly-budget/[id]`  
**Access:** Protected

### Request Body
```json
{
  "amount": 20000,
  "payableBank": "SBI"
}
```

---

## Budget Analytics

**Endpoint:** `GET /api/monthly-budget/analytics`  
**Access:** Protected

### Query Parameters
- `year` (required)
- `month` (required)

### Response (200 OK)
```json
{
  "totalBudget": 50000,
  "totalSpent": 35000,
  "totalRemaining": 15000,
  "percentage": 70,
  "categories": [
    {
      "category": "Food",
      "budgeted": 15000,
      "spent": 8500,
      "remaining": 6500,
      "percentage": 56.67,
      "status": "good"
    }
  ]
}
```

---

## Export Budget

**Endpoint:** `GET /api/monthly-budget/export`  
**Access:** Protected

### Query Parameters
- `year` (required)
- `month` (required)
- `format` (optional) - pdf or csv (default: pdf)

### Response
Returns PDF or CSV file download
