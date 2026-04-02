# Database Schema

## Overview

The application uses PostgreSQL database with Prisma ORM. The schema is defined in `backend/prisma/schema.prisma`.

## Main Models

### User
Stores user account information and settings.

**Fields:**
- `id` (String): Unique identifier (CUID)
- `name` (String): User's full name
- `email` (String): Email address (unique)
- `passwordHash` (String): Hashed password
- `phone` (String?): Phone number (optional)
- `bio` (String?): User bio (optional)
- `profileImage` (String?): Profile image URL (optional)
- `salary` (Int): Monthly salary (default: 0)
- `currency` (String): Currency code (default: "INR")
- `billingCycleStartDay` (Int): Billing cycle start day (1-31)
- `resetToken` (String?): Password reset token
- `resetTokenExpiry` (DateTime?): Reset token expiry
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Has many: Expenses, Incomes, BankAccounts, MonthlyBudgets, etc.

### Expense
Tracks individual expense transactions.

**Fields:**
- `id` (String): Unique identifier
- `userId` (String): User reference
- `date` (DateTime): Expense date
- `title` (String): Expense title/description
- `amount` (Int): Amount in smallest currency unit (paise)
- `category` (String): Expense category
- `bank` (String): Bank/payment source
- `paymentMode` (String): Payment method (UPI, Card, Cash)
- `tags` (String[]): Tags for categorization
- `notes` (String?): Additional notes
- `receiptUrl` (String?): Receipt image URL
- `isRecurring` (Boolean): Is recurring expense
- `subscriptionId` (String?): Linked subscription
- `createdAt` (DateTime): Creation timestamp

**Indexes:**
- `userId + date`: For date-based queries
- `userId + category`: For category filtering

### MonthlyBudget
Manages monthly budget allocations by category.

**Fields:**
- `id` (String): Unique identifier
- `userId` (String): User reference
- `category` (String): Budget category
- `amount` (Int): Budget amount
- `month` (Int): Month (1-12)
- `year` (Int): Year
- `spent` (Int): Amount spent (default: 0)
- `payableBank` (String?): Preferred payment bank
- `isActive` (Boolean): Is budget active
- `resetDate` (DateTime?): Last reset date
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Unique Constraint:**
- `userId + category + month + year`

### ShoppingCategory
Organizes shopping lists into categories.

**Fields:**
- `id` (String): Unique identifier
- `userId` (String): User reference
- `name` (String): Category name
- `icon` (String): Category icon (default: "🛒")
- `color` (String): Category color gradient
- `expectedCost` (Float): Expected total cost
- `realCost` (Float): Actual total cost
- `isActive` (Boolean): Is category active
- `expiryDate` (DateTime?): Category expiry date
- `billAttachments` (Json?): Bill images/documents
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Has many: ShoppingItems
