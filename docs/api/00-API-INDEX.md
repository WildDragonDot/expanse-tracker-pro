# Complete API Reference

## Base URL
- **Development:** `http://localhost:3001`
- **Production:** `https://your-backend.onrender.com`

## Authentication
All protected endpoints require JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## API Categories

1. [Authentication APIs](./01-AUTH-API.md)
   - Register, Login, Password Reset

2. [Expense APIs](./02-EXPENSE-API.md)
   - CRUD operations for expenses

3. [Income APIs](./03-INCOME-API.md)
   - CRUD operations for income

4. [Budget APIs](./04-BUDGET-API.md)
   - Monthly budget management

5. [Shopping APIs](./05-SHOPPING-API.md)
   - Shopping lists and categories

6. [Planning APIs](./06-PLANNING-API.md)
   - Expense planning for events

7. [User APIs](./07-USER-API.md)
   - User profile and settings

8. [Analytics APIs](./08-ANALYTICS-API.md)
   - Financial analytics and reports

9. [Utility APIs](./09-UTILITY-API.md)
   - Health check, chat, etc.

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error
