# Frontend-Backend Connection Guide

## ✅ Connection Status: CONFIGURED

Your Local Fishing Management System is now properly configured to connect your React frontend (Cloudflare Pages) with your Hono backend (Cloudflare Workers).

## 🏗️ Current Setup

### Development Environment
- **Frontend**: http://localhost:8080 (Vite dev server)
- **Backend**: http://127.0.0.1:8787 (Cloudflare Workers local)
- **Database**: Supabase PostgreSQL
- **API Mode**: Cloudflare Workers

### Production Environment
- **Frontend**: Will be deployed to `https://local-fishing-frontend.pages.dev`
- **Backend**: Will be deployed to `https://local-fishing-backend.your-username.workers.dev`
- **Database**: Same Supabase instance

## 🔧 Configuration Files Created

### Environment Files
- `.env` - Development configuration
- `.env.production` - Production configuration
- `.env.example` - Template with all variables

### Deployment Files
- `wrangler.toml` - Cloudflare Pages configuration
- `public/_headers` - CORS and security headers
- `public/_redirects` - SPA routing configuration
- `deploy.js` - Automated deployment script
- `dev-setup.js` - Development setup script
- `DEPLOYMENT.md` - Detailed deployment guide

### Updated Files
- `package.json` - Added deployment scripts
- `backend/wrangler.toml` - Updated CORS origins
- API configuration files - Updated production URLs

## 🚀 Quick Start Commands

### Development
```bash
# Start both frontend and backend
npm run dev:full

# Or start individually
npm run dev          # Frontend only
npm run dev:backend  # Backend only
```

### Deployment
```bash
# Deploy everything
npm run deploy:all

# Or deploy individually
npm run deploy:backend
npm run deploy:frontend

# Using deployment script
node deploy.js
```

## 🔍 API Configuration

### Base URLs
- **Development**: `http://localhost:8787`
- **Production**: `https://local-fishing-backend.your-username.workers.dev`

### Environment Detection
The system automatically detects the environment using:
- `VITE_NODE_ENV` (primary)
- `NODE_ENV` (fallback)

### CORS Configuration
Backend is configured to accept requests from:
- `http://localhost:8080` (development)
- `http://localhost:5173` (Vite alternative)
- `http://localhost:3000` (React alternative)
- `https://local-fishing-frontend.pages.dev` (production)
- `https://local-fishing-frontend-preview.pages.dev` (preview)

## 🧪 Testing Connection

### 1. Local Development Test
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open: http://localhost:8080
4. Test login/registration functionality

### 2. API Health Check
```bash
# Test backend health (when running)
curl http://127.0.0.1:8787/health
```

### 3. Frontend API Test
Open browser console and run:
```javascript
fetch('http://localhost:8787/health')
  .then(r => r.json())
  .then(console.log)
```

## 🔒 Security Features

### Headers Configuration
- CORS properly configured
- Security headers set
- Content-Type validation
- Authorization token handling

### Authentication Flow
- JWT tokens stored in localStorage
- Automatic token refresh
- Secure API communication
- Role-based access control

## 📱 API Endpoints

All endpoints are prefixed with `/api/`:

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/worker-login`
- `GET /api/auth/profile`

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Sales
- `GET /api/sales`
- `POST /api/sales`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `backend/wrangler.toml` CORS_ORIGIN
   - Verify frontend URL is included

2. **API Not Found (404)**
   - Check `VITE_API_URL` in environment files
   - Verify backend is running on correct port

3. **Authentication Issues**
   - Check JWT secrets in backend
   - Verify token storage in localStorage

4. **Build Errors**
   - Run `npm install` in both root and backend
   - Check TypeScript errors

### Debug Commands
```bash
# Check environment variables
npm run dev  # Check console for API config

# Check backend logs
cd backend && wrangler tail local-fishing-backend

# Test API directly
curl -X GET http://127.0.0.1:8787/health
```

## 🎯 Next Steps

1. **Test Local Development**: Verify all features work locally
2. **Deploy to Production**: Use deployment scripts
3. **Update Production URLs**: Replace placeholder URLs with actual domains
4. **Set Up Custom Domains**: Configure custom domains in Cloudflare
5. **Monitor Performance**: Use Cloudflare analytics

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the DEPLOYMENT.md file
3. Check Cloudflare Workers/Pages documentation
4. Verify environment variables are set correctly

---

Your frontend and backend are now properly connected and ready for development and deployment! 🎉
