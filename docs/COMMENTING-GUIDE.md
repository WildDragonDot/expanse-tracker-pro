# Code Commenting Guide (Hindi)

## Backend Files Ko Comment Karne Ka Tarika

### 1. File Header Comment
Har file ke top pe yeh information honi chahiye:

```typescript
/**
 * File Ka Naam Aur Purpose
 * 
 * Yeh file kya karta hai - ek line mein
 * 
 * Main Features:
 * - Feature 1
 * - Feature 2
 * 
 * Dependencies:
 * - Package 1: Kya kaam aata hai
 * - Package 2: Kya kaam aata hai
 * 
 * Used By:
 * - Kaun si files use karti hain
 * - Kaun se API routes use karte hain
 */
```

### 2. Function Comments
Har function ke upar:

```typescript
/**
 * Function Kya Karta Hai - Short Description
 * 
 * Process (agar complex hai):
 * 1. Pehla step
 * 2. Doosra step
 * 3. Teesra step
 * 
 * @param paramName - Parameter ka description
 * @returns Kya return hota hai
 * @throws Error conditions
 * 
 * Used By:
 * - Kaun use karta hai
 * 
 * Example:
 * const result = await functionName(param1, param2)
 */
```

### 3. Inline Comments
Complex logic ke liye:

```typescript
// Check: Condition kya hai
if (condition) {
  // Action: Kya kar rahe hain
  doSomething()
}

// Loop: Kya iterate kar rahe hain
for (const item of items) {
  // Process: Har item ke saath kya kar rahe hain
  processItem(item)
}
```

### 4. Section Comments
File ke different sections ke liye:

```typescript
// ============================================
// SECTION NAME (e.g., USER SERVICES)
// ============================================
```

## Frontend Files Ko Comment Karne Ka Tarika

### 1. Component Header
```typescript
/**
 * Component Ka Naam
 * 
 * Yeh component kya dikhata hai
 * 
 * Props:
 * - prop1: Description
 * - prop2: Description
 * 
 * State:
 * - state1: Kya track karta hai
 * 
 * Used In:
 * - Parent component ka naam
 * 
 * Connects To:
 * - Kaun se APIs call hoti hain
 */
```

### 2. Hook Comments
```typescript
// State: Kya store kar rahe hain
const [data, setData] = useState([])

// Effect: Kab run hota hai aur kya karta hai
useEffect(() => {
  // API call karke data fetch karte hain
  fetchData()
}, [dependency])
```

### 3. Event Handler Comments
```typescript
/**
 * Button Click Handler
 * 
 * Kya hota hai jab user click karta hai:
 * 1. Validation
 * 2. API call
 * 3. State update
 */
const handleClick = async () => {
  // Implementation
}
```

## Example: Fully Commented File

```typescript
/**
 * Expense Management Service
 * 
 * Yeh file expense CRUD operations handle karti hai
 * 
 * Main Features:
 * - Expense create, read, update, delete
 * - Budget warnings
 * - Category-wise filtering
 * 
 * Dependencies:
 * - Prisma: Database operations
 * - dateUtils: Date parsing
 * 
 * Used By:
 * - /api/expenses routes
 * - Analytics service
 */

import { prisma } from './database'
import { parseDate } from './dateUtils'

// ============================================
// EXPENSE CRUD OPERATIONS
// ============================================

/**
 * Naya Expense Create Karta Hai
 * 
 * Process:
 * 1. Date ko parse karta hai
 * 2. Database mein save karta hai
 * 3. Budget check karta hai
 * 
 * @param userId - User ka ID
 * @param data - Expense details
 * @returns Created expense object
 * 
 * Used By:
 * - POST /api/expenses
 */
export async function createExpense(userId: string, data: ExpenseData) {
  // Date ko proper format mein convert karte hain
  const parsedDate = parseDate(data.date)
  
  // Database mein expense save karte hain
  const expense = await prisma.expense.create({
    data: {
      userId,
      date: parsedDate,
      ...data
    }
  })
  
  // Budget warning check karte hain
  await checkBudget(userId, data.category, data.amount)
  
  return expense
}
```

## Important Points

1. **Hindi Mein Likho:** Comments Hindi mein honi chahiye
2. **Clear Raho:** Simple language use karo
3. **Purpose Batao:** Kya kar rahe ho, kyun kar rahe ho
4. **Dependencies Mention Karo:** Kaun si files/functions use ho rahi hain
5. **Examples Do:** Jahan zaroorat ho, example code do
6. **Update Karo:** Code change hone pe comments bhi update karo
