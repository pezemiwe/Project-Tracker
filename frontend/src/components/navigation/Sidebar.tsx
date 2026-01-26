import { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useLogout } from '@/hooks/useAuth';
import { NavItem } from './NavItem';
import { RoleBadge } from './RoleBadge';
import { ThemeToggle } from '../ui/theme-toggle';
import { cn } from '@/lib/utils';

interface NavRoute {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  allowedRoles?: UserRole[];
}

const routes: NavRoute[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/objectives',
    icon: Target,
    label: 'Objectives',
  },
  {
    to: '/activities',
    icon: Activity,
    label: 'Activities',
  },
  {
    to: '/spend-analysis',
    icon: BarChart3,
    label: 'Spend Analysis',
  },
  {
    to: '/approvals',
    icon: CheckCircle,
    label: 'Approvals',
  },
  {
    to: '/users',
    icon: Users,
    label: 'Users',
    allowedRoles: ['Admin'],
  },
  {
    to: '/audit',
    icon: FileText,
    label: 'Audit',
    allowedRoles: ['Admin', 'Auditor'],
  },
  {
    to: '/import-export',
    icon: Upload,
    label: 'Import/Export',
    allowedRoles: ['Admin'],
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    allowedRoles: ['Admin'],
  },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { mutate: logout } = useLogout();
  const navRef = useRef<HTMLElement>(null);

  if (!user) return null;

  const filteredRoutes = routes.filter((route) => {
    if (!route.allowedRoles) return true;
    return route.allowedRoles.includes(user.role);
  });

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!navRef.current) return;

      const links = Array.from(
        navRef.current.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]')
      );

      if (links.length === 0) return;

      const currentIndex = links.findIndex((link) => link === document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < links.length - 1 ? currentIndex + 1 : 0;
          links[nextIndex]?.focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : links.length - 1;
          links[prevIndex]?.focus();
          break;

        case 'Home':
          e.preventDefault();
          links[0]?.focus();
          break;

        case 'End':
          e.preventDefault();
          links[links.length - 1]?.focus();
          break;
      }
    };

    const nav = navRef.current;
    nav?.addEventListener('keydown', handleKeyDown);

    return () => {
      nav?.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredRoutes.length]);

  return (
    <aside
      role="navigation"
      aria-label="Main navigation sidebar"
      className={cn(
        'fixed left-0 top-0 h-screen bg-background border-r border-border/40 transition-all duration-300 ease-in-out z-40',
        'flex flex-col',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-14 border-b border-border/40">
        {!sidebarCollapsed && (
          <div className="flex flex-col gap-1 animate-fade-in">
            <h1 className="font-semibold text-lg text-foreground tracking-tight">
              Oversight Platform
            </h1>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            sidebarCollapsed && 'mx-auto'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User Info */}
      <section
        className="p-4 border-b border-border/40"
        aria-label="User information"
      >
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <div
              className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm shadow-sm"
              role="img"
              aria-label={`${user.fullName} avatar`}
            >
              {user.fullName.charAt(0)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-fade-in">
            <div
              className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm shadow-sm flex-shrink-0"
              role="img"
              aria-label={`${user.fullName} avatar`}
            >
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.fullName}
              </p>
              <RoleBadge role={user.role} className="mt-1" />
            </div>
          </div>
        )}
      </section>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-4 px-2"
        role="menu"
        aria-label="Primary navigation menu"
      >
        <div className="space-y-1">
          {filteredRoutes.map((route, index) => (
            <div
              key={route.to}
            >
              <NavItem
                to={route.to}
                icon={route.icon}
                label={route.label}
                collapsed={sidebarCollapsed}
                index={index}
              />
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 space-y-4">
        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center w-full p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors group',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            sidebarCollapsed ? 'justify-center' : 'gap-3'
          )}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="w-5 h-5 group-hover:text-destructive transition-colors" />
          {!sidebarCollapsed && (
            <span className="font-medium animate-fade-in">Log out</span>
          )}
        </button>

        <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          <ThemeToggle />
          {!sidebarCollapsed && (
            <div className="text-xs text-muted-foreground animate-fade-in font-mono">
              v1.0.0
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
