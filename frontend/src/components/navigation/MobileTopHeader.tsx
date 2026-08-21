import React from 'react';
import { Menu, Bell, School, Sun, Moon } from 'lucide-react';

interface MobileTopHeaderProps {
  onOpenMenu: () => void;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  rightAction?: React.ReactNode;
}

export default function MobileTopHeader({
  onOpenMenu,
  title = 'ALIKA',
  subtitle,
  badgeText,
  notificationCount = 0,
  onOpenNotifications,
  darkMode,
  onToggleDarkMode,
  rightAction,
}: MobileTopHeaderProps) {
  return (
    <header
      id="mobile-top-header"
      className="md:hidden sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 px-4 py-2.5 pt-[calc(0.6rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-2xs transition-colors duration-300"
    >
      {/* Left: Hamburger Menu + Logo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1.5"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <School className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight uppercase leading-none truncate">
                {title}
              </span>
              {badgeText && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight mt-0.5 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        )}

        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )}

        {rightAction}
      </div>
    </header>
  );
}
