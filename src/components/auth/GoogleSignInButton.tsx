/**
 * Google Sign-In Button Component
 * Handles Google OAuth authentication for admin users
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { googleAuthService, authenticateWithGoogle, decodeJWT } from '../../services/googleAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const initializeGoogleAuth = async () => {
    try {
      await googleAuthService.initialize();
      setIsInitialized(true);
      
      // Set up global callback for Google credential response
      (window as any).handleGoogleCredentialResponse = handleCredentialResponse;
      
      // Initialize Google with the callback
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      onError?.('Failed to initialize Google authentication');
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      onError?.('No credential received from Google');
      return;
    }

    setIsLoading(true);
    
    try {
      // Decode the JWT to get user info
      const userInfo = decodeJWT(response.credential);
      console.log('Google user info:', userInfo);

      // Authenticate with backend
      const authResponse = await authenticateWithGoogle(response.credential);
      
      if (authResponse.success) {
        toast.success(`Welcome back, ${authResponse.data?.user.ownerName}!`);
        onSuccess?.();
        navigate('/'); // Redirect to dashboard
      } else {
        throw new Error(authResponse.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    if (!isInitialized) {
      toast.error('Google authentication not ready. Please try again.');
      return;
    }

    try {
      // Render Google button if available
      if (buttonRef.current && (window as any).google?.accounts?.id) {
        // Clear existing content
        buttonRef.current.innerHTML = '';
        
        // Render Google Sign-In button
        (window as any).google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          width: '100%',
        });
      } else {
        // Fallback: show One Tap
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.prompt();
        }
      }
    } catch (error) {
      console.error('Error rendering Google button:', error);
      onError?.('Failed to initialize Google sign-in');
    }
  };

  if (!isInitialized) {
    return (
      <Button
        type="button"
        variant="outline"
        className={`w-full ${className}`}
        disabled={true}
      >
        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading Google Auth...
      </Button>
    );
  }

  return (
    <div className="w-full">
      {/* Hidden Google button container */}
      <div ref={buttonRef} className="hidden" />
      
      {/* Custom button that triggers Google auth */}
      <Button
        type="button"
        variant="outline"
        className={`w-full ${className}`}
        onClick={handleSignIn}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
    </div>
  );
};