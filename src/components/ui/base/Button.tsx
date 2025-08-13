import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button component with Dominican POS design system
 * Built with accessibility and WCAG compliance in mind
 */

const buttonVariants = cva(
  // Base styles - accessibility focused
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap',
    'min-h-[44px]', // Minimum touch target for accessibility
  ],
  {
    variants: {
      variant: {
        // Primary - Dominican blue with high contrast
        primary: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700',
          'active:bg-primary-800',
        ],
        // Secondary - Professional gray
        secondary: [
          'bg-neutral-100 text-neutral-900 shadow-sm border border-neutral-200',
          'hover:bg-neutral-200',
          'active:bg-neutral-300',
        ],
        // Outline - Clean professional look
        outline: [
          'border border-primary-200 bg-white text-primary-700 shadow-sm',
          'hover:bg-primary-50 hover:border-primary-300',
          'active:bg-primary-100',
        ],
        // Ghost - Minimal interaction
        ghost: [
          'text-neutral-700',
          'hover:bg-neutral-100',
          'active:bg-neutral-200',
        ],
        // Dominican red for important actions (use sparingly)
        dominican: [
          'bg-red-600 text-white shadow-sm',
          'hover:bg-red-700',
          'active:bg-red-800',
        ],
        // Success - For positive actions
        success: [
          'bg-green-600 text-white shadow-sm',
          'hover:bg-green-700',
          'active:bg-green-800',
        ],
        // Warning - For caution actions
        warning: [
          'bg-yellow-500 text-white shadow-sm',
          'hover:bg-yellow-600',
          'active:bg-yellow-700',
        ],
        // Destructive - For dangerous actions
        destructive: [
          'bg-red-600 text-white shadow-sm',
          'hover:bg-red-700',
          'active:bg-red-800',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Loading state for async operations
   */
  loading?: boolean
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode
}

/**
 * Modern Button component for Dominican POS system
 * 
 * Features:
 * - WCAG AA compliant colors and contrast
 * - Minimum 44px touch targets for mobile
 * - Loading states for async operations
 * - Icon support with proper spacing
 * - Keyboard navigation support
 * - Screen reader friendly
 * 
 * @example
 * ```tsx
 * // Primary action button
 * <Button>Procesar Venta</Button>
 * 
 * // With loading state
 * <Button loading>Guardando...</Button>
 * 
 * // With icons
 * <Button leftIcon={<PlusIcon />}>Agregar Producto</Button>
 * 
 * // Destructive action
 * <Button variant="destructive">Eliminar</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && <span>{children}</span>}
        
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
