/**
 * Design System Configuration for Dominican POS System
 * Colors optimized for WCAG AA compliance and professional appearance
 */

export const designSystem = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Main primary
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Dominican-inspired accent colors
    dominican: {
      red: '#c1272d',
      blue: '#002d62',
      white: '#ffffff',
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#059669', // Main success
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f59e0b',
      600: '#d97706', // Main warning
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626', // Main error
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Neutral grays with high contrast
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['Geist Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }], // Minimum for accessibility
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '1' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  spacing: {
    // 8px base unit system
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
    40: '160px',
    48: '192px',
  },
  
  borderRadius: {
    none: '0px',
    sm: '2px',
    DEFAULT: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Component specific configurations
  components: {
    button: {
      sizes: {
        sm: {
          height: '32px',
          padding: '0 12px',
          fontSize: '14px',
        },
        md: {
          height: '40px',
          padding: '0 16px',
          fontSize: '16px',
        },
        lg: {
          height: '48px',
          padding: '0 24px',
          fontSize: '18px',
        },
      },
    },
    
    input: {
      height: '44px', // Minimum touch target
      padding: '12px 16px',
    },
    
    card: {
      padding: '24px',
      borderRadius: '8px',
    },
  },
  
  // Dominican POS specific constants
  pos: {
    currency: 'DOP',
    taxRate: 0.18, // 18% ITBIS
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm:ss',
    receiptWidth: '80mm', // Thermal printer standard
  },
};

// CSS Custom Properties for dynamic theming
export const cssVariables = `
:root {
  /* Primary colors */
  --color-primary-50: 239 246 255;
  --color-primary-500: 59 130 246;
  --color-primary-600: 37 99 235;
  --color-primary-700: 29 78 216;
  
  /* Dominican colors */
  --color-dominican-red: 193 39 45;
  --color-dominican-blue: 0 45 98;
  
  /* Semantic colors */
  --color-success: 5 150 105;
  --color-warning: 217 119 6;
  --color-error: 220 38 38;
  
  /* Neutral colors */
  --color-neutral-0: 255 255 255;
  --color-neutral-50: 250 250 250;
  --color-neutral-100: 245 245 245;
  --color-neutral-200: 229 229 229;
  --color-neutral-500: 115 115 115;
  --color-neutral-700: 64 64 64;
  --color-neutral-900: 23 23 23;
  
  /* Typography */
  --font-family-sans: 'Geist', 'Inter', system-ui, sans-serif;
  --font-family-mono: 'Geist Mono', 'Menlo', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Component specific */
  --header-height: 64px;
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 72px;
  --content-max-width: 1200px;
}

/* Dark mode support (future enhancement) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-0: 23 23 23;
    --color-neutral-50: 38 38 38;
    --color-neutral-900: 255 255 255;
  }
}
`;

export default designSystem;
