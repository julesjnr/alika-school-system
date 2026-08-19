import React from 'react';
import {
  X, School, LogOut, Settings, Moon, Sun, User
} from 'lucide-react';
import {
  UserNavContext,
  getAuthorizedNavItems,
  isItemActive,
} from '../../config/navigation';

export interface DrawerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  onClick: () => void;
  isActive?: boolean;
}

export interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string | null;
  portal?: string | null;
  userName?: string;
  userRoleLabel?: string;
  userAvatar?: string;
  activeTab?: string;
  activeSubTab?: string;
  currentPath?: string;
  permissions?: string[];
  isAccountantView?: boolean;
  isLibrarianView?: boolean;
  isLoading?: boolean;
  menuItems?: DrawerMenuItem[];
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onNavigateItem?: (itemId: string, subTabId?: string) => void;
  onSelectTab?: (tabId: string, subTabId?: string) => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export default function MobileDrawerMenu({
  isOpen,
  onClose,
  role,
  portal,
  userName = 'User',
  userRoleLabel,
  userAvatar,
  activeTab,
  activeSubTab,
  currentPath,
  permissions,
  isAccountantView,
  isLibrarianView,
  isLoading,
  menuItems,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onNavigateItem,
  onSelectTab,
  onOpenProfile,
  onOpenSettings,
}: MobileDrawerMenuProps) {
  if (!isOpen) return null;

  // Build items to render
  let itemsToRender: DrawerMenuItem[] = [];

  if (menuItems && menuItems.length > 0) {
    itemsToRender = menuItems;
  } else if (role && !isLoading) {
    const userContext: UserNavContext = {
      role,
      portal: portal || role,
      permissions,
      isAccountantView,
      isLibrarianView,
      isLoading,
    };

    const authorizedItems = getAuthorizedNavItems(userContext);
    itemsToRender = authorizedItems.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      badge: item.badge,
      badgeColor: item.badgeColor,
      isActive: isItemActive(item, currentPath, activeTab, activeSubTab),
      onClick: () => {
        if (onSelectTab) {
          onSelectTab(item.tabId, item.subTabId);
        }
        if (onNavigateItem) {
          onNavigateItem(item.id, item.subTabId);
        }
      },
    }));

    // Append profile / settings if appropriate
    if (onOpenProfile) {
      itemsToRender.push({
        id: 'profile',
        label: 'My Profile',
        icon: User,
        onClick: onOpenProfile,
        isActive: false,
      });
    }

    if (onOpenSettings) {
      itemsToRender.push({
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        onClick: onOpenSettings,
        isActive: false,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 sm:hidden flex">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative flex w-4/5 max-w-xs flex-col bg-slate-900 text-slate-200 shadow-2xl z-10 h-full border-r border-slate-800 animate-slideRight">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white block uppercase leading-none font-display">
                ALIKA
              </span>
              <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5 font-mono">
                {userRoleLabel || role || 'School Portal'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3.5 mx-3 mt-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {userName}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5 capitalize truncate">
              {userRoleLabel || role}
            </span>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Navigation Menu
          </p>
          {itemsToRender.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer select-none text-left ${
                  item.isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-750'
                }`}
                aria-label={item.label}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-blue-500/20 text-blue-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">{darkMode ? 'Dark' : 'Light'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
}
