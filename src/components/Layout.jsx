import React, { useState } from 'react'
import { useAuthStore } from '../store'
import { useTheme } from '../context/ThemeContext'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const { isElite, toggleTheme } = useTheme()
  const location = useLocation()
  const isCertificatesPage = location.pathname === '/certificates'
  const isInboxPage = location.pathname === '/inbox'
  const hideNavbar = isCertificatesPage || isInboxPage

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [enteredPassword, setEnteredPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleToggleClick = () => {
    console.log('🔘 Theme button clicked, isElite:', isElite)
    if (isElite) {
      console.log('✅ Already in elite mode, toggling to normal')
      toggleTheme()
      return
    }
    console.log('🔐 Showing password modal for elite unlock')
    setShowPasswordModal(true)
    setEnteredPassword('')
    setPasswordError('')
  }

  const handlePasswordSubmit = () => {
    setPasswordError('')
    
    if (!enteredPassword) {
      setPasswordError('Please enter a password')
      return
    }

    if (enteredPassword === 'kelite') {
      // Correct password - activate elite mode
      console.log('✅ Correct password! Toggling theme')
      if (!isElite) {
        toggleTheme()
      }
      setShowPasswordModal(false)
      setEnteredPassword('')
    } else if (enteredPassword === 'user1') {
      // User construction - show under construction and return to normal
      setPasswordError('Under Construction')
      setTimeout(() => {
        setShowPasswordModal(false)
        setEnteredPassword('')
        setPasswordError('')
      }, 1500)
    } else {
      // Wrong password
      setPasswordError('Wrong password')
      setEnteredPassword('')
    }
  }

  const handleCloseModal = () => {
    setShowPasswordModal(false)
    setEnteredPassword('')
    setPasswordError('')
  }

  if (!isAuthenticated) {
    return children
  }

  return (
    <div className={`flex h-screen ${isElite ? 'theme-elite' : 'theme-normal'}`}>
      {/* Sidebar (handles both desktop and mobile inside) */}
      <Sidebar />

      {/* Main Content - Offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Navbar - Hidden on Certificates and Inbox pages */}
        {!hideNavbar && <Navbar />}

        {/* Page Content - with proper padding to not overlap navbar */}
        <main className={`flex-1 overflow-auto theme-bg-tertiary ${hideNavbar ? 'p-0' : 'px-4 lg:px-8 pb-6 pt-20 lg:pt-20'}`}>
          {hideNavbar ? <div className="w-full h-full">{children}</div> : <div className="max-w-7xl mx-auto">{children}</div>}
        </main>

        {/* Elite Toggle Button - Bottom Right Corner */}
        <motion.button
          onClick={handleToggleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center z-30 ${
            isElite 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
              : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-indigo-500'
          }`}
          title={isElite ? 'Elite Mode Active' : 'Click to unlock Elite'}
        >
          {isElite ? (
            <span className="text-xl">⭐</span>
          ) : (
            <span className="text-xl">🔒</span>
          )}
        </motion.button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Elite Mode</h2>
            <p className="text-gray-600 mb-6">Enter password to unlock</p>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={enteredPassword}
                  onChange={(e) => {
                    setEnteredPassword(e.target.value)
                    setPasswordError('')
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  autoFocus
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    passwordError === 'Under Construction'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <FiAlertCircle className={passwordError === 'Under Construction' ? 'text-yellow-600' : 'text-red-600'} size={18} />
                  <span className={`text-sm ${passwordError === 'Under Construction' ? 'text-yellow-700' : 'text-red-700'}`}>
                    {passwordError}
                  </span>
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Unlock
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Layout
