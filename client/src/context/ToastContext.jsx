import React, { createContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'

export const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}

      {/* Floating notifications area */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-white'
          let borderClass = 'border-slate-200'
          let textClass = 'text-slate-800'
          let Icon = Info

          if (toast.type === 'success') {
            bgClass = 'bg-green-50'
            borderClass = 'border-green-200'
            textClass = 'text-green-800'
            Icon = CheckCircle2
          } else if (toast.type === 'error') {
            bgClass = 'bg-red-50'
            borderClass = 'border-red-200'
            textClass = 'text-red-800'
            Icon = XCircle
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-50'
            borderClass = 'border-amber-250'
            textClass = 'text-amber-800'
            Icon = AlertCircle
          } else if (toast.type === 'info') {
            bgClass = 'bg-indigo-50'
            borderClass = 'border-indigo-250'
            textClass = 'text-indigo-850'
            Icon = Info
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-lg border shadow-md pointer-events-auto transition-all duration-300 transform translate-x-0 ${bgClass} ${borderClass} ${textClass} animate-fade-in`}
              role="alert"
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold leading-normal">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto cursor-pointer"
                aria-label="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
