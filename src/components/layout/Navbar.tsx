
import { MenuIcon, Bell, UserRound, Sun, Moon, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotifications } from "@/hooks/use-notifications";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useUser, getUserDisplayName } from "@/hooks/use-user";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { t } = useTranslation();
  const { toggleSidebar, state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const userInfo = useUser();
  
  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex h-14 items-center border-b px-4 md:px-6 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side - Mobile menu & title */}
      <div className="flex items-center">
        {/* Mobile menu button - only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden mr-2"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>

        {/* Desktop sidebar toggle - only visible when sidebar is collapsed */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 mr-2 hidden md:flex transition-all duration-200 ease-in-out ${
            state === "collapsed"
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none"
          }`}
          onClick={toggleSidebar}
          title="Expand sidebar"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Expand sidebar</span>
        </Button>


      </div>

      {/* Right side - Account & action buttons */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">{t('notifications.title', 'Notifications')}</span>
            </Button>
          </DropdownMenuTrigger>

        {/* Time display */}
        <div className="hidden md:flex items-center ml-4 px-3 py-1 rounded-lg bg-muted/50 text-sm">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="tabular-nums tracking-tighter font-medium">
            {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <DropdownMenuLabel className="p-0">{t('notifications.title', 'Notifications')}</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  {t('notifications.markAllAsRead', 'Mark all as read')}
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t('notifications.noNotifications', 'No notifications')}
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center justify-center text-sm text-muted-foreground">
                  {t('notifications.viewAll', 'View all notifications')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={toggleTheme}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('common.toggleTheme', 'Toggle theme')}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

        {/* Time display */}
        <div className="hidden md:flex items-center ml-4 px-3 py-1 rounded-lg bg-muted/50 text-sm">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="tabular-nums tracking-tighter font-medium">
            {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>

          {/* Time display should be positioned here */}
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('common.profile', 'My Account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('common.profile', 'Profile')}</DropdownMenuItem>
            <DropdownMenuItem>{t('common.settings', 'Settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('common.logout', 'Log out')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time display */}
        <div className="hidden md:flex items-center ml-4 px-3 py-1 rounded-lg bg-muted/50 text-sm">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="tabular-nums tracking-tighter font-medium">
            {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>
      </div>

      {/* Time display */}
      <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="tabular-nums tracking-tighter font-medium">
          {currentTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })}
        </span>
      </div>
    </div>
  );
};

export default Navbar;
