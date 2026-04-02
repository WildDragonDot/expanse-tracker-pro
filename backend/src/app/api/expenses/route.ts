/**
 * Expenses API Route
 * 
 * Yeh file expense management ke liye GET aur POST endpoints provide karti hai
 * 
 * Endpoints:
 * - GET /api/expenses - Sabhi expenses fetch karta hai (with filters)
 * - POST /api/expenses - Naya expense create karta hai
 * 
 * Features:
 * - Category-wise filtering
 * - Date range filtering
 * - Pagination support
 * - Expense notifications
 * - Budget warnings
 * 
 * Dependencies:
 * - database.ts: createExpense, getExpenses functions
 * - auth.ts: withAuth middleware for protection
 * - notifications.ts: sendExpenseAlert for notifications
 * 
 * Used By:
 * - Frontend expense list page
 * - Frontend expense form
 * - Mobile app
 * - Analytics dashboard
 * 
 * Authentication:
 * - Dono endpoints protected hain (JWT token required)
 * - User sirf apne expenses access kar sakta hai
 */

import { NextRequest, NextResponse } from 'next/server'
import { createExpense, getExpenses } from '@/lib/database'
import { withAuth } from '@/lib/auth'
import { sendExpenseAlert } from '@/lib/notifications'

// Force dynamic rendering - authentication required hai
// Yeh setting ensure karti hai ki response cache nahi hoga
export const dynamic = 'force-dynamic'

/**
 * GET /api/expenses
 * 
 * User Ke Sabhi Expenses Fetch Karta Hai
 * 
 * Query Parameters:
 * - category (optional): Category se filter karo (e.g., "Food", "Transport")
 * - dateFrom (optional): Start date (YYYY-MM-DD format)
 * - dateTo (optional): End date (YYYY-MM-DD format)
 * - limit (optional): Kitne expenses return karne hain (default: 100)
 * - offset (optional): Pagination ke liye offset (default: 0)
 * 
 * Process:
 * 1. withAuth middleware se userId milta hai
 * 2. Query parameters se filters extract karte hain
 * 3. Database se expenses fetch karte hain
 * 4. Filtered results return karte hain
 * 
 * Response (200 OK):
 * [
 *   {
 *     id: "exp123",
 *     title: "Grocery",
 *     amount: 5000,
 *     category: "Food",
 *     date: "2026-04-01",
 *     ...
 *   }
 * ]
 * 
 * Errors:
 * - 401: Unauthorized (token missing/invalid)
 * - 500: Server error
 * 
 * Example Usage:
 * GET /api/expenses?category=Food&dateFrom=2026-04-01&limit=10
 * Authorization: Bearer <token>
 */
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // URL se query parameters extract karte hain
    const { searchParams } = new URL(request.url)
    
    // Filters object banate hain
    const filters = {
      category: searchParams.get('category') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    // Database se expenses fetch karte hain (user ID aur filters ke saath)
    const expenses = await getExpenses(userId, filters)
    
    // Success response return karte hain
    return NextResponse.json(expenses)
  } catch (error: any) {
    // Error log karte hain debugging ke liye
    console.error('Get expenses error:', error)
    
    // Error response return karte hain
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/expenses
 * 
 * Naya Expense Create Karta Hai
 * 
 * Request Body:
 * {
 *   date: "2026-04-01",           // Required: Expense date
 *   title: "Grocery Shopping",    // Required: Expense title
 *   amount: 5000,                 // Required: Amount (positive number)
 *   category: "Food",             // Required: Category name
 *   bank: "HDFC",                 // Required: Bank/payment source
 *   paymentMode: "UPI",           // Required: Payment method
 *   tags: ["grocery", "weekly"],  // Optional: Tags array
 *   notes: "Weekly shopping"      // Optional: Additional notes
 * }
 * 
 * Process:
 * 1. Request body parse karte hain
 * 2. Required fields validate karte hain
 * 3. Amount validate karta hai (positive number)
 * 4. Tags array ensure karta hai
 * 5. Database mein expense save karta hai
 * 6. Notification bhejta hai (optional)
 * 7. Created expense return karta hai
 * 
 * Validations:
 * - Sabhi required fields present honi chahiye
 * - Amount positive number hona chahiye
 * - Tags array format mein hone chahiye
 * 
 * Side Effects:
 * - Budget warning check hota hai (database.ts mein)
 * - Expense notification bhejta hai (agar enabled hai)
 * - Monthly budget spent amount update hota hai
 * 
 * Response (201 Created):
 * {
 *   id: "exp123",
 *   userId: "user123",
 *   title: "Grocery Shopping",
 *   amount: 5000,
 *   category: "Food",
 *   date: "2026-04-01T00:00:00.000Z",
 *   ...
 * }
 * 
 * Errors:
 * - 400: Validation error (missing fields, invalid amount)
 * - 401: Unauthorized
 * - 500: Server error
 * 
 * Example Usage:
 * POST /api/expenses
 * Authorization: Bearer <token>
 * Content-Type: application/json
 * 
 * {
 *   "date": "2026-04-01",
 *   "title": "Grocery",
 *   "amount": 5000,
 *   "category": "Food",
 *   "bank": "HDFC",
 *   "paymentMode": "UPI",
 *   "tags": ["grocery"]
 * }
 */
export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // Request body ko parse karte hain
    const data = await request.json()
    
    // Validate: Sabhi required fields present hain ya nahi
    const requiredFields = ['date', 'title', 'amount', 'category', 'bank', 'paymentMode']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate: Amount positive number hona chahiye
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Ensure: Tags array format mein ho (agar missing hai to empty array)
    if (!Array.isArray(data.tags)) {
      data.tags = []
    }

    // Database mein expense create karte hain
    // Note: createExpense function budget warnings bhi check karta hai
    const expense = await createExpense(userId, data)
    
    // Notification bhejte hain (agar user ne enable kiya hai)
    // Note: Agar notification fail ho to request fail nahi hogi
    try {
      await sendExpenseAlert(userId, {
        title: data.title,
        amount: data.amount,
        category: data.category
      })
    } catch (notifError) {
      // Notification error ko log karte hain but request continue karte hain
      console.error('Failed to send expense notification:', notifError)
    }
    
    // Success response return karte hain (201 Created status ke saath)
    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    // Error log karte hain debugging ke liye
    console.error('Create expense error:', error)
    
    // Error response return karte hain
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
})
