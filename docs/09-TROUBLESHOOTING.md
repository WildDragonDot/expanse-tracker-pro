# Troubleshooting Guide

## Common Issues

### 1. Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
- Check DATABASE_URL format
- Ensure password special characters are URL encoded (`@` → `%40`)
- For Supabase: Use direct connection (port 5432) not pooler
- Check database is publicly accessible
- Verify firewall settings

### 2. CORS Error

**Error:** `Access-Control-Allow-Origin header blocked`

**Solutions:**
- Add frontend URL to backend CORS_ORIGIN
- Check middleware.ts configuration
- Verify environment variables on Render
- Ensure CORS headers are set correctly

### 3. Build Fails on Render

**Error:** `Module not found` or `TypeScript errors`

**Solutions:**
- Use `npm install --include=dev` in build command
- Check tsconfig.json paths configuration
- Verify all dependencies in package.json
- Clear build cache and redeploy

### 4. 503 Service Unavailable

**Error:** Backend returns 503

**Solutions:**
- Render free tier spins down after inactivity
- Wait 30-60 seconds for service to wake up
- Upgrade to paid plan for always-on service
- Check Render logs for startup errors

### 5. Authentication Fails

**Error:** `Invalid token` or `Unauthorized`

**Solutions:**
- Check JWT_SECRET is same on backend
- Verify token expiry time
- Clear browser cookies/localStorage
- Check auth middleware configuration

## Debugging Tips

### Check Backend Logs
```bash
# Render Dashboard → Logs
# Look for error messages
```

### Test API Endpoints
```bash
curl -X GET https://your-backend.onrender.com/api/health
```

### Verify Environment Variables
- Render: Settings → Environment
- Vercel: Settings → Environment Variables

### Database Connection Test
```bash
cd backend
DATABASE_URL="your-url" npx prisma db push
```
