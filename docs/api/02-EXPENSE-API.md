# Expense APIs

## Get All Expenses

**Endpoint:** `GET /api/expenses`  
**Access:** Protected (requires JWT)

### Query Parameters
- `year` (optional) - Filter by year (e.g., 2026)
- `month` (optional) - Filter by month (1-12)
- `category` (optional) - Filter by category name

### Request Example
```bash
GET /api/expenses?year=2026&month=4&category=Food
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "expenses": [
    {
      "id": "clx123abc",
      "userId": "user123",
      "date": "2026-04-01T00:00:00.000Z",
      "title": "Grocery Shopping",
      "amount": 5000,
      "category": "Food",
      "bank": "HDFC",
      "paymentMode": "UPI",
      "tags": ["grocery", "weekly"],
      "notes": "Weekly grocery shopping",
      "receiptUrl": null,
      "isRecurring": false,
      "createdAt": "2026-04-01T10:30:00.000Z"
    }
  ]
}
```

---

## Create Expense

**Endpoint:** `POST /api/expenses`  
**Access:** Protected

### Request Body
```json
{
  "title": "Grocery Shopping",
  "amount": 5000,
  "category": "Food",
  "bank": "HDFC",
  "paymentMode": "UPI",
  "date": "2026-04-01",
  "tags": ["grocery", "weekly"],
  "notes": "Weekly grocery shopping"
}
```

### Response (201 Created)
```json
{
  "expense": {
    "id": "clx123abc",
    "title": "Grocery Shopping",
    "amount": 5000,
    "category": "Food",
    "date": "2026-04-01T00:00:00.000Z"
  }
}
```

---

## Update Expense

**Endpoint:** `PUT /api/expenses/[id]`  
**Access:** Protected

### Request Body
```json
{
  "title": "Updated Title",
  "amount": 6000
}
```

### Response (200 OK)
```json
{
  "expense": {
    "id": "clx123abc",
    "title": "Updated Title",
    "amount": 6000
  }
}
```

---

## Delete Expense

**Endpoint:** `DELETE /api/expenses/[id]`  
**Access:** Protected

### Response (200 OK)
```json
{
  "message": "Expense deleted successfully"
}
```
