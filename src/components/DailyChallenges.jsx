import React from 'react'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiCircle, FiTarget } from 'react-icons/fi'
import SCoinIcon from '../components/SCoinIcon'

const DAILY_CHALLENGES = [
  { id: 'login', title: 'Daily Login', desc: 'Just show up!', coins: 5, icon: '🌅' },
  { id: 'explore', title: 'Explore Users', desc: 'Visit 3 profiles', coins: 10, icon: '🔍', target: 3 },
  { id: 'message', title: 'Start Conversation', desc: 'Send 5 messages', coins: 15, icon: '💬', target: 5 },
  { id: 'post', title: 'Share Knowledge', desc: 'Create 1 post', coins: 20, icon: '📝', target: 1 },
  { id: 'session', title: 'Complete Session', desc: 'Finish 1 learning session', coins: 50, icon: '🎓', target: 1 }
]

export const DailyChallengeCard = ({ challenge, completed = false, progress = 0 }) => {
  const percentage = challenge.target ? (progress / challenge.target) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        completed
          ? 'bg-green-50 border-green-300 dark:bg-green-900/20'
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-3xl p-2 rounded-lg ${
          completed ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {challenge.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-bold ${
                completed ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
              }`}>
                {challenge.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.desc}</p>
            </div>
            
            {/* Status Icon */}
            <div>
              {completed ? (
                <FiCheckCircle className="text-green-600" size={24} />
              ) : (
                <FiCircle className="text-gray-300" size={24} />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {challenge.target && !completed && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>{progress}/{challenge.target}</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="mt-2 flex items-center gap-2">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <SCoinIcon size={12} />
              {challenge.coins} coins
            </div>
            {completed && (
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                ✓ Claimed
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export { DAILY_CHALLENGES }
export default DailyChallengeCard
