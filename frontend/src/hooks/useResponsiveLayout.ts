import { useState, useEffect } from 'react';

export interface ResponsiveLayoutState {
  /** True when viewport width is below 768px (standard mobile layout threshold) */
  isMobile: boolean;
  /** True when viewport width is between 768px and 1023px */
  isTablet: boolean;
  /** True when viewport width is 1024px or higher */
  isDesktop: boolean;
  /** Current viewport width in pixels */
  width: number;
  /** Current viewport height in pixels */
  height: number;
  /** Recommended bottom padding class for dashboard containers to clear the fixed bottom navigation bar */
  bottomNavPaddingClass: string;
}

/**
 * Responsive layout hook that tracks viewport changes across the 768px breakpoint.
 * Enables smooth transitions between desktop sidebar navigation and the fixed BottomNavigation dock.
 *
 * @param breakpoint The pixel width breakpoint (defaults to 768px)
 */
export function useResponsiveLayout(breakpoint: number = 768): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1200,
        height: 800,
        bottomNavPaddingClass: 'pb-28 md:pb-8',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < breakpoint;
    const isTablet = width >= breakpoint && width < 1024;
    const isDesktop = width >= 1024;

    return {
      isMobile,
      isTablet,
      isDesktop,
      width,
      height,
      bottomNavPaddingClass: isMobile ? 'pb-28' : 'pb-8',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < breakpoint;
      const isTablet = width >= breakpoint && width < 1024;
      const isDesktop = width >= 1024;

      setLayout({
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
        bottomNavPaddingClass: isMobile ? 'pb-28' : 'pb-8',
      });
    };

    updateLayout();

    // Use both matchMedia change listener and resize listener for instant responsive updates
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateLayout);
    } else {
      mediaQuery.addListener(updateLayout);
    }

    window.addEventListener('resize', updateLayout);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateLayout);
      } else {
        mediaQuery.removeListener(updateLayout);
      }
      window.removeEventListener('resize', updateLayout);
    };
  }, [breakpoint]);

  return layout;
}

export default useResponsiveLayout;
