import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const [showTooltip, setShowTooltip] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [enteredPassword, setEnteredPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleToggleClick = () => {
    if (theme === 'elite') {
      toggleTheme()
      return
    }
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
      toggleTheme()
      setShowPasswordModal(false)
      setEnteredPassword('')
    } else if (enteredPassword === 'user1') {
      setPasswordError('Under Construction')
      setTimeout(() => {
        setShowPasswordModal(false)
        setEnteredPassword('')
        setPasswordError('')
      }, 1500)
    } else {
      setPasswordError('Wrong password')
      setEnteredPassword('')
    }
  }

  const handleCloseModal = () => {
    setShowPasswordModal(false)
    setEnteredPassword('')
    setPasswordError('')
  }

  return (
    <>
      {/* Theme Toggle Button */}
      <motion.button
        onClick={handleToggleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          theme === 'elite'
            ? 'bg-gradient-to-br from-cyan-400/30 to-blue-600/30 border-2 border-cyan-400 shadow-lg shadow-cyan-400/70'
            : 'bg-white shadow-lg border-2 border-indigo-500 hover:shadow-indigo-500/50'
        }`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {theme === 'elite' ? (
          // Elite Mode Icon (AI/Gemini style)
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        ) : (
          // Normal Mode Icon (Sun style)
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24" />
          </svg>
        )}

        {/* Pulse animation for Elite mode */}
        {theme === 'elite' && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`fixed bottom-24 right-6 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
            theme === 'elite'
              ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400'
              : 'bg-gray-900 text-white border border-gray-700'
          }`}
        >
          {theme === 'elite' ? 'Normal Mode' : 'Elite Mode'} ✨
        </motion.div>
      )}

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
    </>
  )
}

export default ThemeToggle
