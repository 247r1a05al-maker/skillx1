import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers, FiMessageSquare, FiX, FiLogOut, FiTrash2, FiGlobe, FiTrendingUp, FiActivity } from 'react-icons/fi'
import { Card, Button, Badge } from '../components/UI'
import Avatar from '../components/Avatar'
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
  const [groupMembers, setGroupMembers] = useState({}) // Store members for each group
  const [allUsers, setAllUsers] = useState([]) // Store all users for member info
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
        // Deduplicate groups by ID
        const uniqueGroups = Array.from(new Map(loadedGroups.map(g => [g.id, g])).values())
        setGroups(uniqueGroups)
        setIsLoading(false)
        
        // Load members for each group
        uniqueGroups.forEach((group) => {
          firebaseRealtime.subscribeToGroupMembers(group.id, (members) => {
            // Deduplicate members by user ID
            const uniqueMembers = Array.from(new Map(members.map(m => [m.userId, m])).values())
            setGroupMembers((prev) => ({
              ...prev,
              [group.id]: uniqueMembers,
            }))
          })
        })
      })

      // Get all users for member info and online status
      const unsubscribeUsers = firebaseRealtime.subscribeToUsers((users) => {
        // Deduplicate users by ID
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values())
        setAllUsers(uniqueUsers)
      })

      // Get user's groups
      const loadUserGroups = async () => {
        const userId = authUser.uid || authUser.id
        const userGroupIds = await firebaseRealtime.getUserGroups(userId)
        setUserGroups(userGroupIds)
      }

      loadUserGroups()
      const interval = setInterval(loadUserGroups, 2000)

      return () => {
        unsubscribeGroups()
        unsubscribeUsers()
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

  // Get members preview for a group with online status
  const getGroupMembersPreview = (groupId, limit = 5) => {
    const members = groupMembers[groupId] || []
    return members.slice(0, limit).map((member) => {
      const user = allUsers.find((u) => u.id === member.userId || u.uid === member.userId)
      return {
        ...member,
        user,
        isOnline: user?.isOnline || false,
      }
    })
  }

  // Count online members
  const getOnlineMembersCount = (groupId) => {
    const members = groupMembers[groupId] || []
    return members.filter((m) => {
      const user = allUsers.find((u) => u.id === m.userId || u.uid === m.userId)
      return user?.isOnline
    }).length
  }

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
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Groups</h1>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {groups.length} total
                  </span>
                </div>
                <p className="text-gray-600 text-lg">Connect with communities, learn together, and grow</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 text-base"
                >
                  <FiPlus size={20} /> Create Group
                </Button>
              </motion.div>
            </div>

            {/* Search Bar with Categories */}
            <div className="space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search groups by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading communities...</p>
              </div>
            </div>
          ) : (
            <>
              {/* My Groups Section */}
              {userGroups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <FiActivity size={24} className="text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
                    <Badge className="ml-auto">{userGroups.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups
                      .filter((g) => userGroups.includes(g.id))
                      .map((group, idx) => {
                        const members = groupMembers[group.id] || []
                        const onlineCount = getOnlineMembersCount(group.id)
                        const membersPreview = getGroupMembersPreview(group.id, 3)

                        return (
                          <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Card className="h-full hover:shadow-xl transition overflow-hidden group cursor-pointer"
                              onClick={() => navigate(`/group-chat/${group.id}`)}
                            >
                              {/* Header with gradient */}
                              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-24 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20">
                                  <motion.div
                                    className="absolute w-40 h-40 bg-white rounded-full"
                                    animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
                                    transition={{ duration: 6, repeat: Infinity }}
                                    style={{ top: -80, right: -60 }}
                                  />
                                </div>
                              </div>

                              <div className="relative -mt-8 px-4 pb-4">
                                <div className="flex items-end justify-between mb-4">
                                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg border-4 border-white">
                                    <FiUsers className="text-white" size={32} />
                                  </div>
                                  <Badge variant="primary">{group.skillCategory}</Badge>
                                </div>

                                <div className="flex flex-col flex-1 mb-4">
                                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{group.name}</h3>
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{group.description || 'No description'}</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-indigo-600">{members.length}</p>
                                    <p className="text-xs text-gray-600">Members</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                      <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                                    </div>
                                    <p className="text-xs text-gray-600">Online Now</p>
                                  </div>
                                </div>

                                {/* Member Avatars */}
                                {membersPreview.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Active Members</p>
                                    <div className="flex items-center">
                                      {membersPreview.map((member, i) => (
                                        <motion.div
                                          key={member.userId}
                                          className="relative"
                                          style={{ marginLeft: i > 0 ? -8 : 0 }}
                                          whileHover={{ scale: 1.15, zIndex: 10 }}
                                        >
                                          <Avatar
                                            src={member.user?.avatar}
                                            name={member.user?.name || 'User'}
                                            userId={member.userId}
                                            size="sm"
                                            className="border-2 border-white ring-1 ring-gray-200"
                                          />
                                          {member.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                                          )}
                                        </motion.div>
                                      ))}
                                      {members.length > membersPreview.length && (
                                        <span className="ml-2 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                          +{members.length - membersPreview.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1 flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/group-chat/${group.id}`)
                                    }}
                                  >
                                    <FiMessageSquare size={16} /> Chat
                                  </Button>
                                  {!isGroupCreator(group) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleLeaveGroup(group.id)
                                      }}
                                      title="Leave group"
                                    >
                                      <FiLogOut size={16} />
                                    </Button>
                                  )}
                                  {isGroupCreator(group) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteGroup(group.id)
                                      }}
                                      title="Delete group"
                                    >
                                      <FiTrash2 size={16} className="text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        )
                      })}
                  </div>
                </motion.div>
              )}

              {/* Discover Groups Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <FiGlobe size={24} className="text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Discover Groups</h2>
                  <Badge className="ml-auto">{filteredGroups.filter((g) => !userGroups.includes(g.id)).length}</Badge>
                </div>

                {filteredGroups.filter((g) => !userGroups.includes(g.id) && g.createdBy !== (authUser?.uid || authUser?.id)).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredGroups
                        .filter((g) => !userGroups.includes(g.id) && g.createdBy !== (authUser?.uid || authUser?.id))
                        .map((group, idx) => {
                          const members = groupMembers[group.id] || []
                          const onlineCount = getOnlineMembersCount(group.id)
                          const membersPreview = getGroupMembersPreview(group.id, 3)

                          return (
                            <motion.div
                              key={group.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <Card className="h-full hover:shadow-xl transition overflow-hidden group">
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-24 relative overflow-hidden">
                                  <div className="absolute inset-0 opacity-20">
                                    <motion.div
                                      className="absolute w-40 h-40 bg-white rounded-full"
                                      animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
                                      transition={{ duration: 6, repeat: Infinity }}
                                      style={{ top: -80, right: -60 }}
                                    />
                                  </div>
                                </div>

                                <div className="relative -mt-8 px-4 pb-4">
                                  <div className="flex items-end justify-between mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-lg border-4 border-white">
                                      <FiUsers className="text-white" size={32} />
                                    </div>
                                    <Badge variant="primary">{group.skillCategory}</Badge>
                                  </div>

                                  <div className="flex flex-col flex-1 mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{group.name}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{group.description || 'No description'}</p>
                                  </div>

                                  {/* Stats */}
                                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                      <p className="text-2xl font-bold text-purple-600">{members.length}</p>
                                      <p className="text-xs text-gray-600">Members</p>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                                      </div>
                                      <p className="text-xs text-gray-600">Online</p>
                                    </div>
                                  </div>

                                  {/* Member Avatars */}
                                  {membersPreview.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Active Members</p>
                                      <div className="flex items-center">
                                        {membersPreview.map((member, i) => (
                                          <motion.div
                                            key={member.userId}
                                            className="relative"
                                            style={{ marginLeft: i > 0 ? -8 : 0 }}
                                            whileHover={{ scale: 1.15, zIndex: 10 }}
                                          >
                                            <Avatar
                                              src={member.user?.avatar}
                                              name={member.user?.name || 'User'}
                                              userId={member.userId}
                                              size="sm"
                                              className="border-2 border-white ring-1 ring-gray-200"
                                            />
                                            {member.isOnline && (
                                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                                            )}
                                          </motion.div>
                                        ))}
                                        {members.length > membersPreview.length && (
                                          <span className="ml-2 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                            +{members.length - membersPreview.length}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

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
                          )
                        })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Card className="py-20 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <FiUsers size={64} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-600 text-2xl font-bold mb-2">No groups to discover</p>
                      <p className="text-gray-500 text-base mb-6">
                        {searchQuery || selectedCategory !== 'All Skills'
                          ? 'Try adjusting your search or filters'
                          : 'Create a new group to get started!'}
                      </p>
                      {(searchQuery || selectedCategory !== 'All Skills') && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('All Skills')
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </motion.div>
                  </Card>
                )}
              </motion.div>
            </>
          )}
        </div>
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

