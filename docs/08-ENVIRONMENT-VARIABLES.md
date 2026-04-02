# Environment Variables

## Backend Environment Variables

### Required Variables

#### Database
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```
- PostgreSQL connection string
- Use URL encoding for special characters in password
- Example: `@` becomes `%40`

#### Authentication
```env
JWT_SECRET="your-secret-key-minimum-32-characters"
```
- Secret key for JWT token generation
- Must be at least 32 characters
- Keep this secret and secure

#### AWS S3 (File Storage)
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
```
- Required for file uploads (receipts, profile images)
- Create S3 bucket and IAM user with S3 permissions

#### Email (Mailgun)
```env
MAILGUN_LOGIN="postmaster@your-domain.mailgun.org"
MAILGUN_PASSWORD="your-mailgun-smtp-password"
MAILGUN_FROM="noreply@yourdomain.com"
```
- Required for password reset emails
- Get credentials from Mailgun dashboard

#### OpenAI (Optional)
```env
OPENAI_API_KEY="sk-..."
```
- Required for AI chat features
- Optional if not using AI features

#### CORS & URLs
```env
CORS_ORIGIN="https://your-frontend.vercel.app"
FRONTEND_URL="https://your-frontend.vercel.app"
NODE_ENV="production"
```
- CORS_ORIGIN: Comma-separated list of allowed origins
- FRONTEND_URL: Frontend application URL

## Frontend Environment Variables

### Required Variables

```env
NEXT_PUBLIC_BACKEND_URL="https://your-backend.onrender.com"
```
- Backend API URL
- Must start with NEXT_PUBLIC_ to be accessible in browser

### Optional Variables

```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
```
- Analytics tracking IDs
