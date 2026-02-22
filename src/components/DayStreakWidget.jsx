import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useToast } from '../hooks'
import { FiX } from 'react-icons/fi'

const DayStreakWidget = ({ asIcon = false }) => {
  const { user: authUser } = useAuthStore()
  const { success } = useToast()
  const [streak, setStreak] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Load and subscribe to streak data
  useEffect(() => {
    if (!authUser?.id) return

    const loadStreak = async () => {
      try {
        setIsLoading(true)
        const data = await firebaseRealtime.getDayStreak(authUser.id)
        setStreak(data)

        // Update streak on page load (new day activity)
        const result = await firebaseRealtime.updateDayStreak(authUser.id)
        if (result.success && result.isNewDay) {
          setStreak(result.data)
          if (result.data.currentStreak % 7 === 0 && result.data.currentStreak > 0) {
            success(`🔥 ${result.data.currentStreak}-day streak! Awesome!`)
          }
        }
      } catch (error) {
        console.error('Error loading streak:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStreak()
  }, [authUser?.id])

  const getStreakColor = () => {
    if (!streak?.currentStreak) return 'orange'
    if (streak.currentStreak >= 30) return 'red'
    if (streak.currentStreak >= 14) return 'orange'
    if (streak.currentStreak >= 7) return 'amber'
    return 'orange'
  }

  const getStreakEmoji = (count) => {
    if (count >= 30) return '🔥🔥🔥'
    if (count >= 14) return '🔥🔥'
    if (count >= 7) return '🔥'
    if (count >= 3) return '✨'
    return '⭐'
  }

  if (isLoading) {
    return (
      <motion.button
        animate={{ rotate: [0, -15, 15, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-3xl hover:scale-110 transition cursor-pointer"
        title="Loading streak..."
      >
        🔥
      </motion.button>
    )
  }

  // Icon mode - small fire button that opens modal
  if (asIcon) {
    return (
      <>
        {/* Floating Fire Icon Badge - SMALL */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowModal(true)}
          className="relative text-2xl hover:drop-shadow-lg transition cursor-pointer"
          title="Click to see streak details"
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔥
          </motion.div>
          {streak?.currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
            >
              {streak.currentStreak > 99 ? '99' : streak.currentStreak}
            </motion.div>
          )}
        </motion.button>

        {/* Modal with Streak Details */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-gradient-to-br from-${getStreakColor()}-500 to-${getStreakColor()}-600 text-white rounded-2xl p-6 shadow-2xl max-w-sm w-full`}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/30 rounded-lg transition"
                >
                  <FiX size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-3"
                  >
                    🔥
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">Your Streak</h2>
                </div>

                {/* Main Counter */}
                <div className="text-center mb-6 bg-white/20 rounded-xl p-4">
                  <motion.p
                    key={streak?.currentStreak}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-bold mb-1 text-white"
                  >
                    {streak?.currentStreak || 0}
                  </motion.p>
                  <p className="text-lg text-white opacity-95">days</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-white opacity-90 mb-1">Best</p>
                    <p className="text-2xl font-bold text-white">{streak?.longestStreak || 0}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-white opacity-90 mb-1">Total Days</p>
                    <p className="text-2xl font-bold text-white">{streak?.totalDaysActive || 0}</p>
                  </div>
                </div>

                {/* Achievement Display */}
                <div className="bg-white/20 rounded-lg p-4 text-center mb-4">
                  <p className="text-4xl mb-2">{getStreakEmoji(streak?.currentStreak || 0)}</p>
                  <p className="text-lg font-semibold text-white">
                    {streak?.currentStreak === 0
                      ? '✨ Start your streak today!'
                      : streak?.currentStreak < 7
                      ? `${7 - streak?.currentStreak} days to 1 week!`
                      : `${Math.floor((streak?.currentStreak || 0) / 7)} weeks strong! 🎯`}
                  </p>
                </div>

                {/* Motivational Text */}
                <p className="text-center text-sm text-white opacity-95">
                  {streak?.currentStreak > 0
                    ? '🚀 Keep it up! Come back daily to maintain your streak.'
                    : 'Come back every day to build your streak and earn coins!'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Full card mode for Dashboard/Profile (backwards compatibility)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`bg-gradient-to-br from-${getStreakColor()}-500 to-${getStreakColor()}-600 text-white p-4 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl mb-1"
              >
                🔥
              </motion.div>
              <motion.p
                key={streak?.currentStreak}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold leading-none"
              >
                {streak?.currentStreak || 0}
              </motion.p>
              <p className="text-xs opacity-90 mt-0.5">days</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs opacity-75 mb-1">Best: {streak?.longestStreak || 0}</p>
            <p className="text-2xl">{getStreakEmoji(streak?.currentStreak || 0)}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20 text-xs text-center opacity-90">
          {streak?.currentStreak === 0
            ? '✨ Start your streak today!'
            : streak?.currentStreak < 7
            ? `${7 - streak?.currentStreak} days to 1 week!`
            : `${Math.floor((streak?.currentStreak || 0) / 7)} weeks strong! 🎯`}
        </div>
      </Card>
    </motion.div>
  )
}

export default DayStreakWidget
