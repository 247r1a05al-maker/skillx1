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
} from 'react-icons/fi'
import { Card, Button, Badge } from '../components/UI'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { userProfileService } from '../services/user-profile'
import { calculateBadges } from '../utils/badges'

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

  const effectiveBadges = achievements.length > 0
    ? achievements.map((item, index) => ({
        id: item.id || `${item.badgeName || 'badge'}-${index}`,
        name: item.badgeName || item.name || 'Achievement',
        description: item.description || 'Earned by activity milestones',
        icon: item.icon || '🏆',
        earnedAt: item.dateEarned || item.earnedAt || item.timestamp,
      }))
    : badgeStats.earnedBadges.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        icon: '🏆',
        earnedAt: null,
      }))

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
          <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-400" />
          <div className="px-4 sm:px-8 pb-6 -mt-12 text-center">
            <div className="relative inline-block">
              <Avatar
                src={user.avatar}
                name={user.name}
                userId={user.id}
                size="lg"
                className="border-4 border-white shadow-lg"
              />
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full shadow hover:bg-indigo-700"
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

            <h1 className="text-3xl font-bold text-gray-900 mt-3">{user.name}</h1>
            <p className="text-gray-700 mt-1">{user.role || user.bio || 'Skill Learner'}</p>

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

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {isOwnProfile ? (
                <Button variant="primary" onClick={() => setShowEditModal(true)} className="flex items-center gap-2">
                  <FiEdit2 size={16} /> Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={handleFollowToggle}
                    className="flex items-center gap-2"
                    disabled={isFollowLoading}
                  >
                    <FiUsers size={16} /> {isFollowLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" onClick={handleMessageClick} className="flex items-center gap-2">
                    <FiMessageSquare size={16} /> Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="py-2">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'profile', label: 'Profile' },
              { key: 'posts', label: `Posts (${userPosts.length})` },
              { key: 'badges', label: `Badges (${effectiveBadges.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills I Teach</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {(user.skills?.teaching || []).length > 0 ? (
                  user.skills.teaching.map((skill) => (
                    <Badge key={`teach-${skill}`} variant="primary">{skill}</Badge>
                  ))
                ) : (
                  <p className="text-gray-500">No teaching skills added yet.</p>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills I Want to Learn</h2>
              <div className="flex flex-wrap gap-2">
                {(user.skills?.learning || []).length > 0 ? (
                  user.skills.learning.map((skill) => (
                    <Badge key={`learn-${skill}`} variant="success">{skill}</Badge>
                  ))
                ) : (
                  <p className="text-gray-500">No learning skills added yet.</p>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <button onClick={() => setShowFollowersModal(true)} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </button>
                  <button onClick={() => setShowFollowingModal(true)} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </button>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">{groupsJoined}</p>
                    <p className="text-sm text-gray-600">Groups</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-2xl font-bold text-gray-900">{user.coins || 0}</p>
                    <p className="text-sm text-gray-600">Coins</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FiUsers size={18} /> Community Rank
                </h3>
                <p className="text-3xl font-bold text-indigo-700">#{rankMetrics.rank}</p>
                <p className="text-sm text-gray-600 mb-4">of {rankMetrics.rankedTotal}</p>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    style={{ width: `${rankMetrics.progressToNext}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">Level {rankMetrics.level} Learner</span>
                  <span className="text-gray-600">Next Lv: {rankMetrics.progressToNext}%</span>
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiZap className="text-indigo-600" size={20} /> Recent Activity
                </h3>
                <Badge variant="secondary">{recentActivity.length} items</Badge>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-100 rounded-lg bg-white">
                      <div className="flex items-start gap-3">
                        <div className="text-xl">{activity.icon || '⚡'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No activity yet.</p>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiAward size={18} className="text-indigo-600" /> Achievements
                </h3>
                <button className="text-sm text-indigo-600 font-semibold" onClick={() => setActiveTab('badges')}>View all</button>
              </div>
              <div className="space-y-2">
                {effectiveBadges.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="font-semibold text-gray-900">{item.icon} {item.name}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                ))}
                {effectiveBadges.length === 0 && <p className="text-gray-500">No badges unlocked yet.</p>}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'posts' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Posts</h2>
            {userPosts.length === 0 ? (
              <p className="text-gray-500">No posts yet.</p>
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
                <div className="space-y-3">
                  {badgeStats.inProgressBadges.slice(0, 6).map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">{item.name}</span>
                        <span className="text-gray-600">{Math.round(item.progressPercentage)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
