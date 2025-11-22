# Script to rotate all secrets for the FishLedger backend
# This should be run after removing hardcoded secrets from wrangler.toml

Write-Host "FishLedger Secret Rotation Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will guide you through rotating all sensitive credentials."
Write-Host "Make sure you're in the backend directory before running this script."
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "Error: wrangler.toml not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Rotate Supabase Keys" -ForegroundColor Yellow
Write-Host "---------------------------"
Write-Host "1. Go to your Supabase project dashboard"
Write-Host "2. Navigate to Settings > API"
Write-Host "3. Generate new anon key and service role key"
Write-Host "4. Update the secrets:"
Write-Host "   wrangler secret put SUPABASE_URL"
Write-Host "   wrangler secret put SUPABASE_ANON_KEY"
Write-Host "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
Write-Host ""

Write-Host "Step 2: Rotate JWT Secrets" -ForegroundColor Yellow
Write-Host "-------------------------"
Write-Host "Generate two new random strings (at least 32 characters each):"
Write-Host "1. Generate a new JWT secret"
Write-Host "2. Generate a new JWT refresh secret"
Write-Host "3. Update the secrets:"
Write-Host "   wrangler secret put JWT_SECRET"
Write-Host "   wrangler secret put JWT_REFRESH_SECRET"
Write-Host ""

Write-Host "Step 3: Rotate Cloudinary Keys" -ForegroundColor Yellow
Write-Host "-----------------------------"
Write-Host "1. Go to your Cloudinary dashboard"
Write-Host "2. Navigate to Settings > Account Settings"
Write-Host "3. Generate new API key and secret"
Write-Host "4. Update the secrets:"
Write-Host "   wrangler secret put CLOUDINARY_CLOUD_NAME"
Write-Host "   wrangler secret put CLOUDINARY_API_KEY"
Write-Host "   wrangler secret put CLOUDINARY_API_SECRET"
Write-Host ""

Write-Host "Step 4: Rotate Email Password" -ForegroundColor Yellow
Write-Host "----------------------------"
Write-Host "1. Generate a new app password for your email account (if using Gmail)"
Write-Host "2. Update the secrets:"
Write-Host "   wrangler secret put EMAIL_USER"
Write-Host "   wrangler secret put EMAIL_PASSWORD"
Write-Host ""

Write-Host "Step 5: Rotate Google OAuth Keys (if applicable)" -ForegroundColor Yellow
Write-Host "-----------------------------------------------"
Write-Host "1. Go to Google Cloud Console"
Write-Host "2. Navigate to APIs & Services > Credentials"
Write-Host "3. Create new OAuth 2.0 Client IDs or rotate existing ones"
Write-Host "4. Update the secrets:"

Write-Host ""

Write-Host "Step 6: Invalidate Existing Sessions" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Write-Host "After rotating all secrets:"
Write-Host "1. All existing JWT tokens will be invalidated automatically"
Write-Host "2. Users will need to log in again"
Write-Host "3. Any stored sessions or refresh tokens will be invalid"
Write-Host ""

Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "---------------"
Write-Host "- Store the new secrets in a secure password manager"
Write-Host "- Never commit secrets to version control"
Write-Host "- Test the application thoroughly after rotation"
Write-Host "- Notify users if necessary about potential logout"