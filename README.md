# 💰 Expanse Tracker Pro

A comprehensive full-stack expense tracking and financial management application built with Next.js, TypeScript, and PostgreSQL. Track expenses, manage budgets, plan shopping, and gain insights into your spending habits with intelligent analytics.

## ✨ Features

### 📊 Expense Management
- Track daily expenses with categories, banks, and payment modes
- Add receipts and notes to expenses
- Tag expenses for better organization
- Recurring expense tracking with subscription management
- Multi-currency support

### 💳 Income Tracking
- Record income from multiple sources
- Track salary and other income streams
- View income vs expense analytics

### 🎯 Budget Planning
- Set monthly budgets by category
- Real-time budget tracking with alerts
- Budget history and analytics
- Preferred bank assignment per category
- Automatic budget reset based on billing cycle

### 🛒 Smart Shopping Lists
- Create shopping categories with expected costs
- Track items with expected vs actual prices
- Mark items as bought and link to expenses
- Bill attachment support
- Shopping category expiry tracking

### 📅 Expense Planning
- Plan expenses for festivals, events, and special occasions
- Create planning categories (festival, day, month, year, duration)
- Track expected vs actual costs
- Expiry notifications for planning categories

### 🏦 Bank Integration
- Connect multiple bank accounts
- Automatic transaction import
- Link bank transactions to expenses
- Account balance tracking

### 📈 Analytics & Insights
- Smart spending score calculation
- Monthly and yearly expense summaries
- Category-wise spending analysis
- Budget vs actual comparisons
- Trend analysis and forecasting

### 💬 AI Chat Assistant
- Natural language expense queries
- Intelligent spending insights
- Budget recommendations
- Expense pattern analysis

### 👤 User Management
- Secure authentication with JWT
- Password reset functionality
- User profile with phone and bio
- Profile image upload
- Customizable billing cycle

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Framer Motion
- **Charts:** Recharts
- **PDF Generation:** jsPDF with autotable
- **State Management:** React Hooks
- **Testing:** Jest + React Testing Library

### Backend
- **Framework:** Next.js 14 API Routes
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcryptjs
- **File Storage:** AWS S3
- **Email:** Nodemailer
- **Real-time:** Socket.io
- **Validation:** Zod
- **Testing:** Jest with fast-check for property-based testing

## 📁 Project Structure

```
expanse-tracker-pro/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and helpers
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
│
├── backend/                  # Next.js backend API
│   ├── src/
│   │   ├── app/api/         # API routes
│   │   ├── lib/             # Business logic and utilities
│   │   └── middleware/      # Auth and other middleware
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   └── scripts/             # Utility scripts
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- AWS S3 account (for file uploads)
- OpenAI API key (for AI chat features)
- Mailgun account (for email notifications)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/WildDragonDot/expanse-tracker-pro.git
cd expanse-tracker-pro
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Set up environment variables**

Create `.env` files in both `backend` and `frontend` directories:

**Backend `.env`:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"

# Email (Mailgun)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
EMAIL_FROM="noreply@yourdomain.com"

# OpenAI (for AI chat)
OPENAI_API_KEY="your-openai-api-key"

# App URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
```

**Frontend `.env`:**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

4. **Set up the database**
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Run setup script to create test data
npm run setup
```

5. **Run the development servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📝 Available Scripts

### Backend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run tests
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client
npm run setup            # Setup database with initial data
npm run check-expiry     # Check for expired shopping categories
```

### Frontend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run tests
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main models:

- **User** - User accounts with profile information
- **Expense** - Individual expense records
- **Income** - Income tracking
- **MonthlyBudget** - Budget allocations by category
- **BudgetHistory** - Historical budget data
- **ShoppingCategory** - Shopping list categories
- **ShoppingItem** - Individual shopping items
- **ExpensePlanning** - Planned expenses for events
- **PlanningCategory** - Planning categories (festivals, events)
- **Subscription** - Recurring subscriptions
- **BankAccount** - Connected bank accounts
- **BankTransaction** - Bank transaction records
- **ExpenseCategory** - Custom expense categories
- **ExpenseBank** - Custom bank/payment method entries

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Secure password reset flow
- Environment variable protection
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## 📦 Deployment

### Backend Deployment

1. Set up a PostgreSQL database
2. Configure environment variables
3. Build the application: `npm run build`
4. Start the server: `npm run start`

### Frontend Deployment

The frontend can be deployed to Vercel, Netlify, or any platform supporting Next.js:

```bash
npm run build
npm run start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

**WildDragonDot**

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- All open-source contributors

---

Made with ❤️ by WildDragonDot
