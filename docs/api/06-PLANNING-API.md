# Planning APIs

## Get Planning Categories

**Endpoint:** `GET /api/planning-categories`  
**Access:** Protected

### Response (200 OK)
```json
{
  "categories": [
    {
      "id": "plan123",
      "name": "Diwali 2026",
      "icon": "🪔",
      "color": "from-orange-500 to-red-600",
      "type": "festival",
      "expectedCost": 50000,
      "realCost": 35000,
      "startDate": "2026-10-20T00:00:00.000Z",
      "endDate": "2026-10-25T00:00:00.000Z",
      "expiryDate": "2026-10-30T00:00:00.000Z",
      "isActive": true,
      "expenses": [
        {
          "id": "planexp123",
          "title": "Decorations",
          "amount": 5000,
          "date": "2026-10-20",
          "isCompleted": true,
          "actualAmount": 4500
        }
      ]
    }
  ]
}
```

---

## Create Planning Category

**Endpoint:** `POST /api/planning-categories`  
**Access:** Protected

### Request Body
```json
{
  "name": "Diwali 2026",
  "icon": "🪔",
  "color": "from-orange-500 to-red-600",
  "type": "festival",
  "expectedCost": 50000,
  "startDate": "2026-10-20",
  "endDate": "2026-10-25",
  "expiryDate": "2026-10-30"
}
```

### Response (201 Created)
```json
{
  "category": {
    "id": "plan123",
    "name": "Diwali 2026",
    "expectedCost": 50000,
    "type": "festival"
  }
}
```

---

## Get Planning Expenses

**Endpoint:** `GET /api/expense-planning`  
**Access:** Protected

### Query Parameters
- `categoryId` (optional) - Filter by category

### Response (200 OK)
```json
{
  "expenses": [
    {
      "id": "planexp123",
      "categoryId": "plan123",
      "title": "Decorations",
      "amount": 5000,
      "date": "2026-10-20",
      "description": "Lights and decorations",
      "isCompleted": true,
      "actualAmount": 4500
    }
  ]
}
```

---

## Create Planning Expense

**Endpoint:** `POST /api/expense-planning`  
**Access:** Protected

### Request Body
```json
{
  "categoryId": "plan123",
  "title": "Decorations",
  "amount": 5000,
  "date": "2026-10-20",
  "description": "Lights and decorations"
}
```
