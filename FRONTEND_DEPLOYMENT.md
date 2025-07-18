# Frontend Deployment Guide

This guide explains how to deploy the LocalFishing frontend using the configured `wrangler.toml` file.

## 🚀 Quick Deployment

### Deploy to Production
```bash
npm run deploy:prod
```

### Deploy to Preview/Staging
```bash
npm run deploy:preview
```

### Deploy to Development
```bash
npm run deploy:dev
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy` | Deploy to default environment |
| `npm run deploy:prod` | Deploy to production environment |
| `npm run deploy:preview` | Deploy to preview/staging environment |
| `npm run deploy:dev` | Deploy to development environment |
| `npm run wrangler:dev` | Start local development server with Wrangler |
| `npm run wrangler:tail` | View live logs from deployed worker |

## ⚙️ Configuration

The `wrangler.toml` file is configured with:

- **Name**: `aqua-manage-fish-system`
- **Build Command**: `npm run build`
- **Output Directory**: `./dist`
- **Development Port**: `8787`

### Environment Variables

Each environment has specific variables configured:

#### Production
- API URL: `https://local-fishing-backend.ntwaribrian262.workers.dev`
- Debug: Disabled
- Analytics: Enabled

#### Preview
- API URL: `https://local-fishing-backend.ntwaribrian262.workers.dev`
- Debug: Disabled
- Analytics: Disabled

#### Development
- API URL: `http://localhost:8787`
- Debug: Enabled
- Analytics: Disabled

## 🔧 Manual Deployment

If you prefer to deploy manually:

```bash
# Build the application
npm run build:prod

# Deploy using Wrangler
wrangler deploy --env production
```

## 🌐 Access Your Deployed Application

After deployment, your application will be available at:

- **Production**: `https://aqua-manage-fish-system.your-subdomain.workers.dev`
- **Preview**: `https://preview.aqua-manage-fish-system.your-subdomain.workers.dev`
- **Development**: `https://development.aqua-manage-fish-system.your-subdomain.workers.dev`

## 🔍 Monitoring

View live logs from your deployed application:

```bash
npm run wrangler:tail
```

## 🛠️ Troubleshooting

### Build Fails
1. Ensure all dependencies are installed: `npm install`
2. Check for TypeScript errors: `npm run lint`
3. Try a clean build: `rm -rf dist && npm run build`

### Deployment Fails
1. Verify you're logged into Wrangler: `wrangler whoami`
2. Check your Cloudflare account permissions
3. Ensure the project name is unique in your account

### Environment Variables Not Working
1. Check the `wrangler.toml` configuration
2. Verify environment variable names start with `VITE_`
3. Restart the development server after changes

## 📝 Notes

- The frontend is configured as a static site with optional Workers functionality
- Environment variables are automatically injected during build time
- The configuration supports both Cloudflare Pages and Workers deployment methods
