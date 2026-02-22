import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEdit2, FiMessageSquare, FiUserPlus, FiAward, FiUsers, FiX, FiCheck, FiArrowLeft, FiTrash2 } from 'react-icons/fi'
import { useAuthStore } from '../store'
import { userProfileService } from '../services/user-profile'
import firebaseRealtime from '../services/firebase-realtime'
import { Card, Button, Badge } from '../components/UI'
import { calculateBadges } from '../utils/badges'
import Avatar from '../components/Avatar'
import DayStreakWidget from '../components/DayStreakWidget'

const Profile = () => {
  const { userId: paramUserId } = useParams()
  const navigate = useNavigate()
  const { user: authUser, isAuthenticated } = useAuthStore()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [followRequestStatus, setFollowRequestStatus] = useState(null) // 'pending', 'accepted', null
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [unsubscribeFollowers, setUnsubscribeFollowers] = useState(null)
  const [unsubscribeFollowing, setUnsubscribeFollowing] = useState(null)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [inProgressBadges, setInProgressBadges] = useState([])
  const [streakData, setStreakData] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
  })
  const premiumEmails = ['247r1a05al@cmrtc.ac.in', 'karthikgajabheemkar@gmail.com']
  const premiumUsername = 'karthik'
  const normalizedEmail = (user?.email || authUser?.email || editForm.email || '').toLowerCase().trim()
  const isPremiumOwner = premiumEmails.includes(normalizedEmail) || (user?.username || '').toLowerCase() === premiumUsername

  // Load user profile from Firebase
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isAuthenticated || !authUser) {
        setIsLoading(false)
        return
      }

      const currentUserId = authUser.uid || authUser.id
      // If paramUserId exists, load that user's profile; otherwise load current user's
      const userIdToLoad = paramUserId || currentUserId
      const isOwnProfileFlag = !paramUserId || paramUserId === currentUserId

      if (!userIdToLoad) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        // For viewing other user's profiles, get from Firebase directly
        if (paramUserId && paramUserId !== currentUserId) {
          const unsubscribe = firebaseRealtime.subscribeToCurrentUser(paramUserId, (userData) => {
            if (userData) {
              // Ensure user object has id field
              const userWithId = { ...userData, id: paramUserId }
              setUser(userWithId)
              setIsOwnProfile(false)
              setAvatarPreview(userData.avatar || '')
            }
            setIsLoading(false)
          })
          return () => unsubscribe?.()
        } else {
          // Load own profile
          const result = await userProfileService.getUserProfile(currentUserId)
          
          if (result.success && result.data) {
            // Ensure user object has id field
            const userWithId = { ...result.data, id: currentUserId }
            setUser(userWithId)
            setIsOwnProfile(true)
            setEditForm({
              name: result.data.name || authUser.displayName || authUser.name || '',
              email: result.data.email || authUser.email || '',
              bio: result.data.bio || '',
              avatar: result.data.avatar || '',
            })
            setAvatarPreview(result.data.avatar || '')
          } else {
            // Create default profile if doesn't exist
            const defaultProfile = {
              id: currentUserId,
              name: authUser.displayName || authUser.name || 'User',
              email: authUser.email || '',
              bio: '',
              avatar: '',
              followers: 0,
              following: 0,
              coins: 0,
              certificates: 0,
              groups: 0,
              skills: {
                teaching: [],
                learning: [],
              },
            }
            setUser(defaultProfile)
            setIsOwnProfile(true)
            setEditForm({
              name: defaultProfile.name,
              email: defaultProfile.email,
              bio: defaultProfile.bio,
              avatar: defaultProfile.avatar,
            })
            setAvatarPreview(defaultProfile.avatar)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Set default profile on error
        const defaultProfile = {
          id: currentUserId,
          name: authUser.displayName || authUser.name || 'User',
          email: authUser.email || '',
          bio: '',
          avatar: '',
          followers: 0,
          following: 0,
          coins: 0,
          certificates: 0,
          groups: 0,
          skills: {
            teaching: [],
            learning: [],
          },
        }
        setUser(defaultProfile)
        setIsOwnProfile(true)
        setEditForm({
          name: defaultProfile.name,
          email: defaultProfile.email,
          bio: defaultProfile.bio,
          avatar: defaultProfile.avatar,
        })
        setAvatarPreview(defaultProfile.avatar)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [isAuthenticated, authUser, paramUserId])

  // Subscribe to followers and following counts in real-time
  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, skipping count subscription')
      return
    }

    const userIdToLoad = user.id
    console.log('🔄 Setting up count subscriptions for user:', userIdToLoad)

    // Subscribe to followers count
    const unsubscribeFollowers = firebaseRealtime.subscribeToFollowersCount(userIdToLoad, (count) => {
      console.log('📊 Followers count callback - received:', count)
      setFollowersCount(count)
    })

    // Subscribe to following count
    const unsubscribeFollowing = firebaseRealtime.subscribeToFollowingCount(userIdToLoad, (count) => {
      console.log('📊 Following count callback - received:', count)
      setFollowingCount(count)
    })

    // Verify initial counts by fetching once
    const verifyInitialCounts = async () => {
      try {
        const followersSnap = await firebaseRealtime.getFollowersCount(userIdToLoad)
        const followingSnap = await firebaseRealtime.getFollowingCount(userIdToLoad)
        console.log('✅ Verified initial followers:', followersSnap, 'following:', followingSnap)
      } catch (error) {
        console.error('❌ Error verifying counts:', error)
      }
    }

    verifyInitialCounts()

    return () => {
      console.log('🛑 Cleaning up count subscriptions for user:', userIdToLoad)
      if (unsubscribeFollowers) unsubscribeFollowers()
      if (unsubscribeFollowing) unsubscribeFollowing()
    }
  }, [user?.id])

  // Load streak data for the user
  useEffect(() => {
    const loadStreakData = async () => {
      if (!user?.id) return

      try {
        const streak = await firebaseRealtime.getDayStreak(user.id)
        setStreakData(streak)
      } catch (error) {
        console.error('Error loading streak data:', error)
      }
    }

    loadStreakData()
  }, [user?.id])

  // Calculate badges when user data or counts change
  useEffect(() => {
    if (!user) return

    const userStats = {
      groups: user.groups || 0,
      followers: followersCount,
      following: followingCount,
      messagesSent: user.messagesSent || 0,
      groupsCreated: user.groupsCreated || 0,
      postsCreated: user.postsCreated || 0,
      coins: user.coins || 0,
      maxStreak: streakData?.longestStreak || 0,
      teachingSkills: user.skills?.teaching?.length || 0,
      learningSkills: user.skills?.learning?.length || 0
    }

    const { earnedBadges: earned, inProgressBadges: inProgress } = calculateBadges(userStats)
    setEarnedBadges(earned)
    setInProgressBadges(inProgress)
  }, [user, followersCount, followingCount, streakData])

  // Check follow request status for other users
  useEffect(() => {
    if (isOwnProfile || !paramUserId || !authUser) return

    const checkStatus = async () => {
      const currentUserId = authUser.uid || authUser.id
      const status = await firebaseRealtime.checkFollowRequestStatus(currentUserId, paramUserId)
      setFollowRequestStatus(status)
    }

    checkStatus()
  }, [isOwnProfile, paramUserId, authUser])

  // Handle follow/unfollow request
  const handleFollowRequest = async () => {
    if (!authUser || !paramUserId) return

    const currentUserId = authUser.uid || authUser.id
    setIsFollowingLoading(true)

    try {
      if (followRequestStatus === 'pending') {
        // Cancel pending request
        alert('Follow request is pending. Cannot cancel yet.')
      } else if (followRequestStatus === 'accepted') {
        // Unfollow (remove follower relationship)
        alert('Unfollow feature coming soon')
      } else {
        // Send new follow request
        const success = await firebaseRealtime.sendFollowRequest(currentUserId, paramUserId)
        if (success) {
          setFollowRequestStatus('pending')
          alert('Follow request sent! 📬')
        } else {
          alert('Failed to send follow request')
        }
      }
    } catch (error) {
      console.error('Error handling follow request:', error)
      alert('Error: ' + error.message)
    } finally {
      setIsFollowingLoading(false)
    }
  }

  // Load followers list with real-time updates
  const loadFollowersList = async () => {
    if (!user?.id) return
    setIsLoadingLists(true)
    try {
      // Subscribe to real-time followers updates
      const unsubscribe = firebaseRealtime.subscribeToFollowers(user.id, (followers) => {
        // Deduplicate followers by ID
        const uniqueFollowers = Array.from(new Map(followers.map(f => [f.id, f])).values())
        console.log('🔄 Real-time followers updated:', uniqueFollowers.length)
        setFollowersList(uniqueFollowers)
      })
      
      setUnsubscribeFollowers(unsubscribe)
      setShowFollowersModal(true)
    } catch (error) {
      console.error('Error loading followers:', error)
      alert('Error loading followers')
    } finally {
      setIsLoadingLists(false)
    }
  }

  // Load following list with real-time updates
  const loadFollowingList = async () => {
    if (!user?.id) return
    setIsLoadingLists(true)
    try {
      // Subscribe to real-time following updates
      const unsubscribe = firebaseRealtime.subscribeToFollowing(user.id, (following) => {
        // Deduplicate following by ID
        const uniqueFollowing = Array.from(new Map(following.map(f => [f.id, f])).values())
        console.log('🔄 Real-time following updated:', uniqueFollowing.length)
        setFollowingList(uniqueFollowing)
      })
      
      setUnsubscribeFollowing(unsubscribe)
      setShowFollowingModal(true)
    } catch (error) {
      console.error('Error loading following:', error)
      alert('Error loading following')
    } finally {
      setIsLoadingLists(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          setAvatarPreview(result)
          setEditForm(prev => ({ ...prev, avatar: result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    const userId = authUser?.uid || authUser?.id
    if (!userId) return
    
    setIsSaving(true)
    try {
      const result = await userProfileService.updateUserProfile(userId, {
        name: editForm.name,
        email: editForm.email,
        bio: editForm.bio,
        avatar: avatarPreview || null,
      })

      if (result.success) {
        setUser(prev => ({
          ...prev,
          ...editForm,
          avatar: avatarPreview || null,
        }))
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert('Error updating profile: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      avatar: user?.avatar || null,
    })
    setAvatarPreview(user?.avatar || '')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 mt-20">
      {/* Edit Profile Modal */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
                    />
                  ) : (
                    <Avatar
                      src={null}
                      name={editForm.name || 'User'}
                      userId={authUser?.uid || authUser?.id}
                      size="md"
                      className="border-2 border-indigo-200"
                    />
                  )}
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="text-sm text-gray-500"
                      disabled={isSaving}
                    />
                    {avatarPreview && (
                      <button
                        onClick={() => {
                          setAvatarPreview('')
                          setEditForm(prev => ({ ...prev, avatar: '' }))
                        }}
                        disabled={isSaving}
                        className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50 font-medium flex items-center gap-2 w-fit"
                      >
                        <FiTrash2 size={14} /> Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Enter your name"
                  disabled={isSaving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="Enter your email"
                  disabled={isSaving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  placeholder="Tell us about yourself"
                  disabled={isSaving}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <FiX className="inline mr-2" size={18} /> Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheck size={18} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Followers List Modal */}
      {showFollowersModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Followers ({followersList.length})</h2>
              <button
                onClick={() => {
                  setShowFollowersModal(false)
                  if (unsubscribeFollowers) unsubscribeFollowers()
                  setUnsubscribeFollowers(null)
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {followersList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No followers yet</p>
              ) : (
                followersList.map((follower) => (
                  <div key={follower.uid} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar
                        src={follower.avatar}
                        name={follower.name}
                        userId={follower.uid}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{follower.name}</p>
                        <p className="text-xs text-gray-500 truncate">{follower.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/profile/${follower.uid}`)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Following List Modal */}
      {showFollowingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Following ({followingList.length})</h2>
              <button
                onClick={() => {
                  setShowFollowingModal(false)
                  if (unsubscribeFollowing) unsubscribeFollowing()
                  setUnsubscribeFollowing(null)
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {followingList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Not following anyone yet</p>
              ) : (
                followingList.map((following) => (
                  <div key={following.uid} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar
                        src={following.avatar}
                        name={following.name}
                        userId={following.uid}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{following.name}</p>
                        <p className="text-xs text-gray-500 truncate">{following.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/profile/${following.uid}`)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Profile Header Card */}
      <div className="flex items-center gap-4 mb-4">
        {paramUserId && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Go back"
          >
            <FiArrowLeft size={24} className="text-gray-700" />
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="text-center pb-8 relative overflow-hidden">
          {/* Banner Gradient */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl -m-6 mb-6" />

          {/* Avatar */}
          <div className="relative mx-auto -mt-16 mb-4 flex justify-center">
            <div className="relative">
              <Avatar
                src={user?.avatar}
                name={user?.name || 'User'}
                userId={user?.id}
                size="lg"
                className="border-4 border-white shadow-lg"
              />
            </div>
          </div>

          {/* Name & Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'User'}</h1>
          </div>
          <p className="text-gray-600 mb-2">{user?.email}</p>
          <p className="text-gray-700 mb-6">{user?.bio || 'No bio yet'}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button
              onClick={loadFollowersList}
              disabled={isLoadingLists}
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition transform hover:scale-105 border border-blue-200"
              title="View followers"
            >
              <p className="text-3xl font-bold text-blue-600">{followersCount}</p>
              <p className="text-xs font-medium text-blue-700">Followers</p>
            </button>
            <button
              onClick={loadFollowingList}
              disabled={isLoadingLists}
              className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl p-4 transition transform hover:scale-105 border border-purple-200"
              title="View following"
            >
              <p className="text-3xl font-bold text-purple-600">{followingCount}</p>
              <p className="text-xs font-medium text-purple-700">Following</p>
            </button>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-3xl font-bold text-green-600">{streakData?.longestStreak || 0}</p>
              <p className="text-xs font-medium text-green-700">Max Streak</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-600">{user?.coins || 0}</p>
              <p className="text-xs font-medium text-yellow-700">Coins</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isOwnProfile ? (
              <Button 
                variant="primary" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit2 size={18} /> Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="primary" 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => navigate(`/inbox?user=${paramUserId}`)}
                >
                  <FiMessageSquare size={18} /> Message
                </Button>
                <Button
                  variant={followRequestStatus === 'accepted' ? 'secondary' : 'outline'}
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleFollowRequest}
                  disabled={isFollowingLoading}
                >
                  <FiUserPlus size={18} /> 
                  {isFollowingLoading ? 'Loading...' : followRequestStatus === 'pending' ? '⏳ Pending' : followRequestStatus === 'accepted' ? '✓ Following' : 'Follow'}
                </Button>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Bio Section */}
      {user?.bio && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
          </Card>
        </motion.div>
      )}

      {/* Activity Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DayStreakWidget />
          
          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <FiUsers size={20} /> Community Rank
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">#12</span>
              <span className="text-pink-100 mb-1">of 250</span>
            </div>
            <p className="text-sm text-pink-100">Top 5% contributor 🏆</p>
          </Card>
        </div>
      </motion.div>

      {/* Recent Activity Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Completed skill exchange session</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💬</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Posted in Community</p>
                <p className="text-sm text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Earned 20 coins</p>
                <p className="text-sm text-gray-500">Yesterday</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Badges Section */}
      {earnedBadges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiAward className="text-indigo-600" size={22} />
              Achievements ({earnedBadges.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.id}
                    className={`${badge.bgColor} rounded-lg p-4 border-2 border-transparent hover:border-indigo-300 transition`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${badge.color} text-white`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold ${badge.textColor} text-sm mb-0.5`}>
                          {badge.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* In Progress Badges */}
            {inProgressBadges.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">In Progress</h3>
                <div className="space-y-2">
                  {inProgressBadges.slice(0, 3).map((badge) => {
                    const Icon = badge.icon
                    return (
                      <div key={badge.id} className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${badge.bgColor}`}>
                          <Icon size={16} className={badge.textColor} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{badge.name}</span>
                            <span className="text-xs text-gray-500">{Math.round(badge.progressPercentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full bg-gradient-to-r ${badge.color} transition-all duration-300`}
                              style={{ width: `${badge.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Skills Section */}
      {user?.skills?.teaching && user.skills.teaching.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Skills Teaching</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.teaching.map((skill) => (
                <Badge key={skill} variant="primary">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {user?.skills?.learning && user.skills.learning.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Skills Learning</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.learning.map((skill) => (
                <Badge key={skill} variant="success">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Groups Section */}
      {user?.groups && user.groups > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiUsers size={20} /> Groups
              </h2>
              <span className="text-sm font-semibold text-indigo-600">{user.groups} groups</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Web Dev Community', 'React Learners', 'JavaScript Masters', 'UI/UX Design', 'DevOps Team', 'Data Science']
                .slice(0, user.groups)
                .map((group) => (
                  <div key={group} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm font-semibold text-gray-900">{group}</p>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}
      </div>
    </div>
  )
}

export default Profile
