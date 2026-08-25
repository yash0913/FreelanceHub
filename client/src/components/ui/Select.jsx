import React from 'react'

export const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  required = false,
  error,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
          error ? 'border-red-500 focus:ring-red-400 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 focus:border-indigo-450 focus:bg-white'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-semibold text-red-600 mt-0.5">{error}</span>}
    </div>
  )
}

export default Select
