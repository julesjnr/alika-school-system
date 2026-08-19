import React, { useState } from 'react';
import { Search, X, Filter, ChevronRight, Eye, MoreHorizontal } from 'lucide-react';

export interface FilterPill {
  id: string;
  label: string;
  count?: number;
}

export interface ResponsiveCardItem {
  id: string;
  identifier: string;
  identifierBadge?: string;
  status?: string;
  statusType?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  title: string;
  subtitle?: string;
  metaFields?: Array<{ label: string; value: React.ReactNode }>;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActions?: Array<{ label: string; onClick: () => void; destructive?: boolean }>;
}

interface ResponsiveTableCardProps {
  items: ResponsiveCardItem[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterPills?: FilterPill[];
  activeFilterId?: string;
  onFilterSelect?: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  desktopTable?: React.ReactNode;
}

export default function ResponsiveTableCard({
  items,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterPills = [],
  activeFilterId = 'all',
  onFilterSelect,
  isLoading = false,
  emptyMessage = 'No records found matching your filters.',
  desktopTable,
}: ResponsiveTableCardProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getStatusBadgeClass = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'danger':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'info':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full space-y-4 font-sans">
      {/* Mobile Stacked Card View (< 640px) */}
      <div className="block sm:hidden space-y-3">
        {/* Sticky Search and Filter Header */}
        <div className="sticky top-14 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-1 pb-3 space-y-2.5">
          {onSearchChange && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Pills Tag Row */}
          {filterPills.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filterPills.map((pill) => {
                const isActive = activeFilterId === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onFilterSelect && onFilterSelect(pill.id)}
                    className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{pill.label}</span>
                    {pill.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {pill.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stacked Cards List */}
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 relative transition-shadow hover:shadow-md"
              >
                {/* Card Header: Identifier & Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900 truncate">
                      {item.identifier}
                    </span>
                    {item.identifierBadge && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.identifierBadge}
                      </span>
                    )}
                  </div>

                  {item.status && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadgeClass(item.statusType)}`}>
                      {item.status}
                    </span>
                  )}
                </div>

                {/* Card Body: Name, Department, Details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Meta Fields Grid */}
                {item.metaFields && item.metaFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    {item.metaFields.map((field, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {field.label}
                        </span>
                        <div className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate">
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Footer: Primary Action & Menu */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
                  {item.onPrimaryAction ? (
                    <button
                      type="button"
                      onClick={item.onPrimaryAction}
                      className="h-10 flex-1 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{item.primaryActionLabel || 'View Record'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  ) : <div className="flex-1" />}

                  {item.secondaryActions && item.secondaryActions.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {activeMenuId === item.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveMenuId(null)} 
                          />
                          <div className="absolute right-0 bottom-12 z-40 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 divide-y divide-slate-100 dark:divide-slate-700">
                            {item.secondaryActions.map((sec, secIdx) => (
                              <button
                                key={secIdx}
                                type="button"
                                onClick={() => {
                                  sec.onClick();
                                  setActiveMenuId(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                  sec.destructive
                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {sec.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block">
        {desktopTable}
      </div>
    </div>
  );
}
