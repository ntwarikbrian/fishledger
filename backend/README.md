# FishLedger Backend

This is the backend for the FishLedger application, built with Cloudflare Workers and Hono framework.

## Security Notice

**Important:** Sensitive credentials like Supabase keys, JWT secrets, Cloudinary API keys, and email passwords should NEVER be committed to the repository. They are now removed from `wrangler.toml` and should be set using Wrangler secrets.

## Setting Up Secrets

To set up the required secrets for the application, use the following commands in the `backend` directory:

```bash
# Navigate to the backend directory
cd backend

# Set all required secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put EMAIL_USER
wrangler secret put EMAIL_PASSWORD

```

For each command, you'll be prompted to enter the secret value. Make sure to use strong, unique values for each secret.

## Environment Variables

The application requires the following environment variables:

### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### JWT Configuration
- `JWT_SECRET`: Secret key for signing JWT tokens (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens (minimum 32 characters)
- `JWT_EXPIRES_IN`: Token expiration time (default: "7d")
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration time (default: "30d")

### Cloudinary Configuration
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Email Configuration
- `EMAIL_HOST`: SMTP server host (default: "smtp.gmail.com")
- `EMAIL_PORT`: SMTP server port (default: 587)
- `EMAIL_USER`: Email username for SMTP authentication
- `EMAIL_PASSWORD`: Email password for SMTP authentication
- `EMAIL_FROM`: Sender email address

### Google OAuth Configuration


## Development

To run the development server:

```bash
pnpm dev
```

To deploy to Cloudflare Workers:

```bash
pnpm deploy
```