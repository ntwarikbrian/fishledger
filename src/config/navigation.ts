import { 
  Home, 
  Package, 
  Users, 
  DollarSign, 
  FolderOpen, 
  Settings, 
  ShoppingCart, 
  CreditCard, 
  HelpCircle, 
  BarChart3, 
  UserCheck 
} from "lucide-react";

/**
 * Navigation Configuration
 * Shared navigation items for both mobile and desktop sidebars
 * Each sidebar can style and implement these independently
 */

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  key: string;
  translationKey?: string;
}

/**
 * Get main navigation items with translations
 * @param t - Translation function from react-i18next
 * @returns Array of main navigation items
 */
export const getMainNavigation = (t: (key: string) => string): NavigationItem[] => [
  { 
    name: t('navigation.dashboard'), 
    href: "/", 
    icon: Home, 
    key: "dashboard",
    translationKey: 'navigation.dashboard'
  },
  { 
    name: t('navigation.inventory'), 
    href: "/inventory", 
    icon: Package, 
    key: "inventory",
    translationKey: 'navigation.inventory'
  },
  { 
    name: t('navigation.sales'), 
    href: "/sales", 
    icon: ShoppingCart, 
    key: "sales",
    translationKey: 'navigation.sales'
  },
  { 
    name: t('navigation.customers'), 
    href: "/customers", 
    icon: Users, 
    key: "customers",
    translationKey: 'navigation.customers'
  },
  { 
    name: "Transactions", 
    href: "/transactions", 
    icon: CreditCard, 
    key: "transactions"
  },
  { 
    name: t('navigation.expenses'), 
    href: "/expenses", 
    icon: DollarSign, 
    key: "expenses",
    translationKey: 'navigation.expenses'
  },
  { 
    name: t('navigation.documents'), 
    href: "/documents", 
    icon: FolderOpen, 
    key: "documents",
    translationKey: 'navigation.documents'
  },
  { 
    name: t('navigation.reports'), 
    href: "/reports", 
    icon: BarChart3, 
    key: "reports",
    translationKey: 'navigation.reports'
  },
  { 
    name: t('navigation.staff'), 
    href: "/staff", 
    icon: UserCheck, 
    key: "staff",
    translationKey: 'navigation.staff'
  },
];

/**
 * Get general navigation items with translations
 * @param t - Translation function from react-i18next
 * @returns Array of general navigation items
 */
export const getGeneralNavigation = (t: (key: string) => string): NavigationItem[] => [
  { 
    name: t('navigation.settings'), 
    href: "/settings", 
    icon: Settings, 
    key: "settings",
    translationKey: 'navigation.settings'
  },
  { 
    name: t('common.help', 'Help'), 
    href: "/help", 
    icon: HelpCircle, 
    key: "help",
    translationKey: 'common.help'
  },
];

/**
 * Common user utility functions
 */
export const getUserDisplayName = (userType: string | null, userEmail: string | null, workerId: string | null): string => {
  if (userType === "admin") {
    // Extract name from email (part before @) or use email if no @ found
    const emailName = userEmail?.split('@')[0] || userEmail || "Admin";
    // Capitalize first letter and replace dots/underscores with spaces
    return emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' ');
  }
  return `Worker ${workerId}`;
};

/**
 * Common logout functionality
 */
export const handleLogout = (navigate: (path: string) => void, t: (key: string, fallback?: string) => string): void => {
  const confirmed = window.confirm(t('auth.confirmLogout', 'Are you sure you want to logout?'));
  if (confirmed) {
    // Clear authentication data
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("workerId");

    // Redirect to login page
    navigate("/login");
  }
};
