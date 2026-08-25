import { useContext } from 'react'
import { ToastContext } from '../context/ToastContext'

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be defined inside a ToastProvider wrapper')
  }
  return context
}

export default useToast
