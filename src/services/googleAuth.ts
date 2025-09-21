/**
 * Google OAuth Authentication Service
 * Handles Google OAuth integration for admin users using Google Identity Services
 */

// Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Types
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  user?: GoogleUser;
  idToken?: string;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      businessName: string;
      ownerName: string;
      role: string;
      authProvider: string;
      profilePicture?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message?: string;
  error?: string;
}

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: Element, options: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

class GoogleAuthService {
  private isInitialized = false;

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load Google Identity Services script
      await this.loadGoogleScript();
      
      // Initialize Google Identity Services
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
        });
        
        this.isInitialized = true;
        console.log('✅ Google OAuth initialized successfully');
      } else {
        throw new Error('Google Identity Services not available');
      }
    } catch (error) {
      console.error('🚨 Google OAuth initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait a bit for the Google object to be available
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            reject(new Error('Google Identity Services failed to load'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Handle Google credential response
   */
  private handleCredentialResponse(response: any): void {
    if (response.credential) {
      // This will be handled by the component that initiated the sign-in
      console.log('Google credential received');
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderSignInButton(element: Element, options: any = {}): void {
    if (!this.isInitialized) {
      console.error('Google Auth not initialized');
      return;
    }

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      width: '100%',
    };

    const buttonOptions = { ...defaultOptions, ...options };
    
    if (window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(element, buttonOptions);
    }
  }

  /**
   * Show One Tap prompt
   */
  showOneTap(): void {
    if (!this.isInitialized) {
      console.error('Google Auth not initialized');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }

  /**
   * Disable auto select
   */
  disableAutoSelect(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

// Create singleton instance
export const googleAuthService = new GoogleAuthService();

/**
 * Authenticate with backend using Google ID token
 */
export async function authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    const response = await fetch(`${apiUrl}/api/auth/google/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      // Store authentication data
      const { user, tokens } = data.data;
      
      // Store tokens
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      
      // Store user data
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('businessName', user.businessName);
      localStorage.setItem('ownerName', user.ownerName);
      
      if (user.profilePicture) {
        localStorage.setItem('profilePicture', user.profilePicture);
      }

      console.log('✅ Backend authentication successful for:', user.email);
    }

    return data;
  } catch (error) {
    console.error('🚨 Backend authentication failed:', error);
    throw error;
  }
}

/**
 * Logout from Google and clear local storage
 */
export async function logoutFromGoogle(): Promise<void> {
  try {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('businessName');
    localStorage.removeItem('ownerName');
    localStorage.removeItem('profilePicture');
    
    // Disable auto select for next session
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('🚨 Logout failed:', error);
    throw error;
  }
}

/**
 * Decode JWT token to extract user info
 */
export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}