import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX } from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'
import { executeCommand } from '../utils/commands'

const CommandPalette = ({ isOpen, onClose }) => {
  const { isElite } = useTheme()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const allCommands = [
    // Fun
    { name: 'matrix', description: 'Falling code animation' },
    { name: 'hack', description: 'Fake hacking logs' },
    { name: 'celebrate', description: 'Coins and emoji rain' },
    { name: 'penguin', description: '🐧 Walking penguin with sound' },
    { name: 'joke', description: 'Random programming joke' },
    { name: 'glow', description: 'Extra neon glow effects' },
    { name: 'reset', description: 'Remove all effects' },
    { name: 'hello elite', description: 'Secret elite greeting' },
    // Games
    { name: 'games', description: 'List all 16 online games' },
    { name: 'game [name]', description: 'Open game by name (e.g., game chess)' },
    { name: 'play chess', description: 'Open Chess.com' },
    { name: 'play pokemon', description: 'Open Pokemon Showdown' },
    { name: 'play smash karts', description: 'Open Smash Karts racing' },
    { name: 'match card', description: 'Memory matching game' },
    // Birthday
    { name: 'birthday [name]', description: 'Birthday celebration & wishes' },
    { name: 'bday [name]', description: 'Birthday wishes (quick alias)' },
    // Utility
    { name: 'google [query]', description: 'Search Google' },
    { name: 'calc [expression]', description: 'Calculate (e.g., calc 2+2)' },
    { name: 'timer [minutes]', description: 'Start countdown timer' },
    { name: 'note', description: 'Save quick sticky note' },
    { name: 'clear cache', description: 'Clear all stored data' },
    { name: 'whoami', description: 'Show current user info' },
    { name: 'coins', description: 'Show coin balance' },
    { name: 'shortcuts', description: 'List keyboard shortcuts' },
    // Help
    { name: 'kdeveloper', description: 'List ALL cheats & commands' },
    { name: 'cheats', description: 'Same as kdeveloper' },
    { name: 'help', description: 'Same as kdeveloper' },
  ]

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    const filtered = allCommands.filter((cmd) =>
      cmd.name.toLowerCase().includes(input.toLowerCase())
    )
    setSuggestions(filtered)
    setSelectedIndex(0)
  }, [input])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % suggestions.length || 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length || 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(input, onClose)
      setInput('')
    }
  }

  const handleCommand = (cmdName) => {
    executeCommand(cmdName, onClose)
    setInput('')
  }

  if (!isElite) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-start justify-center pt-20"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl mx-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-400/30 rounded-lg shadow-2xl shadow-cyan-400/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-400/20">
              <FiSearch className="text-cyan-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="> Enter command..."
                className="flex-1 bg-transparent outline-none text-cyan-400 placeholder-cyan-400/50 text-lg"
              />
              <button
                onClick={onClose}
                className="text-cyan-400/50 hover:text-cyan-400 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-h-96 overflow-y-auto"
              >
                {suggestions.map((cmd, idx) => (
                  <motion.button
                    key={cmd.name}
                    onClick={() => handleCommand(cmd.name)}
                    whileHover={{ x: 4 }}
                    className={`w-full px-4 py-3 flex items-start gap-4 border-b border-cyan-400/10 transition ${
                      idx === selectedIndex
                        ? 'bg-cyan-400/10 border-l-2 border-l-cyan-400'
                        : 'hover:bg-cyan-400/5'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-cyan-400 font-semibold">{cmd.name}</p>
                      <p className="text-cyan-400/50 text-sm">{cmd.description}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Help Text */}
            {!input && (
              <div className="px-4 py-8 text-center text-cyan-400/50 text-sm">
                <p>🎮 Elite Mode Commands Active</p>
                <p className="mt-2 text-xs">Try: matrix, celebrate, joke, calc 2+2, etc.</p>
                <p className="mt-4 text-xs">↑ ↓ Enter to select • Esc to close</p>
              </div>
            )}

            {/* No Results */}
            {input && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center text-cyan-400/50 text-sm">
                <p>No commands found for "{input}"</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
