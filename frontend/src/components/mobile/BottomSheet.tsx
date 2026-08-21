import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showHandle?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
  showHandle = true,
}: BottomSheetProps) {
  // Prevent background scroll when open
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

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'sm:max-w-sm';
      case 'md':
        return 'sm:max-w-md';
      case 'lg':
        return 'sm:max-w-lg';
      case 'xl':
        return 'sm:max-w-xl';
      case '2xl':
        return 'sm:max-w-2xl';
      case 'full':
        return 'sm:max-w-4xl';
      default:
        return 'sm:max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container: Slide-up Bottom Sheet on mobile (<640px), Centered Dialog on sm+ */}
      <div 
        className={`relative w-full ${getMaxWidthClass()} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10 animate-slideUp sm:animate-scaleIn overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator Handle */}
        {showHandle && (
          <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Optional Fixed Footer Actions */}
        {footer && (
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-150 dark:border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
