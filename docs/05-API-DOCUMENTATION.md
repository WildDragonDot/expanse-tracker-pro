# API Documentation

## Base URL

- **Development:** `http://localhost:3001`
- **Production:** `https://your-backend.onrender.com`

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "salary": 50000,
  "billingCycleStartDay": 1
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token"
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "token": "jwt_token"
}
```

### Expenses

#### Get All Expenses
```http
GET /api/expenses
Authorization: Bearer <token>
```

**Query Parameters:**
- `year` (optional): Filter by year
- `month` (optional): Filter by month
- `category` (optional): Filter by category

**Response (200):**
```json
{
  "expenses": [
    {
      "id": "expense_id",
      "title": "Grocery",
      "amount": 5000,
      "category": "Food",
      "date": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Grocery",
  "amount": 5000,
  "category": "Food",
  "bank": "HDFC",
  "paymentMode": "UPI",
  "date": "2026-04-01",
  "notes": "Weekly grocery shopping"
}
```
