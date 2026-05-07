import { HTMLAttributes, forwardRef } from 'react'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

const variantStyles: Record<string, string> = {
  default: 'bg-white border-gray-200 text-gray-900',
  destructive: 'bg-red-50 border-red-200 text-red-800',
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 flex items-start gap-3 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Alert.displayName = 'Alert'

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <p ref={ref} className={`text-sm leading-relaxed ${className}`} {...props}>
        {children}
      </p>
    )
  }
)

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }
