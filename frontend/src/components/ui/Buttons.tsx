import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function PrimaryButton({ children, className = '', ...rest }: ButtonProps) {
  return (
    <button {...rest} className={`btn btn-primary ${className}`.trim()}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...rest }: ButtonProps) {
  return (
    <button {...rest} className={`btn btn-secondary ${className}`.trim()}>
      {children}
    </button>
  )
}
