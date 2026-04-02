# Deployment Guide

## Backend Deployment (Render)

### 1. Create Render Account
- Sign up at https://render.com

### 2. Create Web Service
- Click "New" → "Web Service"
- Connect GitHub repository
- Configure:
  - **Name:** expanse-tracker-backend
  - **Root Directory:** `backend`
  - **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
  - **Start Command:** `npm run start`

### 3. Environment Variables
Add these in Render dashboard:
```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=your-bucket
MAILGUN_LOGIN=your-login
MAILGUN_PASSWORD=your-password
MAILGUN_FROM=noreply@domain.com
OPENAI_API_KEY=your-key
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment

## Frontend Deployment (Vercel)

### 1. Create Vercel Account
- Sign up at https://vercel.com

### 2. Import Project
- Click "New Project"
- Import from GitHub
- Configure:
  - **Root Directory:** `frontend`
  - **Framework:** Next.js

### 3. Environment Variables
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### 4. Deploy
- Click "Deploy"
- Wait for deployment

## Post-Deployment

### 1. Update CORS
Update backend CORS_ORIGIN with frontend URL

### 2. Test Endpoints
```bash
curl https://your-backend.onrender.com/api/health
```

### 3. Monitor Logs
- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments → Logs
