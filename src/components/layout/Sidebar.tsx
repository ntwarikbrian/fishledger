import DesktopSidebar from "./DesktopSidebar";
import MobileSidebar from "./MobileSidebar";

/**
 * Main Sidebar Component
 * Renders appropriate sidebar based on screen size:
 * - Desktop: Full-featured collapsible sidebar with shadcn/ui components
 * - Mobile: Overlay sidebar with backdrop and slide-in animation
 */
const Sidebar = () => {
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <DesktopSidebar />

      {/* Mobile Sidebar - Hidden on desktop */}
      <MobileSidebar />
    </>
  );
};

export default Sidebar;