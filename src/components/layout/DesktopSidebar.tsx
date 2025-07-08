import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Fish, MenuIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getMainNavigation, getGeneralNavigation, getUserDisplayName, handleLogout as commonHandleLogout } from "@/config/navigation";

const DesktopSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();

  // Get navigation items from shared configuration
  const mainNavigation = getMainNavigation(t);
  const generalNavigation = getGeneralNavigation(t);

  // Get current user info
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");
  const workerId = localStorage.getItem("workerId");

  // Get the display name for the user
  const getDisplayName = () => getUserDisplayName(userType, userEmail, workerId);

  // Handle logout functionality
  const handleLogout = () => {
    // Create a wrapper function that matches the expected signature
    const translationWrapper = (key: string, fallback?: string) => t(key, fallback);
    commonHandleLogout(navigate, translationWrapper);
  };

  return (
    <SidebarContainer collapsible="icon" className="hidden md:flex">
      <SidebarHeader className={cn(
        "flex h-14 items-center border-b",
        state === "collapsed" ? "justify-center px-2" : "px-4"
      )}>
        {state === "collapsed" ? (
          <SidebarTrigger className="h-8 w-8">
            <MenuIcon className="h-4 w-4" />
          </SidebarTrigger>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <Fish className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">LocalFishing</span>
            <SidebarTrigger className="h-8 w-8 ml-auto">
              <MenuIcon className="h-4 w-4" />
            </SidebarTrigger>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {/* Menu Section */}
        <SidebarGroup>
          {state !== "collapsed" && (
            <SidebarGroupLabel className="px-4 py-2 text-xs font-bold text-foreground/70 uppercase tracking-widest">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className={cn(
            state === "collapsed" ? "px-1" : "px-3"
          )}>
            <SidebarMenu className="space-y-1">
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.name} className="relative">
                  {/* Left side indicator for selected tab */}
                  {currentPath === item.href && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"></div>
                  )}
                  <SidebarMenuButton
                    className={cn(
                      "rounded-md transition-all duration-200 text-xs py-1.5 h-7 font-medium",
                      currentPath === item.href
                        ? "bg-primary/15 text-primary font-semibold shadow-sm border border-primary/20"
                        : "hover:bg-accent/60 hover:text-foreground text-foreground/80 hover:shadow-sm hover:font-medium",
                      state === "collapsed"
                        ? "justify-center mx-1 w-9 h-9 p-0"
                        : "justify-start gap-2.5 mx-3"
                    )}
                    onClick={() => navigate(item.href)}
                    tooltip={item.name}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0",
                      state === "collapsed"
                        ? "h-5 w-5 text-foreground/90"
                        : "h-3.5 w-3.5"
                    )} />
                    {state !== "collapsed" && (
                      <span className="truncate font-medium tracking-wide">{item.name}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        {state !== "collapsed" && (
          <div className="mx-4 mt-2 mb-0.1 border-t border-border"></div>
        )}

        {/* General Section */}
        <SidebarGroup>
          {state !== "collapsed" && (
            <SidebarGroupLabel className="px-4 py-1 text-xs font-bold text-foreground/70 uppercase tracking-widest">
              General
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className={cn(
            state === "collapsed" ? "px-1" : "px-3"
          )}>
            <SidebarMenu className="space-y-1">
              {generalNavigation.map((item) => (
                <SidebarMenuItem key={item.name} className="relative">
                  {/* Left side indicator for selected tab */}
                  {currentPath === item.href && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"></div>
                  )}
                  <SidebarMenuButton
                    className={cn(
                      "rounded-md transition-all duration-200 text-xs py-1.5 h-7 font-medium",
                      currentPath === item.href
                        ? "bg-primary/15 text-primary font-semibold shadow-sm border border-primary/20"
                        : "hover:bg-accent/60 hover:text-foreground text-foreground/80 hover:shadow-sm hover:font-medium",
                      state === "collapsed"
                        ? "justify-center mx-1 w-9 h-9 p-0"
                        : "justify-start gap-2.5 mx-3"
                    )}
                    onClick={() => navigate(item.href)}
                    tooltip={item.name}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0",
                      state === "collapsed"
                        ? "h-5 w-5 text-foreground/90"
                        : "h-3.5 w-3.5"
                    )} />
                    {state !== "collapsed" && (
                      <span className="truncate font-medium tracking-wide">{item.name}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className={cn(
        "border-t",
        state === "collapsed" ? "p-2" : "p-4"
      )}>
        {state === "collapsed" ? (
          // Collapsed state - show only avatar centered
          <div className="flex items-center justify-center">
            <Avatar className="h-8 w-8" title={getDisplayName()}>
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {userType === "admin" ? "AD" : "WK"}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          // Expanded state - show user info with logout button on the right
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {userType === "admin" ? "AD" : "WK"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              title={t('common.logout', 'Logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </SidebarContainer>
  );
};

export default DesktopSidebar;
