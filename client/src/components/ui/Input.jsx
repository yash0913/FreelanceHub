import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export const Input = ({
  label,
  error,
  id,
  type = 'text',
  placeholder,
  disabled = false,
  className = '',
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            error ? 'border-red-500 focus:ring-red-400 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 focus:border-indigo-450 focus:bg-white'
          } ${isPassword ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <span className="text-xs font-semibold text-red-600 mt-0.5">{error}</span>}
    </div>
  )
}

export default Input
