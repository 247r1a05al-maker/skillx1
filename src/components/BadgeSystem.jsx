import React from 'react'
import { motion } from 'framer-motion'
import { FiAward, FiStar, FiTrendingUp, FiUsers, FiBook, FiTarget, FiZap, FiHeart, FiMessageCircle, FiClock } from 'react-icons/fi'

export const BADGES = {
  FIRST_SESSION: { id: 'first-session', name: 'First Steps', desc: 'Complete your first session', icon: FiBook, color: 'blue', coins: 10 },
  TOP_TEACHER: { id: 'top-teacher', name: 'Top Teacher', desc: 'Teach 10 sessions', icon: FiAward, color: 'yellow', coins: 50 },
  COIN_COLLECTOR: { id: 'coin-100', name: 'Coin Collector', desc: 'Earn 100 coins', icon: FiTrendingUp, color: 'green', coins: 20 },
  SOCIAL_BUTTERFLY: { id: 'social', name: 'Social Butterfly', desc: 'Follow 25 people', icon: FiUsers, color: 'purple', coins: 30 },
  STREAK_7: { id: 'streak-7', name: '7 Day Streak', desc: 'Login for 7 days straight', icon: FiZap, color: 'orange', coins: 40 },
  HELPFUL: { id: 'helpful', name: 'Helpful', desc: 'Get 50 likes on posts', icon: FiHeart, color: 'pink', coins: 25 },
  COMMUNICATOR: { id: 'communicator', name: 'Communicator', desc: 'Send 100 messages', icon: FiMessageCircle, color: 'indigo', coins: 15 },
  EARLY_BIRD: { id: 'early-bird', name: 'Early Bird', desc: 'Login before 7 AM', icon: FiClock, color: 'cyan', coins: 10 },
  NIGHT_OWL: { id: 'night-owl', name: 'Night Owl', desc: 'Login after 11 PM', icon: FiStar, color: 'violet', coins: 10 },
  GOAL_SETTER: { id: 'goal-setter', name: 'Goal Setter', desc: 'Complete 5 learning goals', icon: FiTarget, color: 'red', coins: 35 }
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 border-blue-300',
  yellow: 'bg-yellow-100 text-yellow-600 border-yellow-300',
  green: 'bg-green-100 text-green-600 border-green-300',
  purple: 'bg-purple-100 text-purple-600 border-purple-300',
  orange: 'bg-orange-100 text-orange-600 border-orange-300',
  pink: 'bg-pink-100 text-pink-600 border-pink-300',
  indigo: 'bg-indigo-100 text-indigo-600 border-indigo-300',
  cyan: 'bg-cyan-100 text-cyan-600 border-cyan-300',
  violet: 'bg-violet-100 text-violet-600 border-violet-300',
  red: 'bg-red-100 text-red-600 border-red-300'
}

export const BadgeCard = ({ badge, earned = false, progress = 0, onClick }) => {
  const Icon = badge.icon
  const colorClass = earned ? colorClasses[badge.color] : 'bg-gray-100 text-gray-400 border-gray-300'

  return (
    <motion.div
      whileHover={{ scale: earned ? 1.05 : 1 }}
      whileTap={{ scale: earned ? 0.95 : 1 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${colorClass} ${
        !earned && 'opacity-50 grayscale'
      }`}
    >
      {/* Badge Icon */}
      <div className="flex flex-col items-center gap-2">
        <div className={`p-3 rounded-full ${earned ? 'bg-white shadow-md' : 'bg-gray-200'}`}>
          <Icon size={32} />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-sm">{badge.name}</h3>
          <p className="text-xs opacity-80">{badge.desc}</p>
        </div>
        
        {/* Coin Reward */}
        {badge.coins && (
          <div className="text-xs font-semibold bg-white px-2 py-1 rounded-full">
            +{badge.coins} 💰
          </div>
        )}
      </div>

      {/* Progress Bar for not earned */}
      {!earned && progress > 0 && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Earned Checkmark */}
      {earned && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1"
        >
          <FiAward size={16} />
        </motion.div>
      )}
    </motion.div>
  )
}

export default BadgeCard
