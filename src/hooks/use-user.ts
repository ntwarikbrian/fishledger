/**
 * Custom hook for accessing user information
 * Provides easy access to current user data stored in localStorage
 */

import { useState, useEffect } from 'react';

interface UserInfo {
  userType: 'admin' | 'worker' | null;
  email: string | null;
  businessName: string | null;
  ownerName: string | null;
  workerId: string | null;
  isAuthenticated: boolean;
}

/**
 * Hook to get current user information from localStorage
 * @returns UserInfo object with current user data
 */
export const useUser = (): UserInfo => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userType: null,
    email: null,
    businessName: null,
    ownerName: null,
    workerId: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Function to update user info from localStorage
    const updateUserInfo = () => {
      const userType = localStorage.getItem("userType") as 'admin' | 'worker' | null;
      const email = localStorage.getItem("userEmail");
      const businessName = localStorage.getItem("businessName");
      const ownerName = localStorage.getItem("ownerName");
      const workerId = localStorage.getItem("workerId");

      setUserInfo({
        userType,
        email,
        businessName,
        ownerName,
        workerId,
        isAuthenticated: !!userType,
      });
    };

    // Initial load
    updateUserInfo();

    // Listen for storage changes (useful for multi-tab scenarios)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('user') || e.key?.startsWith('owner') || e.key?.startsWith('business') || e.key?.startsWith('worker')) {
        updateUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return userInfo;
};

/**
 * Get user display name based on user type
 * @param userInfo - User information object
 * @returns Display name for the user
 */
export const getUserDisplayName = (userInfo: UserInfo): string => {
  if (!userInfo.isAuthenticated) {
    return 'Guest';
  }

  if (userInfo.userType === 'admin' && userInfo.ownerName) {
    return userInfo.ownerName;
  }

  if (userInfo.userType === 'worker' && userInfo.workerId) {
    // For workers, we might need to fetch the worker name from the API
    // For now, return the worker ID or email
    return userInfo.email?.split('@')[0] || userInfo.workerId;
  }

  // Fallback to email username
  return userInfo.email?.split('@')[0] || 'User';
};
