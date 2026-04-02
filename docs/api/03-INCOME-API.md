# Income APIs

## Get All Incomes

**Endpoint:** `GET /api/incomes`  
**Access:** Protected

### Query Parameters
- `year` (optional) - Filter by year
- `month` (optional) - Filter by month (1-12)

### Request Example
```bash
GET /api/incomes?year=2026&month=4
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "incomes": [
    {
      "id": "inc123",
      "userId": "user123",
      "date": "2026-04-01T00:00:00.000Z",
      "source": "Salary",
      "amount": 50000,
      "notes": "Monthly salary",
      "createdAt": "2026-04-01T10:00:00.000Z"
    },
    {
      "id": "inc124",
      "source": "Freelance",
      "amount": 15000,
      "date": "2026-04-15T00:00:00.000Z"
    }
  ],
  "total": 65000
}
```

---

## Create Income

**Endpoint:** `POST /api/incomes`  
**Access:** Protected

### Request Body
```json
{
  "source": "Salary",
  "amount": 50000,
  "date": "2026-04-01",
  "notes": "Monthly salary for April"
}
```

### Response (201 Created)
```json
{
  "income": {
    "id": "inc123",
    "source": "Salary",
    "amount": 50000,
    "date": "2026-04-01T00:00:00.000Z"
  }
}
```

---

## Update Income

**Endpoint:** `PUT /api/incomes/[id]`  
**Access:** Protected

### Request Body
```json
{
  "amount": 55000,
  "notes": "Updated salary amount"
}
```

### Response (200 OK)
```json
{
  "income": {
    "id": "inc123",
    "amount": 55000,
    "notes": "Updated salary amount"
  }
}
```

---

## Delete Income

**Endpoint:** `DELETE /api/incomes/[id]`  
**Access:** Protected

### Response (200 OK)
```json
{
  "message": "Income deleted successfully"
}
```
