import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiDollarSign,
  FiCheckCircle,
  FiBook,
  FiUsers,
  FiPlus,
  FiStar,
  FiTrendingUp,
  FiMessageCircle,
  FiMessageSquare,
  FiGift,
  FiAward,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Card, StatCard, Button, Badge } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useToast } from '../hooks'

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

  // Load user data and earning opportunities
  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.uid && !authUser?.id) return

      setIsLoading(true)
      try {
        const userId = authUser.uid || authUser.id

        // Load earning opportunities
        const opportunities = await firebaseRealtime.getEarningOpportunities(userId)
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

        // Get user coins
        const userRef = await firebaseRealtime.getFollowersCount(userId) // Just using this to test user exists
        setStats(prev => ({ ...prev, coins: authUser.coins || 0 }))

        return () => unsubscribe?.()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
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
        success(`🎉 You earned ${result.coins} coins!`)
        // Refresh opportunities
        const opportunities = await firebaseRealtime.getEarningOpportunities(authUser.id)
        setEarningOpportunities(opportunities)
        // Update coins in state (in real app, reload user)
        setStats(prev => ({ ...prev, coins: prev.coins + result.coins }))
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
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
          <p className="text-gray-500 mt-2">Here's your learning progress overview</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-lg">
          <FiDollarSign className="text-indigo-600" size={24} />
          <div>
            <p className="text-xs text-gray-600">Your Coins</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.coins}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Total Coins" value={stats.coins} trend="+12%" />
        <StatCard icon={FiCheckCircle} label="Sessions Completed" value={stats.sessionsCompleted} trend="+3" />
        <StatCard icon={FiBook} label="Skills Teaching" value={stats.skillsTeaching} />
        <StatCard icon={FiUsers} label="Skills Learning" value={stats.skillsLearning} trend="+2" />
      </div>

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
          {earningOpportunities.map((opportunity) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                opportunity.claimed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${opportunity.claimed ? 'bg-gray-200' : 'bg-white'}`}>
                    {opportunity.id === 'registration-bonus' && <FiGift className="text-indigo-600" size={20} />}
                    {opportunity.id === 'profile-completion' && <FiCheckCircle className="text-green-600" size={20} />}
                    {opportunity.id === 'join-group' && <FiUsers className="text-purple-600" size={20} />}
                    {opportunity.id === 'follow-10' && <FiAward className="text-orange-600" size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{opportunity.title}</h3>
                    <p className="text-sm text-gray-600">{opportunity.description}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar for milestone rewards */}
              {opportunity.progress !== undefined && opportunity.required && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{opportunity.progress}/{opportunity.required}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${Math.min((opportunity.progress / opportunity.required) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-indigo-600" />
                  <span className="text-lg font-bold text-indigo-600">{opportunity.coins} Coins</span>
                </div>

                <Button
                  variant={opportunity.claimed ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleClaimReward(opportunity)}
                  disabled={opportunity.claimed || claimingReward === opportunity.id || !opportunity.canClaim}
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
          ))}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Stats</h2>
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <p className="text-xs text-gray-600 uppercase">Total Coins</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.coins}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 uppercase">Sessions Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.sessionsCompleted}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600 uppercase">Skills Teaching</p>
              <p className="text-2xl font-bold text-purple-600">{stats.skillsTeaching}</p>
            </div>
          </div>
        </Card>

        {/* Welcome Message */}
        <Card className="lg:col-span-2">
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

      {/* Smart Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold theme-text-primary">AI Matchmaking</h2>
            <FiStar className="text-indigo-500" />
          </div>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading recommendations...</div>
          ) : aiMatches.length > 0 ? (
            <div className="space-y-3">
              {aiMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border border-gray-200 bg-white/50 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold theme-text-primary">{match.name}</p>
                      <p className="text-sm theme-text-secondary">{match.skill}</p>
                      <p className="text-xs theme-text-tertiary mt-1">{match.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="success">{Math.round(match.score)}% match</Badge>
                      <button
                        onClick={() => navigate(`/inbox?user=${match.id}`)}
                        className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                        title="Message"
                      >
                        <FiMessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No users available yet</div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold theme-text-primary">Top Categories</h2>
            <FiTrendingUp className="text-indigo-500" />
          </div>
          <div className="space-y-3">
            {[
              { title: 'Web Development', count: 245, icon: '🌐' },
              { title: 'Data Science', count: 189, icon: '📊' },
              { title: 'Design', count: 156, icon: '🎨' },
            ].map((cat, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-200 bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <p className="font-semibold theme-text-primary">{cat.title}</p>
                  </div>
                  <p className="text-sm theme-text-tertiary">{cat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
