import * as React from "react"

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={className}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, {
              checked: child.props.value === value,
              onClick: () => onValueChange?.(child.props.value)
            })
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, checked, onClick, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="radio"
        value={value}
        checked={checked}
        onChange={() => {}}
        onClick={onClick}
        className={`h-4 w-4 rounded-full border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 ${className || ''}`}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
