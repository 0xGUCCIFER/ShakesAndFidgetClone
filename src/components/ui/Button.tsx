import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'disabled'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-primary-light to-primary text-bg-darkest border-primary-light/50 hover:from-primary hover:to-primary-light shadow-[0_2px_8px_rgba(201,168,76,0.3)] hover:shadow-[0_2px_12px_rgba(201,168,76,0.5)]',
  secondary:
    'bg-gradient-to-b from-secondary-light to-secondary text-parchment border-secondary-light/50 hover:from-secondary hover:to-secondary-light shadow-[0_2px_8px_rgba(139,37,0,0.3)]',
  outline:
    'bg-transparent text-parchment border-bg-light hover:border-primary hover:text-primary',
  disabled:
    'bg-bg-medium text-text-muted border-bg-light cursor-not-allowed opacity-60',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-7 py-3 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const v = disabled ? 'disabled' : variant

  return (
    <button
      className={`btn-fantasy inline-flex items-center justify-center rounded border transition-all duration-200 ${variantStyles[v]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
