import React from 'react';
import { Menu } from 'lucide-react';
import {
  NavigationItem,
  UserNavContext,
  getPrimaryNavItems,
  getSecondaryNavItems,
  isItemActive,
} from '../../config/navigation';

export type MobileTabId =
  // Admin tabs
  | 'overview' | 'academics' | 'finances' | 'payroll' | 'inventory' | 'roles' | 'library' | 'diagnostics' | 'admissions'
  // Student tabs
  | 'dashboard' | 'grades' | 'financials' | 'materials' | 'units' | 'officeHours'
  // Lecturer tabs
  | 'workstation' | 'grading' | 'classlist' | 'schedule' | 'attendance' | 'lookup' | 'books'
  // HR / Generic tabs
  | 'home' | 'staff' | 'leave' | 'more';

export interface MobileBottomNavProps {
  role?: 'admin' | 'super_admin' | 'admissions_officer' | 'lecturer' | 'student' | 'accountant' | 'librarian' | 'hr' | 'hr_officer' | string | null;
  portal?: string | null;
  activeTab?: string;
  activeSubTab?: string;
  currentPath?: string;
  permissions?: string[];
  isAccountantView?: boolean;
  isLibrarianView?: boolean;
  isLoading?: boolean;
  onSelectTab: (tab: any, subTab?: string) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenDrawer: () => void;
  customPrimaryItems?: NavigationItem[];
}

export default function MobileBottomNav({
  role,
  portal,
  activeTab = '',
  activeSubTab,
  currentPath,
  permissions,
  isAccountantView,
  isLibrarianView,
  isLoading,
  onSelectTab,
  onNavigateRoute,
  onOpenDrawer,
  customPrimaryItems,
}: MobileBottomNavProps) {
  // Prevent unauthorized navigation items from flashing when unauthenticated or loading
  if (isLoading || !role) {
    return null;
  }

  const userContext: UserNavContext = {
    role,
    portal: portal || role,
    permissions,
    isAccountantView,
    isLibrarianView,
    isLoading,
  };

  const primaryItems: NavigationItem[] = customPrimaryItems && customPrimaryItems.length > 0
    ? customPrimaryItems
    : getPrimaryNavItems(userContext);

  const secondaryItems: NavigationItem[] = getSecondaryNavItems(userContext);

  if (primaryItems.length === 0 && secondaryItems.length === 0) {
    return null;
  }

  // Check if any secondary (More menu) item is currently active
  const isAnySecondaryActive = secondaryItems.some(item =>
    isItemActive(item, currentPath, activeTab, activeSubTab)
  );

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 inset-x-0 h-16 sm:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around z-40 px-2 shadow-lg transition-colors"
    >
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item, currentPath, activeTab, activeSubTab);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectTab(item.tabId, item.subTabId);
              if (item.route && onNavigateRoute) {
                onNavigateRoute(item.route);
              }
            }}
            className={`flex-1 min-h-[44px] h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              active
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
            aria-label={item.label}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${active ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </div>
            <span className="text-[11px] leading-tight tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* MORE BUTTON (Opens drawer for secondary authorized items) */}
      {secondaryItems.length > 0 && (
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`flex-1 min-h-[44px] h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
            isAnySecondaryActive
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
          aria-label="More options"
        >
          <div className={`relative p-1 rounded-lg transition-colors ${isAnySecondaryActive ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <Menu className={`w-5 h-5 transition-transform ${isAnySecondaryActive ? 'scale-110' : ''}`} />
            {isAnySecondaryActive && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </div>
          <span className="text-[11px] leading-tight tracking-tight">
            More
          </span>
        </button>
      )}
    </nav>
  );
}
