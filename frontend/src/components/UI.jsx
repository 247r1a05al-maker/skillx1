import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

export const Card = ({ children, className = '' }) => {
  const { isElite } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`theme-card rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export const StatCard = ({ icon: Icon, label, value, trend }) => {
  const { isElite } = useTheme()
  return (
    <Card className="flex items-center gap-4 stat-card">
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
        isElite 
          ? 'bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-400'
          : 'bg-indigo-100 text-indigo-600'
      }`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="theme-text-secondary text-sm">{label}</p>
        <p className="text-2xl font-bold theme-text-primary">{value}</p>
        {trend && <p className="text-xs text-green-600 mt-1">↑ {trend}</p>}
      </div>
    </Card>
  )
}

export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const { isElite } = useTheme()
  const baseStyles = 'font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants = {
    primary: isElite ? 'btn-primary' : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: isElite ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: isElite ? 'border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 focus:ring-cyan-400' : 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export const Input = ({ label, error, className = '', ...props }) => {
  const { isElite } = useTheme()
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold theme-text-primary mb-2">{label}</label>}
      <input
        className={`w-full px-4 py-2 theme-input rounded-lg focus:outline-none transition ${
          error ? isElite ? 'border-red-500 focus:border-red-500' : 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export const Badge = ({ children, variant = 'primary' }) => {
  const { isElite } = useTheme()
  const variants = {
    primary: isElite ? 'badge-primary' : 'bg-indigo-100 text-indigo-700',
    success: isElite ? 'bg-green-400/20 text-green-400 border border-green-400/50' : 'bg-green-100 text-green-700',
    warning: isElite ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 'bg-yellow-100 text-yellow-700',
    danger: isElite ? 'bg-red-400/20 text-red-400 border border-red-400/50' : 'bg-red-100 text-red-700',
    gray: isElite ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50' : 'bg-gray-100 text-gray-700',
  }

  return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]}`}>{children}</span>
}

export const Loading = () => {
  const { isElite } = useTheme()
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`animate-spin w-8 h-8 border-4 rounded-full ${
        isElite 
          ? 'border-cyan-400/30 border-t-cyan-400 spinner' 
          : 'border-indigo-200 border-t-indigo-600'
      }`} />
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  const { isElite } = useTheme()
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isElite
          ? 'bg-cyan-400/10 text-cyan-400'
          : 'bg-gray-100 text-gray-400'
      }`}>
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold theme-text-primary mb-2">{title}</h3>
      <p className="theme-text-secondary text-center mb-4 max-w-sm">{description}</p>
      {action && action}
    </div>
  )
}

export const Modal = ({ isOpen, onClose, title, children }) => {
  const { isElite } = useTheme()
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`theme-card rounded-xl p-6 max-w-md w-full mx-4 ${
          isElite ? 'border' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold theme-text-primary">{title}</h2>
          <button onClick={onClose} className="theme-text-secondary hover:theme-text-primary">
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

export const SkeletonLoader = ({ count = 3 }) => {
  const { isElite } = useTheme()
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className={`h-16 rounded-lg animate-pulse ${
            isElite
              ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20'
              : 'bg-gray-200'
          }`} />
        ))}
    </div>
  )
}
