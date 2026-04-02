# Frontend Guide

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components
- **Animation:** Framer Motion
- **Charts:** Recharts
- **PDF Generation:** jsPDF

## Project Structure

```
frontend/src/
├── app/              # App router pages
│   ├── (auth)/      # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   └── layout.tsx   # Root layout
├── components/       # React components
│   ├── ui/          # UI components
│   └── features/    # Feature components
├── lib/             # Utilities
│   ├── api.ts       # API client
│   └── utils.ts     # Helper functions
└── types/           # TypeScript types
```

## Key Concepts

### 1. App Router
Next.js 14 uses file-based routing with app directory.

**Example:**
```
app/
├── page.tsx          # / route
├── dashboard/
│   └── page.tsx      # /dashboard route
└── expenses/
    └── [id]/
        └── page.tsx  # /expenses/:id route
```

### 2. API Client
All API calls go through `lib/api.ts`:

```typescript
import { apiFetch } from '@/lib/api'

// GET request
const expenses = await apiFetch('/api/expenses')

// POST request
const result = await apiFetch('/api/expenses', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### 3. Authentication
JWT token stored in localStorage:

```typescript
// Login
const { token } = await login(email, password)
localStorage.setItem('token', token)

// Logout
localStorage.removeItem('token')
```

### 4. State Management
Using React hooks for state:

```typescript
const [expenses, setExpenses] = useState([])
const [loading, setLoading] = useState(false)
```

## Component Guidelines

### Creating New Components

```typescript
// components/ExpenseCard.tsx
interface ExpenseCardProps {
  expense: Expense
  onDelete: (id: string) => void
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  return (
    <div className="card">
      <h3>{expense.title}</h3>
      <p>{expense.amount}</p>
      <button onClick={() => onDelete(expense.id)}>Delete</button>
    </div>
  )
}
```

### Styling with Tailwind

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-800">Title</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click
  </button>
</div>
```
