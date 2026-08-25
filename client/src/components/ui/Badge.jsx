import React from 'react'

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border'

  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-150',
    success: 'bg-green-50 text-green-700 border-green-205',
    warning: 'bg-amber-50 text-amber-700 border-amber-205',
    danger: 'bg-red-50 text-red-700 border-red-205'
  }

  const variantClass = variants[variant] || variants.default

  return (
    <span className={`${baseClasses} ${variantClass} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
