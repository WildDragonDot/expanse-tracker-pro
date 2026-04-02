# Shopping APIs

## Get Shopping Categories

**Endpoint:** `GET /api/shopping-categories`  
**Access:** Protected

### Response (200 OK)
```json
{
  "categories": [
    {
      "id": "cat123",
      "name": "Weekly Grocery",
      "icon": "🛒",
      "color": "from-blue-500 to-cyan-600",
      "expectedCost": 5000,
      "realCost": 4800,
      "isActive": true,
      "expiryDate": "2026-04-30T00:00:00.000Z",
      "items": [
        {
          "id": "item123",
          "name": "Rice",
          "expectedPrice": 500,
          "actualPrice": 480,
          "quantity": 5,
          "unit": "kg",
          "isBought": true
        }
      ]
    }
  ]
}
```

---

## Create Shopping Category

**Endpoint:** `POST /api/shopping-categories`  
**Access:** Protected

### Request Body
```json
{
  "name": "Weekly Grocery",
  "icon": "🛒",
  "color": "from-blue-500 to-cyan-600",
  "expectedCost": 5000,
  "expiryDate": "2026-04-30"
}
```

### Response (201 Created)
```json
{
  "category": {
    "id": "cat123",
    "name": "Weekly Grocery",
    "expectedCost": 5000,
    "realCost": 0
  }
}
```

---

## Get Shopping Items

**Endpoint:** `GET /api/shopping-items`  
**Access:** Protected

### Query Parameters
- `categoryId` (optional) - Filter by category

### Response (200 OK)
```json
{
  "items": [
    {
      "id": "item123",
      "name": "Rice",
      "expectedPrice": 500,
      "actualPrice": 480,
      "quantity": 5,
      "unit": "kg",
      "isBought": true,
      "categoryId": "cat123",
      "expenseId": "exp123"
    }
  ]
}
```

---

## Create Shopping Item

**Endpoint:** `POST /api/shopping-items`  
**Access:** Protected

### Request Body
```json
{
  "categoryId": "cat123",
  "name": "Rice",
  "expectedPrice": 500,
  "quantity": 5,
  "unit": "kg"
}
```

---

## Mark Item as Bought

**Endpoint:** `PUT /api/shopping-items/[id]`  
**Access:** Protected

### Request Body
```json
{
  "isBought": true,
  "actualPrice": 480
}
```
