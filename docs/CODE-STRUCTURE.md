# Code Structure Documentation (Hindi)

## Backend Structure

### Core Files

#### 1. `backend/src/lib/database.ts`
**Purpose:** Database operations ka main hub

**Functions:**
- `createUser()` - Naya user register karta hai
- `authenticateUser()` - Login handle karta hai
- `createExpense()` - Expense add karta hai
- `getExpenses()` - Expenses fetch karta hai
- `createIncome()` - Income add karta hai
- `detectSubscriptions()` - Recurring expenses detect karta hai

**Used By:** Sabhi API routes

#### 2. `backend/src/lib/auth.ts`
**Purpose:** JWT authentication middleware

**Functions:**
- `withAuth()` - API routes ko protect karta hai
- Token verify karta hai
- User ID extract karta hai

**Used By:** Protected API routes

#### 3. `backend/src/lib/email.ts`
**Purpose:** Email notifications bhejta hai

**Functions:**
- `sendEmail()` - Email send karta hai
- `emailTemplates` - Different email templates

**Used By:**
- Registration (welcome email)
- Password reset
- Budget warnings
- Monthly reports

#### 4. `backend/src/middleware.ts`
**Purpose:** Request security aur CORS

**Features:**
- CORS headers set karta hai
- Rate limiting
- Security headers
- IP blocking

**Used By:** Har incoming request

### API Routes Structure

```
/api/
├── auth/
│   ├── register/     # User registration
│   ├── login/        # User login
│   └── forgot-password/  # Password reset
│
├── expenses/
│   ├── GET           # List expenses
│   ├── POST          # Create expense
│   └── [id]/
│       ├── PUT       # Update expense
│       └── DELETE    # Delete expense
│
├── incomes/          # Income management
├── monthly-budget/   # Budget management
├── shopping-categories/  # Shopping lists
├── planning-categories/  # Event planning
├── user/
│   ├── profile/      # User profile
│   ├── password/     # Password change
│   └── billing-cycle/  # Billing settings
│
└── analytics/
    └── summary/      # Financial summary
```

## Frontend Structure

### Core Files

#### 1. `frontend/src/lib/apiFetch.ts`
**Purpose:** API calls ka wrapper

**Functions:**
- `getApiUrl()` - Backend URL construct karta hai
- `apiFetch()` - Fetch wrapper with auth

**Used By:** Sabhi components jo API call karte hain

#### 2. `frontend/src/lib/api.ts`
**Purpose:** API helper functions

**Functions:**
- `login()` - Login API call
- `register()` - Registration API call
- `fetchExpenses()` - Expenses fetch karta hai

**Used By:** Pages aur components

### Component Structure

```
/components/
├── ui/               # Basic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
│
├── features/         # Feature-specific components
│   ├── ExpenseList.tsx
│   ├── BudgetCard.tsx
│   └── ShoppingList.tsx
│
└── layout/           # Layout components
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### Pages Structure

```
/app/
├── (auth)/           # Authentication pages
│   ├── login/
│   └── register/
│
├── dashboard/        # Main dashboard
├── expenses/         # Expense management
├── budget/           # Budget planning
├── shopping/         # Shopping lists
└── profile/          # User profile
```

## Data Flow

### 1. User Registration Flow
```
Frontend (Register Page)
  ↓ POST /api/auth/register
Backend (register/route.ts)
  ↓ calls createUser()
Database (database.ts)
  ↓ creates user
  ↓ sends welcome email
  ↓ generates JWT token
  ↓ returns user + token
Frontend
  ↓ stores token in localStorage
  ↓ redirects to dashboard
```

### 2. Expense Creation Flow
```
Frontend (Expense Form)
  ↓ POST /api/expenses
Backend (expenses/route.ts)
  ↓ withAuth() verifies token
  ↓ calls createExpense()
Database (database.ts)
  ↓ saves expense
  ↓ checks budget warnings
  ↓ sends email if needed
  ↓ returns expense
Frontend
  ↓ updates UI
  ↓ shows success message
```

### 3. Budget Warning Flow
```
User adds expense
  ↓
createExpense() called
  ↓
checkBudgetWarnings() runs
  ↓
Calculates monthly total
  ↓
If > 80% of budget
  ↓
Sends warning email
```

## File Dependencies

### Backend Dependencies
```
database.ts
  ├── Uses: Prisma, bcrypt, jwt, email.ts, dateUtils.ts
  └── Used By: All API routes

auth.ts
  ├── Uses: database.ts (verifyToken)
  └── Used By: Protected API routes

middleware.ts
  ├── Uses: None
  └── Used By: All requests (Next.js middleware)

email.ts
  ├── Uses: nodemailer
  └── Used By: database.ts, API routes
```

### Frontend Dependencies
```
apiFetch.ts
  ├── Uses: None
  └── Used By: api.ts, components

api.ts
  ├── Uses: apiFetch.ts
  └── Used By: Pages, components

Components
  ├── Uses: api.ts, apiFetch.ts
  └── Used By: Pages
```

## Environment Variables Flow

### Backend
```
.env → process.env → Used in:
  ├── database.ts (DATABASE_URL, JWT_SECRET)
  ├── email.ts (MAILGUN_*, EMAIL_FROM)
  ├── middleware.ts (CORS_ORIGIN, FRONTEND_URL)
  └── r2Upload.ts (AWS_*)
```

### Frontend
```
.env.local → process.env → Used in:
  └── apiFetch.ts (NEXT_PUBLIC_BACKEND_URL)
```

## Common Patterns

### 1. API Route Pattern
```typescript
// 1. Import dependencies
import { withAuth } from '@/lib/auth'
import { createExpense } from '@/lib/database'

// 2. Force dynamic rendering
export const dynamic = 'force-dynamic'

// 3. Export handler with auth
export const POST = withAuth(async (request, { userId }) => {
  // 4. Parse request
  const data = await request.json()
  
  // 5. Validate
  if (!data.title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }
  
  // 6. Database operation
  const result = await createExpense(userId, data)
  
  // 7. Return response
  return NextResponse.json(result, { status: 201 })
})
```

### 2. Component Pattern
```typescript
// 1. Import dependencies
import { useState, useEffect } from 'react'
import { fetchExpenses } from '@/lib/api'

// 2. Define component
export function ExpenseList() {
  // 3. State
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 4. Effects
  useEffect(() => {
    loadExpenses()
  }, [])
  
  // 5. Handlers
  const loadExpenses = async () => {
    const data = await fetchExpenses()
    setExpenses(data)
    setLoading(false)
  }
  
  // 6. Render
  return (
    <div>
      {loading ? 'Loading...' : expenses.map(exp => ...)}
    </div>
  )
}
```
