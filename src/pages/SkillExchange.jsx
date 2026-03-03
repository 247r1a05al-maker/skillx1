import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiSend, FiX, FiCalendar, FiStar, FiClock, FiUsers, FiTrendingUp, FiAward, FiSearch, FiFilter, FiTrash2, FiPlay } from 'react-icons/fi'
import { Card, Button, Badge, Modal, Input } from '../components/UI'
import SCoinIcon from '../components/SCoinIcon'
import LiveSession from './LiveSession'
import firebaseRealtimeService from '../services/firebase-realtime'
import { useAuthStore } from '../store'
import { useToast } from '../hooks'

const SkillExchange = () => {
  const { user, setUser } = useAuthStore()
  const { success, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState('marketplace') // marketplace, myTeaching, myLearning, leaderboard
  const [teachingSessions, setTeachingSessions] = useState([])
  const [myBookings, setMyBookings] = useState({ asLearner: [], asTeacher: [] })
  const [leaderboard, setLeaderboard] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showRateModal, setShowRateModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showLiveSession, setShowLiveSession] = useState(false)
  const [currentSessionRoom, setCurrentSessionRoom] = useState(null)
  const [currentSessionTeacher, setCurrentSessionTeacher] = useState(null)
  const [showTeacherProfile, setShowTeacherProfile] = useState(false)
  const [teacherProfileData, setTeacherProfileData] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  
  const [newSession, setNewSession] = useState({
    skillName: '',
    skillLevel: 'Intermediate',
    category: 'Programming',
    description: '',
    duration: 60,
    coinsCost: 25,
    maxLearners: 1,
    isDemoCourse: true,
    hasFullCourse: false,
  })

  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Languages', 'Music', 'Fitness', 'Other']

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to teaching sessions
    const unsubSessions = firebaseRealtimeService.subscribeToTeachingSessions((sessions) => {
      // Deduplicate sessions by ID
      const uniqueSessions = Array.from(new Map(sessions.map(s => [s.id, s])).values())
      setTeachingSessions(uniqueSessions)
    })

    // Subscribe to user bookings
    const unsubBookings = firebaseRealtimeService.subscribeToUserBookings(user.id, (bookings) => {
      // Deduplicate bookings by ID
      const uniqueAsLearner = Array.from(new Map(bookings.asLearner.map(b => [b.id, b])).values())
      const uniqueAsTeacher = Array.from(new Map(bookings.asTeacher.map(b => [b.id, b])).values())
      setMyBookings({ asLearner: uniqueAsLearner, asTeacher: uniqueAsTeacher })
    })

    // Load leaderboard
    loadLeaderboard()

    return () => {
      unsubSessions()
      unsubBookings()
    }
  }, [user])

  const loadLeaderboard = async () => {
    try {
      const leaders = await firebaseRealtimeService.getLeaderboard(10)
      setLeaderboard(leaders)
    } catch (err) {
      console.error('Error loading leaderboard:', err)
    }
  }

  const handleCreateSession = async () => {
    if (!newSession.skillName || !newSession.description) {
      showError('Please fill in all required fields')
      return
    }

    if ((user?.demoSlots || 0) < 1) {
      showError('You need a Demo Pass to create a demo class. Buy one from the Store.')
      return
    }

    try {
      await firebaseRealtimeService.createTeachingSession(user.id, newSession)
      success('Teaching session created successfully!')
      setShowCreateSession(false)
      setNewSession({
        skillName: '',
        skillLevel: 'Intermediate',
        category: 'Programming',
        description: '',
        duration: 60,
        coinsCost: 25,
        maxLearners: 1,
        isDemoCourse: true,
        hasFullCourse: false,
      })
    } catch (err) {
      showError(err.message || 'Failed to create session')
    }
  }

  const handleBuyDemoPass = async () => {
    try {
      const result = await firebaseRealtimeService.purchaseDemoPass(user.id)
      if (!result.success) {
        showError(result.error || 'Failed to purchase Demo Pass')
        return
      }

      const refreshed = await firebaseRealtimeService.refreshUserData(user.id)
      if (refreshed) {
        setUser(refreshed)
      }

      success('✅ Demo Pass purchased! 2 demo slots added.')
      setShowStoreModal(false)
    } catch (err) {
      showError(err.message || 'Failed to purchase Demo Pass')
    }
  }

  const handleViewTeacherProfile = async (teacherId) => {
    try {
      setIsProfileLoading(true)
      setShowTeacherProfile(true)
      const profile = await firebaseRealtimeService.getTeacherProfile(teacherId)
      setTeacherProfileData(profile)
    } catch (err) {
      showError('Failed to load teacher profile')
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleBookSession = async (session) => {
    if (!user?.id) {
      showError('Please login to book sessions')
      return
    }

    if (session.teacherId === user.id) {
      showError('You cannot book your own session')
      return
    }

    setSelectedSession(session)
    setShowBookModal(true)
  }

  const confirmBooking = async () => {
    try {
      // 🔒 SECURITY: Check if user already has active session
      const existingSession = await firebaseRealtimeService.checkUserActiveSession(user.id)
      if (existingSession) {
        showError('You already have an active session. Please complete or leave it first.')
        return
      }

      const selectedSlot = new Date().toISOString()
      
      // Book session (coins deducted after demo ends)
      const booking = await firebaseRealtimeService.bookSession(selectedSession.id, user.id, selectedSlot)
      
      // Create live session room
      await firebaseRealtimeService.createSessionRoom(
        booking.id,
        selectedSession.teacherId,
        user.id,
        selectedSession
      )

      // 🔒 SECURITY: Join the room with validation
      const joinResult = await firebaseRealtimeService.joinSessionRoom(booking.id, user.id)
      if (!joinResult.success) {
        showError(joinResult.error || 'Failed to join session')
        return
      }

      setCurrentSessionRoom(booking)
      setCurrentSessionTeacher(selectedSession.teacher)
      setShowBookModal(false)
      setSelectedSession(null)
      setShowLiveSession(true)
      
      // Inform user about post-demo deduction
      success(`✅ Joining demo... (${booking.coinsCost} coins will be deducted after the demo ends)`)
      
      // Log booking event
      await firebaseRealtimeService.logSessionEvent(user.id, 'demo_joined', {
        sessionId: selectedSession.id,
        bookingId: booking.id,
        isDemoCourse: selectedSession.isDemoCourse
      })
    } catch (err) {
      showError(err.message || 'Failed to book session')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const result = await firebaseRealtimeService.deleteTeachingSession(sessionId, user.id)
        if (result.success) {
          success('Session deleted successfully')
        } else {
          showError(result.error || 'Failed to delete session')
        }
      } catch (err) {
        showError('Error deleting session')
      }
    }
  }

  const handleCompleteSession = async (booking) => {
    try {
      const result = await firebaseRealtimeService.completeSession(booking.id, 5)
      const charged = result?.coinsCharged || booking.coinsCost || 25
      success(`Demo completed! ${charged} coins deducted from the learner.`)
    } catch (err) {
      showError(err.message || 'Failed to complete session')
    }
  }

  const handleRateSession = async () => {
    try {
      await firebaseRealtimeService.rateSession(selectedBooking.id, user.id, rating, review)
      success('Thank you for your feedback!')
      setShowRateModal(false)
      setSelectedBooking(null)
      setRating(5)
      setReview('')
    } catch (err) {
      showError(err.message || 'Failed to submit rating')
    }
  }

  const filteredSessions = teachingSessions.filter(session => {
    const isDemoOnly = session.isDemoCourse === true
    const matchesSearch = session.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || session.category === categoryFilter
    return isDemoOnly && matchesSearch && matchesCategory
  })

  const scoreSession = (session) => {
    const rating = session.teacher?.rating || session.rating || 0
    const profileStrength = session.teacher?.profileStrength || 0
    const ratingScore = Math.min(5, rating) * 20
    return (ratingScore * 0.6) + (profileStrength * 0.4)
  }

  const rankedSessions = [...filteredSessions].sort((a, b) => scoreSession(b) - scoreSession(a))

  const userStats = {
    // INSTANT: Use cached coins (no 0 flash!)
    coinsBalance: user?.coins || 0,
    skillsTaught: user?.skillsTaught || 0,
    skillsLearned: user?.skillsLearned || 0,
    totalEarned: user?.totalCoinsEarned || 0,
    demoSlots: user?.demoSlots || 0,
    profileStrength: user?.profileStrength || 0,
  }

  const teacherProfile = teacherProfileData?.profile || {}
  const teacherLinks = teacherProfileData?.links || {}
  const teacherMedia = teacherProfileData?.media || {}
  const demoVideos = Array.isArray(teacherMedia?.demoVideos) ? teacherMedia.demoVideos : []

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">💎 SkillSwap Marketplace</h1>
        <p className="text-gray-500 mt-2">Teach what you love, Learn what you want - Earn coins!</p>
        
        {/* User Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <SCoinIcon className="text-yellow-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-yellow-700">{userStats.coinsBalance}</div>
            <div className="text-sm text-yellow-600">Coins Balance</div>
          </Card>
          <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100">
            <FiTrendingUp className="text-green-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-green-700">{userStats.totalEarned}</div>
            <div className="text-sm text-green-600">Total Earned</div>
          </Card>
          <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <FiUsers className="text-blue-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-blue-700">{userStats.skillsTaught}</div>
            <div className="text-sm text-blue-600">Skills Taught</div>
          </Card>
          <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100">
            <FiAward className="text-purple-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-purple-700">{userStats.skillsLearned}</div>
            <div className="text-sm text-purple-600">Skills Learned</div>
          </Card>
          <Card className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100">
            <FiPlay className="text-orange-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-orange-700">{userStats.demoSlots}</div>
            <div className="text-sm text-orange-600">Demo Slots</div>
          </Card>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['marketplace', 'myTeaching', 'myLearning', 'leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'marketplace' && '🏪 Marketplace'}
            {tab === 'myTeaching' && '👨‍🏫 My Teaching'}
            {tab === 'myLearning' && '📚 My Learning'}
            {tab === 'leaderboard' && '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Search and Filter */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
              <Button variant="primary" onClick={() => setShowCreateSession(true)} className="flex items-center gap-2">
                <FiPlus /> Teach a Skill
              </Button>
              <Button variant="secondary" onClick={() => setShowStoreModal(true)} className="flex items-center gap-2">
                🛒 Store
              </Button>
            </div>
          </Card>

          {/* Teaching Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {rankedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="h-full hover:shadow-xl transition cursor-pointer">
                    {/* Teacher Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={session.teacher?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.teacherId}`}
                        alt={session.teacher?.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.teacher?.displayName || 'Teacher'}</h3>
                        <div className="flex items-center gap-1 text-sm text-yellow-600">
                          <FiStar fill="currentColor" />
                          <span>{session.rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-gray-400">({session.totalReviews || 0})</span>
                        </div>
                        {session.teacher?.verificationStatus === 'verified' && (
                          <div className="text-xs text-green-700 bg-green-100 inline-block px-2 py-0.5 rounded mt-1">✅ Verified</div>
                        )}
                      </div>
                    </div>

                    {/* Skill Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{session.skillName}</h4>
                        <Badge className="bg-orange-100 text-orange-700 text-xs">🎓 Demo</Badge>
                      </div>
                      <Badge variant="primary" className="mb-2">{session.skillLevel}</Badge>
                      <Badge className="ml-2 bg-purple-100 text-purple-700">{session.category}</Badge>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{session.description}</p>
                    </div>

                    {/* Session Details */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <FiClock />
                        <span>{session.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiUsers />
                        <span>{session.totalSessions || 0} sessions</span>
                      </div>
                    </div>

                    {/* Price and Book Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-indigo-600">
                          25 💎
                        </div>
                        <p className="text-xs text-orange-600 font-semibold mt-1">Fixed demo price</p>
                      </div>
                      <div className="flex gap-2">
                        {session.teacherId === user?.id && (
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600 hover:text-red-700"
                            title="Delete Session"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewTeacherProfile(session.teacherId)}
                          className="flex items-center gap-1"
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleBookSession(session)}
                          disabled={session.teacherId === user?.id}
                          className="flex items-center gap-1"
                        >
                          {session.teacherId === user?.id ? 'Your Session' : (
                            <>
                              <FiPlay size={16} />
                              Join Demo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredSessions.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-gray-500 text-lg">No teaching sessions found</p>
              <p className="text-gray-400 mt-2">Be the first to teach {searchQuery || 'a skill'}!</p>
              <Button variant="primary" className="mt-4" onClick={() => setShowCreateSession(true)}>
                Create Teaching Session
              </Button>
            </Card>
          )}
        </motion.div>
      )}

      {/* My Teaching Tab */}
      {activeTab === 'myTeaching' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Your Created Demo Sessions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">🎬 Your Demo Sessions</h2>
              <Button variant="primary" size="sm" onClick={() => setShowCreateSession(true)}>
                <FiPlus size={16} className="mr-2" /> Create New
              </Button>
            </div>
            {teachingSessions.filter(s => s.teacherId === user?.id).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No demo sessions created yet</p>
                <Button variant="primary" onClick={() => setShowCreateSession(true)}>
                  Create Your First Demo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {teachingSessions.filter(s => s.teacherId === user?.id).map((session) => {
                  const sessionBookings = myBookings.asTeacher.filter(b => b.sessionId === session.id)
                  return (
                    <div key={session.id} className="p-4 border-2 border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{session.skillName}</h3>
                            <Badge variant="info" className="text-xs">Demo</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>⏱️ {session.duration} min</span>
                            <span>👥 {sessionBookings.length} student{sessionBookings.length !== 1 ? 's' : ''}</span>
                            <span>💎 {session.coinsCost} coins</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Delete session"
                          >
                            <FiTrash2 size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Student Bookings */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Student Bookings</h2>
            {myBookings.asTeacher.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students have booked your demos yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.asTeacher.map((booking) => (
                  <div key={booking.id} className="p-4 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.skillName}</h3>
                        <p className="text-sm text-gray-600">Learner: {booking.learnerId}</p>
                        <p className="text-sm text-gray-500">⏱️ {booking.duration} minutes</p>
                        <p className="text-xs text-gray-500 mt-1">📅 {new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">+{booking.coinsCost} 💎</div>
                        <Badge variant={
                          booking.status === 'completed' ? 'success' : 
                          booking.status === 'confirmed' ? 'info' :
                          'warning'
                        }>
                          {booking.status === 'pending' ? '⏳ Pending Confirmation' : 
                           booking.status === 'confirmed' ? '✓ Confirmed' :
                           booking.status === 'completed' ? '✅ Completed' :
                           booking.status}
                        </Badge>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleCompleteSession(booking)}
                          >
                            Mark Complete ✓
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <p className="text-xs text-orange-600 mt-2 font-medium">⏳ Waiting for confirmation...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* My Learning Tab */}
      {activeTab === 'myLearning' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📖 My Learning Sessions</h2>
            {myBookings.asLearner.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't booked any learning sessions yet</p>
                <Button variant="primary" className="mt-4" onClick={() => setActiveTab('marketplace')}>
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.asLearner.map((booking) => (
                  <div key={booking.id} className="p-4 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.skillName}</h3>
                        <p className="text-sm text-gray-600">Teacher: {booking.teacherId}</p>
                        <p className="text-sm text-gray-500">⏱️ {booking.duration} minutes</p>
                        <p className="text-xs text-gray-500 mt-1">📅 {new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-600">{booking.coinsCost} 💎</div>
                        <Badge variant={
                          booking.status === 'completed' ? 'success' : 
                          booking.status === 'confirmed' ? 'info' :
                          'warning'
                        }>
                          {booking.status === 'pending' ? '⏳ Pending Confirmation' : 
                           booking.status === 'confirmed' ? '✓ Confirmed' :
                           booking.status === 'completed' ? '✅ Completed' :
                           booking.status}
                        </Badge>
                        {booking.status === 'completed' && !booking.learnerRating && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowRateModal(true)
                            }}
                          >
                            Rate Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Earners</h2>
            <div className="space-y-3">
              {leaderboard.map((leader, index) => (
                <div key={leader.uid} className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">#{index + 1}</div>
                  <img
                    src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`}
                    alt={leader.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{leader.displayName}</h3>
                    <p className="text-sm text-gray-600">{leader.skillsTaught} skills taught</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-600">{leader.totalCoinsEarned} 💎</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FiStar fill="currentColor" className="text-yellow-500" />
                      <span>{leader.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Create Session Modal */}
      <Modal isOpen={showCreateSession} onClose={() => setShowCreateSession(false)} title="🎓 Create Teaching Session">
        <div className="space-y-4">
          {userStats.demoSlots < 1 && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800">❌ Missing Demo Pass</p>
              <p className="text-sm text-red-700 mt-1">You need a Demo Pass to create a demo class. Buy one from the Store.</p>
            </div>
          )}

          {userStats.profileStrength < 40 && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800">❌ Incomplete Teacher Profile</p>
              <p className="text-sm text-red-700 mt-1">
                Your profile strength is <strong>{userStats.profileStrength}/100</strong>. You need at least <strong>40/100</strong> to create demos.
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">Required:</p>
              <ul className="text-sm text-red-600 mt-1 ml-4 list-disc">
                <li>Bio (20 points) ✓</li>
                <li>Experience (15 points) ✓</li>
                <li>Expertise (15 points) ✓</li>
              </ul>
              <p className="text-sm text-red-700 mt-2">Go to Settings → Teacher Profile to complete your profile.</p>
            </div>
          )}

          {userStats.demoSlots >= 1 && userStats.profileStrength >= 40 && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800">✅ Ready to Create Demo</p>
              <p className="text-sm text-green-700 mt-1">Profile strength: <strong>{userStats.profileStrength}/100</strong> | Demo slots: <strong>{userStats.demoSlots}</strong></p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              🎟️ <strong>Demo Slots Available:</strong> {userStats.demoSlots}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              🎓 <strong>Demo Class Only:</strong> All sessions are demo classes with a fixed cost of 25 coins.
            </p>
          </div>

          <Input
            label="Skill Name *"
            placeholder="e.g., React Basics, Python for Beginners..."
            value={newSession.skillName}
            onChange={(e) => setNewSession({ ...newSession, skillName: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Level *</label>
            <select
              value={newSession.skillLevel}
              onChange={(e) => setNewSession({ ...newSession, skillLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
            <select
              value={newSession.category}
              onChange={(e) => setNewSession({ ...newSession, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              placeholder="Describe what you'll teach..."
              value={newSession.description}
              onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              rows="4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={newSession.duration}
              onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
            />
            <Input
              label="Demo Cost"
              type="number"
              value={newSession.coinsCost}
              onChange={() => setNewSession({ ...newSession, coinsCost: 25 })}
              disabled
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              🎓 <strong>Demo Class (Fixed 25 coins):</strong> Students pay 25 coins to join your demo session.
            </p>
          </div>

          <Button variant="primary" className="w-full" onClick={handleCreateSession} disabled={userStats.demoSlots < 1 || userStats.profileStrength < 40}>
            🎓 Create Demo Class
          </Button>
        </div>
      </Modal>

      {/* Store Modal */}
      <Modal isOpen={showStoreModal} onClose={() => setShowStoreModal(false)} title="🛒 Demo Pass Store">
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-800 font-semibold">🎟️ Demo Pass (₹99)</p>
            <p className="text-sm text-indigo-700 mt-2">Each Demo Pass gives <strong>2 demo slots</strong>.</p>
            <p className="text-sm text-indigo-700 mt-2">Demo slots are required to create demo classes.</p>
          </div>
          <Button variant="primary" className="w-full" onClick={handleBuyDemoPass}>
            Buy Demo Pass (₹99)
          </Button>
          <p className="text-xs text-gray-500 text-center">Mock purchase only - no real payment processed.</p>
        </div>
      </Modal>

      {/* Teacher Profile Modal */}
      <Modal isOpen={showTeacherProfile} onClose={() => setShowTeacherProfile(false)} title="👤 Teacher Profile">
        {isProfileLoading ? (
          <div className="text-center py-6 text-gray-500">Loading profile...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={teacherProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherProfile.id || 'teacher'}`}
                alt={teacherProfile.displayName || 'Teacher'}
                className="w-14 h-14 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{teacherProfile.displayName || 'Teacher'}</h3>
                  {teacherProfile.verificationStatus === 'verified' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✅ Verified</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Rating: {teacherProfile.rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700"><strong>Bio:</strong> {teacherProfile.bio || 'No bio added yet.'}</p>
              <p className="text-sm text-gray-700 mt-2"><strong>Experience:</strong> {teacherProfile.experience || 'Not specified'}</p>
              <p className="text-sm text-gray-700 mt-2"><strong>Expertise:</strong> {teacherProfile.expertise || 'Not specified'}</p>
              <p className="text-sm text-gray-700 mt-2"><strong>Profile Strength:</strong> {teacherProfile.profileStrength || 0}/100</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Social Links</p>
              <div className="flex flex-col gap-2 text-sm">
                {teacherLinks.youtube?.url && <a href={teacherLinks.youtube.url} target="_blank" rel="noreferrer" className="text-blue-600">YouTube</a>}
                {teacherLinks.instagram?.url && <a href={teacherLinks.instagram.url} target="_blank" rel="noreferrer" className="text-pink-600">Instagram</a>}
                {teacherLinks.linkedin?.url && <a href={teacherLinks.linkedin.url} target="_blank" rel="noreferrer" className="text-blue-700">LinkedIn</a>}
                {teacherLinks.github?.url && <a href={teacherLinks.github.url} target="_blank" rel="noreferrer" className="text-gray-800">GitHub</a>}
                {!teacherLinks.youtube?.url && !teacherLinks.instagram?.url && !teacherLinks.linkedin?.url && !teacherLinks.github?.url && (
                  <p className="text-gray-500">No social links provided.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Demo Videos</p>
              {demoVideos.length > 0 ? (
                <div className="space-y-2">
                  {demoVideos.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">{url}</a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No demo videos added yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Book Session Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="🎓 Join Demo Class">
        {selectedSession && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedSession.skillName}
                <span className="text-sm text-orange-600 font-semibold ml-2">Demo</span>
              </h3>
              <p className="text-gray-600">{selectedSession.description}</p>
              <button
                className="text-sm text-blue-600 font-semibold mt-2"
                onClick={() => handleViewTeacherProfile(selectedSession.teacherId)}
                type="button"
              >
                View Teacher Profile
              </button>
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  25 💎
                </div>
                <p className="text-sm text-gray-600">{selectedSession.duration} minutes session</p>
                <p className="text-xs text-orange-600 font-semibold mt-2">Fixed demo price • Coins deducted when session ends</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold">
                🎓 Demo Class (25 coins fixed)
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                ⚠️ <strong>25 coins will be deducted after the demo ends</strong>
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                💡 No refunds if you leave early - coins are non-refundable
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBookModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                onClick={confirmBooking}
                disabled={userStats.coinsBalance < 25}
              >
                {userStats.coinsBalance < 25 ? 'Insufficient Coins' : '🎓 Join Demo'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rate Session Modal */}
      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} title="⭐ Rate Your Experience">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">How was your learning experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={32}
                  className={`cursor-pointer transition ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Review (optional)</label>
            <textarea
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              rows="4"
            />
          </div>

          <Button variant="primary" className="w-full" onClick={handleRateSession}>
            Submit Review
          </Button>
        </div>
      </Modal>

      {/* Live Session */}
      <AnimatePresence>
        {showLiveSession && currentSessionRoom && (
          <LiveSession
            booking={currentSessionRoom}
            session={selectedSession}
            teacherData={currentSessionTeacher}
            onClose={() => setShowLiveSession(false)}
            onSessionEnd={() => {
              setShowLiveSession(false)
              success('Session ended. Thank you!')
            }}
          />
        )}
      </AnimatePresence>    </div>
  )
}

export default SkillExchange