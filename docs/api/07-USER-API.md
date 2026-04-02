# User APIs

## Get User Profile

**Endpoint:** `GET /api/user/profile`  
**Access:** Protected

### Response (200 OK)
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "bio": "Software Developer",
    "profileImage": "https://s3.amazonaws.com/...",
    "salary": 50000,
    "currency": "INR",
    "billingCycleStartDay": 1,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Update Profile

**Endpoint:** `PUT /api/user/profile`  
**Access:** Protected

### Request Body
```json
{
  "name": "John Updated",
  "phone": "+91-9876543210",
  "bio": "Senior Developer",
  "salary": 60000
}
```

### Response (200 OK)
```json
{
  "user": {
    "id": "user123",
    "name": "John Updated",
    "salary": 60000
  }
}
```

---

## Upload Profile Image

**Endpoint:** `POST /api/user/profile/upload`  
**Access:** Protected  
**Content-Type:** multipart/form-data

### Request Body
```
file: <image file>
```

### Response (200 OK)
```json
{
  "profileImage": "https://s3.amazonaws.com/bucket/user123.jpg"
}
```

---

## Update Billing Cycle

**Endpoint:** `PUT /api/user/billing-cycle`  
**Access:** Protected

### Request Body
```json
{
  "billingCycleStartDay": 15
}
```

### Response (200 OK)
```json
{
  "message": "Billing cycle updated",
  "billingCycleStartDay": 15
}
```

---

## Change Password

**Endpoint:** `PUT /api/user/password`  
**Access:** Protected

### Request Body
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### Response (200 OK)
```json
{
  "message": "Password updated successfully"
}
```

---

## Export User Data

**Endpoint:** `GET /api/user/data/export`  
**Access:** Protected

### Response
Returns JSON file with all user data
```json
{
  "user": { ... },
  "expenses": [ ... ],
  "incomes": [ ... ],
  "budgets": [ ... ]
}
```
