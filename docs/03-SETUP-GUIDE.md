# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- AWS S3 account (for file uploads)
- OpenAI API key (for AI features)
- Mailgun account (for emails)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/WildDragonDot/expanse-tracker-pro.git
cd expanse-tracker-pro
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-secret-key-min-32-chars"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET_NAME="your-bucket"
MAILGUN_LOGIN="your-mailgun-login"
MAILGUN_PASSWORD="your-mailgun-password"
MAILGUN_FROM="noreply@yourdomain.com"
OPENAI_API_KEY="your-openai-key"
FRONTEND_URL="http://localhost:3000"
```

Setup database:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
```

Start development:
```bash
npm run dev
```

## Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
