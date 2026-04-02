# Analytics APIs

## Get Financial Summary

**Endpoint:** `GET /api/analytics/summary`  
**Access:** Protected

### Query Parameters
- `year` (optional) - Default: current year
- `month` (optional) - Default: current month

### Request Example
```bash
GET /api/analytics/summary?year=2026&month=4
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "summary": {
    "totalIncome": 50000,
    "totalExpenses": 35000,
    "totalSavings": 15000,
    "savingsPercentage": 30,
    "categoryBreakdown": [
      {
        "category": "Food",
        "amount": 8500,
        "percentage": 24.29,
        "count": 15
      },
      {
        "category": "Transport",
        "amount": 5000,
        "percentage": 14.29,
        "count": 8
      }
    ],
    "dailyAverage": 1166.67,
    "topExpenses": [
      {
        "id": "exp123",
        "title": "Monthly Rent",
        "amount": 15000,
        "date": "2026-04-01"
      }
    ]
  }
}
```

---

## Get Smart Score

**Endpoint:** `GET /api/smart-score/monthly`  
**Access:** Protected

### Query Parameters
- `year` (required)
- `month` (required)

### Response (200 OK)
```json
{
  "score": {
    "score": 75,
    "summary": "Good financial health",
    "metrics": {
      "savingsRate": 30,
      "budgetAdherence": 85,
      "expenseVariability": 15,
      "categoryDiversity": 8
    },
    "recommendations": [
      "Increase savings by 5%",
      "Reduce dining out expenses"
    ]
  }
}
```

---

## Recalculate Smart Score

**Endpoint:** `POST /api/smart-score/recalculate`  
**Access:** Protected

### Request Body
```json
{
  "year": 2026,
  "month": 4
}
```

### Response (200 OK)
```json
{
  "score": 75,
  "message": "Score recalculated successfully"
}
```

---

## Get Monthly Report

**Endpoint:** `GET /api/reports/monthly`  
**Access:** Protected

### Query Parameters
- `year` (required)
- `month` (required)
- `format` (optional) - pdf or json (default: json)

### Response (200 OK)
```json
{
  "report": {
    "period": "April 2026",
    "income": 50000,
    "expenses": 35000,
    "savings": 15000,
    "categories": [ ... ],
    "trends": {
      "vsLastMonth": {
        "income": 5,
        "expenses": -10,
        "savings": 25
      }
    }
  }
}
```

---

## Email Monthly Report

**Endpoint:** `POST /api/reports/email`  
**Access:** Protected

### Request Body
```json
{
  "year": 2026,
  "month": 4,
  "email": "john@example.com"
}
```

### Response (200 OK)
```json
{
  "message": "Report sent to john@example.com"
}
```
