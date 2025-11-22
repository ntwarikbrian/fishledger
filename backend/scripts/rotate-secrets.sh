#!/bin/bash

# Script to rotate all secrets for the FishLedger backend
# This should be run after removing hardcoded secrets from wrangler.toml

echo "FishLedger Secret Rotation Script"
echo "=================================="
echo ""
echo "This script will guide you through rotating all sensitive credentials."
echo "Make sure you're in the backend directory before running this script."
echo ""

# Check if we're in the backend directory
if [ ! -f "wrangler.toml" ]; then
    echo "Error: wrangler.toml not found. Please run this script from the backend directory."
    exit 1
fi

echo "Step 1: Rotate Supabase Keys"
echo "---------------------------"
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to Settings > API"
echo "3. Generate new anon key and service role key"
echo "4. Update the secrets:"
echo "   wrangler secret put SUPABASE_URL"
echo "   wrangler secret put SUPABASE_ANON_KEY"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo "Step 2: Rotate JWT Secrets"
echo "-------------------------"
echo "Generate two new random strings (at least 32 characters each):"
echo "1. Generate a new JWT secret"
echo "2. Generate a new JWT refresh secret"
echo "3. Update the secrets:"
echo "   wrangler secret put JWT_SECRET"
echo "   wrangler secret put JWT_REFRESH_SECRET"
echo ""

echo "Step 3: Rotate Cloudinary Keys"
echo "-----------------------------"
echo "1. Go to your Cloudinary dashboard"
echo "2. Navigate to Settings > Account Settings"
echo "3. Generate new API key and secret"
echo "4. Update the secrets:"
echo "   wrangler secret put CLOUDINARY_CLOUD_NAME"
echo "   wrangler secret put CLOUDINARY_API_KEY"
echo "   wrangler secret put CLOUDINARY_API_SECRET"
echo ""

echo "Step 4: Rotate Email Password"
echo "----------------------------"
echo "1. Generate a new app password for your email account (if using Gmail)"
echo "2. Update the secrets:"
echo "   wrangler secret put EMAIL_USER"
echo "   wrangler secret put EMAIL_PASSWORD"
echo ""

echo "Step 5: Rotate Google OAuth Keys (if applicable)"
echo "-----------------------------------------------"
echo "1. Go to Google Cloud Console"
echo "2. Navigate to APIs & Services > Credentials"
echo "3. Create new OAuth 2.0 Client IDs or rotate existing ones"
echo "4. Update the secrets:"

echo ""

echo "Step 6: Invalidate Existing Sessions"
echo "-----------------------------------"
echo "After rotating all secrets:"
echo "1. All existing JWT tokens will be invalidated automatically"
echo "2. Users will need to log in again"
echo "3. Any stored sessions or refresh tokens will be invalid"
echo ""

echo "Important Notes:"
echo "---------------"
echo "- Store the new secrets in a secure password manager"
echo "- Never commit secrets to version control"
echo "- Test the application thoroughly after rotation"
echo "- Notify users if necessary about potential logout"