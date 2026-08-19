import React from 'react';
import { 
  X, Bell, CheckCheck, Trash2, Clock, 
  CreditCard, UserCheck, Calendar, BookOpen, AlertCircle, FileText
} from 'lucide-react';
import { InAppNotification } from '../../types';

interface NotificationSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotification?: (id: string) => void;
}

export default function NotificationSlideOver({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
}: NotificationSlideOverProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return {
          icon: CreditCard,
          dotColor: 'bg-emerald-500',
          badgeText: 'Payment',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'consultation':
      case 'application':
      case 'admission':
        return {
          icon: UserCheck,
          dotColor: 'bg-rose-500',
          badgeText: 'Application',
          badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      case 'academic':
      case 'grade':
        return {
          icon: FileText,
          dotColor: 'bg-amber-500',
          badgeText: 'Academic',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'library':
      default:
        return {
          icon: BookOpen,
          dotColor: 'bg-blue-500',
          badgeText: 'Library',
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel (or bottom sheet on smallest mobile) */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full z-10 border-l border-slate-200 dark:border-slate-800 animate-slideLeft">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                System alerts, payments & academic updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action bar */}
        {notifications.length > 0 && onMarkAllAsRead && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium font-mono">
              Total {notifications.length} notices
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <Bell className="w-10 h-10 mb-2 opacity-40 animate-pulse" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notifications yet
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                You will receive alerts here when events occur in the system.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const meta = getNotificationIcon(notif.type);
              const isUnread = notif.status === 'unread';

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead && isUnread && onMarkAsRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    isUnread
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-xs'
                      : 'bg-white dark:bg-slate-850/60 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotColor}`} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${meta.badgeClass}`}>
                        {meta.badgeText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.dateTime || 'Just now'}
                      </span>
                      {onClearNotification && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearNotification(notif.id);
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 leading-snug">
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
