import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications';
import { Bell } from 'lucide-react';
import { useAnnouncer } from '../../hooks/useAnnouncer';
import { cn } from '../../lib/utils';

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { announce } = useAnnouncer();

  const { data: notifications = [] } = useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Announce unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      announce(`You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`, 'polite');
    }
  }, [unreadCount, announce]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: string, link?: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      setIsOpen(false);
      if (link) {
        navigate({ to: link });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      announce('All notifications marked as read', 'polite');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      announce('Failed to mark notifications as read', 'assertive');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          'relative p-2 rounded-lg transition-colors duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Notifications menu"
          className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-96 max-w-md bg-card rounded-lg shadow-xl border border-border/40 z-50 ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 gap-2">
            <h3 className="font-semibold text-sm text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                aria-label="Mark all notifications as read"
                className={cn(
                  'text-xs text-primary hover:text-primary/80 font-medium transition-colors whitespace-nowrap',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1'
                )}
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            className="max-h-[60vh] sm:max-h-96 overflow-y-auto scrollbar-thin"
            role="region"
            aria-live="polite"
            aria-label="Notification list"
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    role="menuitem"
                    onClick={() =>
                      handleNotificationClick(notification.id, notification.link)
                    }
                    aria-label={`${notification.title}. ${notification.message}. ${!notification.isRead ? 'Unread.' : 'Read.'}`}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors duration-200 min-h-[60px]',
                      'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                      !notification.isRead ? 'bg-primary/5' : ''
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div
                          className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1.5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-border/40 text-center bg-muted/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate({ to: '/approvals' });
                }}
                aria-label="Navigate to all approvals page"
                className={cn(
                  'text-xs text-primary hover:text-primary/80 font-medium transition-colors w-full flex items-center justify-center py-1',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'
                )}
              >
                View all approvals
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
