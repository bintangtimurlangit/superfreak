'use client'

import React, { forwardRef, useCallback, useMemo, useState } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getVariantClasses(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]'
    case 'secondary':
      return 'bg-[#FCFCFC] border border-[#EFEFEF] hover:bg-[#f7f7f7] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] dark:bg-[#111111] dark:border-white/[.12] dark:hover:bg-[#1a1a1a] dark:shadow-none'
    case 'ghost':
      return 'border border-transparent hover:bg-black/5 dark:hover:bg-white/10'
    case 'link':
      return 'bg-transparent p-0 h-auto underline-offset-4 hover:underline'
    default:
      return ''
  }
}

function getSizeClasses(size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return 'h-9 px-3 text-sm'
    case 'md':
      return 'h-10 px-4'
    case 'lg':
      return 'h-12 px-6 text-base'
    case 'icon':
      return 'h-10 w-10 p-0'
    default:
      return ''
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, onClick, loading, disabled, variant = 'secondary', size = 'md', type = 'button', ...rest },
  ref
) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = loading ?? internalLoading

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return
      try {
        const result = onClick(event)
        if (result && typeof (result as Promise<void>).then === 'function') {
          setInternalLoading(true)
          await result
        }
      } finally {
        setInternalLoading(false)
      }
    },
    [onClick]
  )

  const computedClassName = useMemo(() => {
    const base =
      'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const variantClasses = getVariantClasses(variant)
    const sizeClasses = getSizeClasses(size)
    return cn(base, variantClasses, sizeClasses, className)
  }, [variant, size, className])

  return (
    <button
      ref={ref}
      type={type}
      className={computedClassName}
      onClick={onClick ? handleClick : undefined}
      disabled={Boolean(disabled || isLoading)}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? 'true' : undefined}
      {...rest}
    >
      {isLoading ? (
        <span
          className={cn(
            'mr-2 inline-block h-4 w-4 animate-spin border-2 border-r-transparent align-[-0.125em]',
            size === 'lg' && 'h-5 w-5',
            size === 'sm' && 'h-3.5 w-3.5',
            size === 'icon' && 'mr-0'
          )}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
})

export default Button
