import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers, FiMessageSquare, FiX, FiLogOut, FiTrash2 } from 'react-icons/fi'
import { Card, Button, Badge } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useNavigate } from 'react-router-dom'

const SKILL_CATEGORIES = [
  'All Skills',
  'Programming',
  'Languages',
  'Design',
  'Music',
  'Sports',
  'Business',
  'Art',
  'Science',
  'General'
]

const Groups = () => {
  const { user: authUser } = useAuthStore()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [userGroups, setUserGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Skills')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [joiningGroupId, setJoiningGroupId] = useState(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    skillCategory: 'General',
  })

  // Load groups and user's groups
  useEffect(() => {
    if (!authUser) return

    setIsLoading(true)
    try {
      // Subscribe to all groups
      const unsubscribeGroups = firebaseRealtime.subscribeToGroups((loadedGroups) => {
        setGroups(loadedGroups)
        setIsLoading(false)
      })

      // Get user's groups
      const loadUserGroups = async () => {
        const userId = authUser.uid || authUser.id
        const userGroupIds = await firebaseRealtime.getUserGroups(userId)
        setUserGroups(userGroupIds)
      }

      // Load user groups initially and also subscribe to group member changes
      loadUserGroups()
      
      // Reload user groups every 2 seconds to catch new joins/leaves
      const interval = setInterval(loadUserGroups, 2000)

      return () => {
        unsubscribeGroups()
        clearInterval(interval)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      setIsLoading(false)
    }
  }, [authUser])

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All Skills' || group.skillCategory === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Handle create group
  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      setCreateError('Group name is required')
      return
    }

    setIsCreating(true)
    setCreateError('')

    try {
      const userId = authUser.uid || authUser.id
      const result = await firebaseRealtime.createGroup({
        name: createForm.name,
        description: createForm.description,
        skillCategory: createForm.skillCategory,
        createdBy: userId,
      })

      if (result.success) {
        // Add the newly created group to userGroups state (creator is auto-added in Firebase)
        setUserGroups([...userGroups, result.groupId])
        setCreateForm({ name: '', description: '', skillCategory: 'General' })
        setShowCreateModal(false)
        alert('Group created successfully!')
      } else {
        setCreateError(result.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      setCreateError(error.message || 'Error creating group')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle join group
  const handleJoinGroup = async (groupId) => {
    setJoiningGroupId(groupId)
    try {
      const userId = authUser.uid || authUser.id
      const result = await firebaseRealtime.joinGroup(groupId, userId)

      if (result.success) {
        // Update userGroups state to include the new group
        setUserGroups([...userGroups, groupId])
        alert('Joined group successfully!')
      } else {
        alert('Error joining group: ' + result.error)
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Error joining group')
    } finally {
      setJoiningGroupId(null)
    }
  }

  // Handle leave group
  const handleLeaveGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const userId = authUser.uid || authUser.id
        const result = await firebaseRealtime.leaveGroup(groupId, userId)

        if (result.success) {
          // Remove group from userGroups state
          setUserGroups(userGroups.filter(id => id !== groupId))
          alert('Left group successfully!')
        } else {
          alert('Error leaving group: ' + result.error)
        }
      } catch (error) {
        console.error('Error leaving group:', error)
        alert('Error leaving group')
      }
    }
  }

  // Handle delete group
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        const userId = authUser.uid || authUser.id
        const result = await firebaseRealtime.deleteGroup(groupId, userId)

        if (result.success) {
          alert('Group deleted successfully!')
        } else {
          alert('Error: ' + result.error)
        }
      } catch (error) {
        console.error('Error deleting group:', error)
        alert('Error deleting group')
      }
    }
  }

  const isGroupMember = (groupId) => userGroups.includes(groupId)
  const isGroupCreator = (group) => group.createdBy === (authUser?.uid || authUser?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Groups</h1>
              <p className="text-gray-600">Join skill-based groups and collaborate with others</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <FiPlus size={20} /> Create Group
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </motion.div>

        {/* My Groups Section */}
        {userGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Groups ({userGroups.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups
                .filter((g) => userGroups.includes(g.id))
                .map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="h-full hover:shadow-lg transition cursor-pointer">
                      <div className="flex flex-col h-full">
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex-1">{group.name}</h3>
                            <Badge>{group.skillCategory}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-1">
                          <div className="flex items-center gap-1">
                            <FiUsers size={16} />
                            <span>{group.memberCount || 0} members</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/group-chat/${group.id}`)}
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            <FiMessageSquare size={16} /> Chat
                          </Button>
                          {!isGroupCreator(group) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLeaveGroup(group.id)}
                              title="Leave group"
                            >
                              <FiLogOut size={16} />
                            </Button>
                          )}
                          {isGroupCreator(group) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete group"
                            >
                              <FiTrash2 size={16} className="text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Discover Groups Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover Groups</h2>
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredGroups
                  .filter((g) => !userGroups.includes(g.id) && g.createdBy !== (authUser?.uid || authUser?.id))
                  .map((group) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="h-full hover:shadow-lg transition">
                        <div className="flex flex-col h-full">
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900 flex-1">{group.name}</h3>
                              <Badge>{group.skillCategory}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-1">
                            <div className="flex items-center gap-1">
                              <FiUsers size={16} />
                              <span>{group.memberCount || 0} members</span>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={joiningGroupId === group.id}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <FiPlus size={16} /> {joiningGroupId === group.id ? 'Joining...' : 'Join Group'}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="text-center py-12">
              <FiUsers size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No groups found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter group name"
                    disabled={isCreating}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe your group"
                    disabled={isCreating}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Skill Category
                  </label>
                  <select
                    value={createForm.skillCategory}
                    onChange={(e) => setCreateForm({ ...createForm, skillCategory: e.target.value })}
                    disabled={isCreating}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    {SKILL_CATEGORIES.filter((c) => c !== 'All Skills').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Groups

