/**
 * Custom hook for fetching and managing user profile data from database
 * Provides real-time user data with loading states and error handling
 */

import { useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  business_name: string;
  owner_name: string;
  email_address: string;
  phone_number?: string;
  created_at: string;
  last_login?: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

/**
 * Hook to fetch and manage user profile data from the database
 * @returns UserProfile data with loading states and update functions
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile from the database
   */
  const fetchProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.getProfile();
      
      if (response.success && response.data?.user) {
        setProfile(response.data.user);
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile';
      setError(errorMessage);
      console.error('Error fetching user profile:', err);
      
      // Show error toast
      toast.error('Failed to load profile', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile in the database
   * @param data - Partial user data to update
   * @returns Promise<boolean> - Success status
   */
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(data);

      if (response.success && response.data?.user) {
        // Update local state with the response data
        setProfile(response.data.user);

        // Update localStorage if business name or owner name changed
        if (data.business_name) {
          localStorage.setItem('businessName', data.business_name);
        }
        if (data.owner_name) {
          localStorage.setItem('ownerName', data.owner_name);
        }
        if (data.email_address) {
          localStorage.setItem('userEmail', data.email_address);
        }

        toast.success('Profile updated successfully!', {
          description: 'Your changes have been saved.',
        });

        return true;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);

      toast.error('Failed to update profile', {
        description: errorMessage,
      });

      return false;
    }
  };

  /**
   * Refetch profile data
   */
  const refetch = async (): Promise<void> => {
    await fetchProfile();
  };

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile,
  };
};

/**
 * Get user profile data from localStorage (fallback)
 * @returns Partial user profile from localStorage
 */
export const getUserFromLocalStorage = (): Partial<UserProfile> => {
  return {
    business_name: localStorage.getItem('businessName') || '',
    owner_name: localStorage.getItem('ownerName') || '',
    email_address: localStorage.getItem('userEmail') || '',
  };
};
