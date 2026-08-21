import React from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  action: () => void;
  isActive?: boolean;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  className?: string;
  /** Force visibility regardless of viewport width; defaults to false (responsive below 768px) */
  forceVisible?: boolean;
}

/**
 * BottomNavigation bar component for mobile devices (< 768px).
 * Replaces the desktop-centric sidebar flow on touch devices with ergonomic bottom navigation tabs.
 */
export function BottomNavigation({ items, className = '', forceVisible = false }: BottomNavigationProps) {
  const { isMobile } = useResponsiveLayout(768);

  if (!items || items.length === 0) return null;
  // If not forcing visibility and not on mobile breakpoint, keep hidden
  if (!forceVisible && !isMobile) return null;

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Mobile Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 px-3 transition-all duration-200 ${
        forceVisible ? '' : 'md:hidden'
      } ${className}`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = !!item.isActive;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              type="button"
              onClick={item.action}
              className={`flex-1 min-w-[52px] min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-90 ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'hover:bg-slate-150/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                </div>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-in zoom-in-50 duration-150">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight leading-tight mt-1 max-w-[64px] truncate text-center transition-colors ${
                  active ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Re-export for compatibility
export { BottomNavigation as MobileBottomNav };
export default BottomNavigation;
