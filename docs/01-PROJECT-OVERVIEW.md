# Project Overview

## Introduction

Expanse Tracker Pro is a comprehensive full-stack expense tracking and financial management application designed to help users manage their finances effectively. The application provides features for expense tracking, budget planning, shopping lists, and AI-powered financial insights.

## Key Features

### 1. Expense Management
- Track daily expenses with categories, banks, and payment modes
- Add receipts and notes to expenses
- Tag expenses for better organization
- Recurring expense tracking with subscription management
- Multi-currency support

### 2. Income Tracking
- Record income from multiple sources
- Track salary and other income streams
- View income vs expense analytics

### 3. Budget Planning
- Set monthly budgets by category
- Real-time budget tracking with alerts
- Budget history and analytics
- Preferred bank assignment per category
- Automatic budget reset based on billing cycle

### 4. Smart Shopping Lists
- Create shopping categories with expected costs
- Track items with expected vs actual prices
- Mark items as bought and link to expenses
- Bill attachment support
- Shopping category expiry tracking

### 5. Expense Planning
- Plan expenses for festivals, events, and special occasions
- Create planning categories (festival, day, month, year, duration)
- Track expected vs actual costs
- Expiry notifications for planning categories

### 6. Bank Integration
- Connect multiple bank accounts
- Automatic transaction import
- Link bank transactions to expenses
- Account balance tracking

### 7. Analytics & Insights
- Smart spending score calculation
- Monthly and yearly expense summaries
- Category-wise spending analysis
- Budget vs actual comparisons
- Trend analysis and forecasting

### 8. AI Chat Assistant
- Natural language expense queries
- Intelligent spending insights
- Budget recommendations
- Expense pattern analysis

### 9. User Management
- Secure authentication with JWT
- Password reset functionality
- User profile with phone and bio
- Profile image upload
- Customizable billing cycle

## Target Users

- Individuals looking to manage personal finances
- Families tracking household expenses
- Small business owners managing business expenses
- Anyone wanting to gain insights into spending habits

## Business Value

- **Financial Awareness:** Helps users understand where their money goes
- **Budget Control:** Prevents overspending with real-time alerts
- **Smart Planning:** Plan for future expenses and events
- **Data-Driven Decisions:** Make informed financial decisions with analytics
- **Time Saving:** Automate expense tracking and categorization

## Technology Choices

### Frontend: Next.js 14
- **Why:** Server-side rendering, excellent performance, great developer experience
- **Benefits:** SEO-friendly, fast page loads, built-in routing

### Backend: Next.js API Routes
- **Why:** Unified codebase, easy deployment, serverless architecture
- **Benefits:** Reduced complexity, better maintainability, cost-effective

### Database: PostgreSQL with Prisma
- **Why:** Robust, reliable, excellent for financial data
- **Benefits:** ACID compliance, type-safe queries, easy migrations

### Authentication: JWT
- **Why:** Stateless, scalable, secure
- **Benefits:** No server-side session storage, works well with APIs

### Deployment: Vercel + Render
- **Why:** Easy deployment, automatic scaling, good free tiers
- **Benefits:** CI/CD integration, global CDN, monitoring

## Project Structure

```
expanse-tracker-pro/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
│
├── backend/              # Next.js backend API
│   ├── src/
│   │   ├── app/api/      # API routes
│   │   ├── lib/          # Business logic
│   │   └── middleware/   # Auth and security
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── migrations/   # Database migrations
│   └── scripts/          # Utility scripts
│
├── docs/                 # Documentation
└── README.md            # Project readme
```

## Development Workflow

1. **Local Development:** Run frontend and backend separately
2. **Testing:** Manual testing + automated tests
3. **Staging:** Deploy to staging environment
4. **Production:** Deploy to production after testing

## Future Enhancements

- Mobile app (React Native)
- Bank API integrations
- Receipt OCR scanning
- Multi-user support (family accounts)
- Investment tracking
- Tax calculation and reporting
- Cryptocurrency tracking
- Bill reminders and notifications
- Export to accounting software
