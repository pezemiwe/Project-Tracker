import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Target,
  Activity,
  BarChart3,
  CheckCircle,
  Users,
  FileText,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore, UserRole } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { NavItem } from "./NavItem";
import { ThemeToggle } from "../ui/theme-toggle";
import { cn } from "@/lib/utils";

interface NavRoute {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  allowedRoles?: UserRole[];
}

const routes: NavRoute[] = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/objectives",
    icon: Target,
    label: "Objectives",
  },
  {
    to: "/activities",
    icon: Activity,
    label: "Activities",
  },
  {
    to: "/spend-analysis",
    icon: BarChart3,
    label: "Spend Analysis",
  },
  {
    to: "/approvals",
    icon: CheckCircle,
    label: "Approvals",
  },
  {
    to: "/users",
    icon: Users,
    label: "Users",
    allowedRoles: ["Admin"],
  },
  {
    to: "/audit",
    icon: FileText,
    label: "Audit",
    allowedRoles: ["Admin", "Auditor"],
  },
  {
    to: "/import-export",
    icon: Upload,
    label: "Import/Export",
    allowedRoles: ["Admin"],
  },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    allowedRoles: ["Admin"],
  },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { theme } = useTheme();
  const { mutate: logout } = useLogout();
  const navRef = useRef<HTMLElement>(null);

  if (!user) return null;

  const filteredRoutes = routes.filter((route) => {
    if (!route.allowedRoles) return true;
    return route.allowedRoles.includes(user.role);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!navRef.current) return;

      const links = Array.from(
        navRef.current.querySelectorAll<HTMLAnchorElement>(
          'a[role="menuitem"]',
        ),
      );

      if (links.length === 0) return;

      const currentIndex = links.findIndex(
        (link) => link === document.activeElement,
      );

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const nextIndex =
            currentIndex < links.length - 1 ? currentIndex + 1 : 0;
          links[nextIndex]?.focus();
          break;

        case "ArrowUp":
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : links.length - 1;
          links[prevIndex]?.focus();
          break;

        case "Home":
          e.preventDefault();
          links[0]?.focus();
          break;

        case "End":
          e.preventDefault();
          links[links.length - 1]?.focus();
          break;
      }
    };

    const nav = navRef.current;
    nav?.addEventListener("keydown", handleKeyDown);

    return () => {
      nav?.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredRoutes.length]);

  return (
    <aside
      role="navigation"
      aria-label="Main navigation sidebar"
      className={cn(
        "group/sidebar fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-40",
        "flex flex-col",
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        sidebarCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="px-6 py-6 transition-all duration-300 bg-[#1a365d]/5 dark:bg-[#1a365d]/10">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-lg bg-[#1a365d] dark:bg-[#1a365d] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
              OVERSIGHT
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-[#1a365d] dark:bg-[#1a365d] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-2 px-3"
        role="menu"
        aria-label="Primary navigation menu"
      >
        <div className="space-y-1">
          {filteredRoutes.map((route, index) => (
            <NavItem
              key={route.to}
              to={route.to}
              icon={route.icon}
              label={route.label}
              collapsed={sidebarCollapsed}
              index={index}
            />
          ))}
        </div>
      </nav>

      <div className="relative p-4 border-t border-[#1a365d]/20 dark:border-[#1a365d]/30 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-3 -top-3 z-50",
            "h-6 w-6 flex items-center justify-center",
            "bg-[#1a365d] dark:bg-[#1a365d] text-white",
            "border border-[#1a365d] dark:border-[#1a365d]",
            "rounded-full shadow-sm",
            "transition-all duration-300",
            "opacity-0 group-hover/sidebar:opacity-100 focus-visible:opacity-100",
            "hover:bg-[#059669] dark:hover:bg-[#059669]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]",
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div
          className={cn(
            "flex items-center rounded-lg p-2 -m-2",
            "hover:bg-[#1a365d]/5 dark:hover:bg-[#1a365d]/10 transition-colors",
            sidebarCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 text-[#1a365d] dark:text-[#1a365d]/80">
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
          )}
          <ThemeToggle />
        </div>

        <div
          className={cn(
            "flex items-center",
            sidebarCollapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-sm text-slate-700 dark:text-slate-200">
              {user.fullName.charAt(0)}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.fullName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
