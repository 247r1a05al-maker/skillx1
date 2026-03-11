import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiAward,
  FiCamera,
  FiCheck,
  FiEdit2,
  FiFileText,
  FiMapPin,
  FiMessageSquare,
  FiUsers,
  FiX,
  FiZap,
  FiPlus,
  FiBriefcase,
  FiCode,
  FiStar,
  FiBookOpen,
  FiTrendingUp,
  FiLink,
  FiImage,
  FiVideo,
} from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { userProfileService } from '../services/user-profile'
import { calculateBadges, BADGES } from '../utils/badges'

const LEVEL_POINTS = 120

const formatDateTime = (value) => {
  if (!value) return 'Recently'
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return 'Recently'
  return time.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getInitialProfile = (authUser, userId) => ({
  id: userId,
  name: authUser?.displayName || authUser?.name || 'User',
  email: authUser?.email || '',
  bio: '',
  role: 'Skill Learner',
  location: '',
  avatar: '',
  coins: 0,
  groups: 0,
  skills: {
    teaching: [],
    learning: [],
  },
})

const POST_TYPE_OPTIONS = [
  {
    value: 'portfolio',
    label: 'Portfolio',
    icon: FiBriefcase,
    selectedClass: 'border-indigo-500 bg-indigo-50 text-indigo-700',
    iconClass: 'text-indigo-600',
  },
  {
    value: 'project',
    label: 'Project',
    icon: FiCode,
    selectedClass: 'border-purple-500 bg-purple-50 text-purple-700',
    iconClass: 'text-purple-600',
  },
  {
    value: 'skill',
    label: 'Skill Demo',
    icon: FiZap,
    selectedClass: 'border-blue-500 bg-blue-50 text-blue-700',
    iconClass: 'text-blue-600',
  },
  {
    value: 'achievement',
    label: 'Achievement',
    icon: FiStar,
    selectedClass: 'border-amber-500 bg-amber-50 text-amber-700',
    iconClass: 'text-amber-600',
  },
  {
    value: 'tutorial',
    label: 'Tutorial',
    icon: FiBookOpen,
    selectedClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    iconClass: 'text-emerald-600',
  },
  {
    value: 'update',
    label: 'Update',
    icon: FiTrendingUp,
    selectedClass: 'border-slate-500 bg-slate-50 text-slate-700',
    iconClass: 'text-slate-600',
  },
]

const DEFAULT_POST_FORM = {
  type: 'update',
  title: '',
  content: '',
  imageUrl: '',
  videoUrl: '',
  projectLink: '',
  tags: '',
}

const isValidHttpUrl = (value) => {
  if (!value) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const Profile = () => {
  const navigate = useNavigate()
  const { userId: paramUserId } = useParams()
  const { user: authUser, isAuthenticated } = useAuthStore()

  const [user, setUser] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [groupsJoined, setGroupsJoined] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)

  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [userPosts, setUserPosts] = useState([])
  const [achievements, setAchievements] = useState([])

  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [postForm, setPostForm] = useState(DEFAULT_POST_FORM)
  const [postFormError, setPostFormError] = useState('')

  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])

  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    role: '',
    location: '',
    avatar: '',
    teachSkillsText: '',
    learnSkillsText: '',
  })

  const avatarInputRef = useRef(null)

  const currentUserId = authUser?.uid || authUser?.id
  const profileUserId = paramUserId || currentUserId

  useEffect(() => {
    if (!isAuthenticated || !profileUserId || !authUser) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribeUser = firebaseRealtime.subscribeToCurrentUser(profileUserId, (profileData) => {
      const own = profileUserId === currentUserId
      setIsOwnProfile(own)

      if (profileData) {
        const mergedUser = {
          ...getInitialProfile(authUser, profileUserId),
          ...profileData,
          id: profileUserId,
          skills: {
            teaching: profileData?.skills?.teaching || [],
            learning: profileData?.skills?.learning || [],
          },
        }
        setUser(mergedUser)
        setEditForm({
          name: mergedUser.name || '',
          bio: mergedUser.bio || '',
          role: mergedUser.role || mergedUser.title || 'Skill Learner',
          location: mergedUser.location || '',
          avatar: mergedUser.avatar || '',
          teachSkillsText: (mergedUser.skills?.teaching || []).join(', '),
          learnSkillsText: (mergedUser.skills?.learning || []).join(', '),
        })
      } else {
        const fallback = getInitialProfile(authUser, profileUserId)
        setUser(fallback)
        setEditForm({
          name: fallback.name,
          bio: fallback.bio,
          role: fallback.role,
          location: fallback.location,
          avatar: fallback.avatar,
          teachSkillsText: '',
          learnSkillsText: '',
        })
      }

      setIsLoading(false)
    })

    return () => unsubscribeUser?.()
  }, [isAuthenticated, authUser, profileUserId, currentUserId])

  useEffect(() => {
    if (!profileUserId) return

    const unsubFollowersCount = firebaseRealtime.subscribeToFollowersCount(profileUserId, setFollowersCount)
    const unsubFollowingCount = firebaseRealtime.subscribeToFollowingCount(profileUserId, setFollowingCount)
    const unsubGroups = firebaseRealtime.subscribeToGroupsJoinedCount(profileUserId, setGroupsJoined)
    const unsubActivities = firebaseRealtime.subscribeToUserRecentActivity(profileUserId, (items) => {
      setRecentActivity((items || []).slice(0, 10))
    })
    const unsubPosts = firebaseRealtime.subscribeToUserPosts(profileUserId, setUserPosts)
    const unsubAchievements = firebaseRealtime.subscribeToUserAchievements(profileUserId, setAchievements)
    const unsubUsers = firebaseRealtime.subscribeToUsers((users) => setTotalUsers(users.length || 0))
    const unsubFollowersList = firebaseRealtime.subscribeToFollowers(profileUserId, setFollowersList)
    const unsubFollowingList = firebaseRealtime.subscribeToFollowing(profileUserId, setFollowingList)

    firebaseRealtime.getDayStreak(profileUserId)
      .then((streak) => setStreakData(streak || { currentStreak: 0, longestStreak: 0 }))
      .catch(() => setStreakData({ currentStreak: 0, longestStreak: 0 }))

    return () => {
      unsubFollowersCount?.()
      unsubFollowingCount?.()
      unsubGroups?.()
      unsubActivities?.()
      unsubPosts?.()
      unsubAchievements?.()
      unsubUsers?.()
      unsubFollowersList?.()
      unsubFollowingList?.()
    }
  }, [profileUserId])

  useEffect(() => {
    if (isOwnProfile || !currentUserId || !profileUserId) {
      setIsFollowing(false)
      return
    }

    let mounted = true
    firebaseRealtime.checkIsFollowing(currentUserId, profileUserId).then((result) => {
      if (mounted) setIsFollowing(result)
    })

    return () => {
      mounted = false
    }
  }, [isOwnProfile, currentUserId, profileUserId, followersCount])

  const likesReceived = useMemo(
    () => userPosts.reduce((sum, post) => sum + (post.likesCount || 0), 0),
    [userPosts]
  )

  const rankMetrics = useMemo(() => {
    const postPoints = userPosts.length * 15
    const activityPoints = recentActivity.length * 5
    const followerPoints = followersCount * 3
    const likesPoints = likesReceived * 4
    const groupPoints = groupsJoined * 10
    const streakPoints = (streakData?.currentStreak || 0) * 2

    const totalPoints = postPoints + activityPoints + followerPoints + likesPoints + groupPoints + streakPoints
    const level = Math.max(1, Math.floor(totalPoints / LEVEL_POINTS) + 1)
    const progressToNext = Math.round((totalPoints % LEVEL_POINTS) / LEVEL_POINTS * 100)

    const computedRank = totalUsers > 0
      ? Math.max(1, totalUsers - Math.floor(totalPoints / 50))
      : 1

    return {
      totalPoints,
      level,
      progressToNext,
      rank: user?.communityRank || computedRank,
      rankedTotal: user?.totalRankedUsers || totalUsers || 1,
    }
  }, [user, userPosts, recentActivity, followersCount, likesReceived, groupsJoined, streakData, totalUsers])

  const badgeStats = useMemo(() => {
    return calculateBadges({
      groups: groupsJoined,
      followers: followersCount,
      following: followingCount,
      messagesSent: user?.messagesSent || 0,
      groupsCreated: user?.groupsCreated || 0,
      postsCreated: userPosts.length,
      coins: user?.coins || 0,
      certificates: (achievements || []).length,
      teachingSkills: user?.skills?.teaching?.length || 0,
      learningSkills: user?.skills?.learning?.length || 0,
      maxStreak: streakData?.longestStreak || 0,
    })
  }, [groupsJoined, followersCount, followingCount, user, userPosts.length, achievements, streakData])

  const effectiveBadges = useMemo(() => {
    const fromAchievements = (achievements || []).map((item, index) => ({
      id: item.id || `${item.badgeName || 'badge'}-${index}`,
      name: item.badgeName || item.name || 'Achievement',
      description: item.description || 'Earned by activity milestones',
      icon: item.icon || '🏆',
      earnedAt: item.dateEarned || item.earnedAt || item.timestamp,
    }))

    const fromComputed = (badgeStats.earnedBadges || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      icon: '🏆',
      earnedAt: null,
    }))

    const merged = [...fromAchievements, ...fromComputed]
    const seen = new Set()

    return merged.filter((badge) => {
      const key = `${badge.id || ''}::${badge.name || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [achievements, badgeStats])

  const interestTopics = useMemo(() => {
    const teaching = user?.skills?.teaching || []
    const learning = user?.skills?.learning || []
    return [...new Set([...teaching, ...learning])].slice(0, 10)
  }, [user])

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !isOwnProfile || !profileUserId) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const avatar = typeof e.target?.result === 'string' ? e.target.result : ''
      if (!avatar) return

      setEditForm((prev) => ({ ...prev, avatar }))
      setUser((prev) => ({ ...prev, avatar }))

      await userProfileService.updateUserProfile(profileUserId, { avatar })
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!profileUserId || !isOwnProfile) return

    setIsSaving(true)
    try {
      const teachSkills = editForm.teachSkillsText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      const learnSkills = editForm.learnSkillsText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      const updates = {
        name: editForm.name.trim(),
        bio: editForm.bio.trim(),
        role: editForm.role.trim(),
        location: editForm.location.trim(),
        avatar: editForm.avatar || user?.avatar || '',
        skills: {
          teaching: teachSkills,
          learning: learnSkills,
        },
      }

      const result = await userProfileService.updateUserProfile(profileUserId, updates)
      if (result.success) {
        setUser((prev) => ({ ...prev, ...updates }))
        setShowEditModal(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUserId || !profileUserId || isOwnProfile) return

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        const ok = await firebaseRealtime.unfollowUser(currentUserId, profileUserId)
        if (ok) setIsFollowing(false)
      } else {
        const ok = await firebaseRealtime.followUser(currentUserId, profileUserId)
        if (ok) setIsFollowing(true)
      }
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMessageClick = async () => {
    if (!currentUserId || !profileUserId || isOwnProfile) return
    await firebaseRealtime.createOrGetConversation(currentUserId, profileUserId)
    navigate(`/inbox?user=${profileUserId}`)
  }

  const resetPostForm = () => {
    setPostForm(DEFAULT_POST_FORM)
    setPostFormError('')
  }

  const closeCreatePostModal = () => {
    setShowCreatePostModal(false)
    resetPostForm()
  }

  const handleCreatePost = async () => {
    const title = postForm.title.trim()
    const content = postForm.content.trim()
    const imageUrl = postForm.imageUrl.trim()
    const videoUrl = postForm.videoUrl.trim()
    const projectLink = postForm.projectLink.trim()

    if (!content) {
      setPostFormError('Content is required.')
      return
    }

    if (content.length < 10) {
      setPostFormError('Content must be at least 10 characters.')
      return
    }

    if (title.length > 120) {
      setPostFormError('Title must be 120 characters or less.')
      return
    }

    if (content.length > 2000) {
      setPostFormError('Content must be 2000 characters or less.')
      return
    }

    if (!isValidHttpUrl(imageUrl) || !isValidHttpUrl(videoUrl) || !isValidHttpUrl(projectLink)) {
      setPostFormError('Use valid URLs starting with http:// or https://.')
      return
    }

    if (imageUrl && videoUrl) {
      setPostFormError('Please provide either an image URL or a video URL, not both.')
      return
    }

    const tags = [...new Set(
      postForm.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t && t.length <= 24)
    )].slice(0, 10)

    setPostFormError('')
    setIsCreatingPost(true)
    try {
      const postTypeEmojis = {
        portfolio: '🎨',
        project: '💼',
        skill: '⚡',
        achievement: '🏆',
        tutorial: '📚',
        update: '📝',
      }

      const typeLabels = {
        portfolio: 'Portfolio',
        project: 'Project',
        skill: 'Skill Demo',
        achievement: 'Achievement',
        tutorial: 'Tutorial',
        update: 'Update',
      }

      const emoji = postTypeEmojis[postForm.type] || '📝'
      const typeLabel = typeLabels[postForm.type] || 'Update'

      let formattedContent = `${emoji} ${typeLabel}`
      if (title) {
        formattedContent += `: ${title}`
      }
      formattedContent += `\n\n${content}`

      if (projectLink) {
        formattedContent += `\n\n🔗 Link: ${projectLink}`
      }

      const postData = {
        authorId: currentUserId,
        content: formattedContent,
        title,
        type: postForm.type,
        projectLink: projectLink || null,
        image: imageUrl || null,
        video: videoUrl || null,
        tags,
      }

      const result = await firebaseRealtime.createPost(postData)

      if (result.success) {
        closeCreatePostModal()
      } else {
        setPostFormError(result.error || 'Failed to create post.')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setPostFormError('An error occurred while creating the post.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-4">This profile is not available right now.</p>
          <Button variant="primary" onClick={() => navigate('/explore')}>Go to Explore</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {paramUserId && (
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <FiArrowLeft size={22} className="text-gray-700" />
          </button>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-400" />
          <div className="px-4 sm:px-8 pb-6 -mt-14 text-center">
            <div className="relative inline-block">
              <div className="rounded-full bg-white p-1 shadow-xl">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  userId={user.id}
                  size="lg"
                  className="border-4 border-white"
                />
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow hover:bg-indigo-700"
                  aria-label="Change avatar"
                >
                  <FiCamera size={14} />
                </button>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <h1 className="text-3xl font-bold text-gray-900 mt-4">{user.name}</h1>
            <p className="text-gray-700 mt-1">{user.role || user.title || user.bio || 'Skill Learner'}</p>

            <div className="flex justify-center items-center gap-2 text-gray-600 mt-1">
              <FiMapPin size={15} />
              <span>{user.location || 'Location not set'}</span>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-sm font-semibold text-orange-700">
                🔥 {streakData?.currentStreak || 0} Day Streak
              </div>
              <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-100 rounded-lg text-sm font-semibold text-yellow-700">
                🪙 {user.coins || 0} Coins
              </div>
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-semibold text-blue-700">
                👥 {groupsJoined} Groups
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {isOwnProfile ? (
                <Button
                  variant="primary"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center justify-center gap-2 min-w-[180px]"
                >
                  <FiEdit2 size={16} /> Edit Profile
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={handleFollowToggle}
                    className="flex-1 flex items-center justify-center gap-2"
                    disabled={isFollowLoading}
                  >
                    <FiUsers size={16} /> {isFollowLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMessageClick}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <FiMessageSquare size={16} /> Message
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-2">
            <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'profile', label: 'Profile', icon: FiUsers },
              { key: 'posts', label: `Posts (${userPosts.length})`, icon: FiFileText },
              { key: 'badges', label: `Badges (${effectiveBadges.length})`, icon: FiAward },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
            </div>
          </div>
        </Card>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Highlights</h2>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">About</p>
                <p className="text-gray-700">
                  {user.bio?.trim() || 'Add a short bio from Edit Profile to help others understand what you do.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <p className="text-xs text-gray-500">Posts Created</p>
                  <p className="text-2xl font-bold text-gray-900">{userPosts.length}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <p className="text-xs text-gray-500">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <p className="text-xs text-gray-500">Groups Joined</p>
                  <p className="text-2xl font-bold text-gray-900">{groupsJoined}</p>
                </div>
              </div>

              {interestTopics.length > 0 ? (
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Top Interests</p>
                  {interestTopics.map((topic) => (
                    <span
                      key={`topic-${topic}`}
                      className="inline-block mr-2 mb-2 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-600">
                  Add interests in Edit Profile to make your account easier for other students to discover.
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </button>
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </button>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">{groupsJoined}</p>
                    <p className="text-sm text-gray-600">Groups</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">{user.coins || 0}</p>
                    <p className="text-sm text-gray-600">Coins</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <FiZap size={18} /> Login Activity
                </h3>
                <p className="text-3xl font-bold text-green-600">{streakData?.currentStreak || 0} days</p>
                <p className="text-sm text-gray-600 mb-3">Marked by daily sign in</p>

                <div className="flex items-center gap-1 mb-3" aria-hidden>
                  {Array.from({ length: 14 }).map((_, i) => {
                    const filled = i < Math.min(streakData?.currentStreak || 0, 14)
                    return (
                      <span
                        key={`hm-${i}`}
                        className={`w-3 h-3 rounded-sm border ${filled ? 'bg-green-500 border-green-400' : 'bg-gray-100 border-gray-200'}`}
                      />
                    )
                  })}
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${Math.min(((streakData?.currentStreak || 0) / 14) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">Longest Streak: {streakData?.longestStreak || 0} days</span>
                  <span className="text-gray-600">14-day view</span>
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiAward size={18} className="text-indigo-600" /> Achievements
                </h3>
                <button className="text-sm text-indigo-600 font-semibold" onClick={() => setActiveTab('badges')}>View all</button>
              </div>

              {effectiveBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {effectiveBadges.slice(0, 6).map((item, idx) => (
                    <div
                      key={item.id}
                      className={`rounded-xl p-3 text-white border border-white/20 shadow-sm ${
                        idx % 3 === 0
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          : idx % 3 === 1
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}
                    >
                      <div className="text-2xl">{item.icon || '🏆'}</div>
                      <p className="text-xs font-semibold mt-2 leading-tight line-clamp-2">{item.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No badges unlocked yet.</p>
              )}
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Community Progress</p>
                    <p className="text-xs text-gray-500">Level {rankMetrics.level}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      🪙
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{rankMetrics.totalPoints}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    style={{ width: `${rankMetrics.progressToNext}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Rank #{rankMetrics.rank} of {rankMetrics.rankedTotal}</span>
                  <span>Next level: {rankMetrics.progressToNext}%</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Posts</h2>
              {isOwnProfile && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreatePostModal(true)}
                  className="flex items-center gap-2"
                >
                  <FiPlus size={16} /> Create Post
                </Button>
              )}
            </div>
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <FiFileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No posts yet.</p>
                {isOwnProfile && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreatePostModal(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <FiPlus size={16} /> Create Your First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => {
                      setSelectedPost(post)
                      setShowPostModal(true)
                    }}
                    className="w-full text-left p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{post.content?.slice(0, 80) || 'Post'}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Likes {post.likesCount || 0} • Comments {post.commentsCount || 0}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'badges' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Badges & Achievements</h2>
            {effectiveBadges.length === 0 ? (
              <p className="text-gray-500">No badges unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {effectiveBadges.map((badge) => (
                  <div key={badge.id} className="rounded-lg p-4 border border-gray-100 bg-gray-50">
                    <p className="font-semibold text-gray-900">{badge.icon} {badge.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-xs text-gray-500 mt-2">Earned {formatDateTime(badge.earnedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {badgeStats.inProgressBadges.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">In Progress</h3>
                <div className="space-y-4">
                  {badgeStats.inProgressBadges.map((item) => {
                    const visiblePercent =
                      item.progressPercentage > 0 && item.progressPercentage < 1
                        ? 1
                        : Math.round(item.progressPercentage)

                    return (
                      <div key={item.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 flex items-center gap-2">
                            {item.icon} {item.name}
                          </span>
                          <span className="text-sm font-medium text-indigo-600">{visiblePercent}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                            style={{ width: `${Math.max(item.progressPercentage, item.progressPercentage > 0 ? 1 : 0)}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-2">
                          Progress: {item.progressLabel}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Show all available badges */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">All Available Badges ({Object.keys(BADGES).length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(BADGES).map((badge) => {
                  const isEarned = effectiveBadges.some(b => b.id === badge.id)
                  const inProgress = badgeStats.inProgressBadges.find(b => b.id === badge.id)
                  const Icon = badge.icon
                  
                  return (
                    <div 
                      key={badge.id} 
                      className={`rounded-lg p-4 border transition ${
                        isEarned 
                          ? 'border-green-300 bg-green-50' 
                          : inProgress
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {typeof Icon === 'string' ? (
                            <span className="text-2xl">{Icon}</span>
                          ) : Icon ? (
                            <Icon size={20} className={isEarned ? 'text-green-600' : inProgress ? 'text-indigo-600' : 'text-gray-400'} />
                          ) : (
                            <span className="text-2xl">{badge.icon}</span>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{badge.name}</p>
                          </div>
                        </div>
                        {isEarned && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">✓ Earned</span>}
                        {!isEarned && inProgress && (
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                            {Math.round(inProgress.progressPercentage)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      {inProgress && !isEarned && (
                        <p className="text-xs font-medium text-gray-700 mt-2">
                          {inProgress.progressLabel}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-gray-100">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role"
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.location}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
              />
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.bio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Bio"
              />
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.teachSkillsText}
                onChange={(e) => setEditForm((prev) => ({ ...prev, teachSkillsText: e.target.value }))}
                placeholder="Skills I teach (comma separated)"
              />
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editForm.learnSkillsText}
                onChange={(e) => setEditForm((prev) => ({ ...prev, learnSkillsText: e.target.value }))}
                placeholder="Skills I want to learn (comma separated)"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2">
                <FiCheck size={16} /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCreatePostModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-2 sm:my-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiPlus size={20} /> Create Post
              </h2>
              <button onClick={closeCreatePostModal} className="p-1 rounded hover:bg-gray-100">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              {postFormError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {postFormError}
                </p>
              )}

              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Post Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POST_TYPE_OPTIONS.map((type) => {
                    const Icon = type.icon
                    const isSelected = postForm.type === type.value
                    return (
                      <button
                        type="button"
                        key={type.value}
                        onClick={() => setPostForm((prev) => ({ ...prev, type: type.value }))}
                        className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? type.selectedClass
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={20} className={isSelected ? type.iconClass : 'text-gray-500'} />
                        <span className={`text-xs font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                          {type.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={120}
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a catchy title..."
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={2000}
                  value={postForm.content}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your portfolio, project, skill, or update with the community..."
                />
                <p className="text-xs text-gray-500 mt-1">{postForm.content.trim().length}/2000</p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <FiImage size={14} /> Image URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={postForm.imageUrl}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <FiVideo size={14} /> Video URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={postForm.videoUrl}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              {/* Project Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <FiLink size={14} /> Project Link <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={postForm.projectLink}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, projectLink: e.target.value }))}
                  placeholder="https://github.com/username/project or live demo link"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={postForm.tags}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="react, webdev, portfolio, design"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2 shrink-0 bg-white">
              <Button variant="secondary" onClick={closeCreatePostModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreatePost}
                disabled={isCreatingPost || !postForm.content.trim()}
                className="flex items-center gap-2"
              >
                <FiCheck size={16} /> {isCreatingPost ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiFileText size={18} /> Post Details
              </h3>
              <button onClick={() => setShowPostModal(false)} className="p-1 rounded hover:bg-gray-100">
                <FiX size={20} />
              </button>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap">{selectedPost.content}</p>
            {(selectedPost.image || selectedPost.video) && (
              <div className="mt-3">
                {selectedPost.image && <img src={selectedPost.image} alt="Post" className="max-h-80 rounded-lg border" />}
                {selectedPost.video && (
                  <video src={selectedPost.video} controls className="w-full max-h-80 rounded-lg border" />
                )}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-3">
              {formatDateTime(selectedPost.createdAt)} • Likes {selectedPost.likesCount || 0} • Comments {selectedPost.commentsCount || 0}
            </div>
          </Card>
        </div>
      )}

      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Followers ({followersList.length})</h3>
              <button onClick={() => setShowFollowersModal(false)} className="p-1 rounded hover:bg-gray-100"><FiX size={20} /></button>
            </div>
            <div className="space-y-2">
              {followersList.length === 0 ? <p className="text-gray-500">No followers yet.</p> : followersList.map((item) => (
                <button
                  key={item.uid}
                  onClick={() => {
                    setShowFollowersModal(false)
                    navigate(`/profile/${item.uid}`)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <Avatar src={item.avatar} name={item.name} userId={item.uid} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.email || ''}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Following ({followingList.length})</h3>
              <button onClick={() => setShowFollowingModal(false)} className="p-1 rounded hover:bg-gray-100"><FiX size={20} /></button>
            </div>
            <div className="space-y-2">
              {followingList.length === 0 ? <p className="text-gray-500">Not following anyone yet.</p> : followingList.map((item) => (
                <button
                  key={item.uid}
                  onClick={() => {
                    setShowFollowingModal(false)
                    navigate(`/profile/${item.uid}`)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <Avatar src={item.avatar} name={item.name} userId={item.uid} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.email || ''}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Profile
