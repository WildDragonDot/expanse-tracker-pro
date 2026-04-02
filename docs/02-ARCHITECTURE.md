# Architecture

## System Architecture

### High-Level Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Vercel    │────────▶│   Render    │
│  (Frontend) │         │  (Frontend) │         │  (Backend)  │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  Supabase   │
                                                 │ (PostgreSQL)│
                                                 └─────────────┘
```

## Component Architecture

### Frontend (Next.js 14)
- **App Router:** File-based routing
- **Components:** Reusable UI components
- **State Management:** React hooks
- **API Client:** Fetch with custom wrapper
- **Styling:** Tailwind CSS

### Backend (Next.js API Routes)
- **API Routes:** RESTful endpoints
- **Middleware:** Authentication, CORS, rate limiting
- **Business Logic:** Service layer
- **Database:** Prisma ORM
- **File Storage:** AWS S3

### Database (PostgreSQL)
- **ORM:** Prisma
- **Migrations:** Prisma Migrate
- **Connection Pooling:** Supabase pooler
