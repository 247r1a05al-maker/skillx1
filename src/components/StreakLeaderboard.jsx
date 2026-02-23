import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiAward, FiZap } from 'react-icons/fi'
import { Card } from './UI'
import firebaseRealtime from '../services/firebase-realtime'
import { useAuthStore } from '../store'

const StreakLeaderboard = ({ limit = 10 }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user: authUser } = useAuthStore()
  const currentUserId = authUser?.uid || authUser?.id

  useEffect(() => {
    console.log('🔄 Starting real-time leaderboard subscription...')
    setIsLoading(true)

    // Subscribe to real-time leaderboard updates
    const unsubscribe = firebaseRealtime.subscribeToStreakLeaderboard(limit, async (data) => {
      console.log('📊 Leaderboard data received:', data.length, 'entries')
      
      try {
        // Enrich with user data if available
        const enrichedData = await Promise.all(
          data.map(async (entry) => {
            try {
              const userData = await firebaseRealtime.getUserData(entry.userId)
              const isCurrentUser = entry.userId === currentUserId
              
              // Check if user wants to hide from leaderboard
              if (userData?.hideFromLeaderboard && !isCurrentUser) {
                return null // Filter out users who want privacy
              }
              
              return {
                ...entry,
                username: userData?.username || userData?.name || 'Anonymous',
                avatar: userData?.profileImage || userData?.avatar || null,
                isCurrentUser,
              }
            } catch (error) {
              console.error('❌ Error enriching user data:', entry.userId, error)
              return {
                ...entry,
                username: 'Anonymous',
                avatar: null,
                isCurrentUser: entry.userId === currentUserId,
              }
            }
          })
        )
        
        // Filter out null entries (hidden users)
        const filteredData = enrichedData.filter(entry => entry !== null)
        
        console.log('✅ Leaderboard enriched with user data:', filteredData.length, 'visible users')
        setLeaderboard(filteredData)
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Error enriching leaderboard:', error)
        setLeaderboard(data.map(entry => ({
          ...entry,
          username: 'Anonymous',
          avatar: null,
          isCurrentUser: entry.userId === currentUserId,
        })))
        setIsLoading(false)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from leaderboard')
      if (unsubscribe) unsubscribe()
    }
  }, [limit, currentUserId])

  const getMedalEmoji = (rank) => {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return `${rank + 1}.`
  }

  const getStreakBadge = (streak) => {
    if (streak >= 30) return { color: 'text-red-500', emoji: '🔥🔥🔥' }
    if (streak >= 14) return { color: 'text-orange-500', emoji: '🔥🔥' }
    if (streak >= 7) return { color: 'text-yellow-500', emoji: '🔥' }
    return { color: 'text-green-500', emoji: '✨' }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FiAward className="text-blue-500" size={24} />
        <h2 className="text-2xl font-bold">Streak Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No streaks yet. Be the first!</p>
        ) : (
          leaderboard.map((entry, rank) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-400 ring-2 ring-blue-200'
                  : rank === 0
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300'
                  : rank === 1
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300'
                  : rank === 2
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 transition'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center font-bold text-lg">
                {getMedalEmoji(rank)}
              </div>

              {/* Avatar & Name */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold truncate">
                    {entry.username}
                    {entry.isCurrentUser && <span className="ml-1 text-blue-600 text-xs">(You)</span>}
                  </span>
                </div>
              </div>

              {/* Streak Info */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <FiZap className={getStreakBadge(entry.longestStreak).color} size={18} />
                    <span className="text-2xl font-bold">{entry.longestStreak}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {entry.currentStreak}
                  </p>
                </div>
                <span className="text-2xl">{getStreakBadge(entry.longestStreak).emoji}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
          🔴 Live • Real-time updates • Top {Math.min(leaderboard.length, limit)}
        </div>
      )}
    </Card>
  )
}

export default StreakLeaderboard
