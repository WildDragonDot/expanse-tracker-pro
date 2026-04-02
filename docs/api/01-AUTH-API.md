# Authentication APIs

## Register User

**Endpoint:** `POST /api/auth/register`  
**Access:** Public

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "salary": 50000,
  "billingCycleStartDay": 1
}
```

### Response (201 Created)
```json
{
  "user": {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "salary": 50000,
    "currency": "INR",
    "billingCycleStartDay": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Errors
- `400` - Validation error (missing fields, invalid email, weak password)
- `409` - User already exists
- `500` - Server error

---

## Login

**Endpoint:** `POST /api/auth/login`  
**Access:** Public

### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response (200 OK)
```json
{
  "user": {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Errors
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

---

## Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`  
**Access:** Public

### Request Body
```json
{
  "email": "john@example.com"
}
```

### Response (200 OK)
```json
{
  "message": "Password reset email sent"
}
```
