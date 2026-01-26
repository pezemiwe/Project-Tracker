import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Sidebar } from '../navigation/Sidebar';
import { ErrorTrigger } from '../dev/ErrorTrigger';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const user = useAuthStore((state) => state.user);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - visible only on mobile */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-20'
        )}
      >
        {children}
      </main>

      {/* Development tools */}
      <ErrorTrigger />
    </div>
  );
}
