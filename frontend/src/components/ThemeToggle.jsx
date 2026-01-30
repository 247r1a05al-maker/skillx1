import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <>
      {/* Theme Toggle Button */}
      <motion.button
        onClick={toggleTheme}
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
            className="w-6 h-6 text-cyan-400 animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        ) : (
          // Normal Mode Icon (Sun style)
          <svg
            className="w-6 h-6 text-indigo-600"
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
    </>
  )
}

export default ThemeToggle
