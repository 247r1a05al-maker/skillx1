import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const icons = {
    success: <FiCheck className="text-green-600" size={20} />,
    error: <FiX className="text-red-600" size={20} />,
    warning: <FiAlertCircle className="text-yellow-600" size={20} />,
    info: <FiInfo className="text-blue-600" size={20} />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} shadow-md`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto p-1 hover:bg-black/10 rounded transition"
      >
        <FiX size={18} />
      </button>
    </motion.div>
  )
}

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
