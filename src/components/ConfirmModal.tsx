import { ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'primary'
  variant?: 'danger' | 'warning' | 'info' | 'primary'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type,
  variant
}: ConfirmModalProps) {
  const resolvedType = type || variant || 'warning'
  if (!isOpen) return null

  const getColors = () => {
    switch (resolvedType) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-200'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          button: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:shadow-lg hover:shadow-yellow-200'
        }
      case 'primary':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          button: 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-200'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-gradient-to-r from-imboni-blue to-blue-600 hover:shadow-lg hover:shadow-blue-200'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className={`w-12 h-12 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
          <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-all font-medium ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
