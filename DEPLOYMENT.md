# Local Fishing Management System - Deployment Guide

This guide will help you deploy your Local Fishing Management System to Cloudflare Pages (frontend) and Cloudflare Workers (backend).

## 🏗️ Architecture Overview

- **Frontend**: React app deployed to Cloudflare Pages
- **Backend**: Hono-based API deployed to Cloudflare Workers
- **Database**: Supabase PostgreSQL

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Authentication**: Login to Cloudflare
   ```bash
   wrangler login
   ```

## 🚀 Quick Deployment

### Option 1: Deploy Everything
```bash
npm run deploy:all
```

### Option 2: Deploy Individually
```bash
# Deploy backend first
npm run deploy:backend

# Then deploy frontend
npm run deploy:frontend
```

### Option 3: Use Deployment Script
```bash
# Deploy everything
node deploy.js

# Deploy only backend
node deploy.js backend

# Deploy only frontend
node deploy.js frontend
```

## 🔧 Manual Deployment Steps

### 1. Backend Deployment (Cloudflare Workers)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Set production secrets**:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put JWT_REFRESH_SECRET
   # Add other secrets as needed
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Note your Worker URL**: After deployment, you'll get a URL like:
   ```
   https://local-fishing-backend.your-username.workers.dev
   ```

### 2. Frontend Deployment (Cloudflare Pages)

1. **Update environment variables**: Edit `.env.production` with your actual Worker URL:
   ```env
   VITE_API_URL=https://local-fishing-backend.your-username.workers.dev
   ```

2. **Build for production**:
   ```bash
   npm run build:prod
   ```

3. **Deploy to Pages**:
   ```bash
   wrangler pages deploy dist
   ```

4. **Note your Pages URL**: After deployment, you'll get a URL like:
   ```
   https://local-fishing-frontend.pages.dev
   ```

## 🌐 Environment Configuration

### Development (.env)
```env
VITE_API_URL=http://localhost:8787
VITE_API_MODE=workers
VITE_NODE_ENV=development
```

### Production (.env.production)
```env
VITE_API_URL=https://local-fishing-backend.your-username.workers.dev
VITE_API_MODE=workers
VITE_NODE_ENV=production
```

## 🔒 Security Configuration

### Backend CORS
Update `backend/wrangler.toml` to include your Pages domain:
```toml
CORS_ORIGIN = "https://local-fishing-frontend.pages.dev,https://your-custom-domain.com"
```

### Frontend Headers
The `public/_headers` file is configured to:
- Set security headers
- Allow CORS for your Workers domain
- Configure caching for static assets

## 🎯 Custom Domains (Optional)

### For Cloudflare Pages:
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Custom domains" tab
3. Add your domain and follow DNS instructions

### For Cloudflare Workers:
1. Go to Cloudflare Dashboard → Workers → Your Worker
2. Click "Triggers" tab
3. Add custom domain route

## 🧪 Testing Deployment

### Health Check
Test your backend:
```bash
curl https://local-fishing-backend.your-username.workers.dev/health
```

### Frontend Test
Visit your Pages URL and verify:
- ✅ App loads correctly
- ✅ API calls work
- ✅ Authentication functions
- ✅ All features operational

## 🔄 Development Workflow

### Local Development
```bash
# Setup (first time only)
node dev-setup.js setup

# Start development servers
npm run dev:full
```

### Deployment Workflow
1. Test locally
2. Commit changes
3. Deploy backend: `npm run deploy:backend`
4. Deploy frontend: `npm run deploy:frontend`
5. Test production deployment

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**: Update CORS_ORIGIN in backend/wrangler.toml
2. **API Not Found**: Check VITE_API_URL in .env.production
3. **Authentication Issues**: Verify JWT secrets are set in Workers
4. **Build Failures**: Check environment variables and dependencies

### Debug Commands
```bash
# Check Wrangler auth
wrangler whoami

# View Worker logs
wrangler tail local-fishing-backend

# Test API endpoints
curl -X GET https://your-worker-url.workers.dev/health
```

## 📊 Monitoring

- **Workers Analytics**: Available in Cloudflare Dashboard
- **Pages Analytics**: Available in Cloudflare Dashboard
- **Error Tracking**: Check Worker logs with `wrangler tail`

## 🔄 Updates

To update your deployment:
1. Make changes locally
2. Test thoroughly
3. Run deployment commands
4. Verify production functionality

---

For more detailed information, check the individual README files in the `backend/` directory and the main project README.
