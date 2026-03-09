import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiSearch,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import Avatar from '../components/Avatar'

const PAGE_SIZE = 16

const normalizeString = (value) => (value || '').toString().trim().toLowerCase()

const getUserSkills = (user) => {
  if (!user) return []
  if (Array.isArray(user.skills)) return user.skills.filter(Boolean)
  const teaching = Array.isArray(user.skills?.teaching) ? user.skills.teaching : []
  const learning = Array.isArray(user.skills?.learning) ? user.skills.learning : []
  // Screenshot shows just a couple skill chips (no teaching/learning split)
  return [...teaching, ...learning].filter(Boolean)
}

const getTagline = (user) => {
  const role = user?.role || user?.title || ''
  if (role) return role
  const bio = user?.bio || ''
  if (!bio) return 'Skill Exchange Member'
  const trimmed = bio.trim()
  if (trimmed.length <= 38) return trimmed
  return `${trimmed.slice(0, 38)}…`
}

const uniqueList = (items) => {
  const out = []
  const seen = new Set()
  ;(items || []).forEach((item) => {
    const v = (item || '').toString().trim()
    if (!v) return
    const key = v.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(v)
  })
  return out
}

const SKILL_CHIP_STYLES = [
  'bg-green-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-indigo-500 text-white',
  'bg-orange-500 text-white',
  'bg-teal-500 text-white',
]

const hashToIndex = (value, mod) => {
  const s = (value || '').toString()
  let hash = 0
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) % 2147483647
  return Math.abs(hash) % mod
}

const Explore = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const currentUserId = authUser?.uid || authUser?.id

  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [onlineFilter, setOnlineFilter] = useState('online') // matches screenshot
  const [sortBy, setSortBy] = useState('most_active')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const [followersCounts, setFollowersCounts] = useState({})
  const [groupsCounts, setGroupsCounts] = useState({})

  // Load users from Firebase in real-time
  useEffect(() => {
    if (!currentUserId) return () => {}

    setIsLoading(true)
    const unsubscribe = firebaseRealtime.subscribeToUsers((firebaseUsers) => {
      const uniqueUsers = Array.from(new Map((firebaseUsers || []).map((u) => [u.id, u])).values())
      const others = uniqueUsers.filter((u) => u?.id && u.id !== currentUserId)
      setAllUsers(others)
      setIsLoading(false)
    })

    return () => unsubscribe?.()
  }, [currentUserId])

  // Skills list for the dropdown
  const allSkills = useMemo(() => {
    const skills = new Set()
    allUsers.forEach((u) => {
      uniqueList(getUserSkills(u)).forEach((s) => {
        if (s) skills.add(s)
      })
    })
    return Array.from(skills).sort((a, b) => a.localeCompare(b))
  }, [allUsers])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery, selectedSkill, onlineFilter, sortBy])

  const filteredAndSorted = useMemo(() => {
    const q = normalizeString(searchQuery)
    const skillNeedle = normalizeString(selectedSkill)

    const filtered = (allUsers || []).filter((u) => {
      const name = normalizeString(u?.name)
      const bio = normalizeString(u?.bio)
      const role = normalizeString(u?.role || u?.title)

      const skills = uniqueList(getUserSkills(u))
      const skillsJoined = skills.map(normalizeString)

      const matchesSearch = !q
        || name.includes(q)
        || bio.includes(q)
        || role.includes(q)
        || skillsJoined.some((s) => s.includes(q))

      const matchesSkill = !skillNeedle || skillsJoined.includes(skillNeedle)

      const isOnline = !!u?.isOnline
      const matchesOnline = onlineFilter === 'all'
        ? true
        : onlineFilter === 'online'
          ? isOnline
          : !isOnline

      return matchesSearch && matchesSkill && matchesOnline
    })

    const getLastActive = (u) => {
      const v = u?.statusLastChanged || u?.lastActiveAt || u?.updatedAt || u?.lastSeen
      const t = typeof v === 'number' ? v : new Date(v || 0).getTime()
      return Number.isFinite(t) ? t : 0
    }

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return (a?.name || '').localeCompare(b?.name || '')
      }

      if (sortBy === 'most_followed') {
        const af = followersCounts[a?.id] || 0
        const bf = followersCounts[b?.id] || 0
        if (bf !== af) return bf - af
      }

      if (sortBy === 'newest') {
        const at = new Date(a?.createdAt || a?.joinedAt || a?.registeredAt || 0).getTime() || 0
        const bt = new Date(b?.createdAt || b?.joinedAt || b?.registeredAt || 0).getTime() || 0
        if (bt !== at) return bt - at
      }

      // Default: Most Active
      const aOnline = a?.isOnline ? 1 : 0
      const bOnline = b?.isOnline ? 1 : 0
      if (bOnline !== aOnline) return bOnline - aOnline

      const al = getLastActive(a)
      const bl = getLastActive(b)
      if (bl !== al) return bl - al

      return (a?.name || '').localeCompare(b?.name || '')
    })

    return sorted
  }, [allUsers, searchQuery, selectedSkill, onlineFilter, sortBy, followersCounts])

  const visibleUsers = useMemo(
    () => filteredAndSorted.slice(0, Math.min(visibleCount, filteredAndSorted.length)),
    [filteredAndSorted, visibleCount]
  )

  const visibleUserIdsKey = useMemo(
    () => visibleUsers.map((u) => u.id).filter(Boolean).join('|'),
    [visibleUsers]
  )

  // Subscribe to counts for visible cards
  useEffect(() => {
    const ids = visibleUsers.map((u) => u.id).filter(Boolean)
    if (ids.length === 0) return () => {}

    const unsubscribers = []
    ids.forEach((userId) => {
      unsubscribers.push(
        firebaseRealtime.subscribeToFollowersCount(userId, (count) => {
          setFollowersCounts((prev) => (prev[userId] === count ? prev : { ...prev, [userId]: count }))
        })
      )
      unsubscribers.push(
        firebaseRealtime.subscribeToGroupsJoinedCount(userId, (count) => {
          setGroupsCounts((prev) => (prev[userId] === count ? prev : { ...prev, [userId]: count }))
        })
      )
    })

    return () => {
      unsubscribers.forEach((fn) => fn?.())
    }
  }, [visibleUserIdsKey])


  const showingCount = Math.min(visibleCount, filteredAndSorted.length)

  const canShowLess = showingCount > PAGE_SIZE
  const canShowMore = showingCount < filteredAndSorted.length

  const handleMessage = async (targetUserId) => {
    if (!currentUserId || !targetUserId) return
    try {
      await firebaseRealtime.createOrGetConversation(currentUserId, targetUserId)
    } catch (e) {
      // Inbox can still work without pre-creating
      console.error('Failed to ensure conversation:', e)
    }
    navigate(`/inbox?user=${targetUserId}`)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Explore &amp; Discover</h1>
        <p className="text-gray-600 mt-2 text-base md:text-lg">Find mentors, learn new skills, and grow together</p>
      </motion.div>

      {/* Filter Bar (matches screenshot layout) */}
      <div className="bg-white/70 border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative w-full lg:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill, or bio..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px]"
              aria-label="Skill filter"
            >
              <option value="">All Skills</option>
              {allSkills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative min-w-[140px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <FiCheck size={16} />
              </div>
              <select
                value={onlineFilter}
                onChange={(e) => setOnlineFilter(e.target.value)}
                className="pl-12 pr-5 py-3 rounded-xl bg-white text-gray-800 font-semibold border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full"
                aria-label="Online filter"
              >
                <option value="online">Online</option>
                <option value="all">All</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-3 rounded-xl bg-white text-gray-800 font-semibold border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 min-w-[200px]"
              aria-label="Sort"
            >
              <option value="most_active">Sort by: Most Active</option>
              <option value="most_followed">Sort by: Most Followed</option>
              <option value="newest">Sort by: Newest</option>
              <option value="name">Sort by: Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-bold text-gray-900">{showingCount}</span> of{' '}
          <span className="font-bold text-gray-900">{filteredAndSorted.length}</span> members
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => Math.max(PAGE_SIZE, c - PAGE_SIZE))}
            disabled={!canShowLess}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            aria-label="Show less"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setVisibleCount((c) => Math.min(filteredAndSorted.length, c + PAGE_SIZE))}
            disabled={!canShowMore}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            aria-label="Show more"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </div>
        </div>
      ) : visibleUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleUsers.map((user, index) => {
            const isOnline = !!user.isOnline
            const followers = followersCounts[user.id] ?? 0
            const groups = groupsCounts[user.id] ?? 0
            const skills = uniqueList(getUserSkills(user)).slice(0, 2)
            const isVerified = !!(user?.verified || user?.isVerified)

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.25) }}
              >
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="rounded-full ring-4 ring-gray-100 p-1 bg-white">
                        <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 left-1 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        aria-label={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                      {user.name || 'Member'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{getTagline(user)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 min-h-[28px]">
                    {(skills || []).map((skill) => {
                      const cls = SKILL_CHIP_STYLES[hashToIndex(skill, SKILL_CHIP_STYLES.length)]
                      return (
                        <span key={skill} className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
                          {skill}
                        </span>
                      )
                    })}
                    {isVerified ? (
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500 text-white flex items-center justify-center" aria-label="Verified">
                        <FiCheck size={14} />
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                    <div className="flex items-center gap-2">
                      <FiUsers className="text-gray-400" />
                      <span>
                        Followers. <span className="font-semibold text-gray-800">{followers}</span>
                      </span>
                    </div>
                    <div>
                      <span>
                        Groups: <span className="font-semibold text-gray-800">#{groups}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      <FiUser size={16} /> View Profile
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
                      onClick={() => handleMessage(user.id)}
                    >
                      <FiMessageSquare size={16} /> Message
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-xl font-bold text-gray-900">No members found</p>
          <p className="text-gray-600 mt-2">Try adjusting your search or filters.</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-semibold"
              onClick={() => {
                setSearchQuery('')
                setSelectedSkill('')
                setOnlineFilter('all')
                setSortBy('most_active')
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
              onClick={() => navigate('/profile')}
            >
              My Profile
            </button>
          </div>
        </div>
      )}

      {(!isLoading && canShowMore) ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => Math.min(filteredAndSorted.length, c + PAGE_SIZE))}
            className="px-14 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-semibold"
          >
            Load more
          </button>
        </div>
      ) : null}

      {!isLoading && filteredAndSorted.length === 0 ? (
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">No members yet</span>
        </div>
      ) : null}
    </div>
  )
}

export default Explore
