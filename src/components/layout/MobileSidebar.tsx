import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Fish, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { getMainNavigation, getGeneralNavigation, getUserDisplayName, handleLogout as commonHandleLogout } from "@/config/navigation";

const MobileSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { openMobile, setOpenMobile } = useSidebar();

  // Get navigation items from shared configuration
  const mainNavigation = getMainNavigation(t);
  const generalNavigation = getGeneralNavigation(t);

  // Handle navigation and close mobile sidebar
  const handleNavigate = (href: string) => {
    navigate(href);
    setOpenMobile(false);
  };

  // Handle logout functionality (mobile-specific with sidebar close)
  const handleLogout = () => {
    const confirmed = window.confirm(t('auth.confirmLogout', 'Are you sure you want to logout?'));
    if (confirmed) {
      // Clear authentication data
      localStorage.removeItem("userType");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("workerId");

      // Close mobile sidebar and redirect to login page
      setOpenMobile(false);
      navigate("/login");
    }
  };

  // Get current user info
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");
  const workerId = localStorage.getItem("workerId");

  // Get the display name for the user
  const getDisplayName = () => getUserDisplayName(userType, userEmail, workerId);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setOpenMobile(false);
  }, [currentPath, setOpenMobile]);

  if (!openMobile) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setOpenMobile(false)}
      />
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out md:hidden",
        openMobile ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-3">
            <Fish className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">LocalFishing</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpenMobile(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6">
            {/* Menu Section */}
            <div className="px-5 mb-8">
              <h3 className="px-2 py-4 text-base font-bold text-muted-foreground uppercase tracking-wider">
                Menu
              </h3>
              <div className="space-y-3 mt-4">
                {mainNavigation.map((item) => (
                  <div key={item.name} className="relative">
                    {/* Left side indicator for selected tab */}
                    {currentPath === item.href && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-14 bg-primary rounded-r-full"></div>
                    )}
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-5 h-14 px-5 mx-2 rounded-lg transition-all duration-200 text-lg font-semibold",
                        currentPath === item.href
                          ? "bg-primary/10 text-primary font-bold shadow-sm"
                          : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground hover:shadow-sm"
                      )}
                      onClick={() => handleNavigate(item.href)}
                    >
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      <span className="truncate font-semibold">{item.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 my-6 border-t border-border"></div>

            {/* General Section */}
            <div className="px-5">
              <h3 className="px-2 py-4 text-base font-bold text-muted-foreground uppercase tracking-wider">
                General
              </h3>
              <div className="space-y-3 mt-4">
                {generalNavigation.map((item) => (
                  <div key={item.name} className="relative">
                    {/* Left side indicator for selected tab */}
                    {currentPath === item.href && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-14 bg-primary rounded-r-full"></div>
                    )}
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-5 h-14 px-5 mx-2 rounded-lg transition-all duration-200 text-lg font-semibold",
                        currentPath === item.href
                          ? "bg-primary/10 text-primary font-bold shadow-sm"
                          : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground hover:shadow-sm"
                      )}
                      onClick={() => handleNavigate(item.href)}
                    >
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      <span className="truncate font-semibold">{item.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6">
            {/* User Info with Logout Button */}
            <div className="flex items-center gap-5 p-5 rounded-lg bg-muted/50">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {userType === "admin" ? "AD" : "WK"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold truncate">
                  {getDisplayName()}
                </p>
                <p className="text-base text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                title={t('common.logout', 'Logout')}
              >
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
