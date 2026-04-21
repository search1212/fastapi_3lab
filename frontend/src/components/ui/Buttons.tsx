import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function PrimaryButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button {...props} className={`btn btn-primary ${className}`.trim()}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button {...props} className={`btn btn-secondary ${className}`.trim()}>
      {children}
    </button>
  )
}
