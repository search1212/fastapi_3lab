import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { FormField } from './FormField'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  hint?: ReactNode
}

export function PasswordField({ label, hint, className = '', ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} hint={hint}>
      <div className="password-field">
        <input
          {...inputProps}
          type={visible ? 'text' : 'password'}
          className={`password-field-input ${className}`.trim()}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          title={visible ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
              />
              <path
                fill="currentColor"
                d="M3.2 3.2 20.8 20.8l-1.4 1.4L1.8 4.6z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
              />
            </svg>
          )}
        </button>
      </div>
    </FormField>
  )
}
