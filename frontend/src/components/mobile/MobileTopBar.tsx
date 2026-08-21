import React from 'react';
import { Menu, Bell, School, User as UserIcon } from 'lucide-react';

export interface MobileTopBarProps {
  title?: string;
  subtitle?: string;
  userRole?: string;
  userName?: string;
  userAvatar?: string;
  unreadNotificationsCount?: number;
  onOpenDrawer: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

export default function MobileTopBar({
  title = 'ALIKA',
  subtitle,
  userRole,
  userName,
  userAvatar,
  unreadNotificationsCount = 0,
  onOpenDrawer,
  onOpenNotifications,
  onOpenProfile,
}: MobileTopBarProps) {
  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'Admin';
      case 'lecturer':
      case 'faculty':
        return 'Lecturer';
      case 'student':
        return 'Student';
      case 'hr':
      case 'hr_officer':
      case 'hr_manager':
        return 'HR';
      case 'accountant':
        return 'Finance';
      case 'librarian':
        return 'Library';
      case 'admissions_officer':
        return 'Admissions';
      default:
        return role || 'Portal';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3.5 flex items-center justify-between shadow-xs transition-colors font-sans sm:hidden">
      {/* Left: Hamburger Icon (☰) & Logo ("ALIKA") */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shrink-0"
          aria-label="Open navigation drawer"
          title="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand: Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-blue-500/30">
            <School className="w-4 h-4" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                {title}
              </span>
              {userRole && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  {getRoleBadge(userRole)}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Notifications (🔔) & Profile Avatar (👤) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenNotifications || onOpenDrawer}
          className="relative min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          aria-label={`Notifications (${unreadNotificationsCount} unread)`}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenProfile || onOpenDrawer}
          className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-xl p-0.5 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer shrink-0"
          aria-label="User profile menu"
          title={userName || 'User Profile'}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || 'User'}
              className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {userName ? userName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
