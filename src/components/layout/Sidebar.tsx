
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Fish, Package, ShoppingCart, Users, TrendingUp, FileText, MenuIcon, DollarSign, FolderOpen, LogOut } from "lucide-react";
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

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Product Inventory", href: "/inventory", icon: Fish },
  { name: "Product Catalog", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Sales & Analytics", href: "/sales", icon: TrendingUp },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
  { name: "Documents", href: "/documents", icon: FolderOpen },
  { name: "Reports", href: "/reports", icon: FileText },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();

  // Handle logout functionality
  const handleLogout = () => {
    // Add confirmation dialog
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      // Add your logout logic here
      console.log("Logging out...");
      // For example: clear tokens, redirect to login, etc.
      // localStorage.removeItem("authToken");
      // navigate("/login");
      alert("Logout functionality would be implemented here");
    }
  };

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
              <span className="text-xl font-semibold">AquaManage</span>
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
                <div className="h-8 w-8 rounded-full bg-emplify-100 flex items-center justify-center cursor-pointer">
                  <span className="font-medium text-emplify-600">AD</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@emplify.com</p>
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
              <div className="h-8 w-8 rounded-full bg-emplify-100 flex items-center justify-center">
                <span className="font-medium text-emplify-600">AD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@emplify.com</p>
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
