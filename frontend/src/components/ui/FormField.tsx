import type { ReactNode } from 'react'

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint}
    </label>
  )
}
