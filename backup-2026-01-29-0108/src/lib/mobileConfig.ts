// Mobile Configuration & Constants
// הגדרות גלובליות למובייל

export const MOBILE_CONFIG = {
  // Breakpoints (px)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Touch targets (minimum recommended)
  touchTarget: {
    min: 44, // Minimum size in pixels
    comfortable: 48,
    large: 56,
  },

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
    verySlow: 500,
  },

  // Swipe thresholds
  swipe: {
    minDistance: 50, // Minimum distance to register swipe
    maxTime: 300, // Maximum time for swipe gesture
    threshold: 80, // Action trigger threshold
  },

  // Pull to refresh
  pullToRefresh: {
    threshold: 80,
    resistance: 0.5,
    maxPull: 120,
  },

  // Bottom navigation
  bottomNav: {
    height: 64,
    maxItems: 5,
    safeArea: 16,
  },

  // Floating action button
  fab: {
    size: {
      small: 48,
      medium: 56,
      large: 64,
    },
    position: {
      offset: 16,
      offsetSm: 24,
    },
  },

  // Dialog/Modal
  dialog: {
    mobileBreakpoint: 768,
    maxHeight: '90vh',
    fullScreenBreakpoint: 640,
  },

  // Typography scale
  typography: {
    xs: {
      mobile: '10px',
      desktop: '12px',
    },
    sm: {
      mobile: '12px',
      desktop: '14px',
    },
    base: {
      mobile: '14px',
      desktop: '16px',
    },
    lg: {
      mobile: '16px',
      desktop: '18px',
    },
    xl: {
      mobile: '18px',
      desktop: '20px',
    },
  },

  // Spacing scale (for responsive utilities)
  spacing: {
    xs: {
      mobile: '0.5rem', // 8px
      tablet: '0.75rem', // 12px
      desktop: '1rem', // 16px
    },
    sm: {
      mobile: '0.75rem', // 12px
      tablet: '1rem', // 16px
      desktop: '1.25rem', // 20px
    },
    md: {
      mobile: '1rem', // 16px
      tablet: '1.25rem', // 20px
      desktop: '1.5rem', // 24px
    },
    lg: {
      mobile: '1.25rem', // 20px
      tablet: '1.5rem', // 24px
      desktop: '2rem', // 32px
    },
    xl: {
      mobile: '1.5rem', // 24px
      tablet: '2rem', // 32px
      desktop: '3rem', // 48px
    },
  },

  // Card configurations
  card: {
    borderRadius: {
      mobile: '8px',
      desktop: '12px',
    },
    padding: {
      mobile: '12px',
      tablet: '16px',
      desktop: '20px',
    },
    shadow: {
      mobile: '0 1px 3px rgba(0,0,0,0.1)',
      desktop: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },

  // Table responsive
  table: {
    minWidth: 600,
    cardBreakpoint: 768,
    stackBreakpoint: 640,
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    overlay: 40,
    fab: 40,
    bottomNav: 50,
    drawer: 50,
    toast: 60,
  },
} as const;

// Helper functions
export const isMobileDevice = () => {
  return window.innerWidth < MOBILE_CONFIG.breakpoints.md;
};

export const isTablet = () => {
  const width = window.innerWidth;
  return width >= MOBILE_CONFIG.breakpoints.md && width < MOBILE_CONFIG.breakpoints.lg;
};

export const isDesktop = () => {
  return window.innerWidth >= MOBILE_CONFIG.breakpoints.lg;
};

export const getTouchTargetSize = (variant: 'min' | 'comfortable' | 'large' = 'comfortable') => {
  return MOBILE_CONFIG.touchTarget[variant];
};

export const getResponsiveSpacing = (size: keyof typeof MOBILE_CONFIG.spacing) => {
  const isMobile = isMobileDevice();
  const isTab = isTablet();
  
  if (isMobile) return MOBILE_CONFIG.spacing[size].mobile;
  if (isTab) return MOBILE_CONFIG.spacing[size].tablet;
  return MOBILE_CONFIG.spacing[size].desktop;
};

export const getResponsiveTypography = (size: keyof typeof MOBILE_CONFIG.typography) => {
  const isMobile = isMobileDevice();
  return isMobile ? MOBILE_CONFIG.typography[size].mobile : MOBILE_CONFIG.typography[size].desktop;
};

// Safe area helpers (for notched devices)
export const hasSafeArea = () => {
  return (
    typeof CSS !== 'undefined' &&
    CSS.supports('padding-bottom: env(safe-area-inset-bottom)')
  );
};

export const getSafeAreaInsets = () => {
  if (!hasSafeArea()) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  return {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  };
};

// Viewport helpers
export const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

export const isPortrait = () => {
  return window.innerHeight > window.innerWidth;
};

// Device detection (basic)
export const getDeviceType = () => {
  const ua = navigator.userAgent;
  
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Windows Phone/.test(ua)) return 'windows-phone';
  
  return 'unknown';
};

export const isIOS = () => getDeviceType() === 'ios';
export const isAndroid = () => getDeviceType() === 'android';

// Touch support detection
export const hasTouchSupport = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - Legacy IE property
    navigator.msMaxTouchPoints > 0
  );
};

// Haptic feedback (if supported)
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const duration = {
      light: 10,
      medium: 20,
      heavy: 30,
    }[style];
    
    navigator.vibrate(duration);
  }
};

// Network information (if supported)
export const getNetworkInfo = () => {
  // @ts-expect-error - Experimental API not in types
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    return {
      type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  
  return null;
};

export const isSlowNetwork = () => {
  const info = getNetworkInfo();
  return info?.type === 'slow-2g' || info?.type === '2g' || info?.saveData;
};

// Export all
export default MOBILE_CONFIG;
