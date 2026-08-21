import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, LogOut, Sun, Moon, School, ChevronRight,
  ShieldCheck, User, Bell
} from 'lucide-react';

export interface DrawerNavGroup {
  title?: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    isActive?: boolean;
    badge?: string | number;
  }[];
}

export interface UserProfileSummary {
  name: string;
  role: string;
  idOrAdmission?: string;
  subDetail?: string;
  avatarUrl?: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  profile?: UserProfileSummary;
  groups: DrawerNavGroup[];
  onLogout?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  title = 'ALIKA MEDICAL',
  subtitle = 'Management Portal',
  profile,
  groups,
  onLogout,
  darkMode,
  onToggleDarkMode,
}: MobileNavDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative flex w-[85vw] max-w-xs flex-col bg-slate-900 dark:bg-slate-950 text-slate-200 shadow-2xl z-10 h-full max-h-screen border-r border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Header with Branding & Close Button */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase leading-none">
                    {title}
                  </h3>
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block mt-1">
                    {subtitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Card if present */}
            {profile && (
              <div className="p-4 mx-4 mt-4 rounded-2xl bg-slate-850/80 border border-slate-800 flex items-center gap-3 shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white leading-tight truncate">
                    {profile.name}
                  </h4>
                  <p className="text-[10px] text-blue-400 font-mono mt-0.5 truncate">
                    {profile.idOrAdmission || profile.role}
                  </p>
                  {profile.subDetail && (
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {profile.subDetail}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Nav Menu Groups */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {groups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  {group.title && (
                    <p className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
                      {group.title}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = !!item.isActive;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge !== null ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${active ? 'text-white' : 'text-slate-600'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions: Theme Toggle & Logout */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                    <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">
                    {darkMode ? 'Active' : 'Off'}
                  </span>
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Portal</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
