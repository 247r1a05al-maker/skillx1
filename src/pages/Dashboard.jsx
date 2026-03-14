import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCheckCircle,
  FiBook,
  FiUsers,
  FiPlus,
  FiStar,
  FiTrendingUp,
  FiMessageCircle,
  FiMessageSquare,
  FiGift,
  FiZap,
  FiAward,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Card, StatCard, Button, Badge } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useToast } from '../hooks'
import { playCoinSound } from '../utils/sounds'
import WelcomeTour from '../components/WelcomeTour'
import DayStreakWidget from '../components/DayStreakWidget'
import SCoinIcon from '../components/SCoinIcon'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const { success, error: showError } = useToast()
  const userId = authUser?.uid || authUser?.id
  const [stats, setStats] = useState({
    coins: 0,
    sessionsCompleted: 0,
    skillsTeaching: 0,
    skillsLearning: 0,
  })
  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [earningOpportunities, setEarningOpportunities] = useState([])
  const [claimingReward, setClaimingReward] = useState(null)
  const [showTour, setShowTour] = useState(false)

  // Load user data and earning opportunities
  useEffect(() => {
    let unsubscribeUsers = null

    const loadData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        console.log('📊 Loading dashboard for user:', userId)

        // Load earning opportunities
        const opportunities = await firebaseRealtime.getEarningOpportunities(userId)
        console.log('🎁 Earning opportunities:', opportunities)
        setEarningOpportunities(Array.isArray(opportunities) ? opportunities : [])

        // Subscribe to all users for recommendations
        unsubscribeUsers = firebaseRealtime.subscribeToUsers((users) => {
          // Filter out current user
          const otherUsers = users.filter((u) => {
            return u.id !== userId && 
                   u.id !== authUser?.uid && 
                   u.id !== authUser?.id &&
                   u.uid !== userId &&
                   u.uid !== authUser?.uid &&
                   u.uid !== authUser?.id
          })
          setAllUsers(otherUsers)
          setIsLoading(false)
        })

        // Get user coins - use cached value from authUser first, then sync from Firebase
        const cachedCoins = authUser.coins || 0
        setStats(prev => ({ ...prev, coins: cachedCoins }))
        console.log('💰 User coins loaded instantly from cache:', cachedCoins)
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error)
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      unsubscribeUsers?.()
    }
  }, [authUser, userId])

  useEffect(() => {
    if (!userId) return

    const refreshOpportunities = async () => {
      const opportunities = await firebaseRealtime.getEarningOpportunities(userId)
      setEarningOpportunities(Array.isArray(opportunities) ? opportunities : [])
    }

    const onFocus = () => {
      refreshOpportunities()
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [userId])

  // Handle claim reward
  const handleClaimReward = async (opportunity) => {
    if (!userId) {
      showError('Please login to claim rewards')
      return
    }

    if (opportunity.claimed) {
      showError('You have already claimed this reward')
      return
    }

    // Validate task is actually completed
    if (!opportunity.canClaim) {
      showError('Please complete the task first before claiming rewards')
      return
    }

    setClaimingReward(opportunity.id)

    try {
      let result

      switch (opportunity.action) {
        case 'claimRegistrationBonus':
          result = await firebaseRealtime.claimRegistrationBonus(userId)
          break
        case 'claimProfileCompletion':
          result = await firebaseRealtime.claimProfileCompletion(userId)
          break
        case 'claimJoinGroupBonus':
          result = await firebaseRealtime.claimJoinGroupBonus(userId)
          break
        case 'claimFollowMilestone':
          result = await firebaseRealtime.claimFollowMilestone(userId, 10)
          break
        default:
          showError('Invalid reward action')
          return
      }

      if (result.success) {
        // Trigger confetti animation and sound!
        triggerCoinConfetti()
        playCoinSound()
        
        success(`🎉 You earned ${result.coins} coins!`)
        
        // Refresh opportunities
        const opportunities = await firebaseRealtime.getEarningOpportunities(userId)
        setEarningOpportunities(Array.isArray(opportunities) ? opportunities : [])
        
        // DO NOT manually update coins here - UserDataSync in App.jsx handles it automatically
        // This prevents double-counting and ensures single source of truth from Firebase
        console.log(`✅ REWARD CLAIMED: +${result.coins} coins from ${opportunity.action}`)
      } else {
        showError(result.error || 'Failed to claim reward')
      }
    } catch (err) {
      showError(err.message || 'Failed to claim reward')
    } finally {
      setClaimingReward(null)
    }
  }

  // Get AI matches based on complementary skills
  const getAIMatches = () => {
    return allUsers.slice(0, 3).map((user, idx) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      skill: user.skills?.teaching?.join(', ') || 'Multiple skills',
      score: 85 + Math.random() * 15,
      reason: idx === 0 ? 'Same schedule + high rating' : idx === 1 ? 'Matches your goals' : 'Similar learning path',
    }))
  }

  const aiMatches = getAIMatches()

  return (
    <div className="space-y-6">
      {/* Welcome Header with Streak */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {authUser?.name || authUser?.displayName || 'there'}! 👋</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Here's your learning progress overview</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Streak Fire Icon - Click to see details */}
          <DayStreakWidget asIcon={true} />
          
          {/* Coins */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <SCoinIcon size={24} />
            <div>
              <p className="text-xs font-semibold">Your Coins</p>
              <p className="text-2xl font-bold">{stats.coins}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards - REMOVED */}

      {/* Quick Start */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Start</h2>
          </div>
          <Badge variant="secondary">Do 1 today</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <FiUsers className="text-indigo-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900">Find Learners</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Follow members to unlock rewards.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/explore')}>Explore</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <FiMessageCircle className="text-indigo-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900">Post in Community</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Get engagement and grow visibility.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/community')}>Post</Button>
          </motion.div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => navigate('/explore')} className="flex items-center gap-2">
          <FiUsers size={20} /> Explore Users
        </Button>
        <Button variant="secondary" onClick={() => navigate('/inbox')} className="flex items-center gap-2">
          <FiMessageSquare size={20} /> Open Inbox
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Welcome Message */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Welcome to SkillEx! 👋</h2>
          <p className="text-gray-600 mb-4">
            Connect with skilled professionals and exchange knowledge. Browse our community in the Explore section to find people with skills you want to learn.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate('/explore')}>
              Explore Users
            </Button>
            <Button variant="secondary" onClick={() => navigate('/inbox')}>
              Go to Inbox
            </Button>
          </div>
        </Card>
      </div>

      {/* Welcome Tour */}
      <WelcomeTour onComplete={() => setShowTour(false)} />
    </div>
  )
}

export default Dashboard
