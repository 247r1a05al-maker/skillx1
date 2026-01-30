import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiFilter, FiMessageSquare, FiUser, FiCheck, FiSearch } from 'react-icons/fi'
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
  })

  // Load users from Firebase
  useEffect(() => {
    const userId = authUser?.uid || authUser?.id
    if (!userId) return

    const unsubscribe = firebaseRealtime.subscribeToUsers((users) => {
      // Filter out current user - check against all possible ID formats
      const otherUsers = users.filter((u) => {
        // Don't show if user ID matches any of these
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
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">Explore & Discover</h1>
        <p className="text-gray-500 mt-2">Find people to exchange skills with</p>
      </motion.div>

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
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
              <div className="relative">
                <input
                  type="text"
                  name="skill"
                  placeholder="e.g., React, Design..."
                  value={filters.skill}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
                />
                {filters.skill && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, skill: '' }))}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="onlineOnly"
                  checked={filters.onlineOnly}
                  onChange={handleFilterChange}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Online Only</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-indigo-600">{filteredUsers.length}</span> of <span className="font-bold text-gray-700">{allUsers.length}</span> users
          </p>
          {(searchQuery || filters.skill || filters.onlineOnly) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ skill: '', onlineOnly: false })
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              Clear all filters
            </button>
          )}
        </div>
        {isLoading && <p className="text-sm text-gray-500 animate-pulse">Loading users...</p>}
      </div>

      {/* User Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
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
              <Card className="relative hover:shadow-xl transition flex flex-col h-full">
                {/* Online Status */}
                {user.isOnline && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}

                {/* User Info */}
                <div className="flex flex-col items-center text-center mb-4 flex-1">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full mb-3 object-cover"
                  />
                  <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{user.bio || 'No bio yet'}</p>

                  {/* Status */}
                  <div className="mt-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.isOnline 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.isOnline ? '🟢 Online' : '⚪ Offline'}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                {user.skills && user.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Skills</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {user.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="primary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {user.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.skills.length - 3} more
                        </Badge>
                      )}
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
        <Card className="py-16 text-center flex flex-col items-center justify-center">
          <FiSearch size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg font-semibold">No users found</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md">
            {searchQuery || filters.skill || filters.onlineOnly
              ? 'Try adjusting your search query or filters'
              : 'No users available yet'}
          </p>
          {(searchQuery || filters.skill || filters.onlineOnly) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ skill: '', onlineOnly: false })
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </Card>
      )}
    </div>
  )
}

export default Explore
