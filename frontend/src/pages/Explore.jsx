import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiFilter, FiMessageSquare, FiUser, FiCheck, FiSearch, FiStar, FiZap, FiTrendingUp } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'

const Explore = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    skill: '',
    onlineOnly: false,
    sortBy: 'recent', // 'recent', 'rating', 'online'
  })
  const [featuredUsers, setFeaturedUsers] = useState([])
  const [recommendedUsers, setRecommendedUsers] = useState([])

  // Demo users fallback
  const demoUsers = [
    {
      id: 'demo-1',
      name: 'Alex Chen',
      email: 'alex@example.com',
      bio: 'Full-stack developer passionate about React and Node.js',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      skills: ['React', 'Node.js', 'JavaScript'],
      rating: 4.8,
      completedExchanges: 12,
      isOnline: true,
    },
    {
      id: 'demo-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      bio: 'UI/UX Designer with 5+ years experience in Figma',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      skills: ['UI Design', 'UX Research', 'Figma'],
      rating: 4.9,
      completedExchanges: 28,
      isOnline: true,
    },
    {
      id: 'demo-3',
      name: 'Raj Patel',
      email: 'raj@example.com',
      bio: 'Data scientist specializing in Python and Machine Learning',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj',
      skills: ['Python', 'Machine Learning', 'Data Analysis'],
      rating: 4.7,
      completedExchanges: 18,
      isOnline: true,
    },
  ]

  // Load users from Firebase
  useEffect(() => {
    const userId = authUser?.uid || authUser?.id
    if (!userId) return

    const unsubscribe = firebaseRealtime.subscribeToUsers((firebaseUsers) => {
      // Use Firebase users if available, otherwise use demo users
      let usersToDisplay = firebaseUsers && firebaseUsers.length > 0 ? firebaseUsers : demoUsers
      
      // Filter out current user - check against all possible ID formats
      const otherUsers = usersToDisplay.filter((u) => {
        // Don't show if user ID matches any of these
        return u.id !== userId && 
               u.id !== authUser?.uid && 
               u.id !== authUser?.id &&
               u.uid !== userId &&
               u.uid !== authUser?.uid &&
               u.uid !== authUser?.id
      })
      
      setAllUsers(otherUsers)
      
      // Set featured users (top rated, online, or most active)
      const featured = otherUsers
        .filter((u) => u.isOnline) // Prioritize online users
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3)
      setFeaturedUsers(featured)
      
      // Set recommended users based on complementary skills
      const recommended = otherUsers
        .sort((a, b) => (b.completedExchanges || 0) - (a.completedExchanges || 0))
        .slice(0, 5)
      setRecommendedUsers(recommended)
      
      setIsLoading(false)
    })

    return () => unsubscribe?.()
  }, [authUser])

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSkill =
      !filters.skill ||
      user.skills?.some((s) => s.toLowerCase().includes(filters.skill.toLowerCase()))

    const matchesOnline = !filters.onlineOnly || user.isOnline

    return matchesSearch && matchesSkill && matchesOnline
  }).sort((a, b) => {
    if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    if (filters.sortBy === 'online') return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0)
    return (b.completedExchanges || 0) - (a.completedExchanges || 0) // recent/popular
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Explore & Discover</h1>
        <p className="text-gray-600 mt-2 text-lg">Find mentors, learn new skills, and grow together</p>
      </motion.div>

      {/* Featured Users Section - Only show when not searching/filtering */}
      {!searchQuery && !filters.skill && !filters.onlineOnly && featuredUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <FiStar className="text-yellow-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Featured Members</h2>
              <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">Top Rated</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.isOnline && <span className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{user.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} size={14} className={i < Math.round(user.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({user.completedExchanges || 0})</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{user.bio || 'Skilled member'}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-center text-xs py-1"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    View Profile
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, skill, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition text-lg"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-2">
            <FiFilter size={20} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters & Sort</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
              <input
                type="text"
                name="skill"
                placeholder="e.g., React, Design..."
                value={filters.skill}
                onChange={(e) => setFilters((prev) => ({ ...prev, skill: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
              >
                <option value="recent">Most Active</option>
                <option value="rating">Highest Rated</option>
                <option value="online">Online Now</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlineOnly}
                  onChange={(e) => setFilters((prev) => ({ ...prev, onlineOnly: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Online Only</span>
              </label>
            </div>

            <div className="flex items-end">
              {(searchQuery || filters.skill || filters.onlineOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({ skill: '', onlineOnly: false, sortBy: 'recent' })
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition px-3 py-2 bg-indigo-50 rounded-lg w-full"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-indigo-600">{filteredUsers.length}</span> of <span className="font-bold text-gray-700">{allUsers.length}</span> members found
          </p>
          {allUsers.length === 0 && (
            <Badge variant="warning" className="text-xs">
              No members yet
            </Badge>
          )}
        </div>
        {isLoading && <p className="text-sm text-gray-500 animate-pulse">Loading members...</p>}
      </div>

      {/* User Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading amazing people...</p>
          </div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="relative hover:shadow-xl transition flex flex-col h-full group">
                {/* Online Status Badge */}
                {user.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                  </div>
                )}

                {/* User Info */}
                <div className="flex flex-col items-center text-center mb-4 flex-1">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full mb-3 object-cover ring-4 ring-indigo-100 group-hover:ring-indigo-200 transition"
                  />
                  <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                  
                  {/* Rating & Experience */}
                  {(user.rating || user.completedExchanges) && (
                    <div className="flex items-center justify-center gap-1 mt-1 mb-2">
                      {user.rating && (
                        <>
                          <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
                          <span className="text-xs font-semibold text-gray-700">{user.rating.toFixed(1)}</span>
                        </>
                      )}
                      {user.completedExchanges && (
                        <>
                          <span className="text-gray-300 text-xs">•</span>
                          <FiTrendingUp className="text-indigo-600" size={14} />
                          <span className="text-xs font-semibold text-gray-700">{user.completedExchanges} exchanges</span>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{user.bio || 'Skilled member looking to exchange knowledge'}</p>

                  {/* Location */}
                  {user.location && (
                    <p className="text-xs text-gray-500 mt-1">📍 {user.location}</p>
                  )}
                </div>

                {/* Skills */}
                {user.skills && user.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Expertise</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {user.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="primary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {user.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Learning Goals */}
                {user.learningGoals && user.learningGoals.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                      <FiZap size={12} /> Want to learn
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.learningGoals.slice(0, 2).map((goal) => (
                        <span key={goal} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <FiUser size={16} /> View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/inbox?user=${user.id}`)}
                  >
                    <FiMessageSquare size={16} /> Chat
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="py-20 text-center flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiSearch size={64} className="text-gray-200 mx-auto mb-6" />
            <p className="text-gray-600 text-2xl font-bold mb-2">No members found</p>
            {searchQuery || filters.skill || filters.onlineOnly ? (
              <>
                <p className="text-gray-500 text-base mb-6 max-w-md">
                  Try adjusting your search query or filters to discover more members
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({ skill: '', onlineOnly: false, sortBy: 'recent' })
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-base mb-6 max-w-md">
                  Be the first to join our skill exchange community! Invite your friends and start learning together.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Complete Your Profile
                </button>
              </>
            )}
          </motion.div>
        </Card>
      )}

      {/* Recommended Section - Show at bottom when there are results */}
      {!searchQuery && !filters.skill && filteredUsers.length > 0 && recommendedUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="text-purple-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Recommended For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {recommendedUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg p-3 hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover mb-2"
                  />
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{user.name}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{user.skills?.[0] || 'Member'}</p>
                  <Button variant="primary" size="sm" className="w-full text-xs py-1">
                    Check Out
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default Explore
