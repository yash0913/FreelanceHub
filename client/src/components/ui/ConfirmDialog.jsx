import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

export const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  showCloseButton = true,
  showCancelButton = true
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      {/* Dialogue Panel */}
      <div 
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm" id="confirm-dialog-title">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{title}</span>
          </div>
          {showCloseButton && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-650 disabled:opacity-50 cursor-pointer focus:outline-none"
              aria-label="Close Dialog"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Message body */}
        <div className="px-6 py-5 text-xs font-semibold text-slate-500 leading-normal">
          {message}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          {showCancelButton && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              size="sm"
            >
              {cancelLabel}
            </Button>
          )}
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={isLoading}
            size="sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
