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
    const loadData = async () => {
      if (!authUser?.uid && !authUser?.id) return

      setIsLoading(true)
      try {
        const userId = authUser.uid || authUser.id
        console.log('📊 Loading dashboard for user:', userId)

        // Load earning opportunities
        const opportunities = await firebaseRealtime.getEarningOpportunities(userId)
        console.log('🎁 Earning opportunities:', opportunities)
        setEarningOpportunities(opportunities)

        // Subscribe to all users for recommendations
        const unsubscribe = firebaseRealtime.subscribeToUsers((users) => {
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

        return () => {
          unsubscribe?.()
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [authUser])

  // Handle claim reward
  const handleClaimReward = async (opportunity) => {
    if (!authUser?.id) {
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
          result = await firebaseRealtime.claimRegistrationBonus(authUser.id)
          break
        case 'claimProfileCompletion':
          result = await firebaseRealtime.claimProfileCompletion(authUser.id)
          break
        case 'claimJoinGroupBonus':
          result = await firebaseRealtime.claimJoinGroupBonus(authUser.id)
          break
        case 'claimFollowMilestone':
          result = await firebaseRealtime.claimFollowMilestone(authUser.id, 10)
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
        const opportunities = await firebaseRealtime.getEarningOpportunities(authUser.id)
        setEarningOpportunities(opportunities)
        
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Here's your learning progress overview</p>
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

      {/* Earning Opportunities */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiGift className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Earn Coins</h2>
          </div>
          <Badge variant="primary">{earningOpportunities.filter(o => !o.claimed).length} available</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earningOpportunities.map((opportunity) => {
            // Define unique gradient colors for each opportunity
            const getCardStyle = () => {
              if (opportunity.claimed) {
                return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 opacity-70'
              }
              
              switch(opportunity.id) {
                case 'registration-bonus':
                  return 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 hover:shadow-lg hover:shadow-green-100'
                case 'profile-completion':
                  return 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 hover:shadow-lg hover:shadow-blue-100'
                case 'join-group':
                  return 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-purple-200 hover:shadow-lg hover:shadow-purple-100'
                case 'follow-10':
                  return 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-orange-200 hover:shadow-lg hover:shadow-orange-100'
                default:
                  return 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-lg'
              }
            }
            
            const getIconBg = () => {
              if (opportunity.claimed) return 'bg-gray-200'
              
              switch(opportunity.id) {
                case 'registration-bonus': return 'bg-gradient-to-br from-green-100 to-emerald-100'
                case 'profile-completion': return 'bg-gradient-to-br from-blue-100 to-indigo-100'
                case 'join-group': return 'bg-gradient-to-br from-purple-100 to-pink-100'
                case 'follow-10': return 'bg-gradient-to-br from-orange-100 to-amber-100'
                default: return 'bg-white'
              }
            }
            
            return (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-5 rounded-xl border-2 transition-all ${getCardStyle()}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl shadow-sm ${getIconBg()}`}>
                    {opportunity.id === 'registration-bonus' && <FiGift className="text-green-600" size={24} />}
                    {opportunity.id === 'profile-completion' && <FiCheckCircle className="text-blue-600" size={24} />}
                    {opportunity.id === 'join-group' && <FiUsers className="text-purple-600" size={24} />}
                    {opportunity.id === 'follow-10' && <FiAward className="text-orange-600" size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{opportunity.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{opportunity.description}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar for milestone rewards */}
              {opportunity.progress !== undefined && opportunity.required && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                    <span>{opportunity.progress}/{opportunity.required}</span>
                    <span>{Math.round((opportunity.progress / opportunity.required) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min((opportunity.progress / opportunity.required) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <SCoinIcon className="text-yellow-500" size={20} />
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{opportunity.coins} coins</span>
                </div>

                <Button
                  variant={opportunity.claimed ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    if (!opportunity.canClaim && !opportunity.claimed) {
                      // Navigate to complete the task
                      if (opportunity.id === 'profile-completion') {
                        navigate('/profile')
                      } else if (opportunity.id === 'join-group') {
                        navigate('/groups')
                      } else if (opportunity.id === 'follow-10') {
                        navigate('/explore')
                      }
                    } else {
                      handleClaimReward(opportunity)
                    }
                  }}
                  disabled={opportunity.claimed || claimingReward === opportunity.id}
                  className={opportunity.claimed ? 'cursor-not-allowed' : ''}
                >
                  {claimingReward === opportunity.id ? (
                    'Claiming...'
                  ) : opportunity.claimed ? (
                    <>
                      <FiCheckCircle size={16} /> Claimed
                    </>
                  ) : !opportunity.canClaim ? (
                    'Complete Task'
                  ) : (
                    'Claim'
                  )}
                </Button>
              </div>
            </motion.div>
            )
          })}
        </div>

        {earningOpportunities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiGift size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Loading earning opportunities...</p>
          </div>
        )}
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
