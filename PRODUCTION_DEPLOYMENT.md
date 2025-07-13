# Production Deployment Guide

## 🚀 Step-by-Step Production Deployment

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler Authentication**: 
   ```bash
   wrangler login
   ```
   This will open a browser window for authentication.

### Step 1: Deploy Backend (Cloudflare Workers)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Set production secrets** (replace with your actual values):
   ```bash
   wrangler secret put SUPABASE_URL
   # Enter: https://hebdlpduohlfhdgvugla.supabase.co
   
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   # Enter your service role key from backend/wrangler.toml
   
   wrangler secret put JWT_SECRET
   # Enter a strong secret (32+ characters)
   
   wrangler secret put JWT_REFRESH_SECRET
   # Enter another strong secret (32+ characters)
   
   wrangler secret put EMAIL_PASSWORD
   # Enter: wzge fkwj unyk xkiw
   
   wrangler secret put CLOUDINARY_API_SECRET
   # Enter: pB_7QOUVorneWKAer1aErW-yNe0
   ```

3. **Deploy backend**:
   ```bash
   npm run deploy
   ```

4. **Note your Worker URL**: After deployment, you'll see something like:
   ```
   Published local-fishing-backend (1.23s)
     https://local-fishing-backend.your-username.workers.dev
   ```

### Step 2: Update Frontend Configuration

1. **Update production environment file**:
   Edit `.env.production` and replace the placeholder URL:
   ```env
   VITE_API_URL=https://local-fishing-backend.your-username.workers.dev
   REACT_APP_API_URL=https://local-fishing-backend.your-username.workers.dev
   ```

2. **Update CORS in backend**:
   After you get your Pages URL, update `backend/wrangler.toml`:
   ```toml
   CORS_ORIGIN = "https://local-fishing-frontend.pages.dev,https://your-actual-pages-url.pages.dev"
   ```

### Step 3: Deploy Frontend (Cloudflare Pages)

1. **Build for production**:
   ```bash
   npm run build:prod
   ```

2. **Deploy to Pages**:
   ```bash
   wrangler pages deploy dist
   ```

3. **Note your Pages URL**: You'll see something like:
   ```
   ✨ Success! Uploaded 45 files (3.21 sec)
   ✨ Deployment complete! Take a peek over at https://abc123.local-fishing-frontend.pages.dev
   ```

### Step 4: Update Backend CORS (Final)

1. **Update backend CORS with actual Pages URL**:
   Edit `backend/wrangler.toml` and add your actual Pages URL:
   ```toml
   CORS_ORIGIN = "http://localhost:8080,https://your-actual-pages-url.pages.dev"
   ```

2. **Redeploy backend**:
   ```bash
   cd backend
   npm run deploy
   ```

### Step 5: Test Production Deployment

1. **Visit your Pages URL**
2. **Test key functionality**:
   - ✅ App loads without errors
   - ✅ Login/registration works
   - ✅ API calls succeed
   - ✅ All features operational

## 🔧 Alternative: Using Deployment Scripts

### Option 1: Automated Deployment
```bash
# After authentication
node deploy.js
```

### Option 2: Individual Deployment
```bash
# Deploy backend only
node deploy.js backend

# Deploy frontend only  
node deploy.js frontend
```

## 🌐 Custom Domains (Optional)

### For Cloudflare Pages:
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Custom domains" tab
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS setup instructions

### For Cloudflare Workers:
1. Go to Cloudflare Dashboard → Workers → Your Worker
2. Click "Triggers" tab
3. Add custom domain route (e.g., `api.yourdomain.com/*`)

## 🔒 Production Security Checklist

- [ ] Strong JWT secrets set
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting enabled

## 📊 Monitoring Setup

### Cloudflare Analytics
- Workers analytics available in dashboard
- Pages analytics available in dashboard
- Real-time logs with `wrangler tail`

### Error Monitoring
```bash
# Monitor backend logs
wrangler tail local-fishing-backend

# Check deployment status
wrangler deployments list
```

## 🛠️ Troubleshooting Production Issues

### Common Problems

1. **CORS Errors**:
   - Verify CORS_ORIGIN includes your Pages URL
   - Check browser network tab for exact error

2. **API 404 Errors**:
   - Verify VITE_API_URL in .env.production
   - Check Worker deployment status

3. **Authentication Issues**:
   - Verify JWT secrets are set in Workers
   - Check localStorage for tokens

4. **Build Failures**:
   - Check environment variables
   - Verify all dependencies installed

### Debug Commands
```bash
# Check Worker status
wrangler deployments list

# View Worker logs
wrangler tail local-fishing-backend

# Test API endpoint
curl https://your-worker-url.workers.dev/health

# Check Pages deployment
wrangler pages deployment list
```

## 🔄 Update Workflow

For future updates:
1. Make changes locally
2. Test thoroughly
3. Deploy backend: `cd backend && npm run deploy`
4. Deploy frontend: `npm run build:prod && wrangler pages deploy dist`
5. Test production

## 📞 Support Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

Your application is now ready for production deployment! 🎉
