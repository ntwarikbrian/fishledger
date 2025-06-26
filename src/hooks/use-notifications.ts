import { useState, useCallback } from 'react';

export interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Sample notifications data
const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "success",
    title: "Order Completed",
    message: "Order #1234 has been successfully processed and shipped.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Low Stock Alert",
    message: "Salmon stock is running low. Only 5 kg remaining.",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "New Customer",
    message: "A new customer has registered: John Smith.",
    time: "1 hour ago",
    read: true,
  },
  {
    id: 4,
    type: "error",
    title: "Payment Failed",
    message: "Payment for order #1235 could not be processed.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 5,
    type: "info",
    title: "Daily Report",
    message: "Your daily sales report is ready for review.",
    time: "3 hours ago",
    read: true,
  },
];

/**
 * Custom hook for managing notifications
 * Provides functionality to add, remove, mark as read, and manage notification state
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Add new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(), // Simple ID generation
      time: 'Just now',
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
};
