
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Fish, Package, Users, TrendingUp, FileText, MenuIcon, DollarSign, FolderOpen, LogOut, Receipt, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();

  // Navigation items with translation keys
  const navigation = [
    { name: t('navigation.dashboard'), href: "/", icon: Home, key: "dashboard" },
    { name: t('navigation.inventory'), href: "/inventory", icon: Fish, key: "inventory" },
    { name: t('navigation.sales'), href: "/sales", icon: TrendingUp, key: "sales" },
    { name: t('navigation.customers'), href: "/customers", icon: Users, key: "customers" },
    { name: "Transactions", href: "/transactions", icon: Receipt, key: "transactions" },
    { name: t('navigation.expenses'), href: "/expenses", icon: DollarSign, key: "expenses" },
    { name: t('navigation.documents'), href: "/documents", icon: FolderOpen, key: "documents" },
    { name: t('navigation.reports'), href: "/reports", icon: FileText, key: "reports" },
    { name: t('navigation.staff'), href: "/staff", icon: Users, key: "staff" },
    { name: t('navigation.settings'), href: "/settings", icon: Settings, key: "settings" },
  ];

  // Handle logout functionality
  const handleLogout = () => {
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

  // Get current user info
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");
  const workerId = localStorage.getItem("workerId");

  return (
    <SidebarContainer collapsible="icon">
      <SidebarHeader className={cn(
        "flex h-14 items-center border-b",
        state === "collapsed" ? "justify-center px-2" : "justify-between px-4"
      )}>
        {state === "collapsed" ? (
          <SidebarTrigger className="h-8 w-8">
            <MenuIcon className="h-4 w-4" />
          </SidebarTrigger>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Fish className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-semibold">LocalFishing</span>
            </div>
            <SidebarTrigger className="h-8 w-8">
              <MenuIcon className="h-4 w-4" />
            </SidebarTrigger>
          </>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    className={cn(
                      currentPath === item.href ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
                      "w-full justify-start"
                    )}
                    onClick={() => navigate(item.href)}
                    tooltip={item.name}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className={cn(
        "border-t",
        state === "collapsed" ? "p-2 space-y-2" : "p-4 space-y-3"
      )}>
        {state === "collapsed" ? (
          // Collapsed state - show avatar and logout button vertically
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center cursor-pointer">
                  <span className="font-medium text-blue-600 dark:text-blue-300">
                    {userType === "admin" ? "AD" : "WK"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="text-sm font-medium">
                    {userType === "admin" ? "Admin User" : "Worker"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userType === "admin" ? userEmail : `Worker ID: ${workerId}`}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          // Expanded state - show user info and logout button
          <>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="font-medium text-blue-600 dark:text-blue-300">
                  {userType === "admin" ? "AD" : "WK"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {userType === "admin" ? "Admin User" : "Worker"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userType === "admin" ? userEmail : `Worker ID: ${workerId}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SidebarFooter>

      {/* Rail for expanding collapsed sidebar */}
      <SidebarRail />
    </SidebarContainer>
  );
};

export default Sidebar;
