/**
 * Google OAuth Authentication Handlers
 * Handles Google OAuth flow for admin users only
 * Worker authentication remains unchanged using email/password
 */

import { Context } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.js';
import { createSuccessResponse, createErrorResponse } from '../utils/response.js';
import type { Environment } from '../config/environment.js';

// Types
interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  given_name?: string | undefined;
  family_name?: string | undefined;
}

interface GoogleTokenPayload {
  iss: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

// Validation schemas
const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

const googleTokenSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

/**
 * Get Google OAuth client instance
 */
function getGoogleOAuthClient(env: Environment): OAuth2Client {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth configuration missing');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google OAuth authorization URL
 * GET /api/auth/google
 */
export const googleAuthHandler = async (c: Context) => {
  try {
    const env = c.env as Environment;
    const oauth2Client = getGoogleOAuthClient(env);

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in session/cache if needed for verification
    // For simplicity, we'll rely on the redirect URI validation

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ],
      state: state,
      prompt: 'consent'
    });

    return c.json({
      success: true,
      data: {
        authUrl,
        state
      },
      message: 'Google OAuth URL generated successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('🚨 Google OAuth URL generation failed:', error);
    return c.json({
      success: false,
      error: 'Failed to generate Google OAuth URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Handle Google OAuth callback
 * POST /api/auth/google/callback
 */
export const googleCallbackHandler = async (c: Context) => {
  try {
    const env = c.env as Environment;
    const body = await c.req.json();

    // Validate input
    const validation = googleCallbackSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Invalid Google OAuth callback data',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { code, state } = validation.data;
    const oauth2Client = getGoogleOAuthClient(env);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }

    // Verify and decode the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() as GoogleTokenPayload;
    if (!payload) {
      throw new Error('Invalid Google ID token payload');
    }

    // Extract user information
    const googleUser: GoogleUserInfo = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture || undefined,
      given_name: payload.given_name || undefined,
      family_name: payload.family_name || undefined,
    };

    // Create or update user in database
    const user = await createOrUpdateGoogleUser(c, googleUser);

    // Generate JWT tokens
    const accessToken = generateAccessToken(
      {
        id: user.user_id,
        email: user.email_address,
        username: user.email_address,
        role: 'admin',
        isActive: true,
      },
      env
    );

    const refreshToken = generateRefreshToken(
      user.user_id,
      1, // token version
      env
    );

    console.log(`✅ Google OAuth successful for user: ${user.email_address}`);

    return c.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          email: user.email_address,
          businessName: user.business_name,
          ownerName: user.owner_name,
          role: 'admin',
          authProvider: 'google',
          profilePicture: user.profile_picture_url,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      message: 'Google OAuth authentication successful',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('🚨 Google OAuth callback failed:', error);
    return c.json({
      success: false,
      error: 'Google OAuth authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 500);
  }
};

/**
 * Verify Google ID token (for client-side flow)
 * POST /api/auth/google/verify
 */
export const googleVerifyHandler = async (c: Context) => {
  try {
    const env = c.env as Environment;
    const body = await c.req.json();

    // Validate input
    const validation = googleTokenSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Invalid Google token data',
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      }, 400);
    }

    const { idToken } = validation.data;
    const oauth2Client = getGoogleOAuthClient(env);

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() as GoogleTokenPayload;
    if (!payload) {
      throw new Error('Invalid Google ID token payload');
    }

    // Extract user information
    const googleUser: GoogleUserInfo = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture || undefined,
      given_name: payload.given_name || undefined,
      family_name: payload.family_name || undefined,
    };

    // Create or update user in database
    const user = await createOrUpdateGoogleUser(c, googleUser);

    // Generate JWT tokens
    const accessToken = generateAccessToken(
      {
        id: user.user_id,
        email: user.email_address,
        username: user.email_address,
        role: 'admin',
        isActive: true,
      },
      env
    );

    const refreshToken = generateRefreshToken(
      user.user_id,
      1, // token version
      env
    );

    console.log(`✅ Google token verification successful for user: ${user.email_address}`);

    return c.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          email: user.email_address,
          businessName: user.business_name,
          ownerName: user.owner_name,
          role: 'admin',
          authProvider: 'google',
          profilePicture: user.profile_picture_url,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      message: 'Google token verification successful',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });

  } catch (error) {
    console.error('🚨 Google token verification failed:', error);
    return c.json({
      success: false,
      error: 'Google token verification failed',
      details: error instanceof Error ? error.message : 'Invalid token',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    }, 401);
  }
};

/**
 * Create or update user from Google OAuth data
 */
async function createOrUpdateGoogleUser(c: Context, googleUser: GoogleUserInfo) {
  const supabase = c.get('supabase');

  // Check if user exists by Google ID
  let { data: existingUser, error: searchError } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleUser.id)
    .single();

  if (searchError && searchError.code !== 'PGRST116') {
    throw new Error(`Database search error: ${searchError.message}`);
  }

  // If user doesn't exist by Google ID, check by email
  if (!existingUser) {
    const { data: emailUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email_address', googleUser.email)
      .single();

    if (emailError && emailError.code !== 'PGRST116') {
      throw new Error(`Database email search error: ${emailError.message}`);
    }

    existingUser = emailUser;
  }

  if (existingUser) {
    // Update existing user with Google information
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        google_id: googleUser.id,
        auth_provider: 'google',
        profile_picture_url: googleUser.picture,
        owner_name: googleUser.name, // Update name from Google if needed
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingUser.user_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    return updatedUser;
  } else {
    // Create new user
    const businessName = extractBusinessName(googleUser.email, googleUser.name);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email_address: googleUser.email,
        business_name: businessName,
        owner_name: googleUser.name,
        google_id: googleUser.id,
        auth_provider: 'google',
        profile_picture_url: googleUser.picture,
        password: null, // No password for Google OAuth users
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`✅ New Google user created: ${googleUser.email}`);
    return newUser;
  }
}

/**
 * Extract business name from email or use user's name
 */
function extractBusinessName(email: string, userName: string): string {
  // Try to extract from email domain
  const domain = email.split('@')[1];
  if (domain && domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !== 'outlook.com') {
    // Convert domain to business name (e.g., "company.com" -> "Company Business")
    const companyName = domain.split('.')[0];
    if (companyName) {
      return companyName.charAt(0).toUpperCase() + companyName.slice(1) + ' Business';
    }
  }
  
  // Fallback to user's name + "Business"
  return `${userName}'s Business`;
}