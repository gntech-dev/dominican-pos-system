import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - Enhanced contrast
        primary: {
          50: 'rgb(239 246 255)',
          100: 'rgb(219 234 254)',
          200: 'rgb(191 219 254)',
          300: 'rgb(147 197 253)',
          400: 'rgb(96 165 250)',
          500: 'rgb(59 130 246)',
          600: 'rgb(37 99 235)',  // Main primary - enhanced contrast
          700: 'rgb(29 78 216)',
          800: 'rgb(30 64 175)',
          900: 'rgb(30 58 138)',
        },
        
        // Dominican colors
        dominican: {
          red: 'rgb(193 39 45)',
          blue: 'rgb(0 45 98)',
          white: 'rgb(255 255 255)',
        },
        
        // Semantic colors - Enhanced contrast
        success: {
          50: 'rgb(240 253 244)',
          100: 'rgb(220 252 231)',
          200: 'rgb(187 247 208)',
          300: 'rgb(134 239 172)',
          400: 'rgb(74 222 128)',
          500: 'rgb(34 197 94)',
          600: 'rgb(5 150 105)',  // Enhanced contrast
          700: 'rgb(4 120 87)',
          800: 'rgb(6 95 70)',
          900: 'rgb(6 78 59)',
        },
        
        warning: {
          50: 'rgb(255 251 235)',
          100: 'rgb(254 243 199)',
          200: 'rgb(253 215 170)',
          300: 'rgb(253 186 116)',
          400: 'rgb(251 146 60)',
          500: 'rgb(245 158 11)',
          600: 'rgb(217 119 6)',   // Enhanced contrast
          700: 'rgb(180 83 9)',
          800: 'rgb(146 64 14)',
          900: 'rgb(120 53 15)',
        },
        
        error: {
          50: 'rgb(254 242 242)',
          100: 'rgb(254 226 226)',
          200: 'rgb(254 202 202)',
          300: 'rgb(252 165 165)',
          400: 'rgb(248 113 113)',
          500: 'rgb(239 68 68)',
          600: 'rgb(220 38 38)',   // Enhanced contrast
          700: 'rgb(185 28 28)',
          800: 'rgb(153 27 27)',
          900: 'rgb(127 29 29)',
        },
        
        // High contrast neutrals
        neutral: {
          0: 'rgb(255 255 255)',
          50: 'rgb(250 250 250)',
          100: 'rgb(245 245 245)',
          200: 'rgb(229 229 229)',
          300: 'rgb(212 212 212)',
          400: 'rgb(163 163 163)',
          500: 'rgb(115 115 115)',
          600: 'rgb(82 82 82)',     // Enhanced contrast for text
          700: 'rgb(64 64 64)',     // Enhanced contrast for headings
          800: 'rgb(38 38 38)',     // Dark text
          900: 'rgb(23 23 23)',     // Darkest text
          950: 'rgb(10 10 10)',     // Maximum contrast
        }
      },
      
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],  // Minimum for accessibility
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      
      spacing: {
        '18': '4.5rem',    // 72px - for collapsed sidebar
        '72': '18rem',     // 288px - for full sidebar
      },
      
      minHeight: {
        'touch': '44px',   // Minimum touch target size
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
      },
      
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-in': 'slide-in 0.3s ease-in-out',
        'scale-in': 'scale-in 0.2s ease-in-out',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
