import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiActivity,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiSearch,
  FiSliders,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
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
  'bg-slate-100 text-slate-700 border border-slate-200',
  'bg-blue-50 text-blue-700 border border-blue-200',
  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'bg-zinc-100 text-zinc-700 border border-zinc-200',
]

const PROFILE_BANNER_STYLES = [
  'from-indigo-500 via-blue-500 to-cyan-400',
  'from-fuchsia-500 via-violet-500 to-indigo-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-orange-500 via-rose-500 to-pink-500',
  'from-slate-700 via-gray-700 to-zinc-700',
  'from-sky-500 via-indigo-500 to-purple-600',
]

const hashToIndex = (value, mod) => {
  const s = (value || '').toString()
  let hash = 0
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) % 2147483647
  return Math.abs(hash) % mod
}

const MODEL_OPTIONS = [
  { key: 'linkedin', title: 'Model A', subtitle: 'LinkedIn' },
  { key: 'executive', title: 'Model B', subtitle: 'Executive' },
  { key: 'compact', title: 'Model C', subtitle: 'Compact' },
  { key: 'spotlight', title: 'Model D', subtitle: 'Spotlight' },
  { key: 'magazine', title: 'Model E', subtitle: 'Magazine' },
  { key: 'timeline', title: 'Model F', subtitle: 'Timeline' },
  { key: 'carddeck', title: 'Model G', subtitle: 'Card Deck' },
  { key: 'table', title: 'Model H', subtitle: 'Table Row' },
  { key: 'pulse', title: 'Model I', subtitle: 'Pulse' },
  { key: 'ribbon', title: 'Model J', subtitle: 'Ribbon' },
  { key: 'matrix', title: 'Model K', subtitle: 'Matrix' },
  { key: 'minimal', title: 'Model L', subtitle: 'Minimal' },
  { key: 'split', title: 'Model M', subtitle: 'Split Panel' },
]

const GRID_LAYOUT_MODELS = new Set(['executive', 'magazine', 'carddeck', 'matrix'])

const Explore = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: authUser } = useAuthStore()
  const currentUserId = authUser?.uid || authUser?.id

  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [onlineFilter, setOnlineFilter] = useState('all')
  const [sortBy, setSortBy] = useState('most_active')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [layoutModel, setLayoutModel] = useState('linkedin')

  const [followersCounts, setFollowersCounts] = useState({})
  const [groupsCounts, setGroupsCounts] = useState({})

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchQuery(q)
  }, [searchParams])

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

  const onlineMembersCount = useMemo(
    () => (filteredAndSorted || []).filter((item) => !!item?.isOnline).length,
    [filteredAndSorted]
  )

  const featuredMembers = useMemo(
    () => filteredAndSorted.slice(0, 12),
    [filteredAndSorted]
  )

  const topSkillTags = useMemo(() => {
    const counts = new Map()
    filteredAndSorted.forEach((item) => {
      uniqueList(getUserSkills(item)).forEach((skill) => {
        const key = (skill || '').toString().trim()
        if (!key) return
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }, [filteredAndSorted])

  const cardsContainerClass = GRID_LAYOUT_MODELS.has(layoutModel)
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
    : 'space-y-3'

  const renderSkillPills = (skills, limit = 4) => (
    <div className="flex flex-wrap gap-1.5">
      {(skills || []).slice(0, limit).map((skill) => {
        const cls = SKILL_CHIP_STYLES[hashToIndex(skill, SKILL_CHIP_STYLES.length)]
        return (
          <span key={skill} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${cls}`}>
            {skill}
          </span>
        )
      })}
      {skills.length === 0 ? (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">No skills listed</span>
      ) : null}
    </div>
  )

  const renderModelCard = (user, cardData) => {
    const {
      isOnline,
      followers,
      groups,
      skills,
      isVerified,
      bannerClass,
    } = cardData

    if (layoutModel === 'executive') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition">
          <div className={`h-14 bg-gradient-to-r ${bannerClass}`} />
          <div className="px-4 pb-4 -mt-7">
            <div className="flex justify-between items-start">
              <div className="relative ring-4 ring-white rounded-full">
                <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              {isVerified ? (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <FiCheck size={11} /> Verified
                </span>
              ) : null}
            </div>

            <h3 className="mt-2 text-base font-extrabold text-slate-900 truncate">{user.name || 'Member'}</h3>
            <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">{getTagline(user)}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><p className="text-[10px] uppercase tracking-wide text-slate-500">Followers</p><p className="text-sm font-extrabold text-slate-900">{followers}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><p className="text-[10px] uppercase tracking-wide text-slate-500">Groups</p><p className="text-sm font-extrabold text-slate-900">{groups}</p></div>
            </div>

            <div className="mt-3">{renderSkillPills(skills, 3)}</div>
            <div className="flex gap-2 mt-3">
              <button type="button" className="flex-1 px-3 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition text-sm font-bold" onClick={() => navigate(`/profile/${user.id}`)}>View Profile</button>
              <button type="button" className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-sm font-bold" onClick={() => handleMessage(user.id)}>Message</button>
            </div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'compact') {
      return (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <div className="min-w-0"><h3 className="text-sm font-extrabold text-slate-900 truncate">{user.name || 'Member'}</h3><p className="text-xs text-slate-600 truncate">{getTagline(user)}</p></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs lg:w-[360px]">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-bold text-slate-900">{followers}</span> followers</div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-bold text-slate-900">{groups}</span> groups</div>
              <div className={`rounded-md border px-2 py-1.5 ${isOnline ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{isOnline ? 'Available' : 'Away'}</div>
            </div>
            <div className="flex gap-2 lg:w-[290px]">
              <button type="button" className="flex-1 px-3 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition text-xs font-bold" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button>
              <button type="button" className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-xs font-bold" onClick={() => handleMessage(user.id)}>Message</button>
            </div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'spotlight') {
      return (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm p-4 hover:shadow-md transition">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2"><h3 className="text-base font-extrabold text-slate-900 truncate">{user.name || 'Member'}</h3>{isVerified ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Verified</span> : null}</div>
                <p className="text-sm text-slate-700 mt-0.5 line-clamp-1">{getTagline(user)}</p>
                <div className="mt-2">{renderSkillPills(skills, 5)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:w-[230px] text-sm">
              <div className="rounded-lg bg-white border border-amber-200 px-3 py-2"><p className="text-xs text-slate-500">Followers</p><p className="font-extrabold text-slate-900">{followers}</p></div>
              <div className="rounded-lg bg-white border border-amber-200 px-3 py-2"><p className="text-xs text-slate-500">Groups</p><p className="font-extrabold text-slate-900">{groups}</p></div>
              <button type="button" className="col-span-2 rounded-lg bg-slate-900 text-white py-2 font-bold text-sm" onClick={() => navigate(`/profile/${user.id}`)}>Open Profile</button>
            </div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'magazine') {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
          <div className={`h-24 bg-gradient-to-r ${bannerClass}`} />
          <div className="p-4 -mt-8">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-slate-900 truncate">{user.name || 'Member'}</h3>
                  <p className="text-xs text-slate-600">{getTagline(user)}</p>
                  <div className="mt-2 text-xs text-slate-600">{followers} followers • {groups} groups • {isOnline ? 'Online' : 'Offline'}</div>
                </div>
              </div>
              <div className="mt-3">{renderSkillPills(skills, 3)}</div>
              <div className="flex gap-2 mt-3">
                <button type="button" className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-bold text-slate-700" onClick={() => handleMessage(user.id)}>Message</button>
                <button type="button" className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white" onClick={() => navigate(`/profile/${user.id}`)}>Read More</button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'timeline') {
      return (
        <div className="relative pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition">
          <span className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
          <span className={`absolute left-[11px] top-6 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 truncate">{user.name || 'Member'} {isVerified ? <span className="text-blue-600">• verified</span> : null}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{getTagline(user)}</p>
                <div className="text-xs text-slate-500 mt-1">{followers} followers • {groups} groups</div>
              </div>
            </div>
            <div className="lg:w-[260px]">{renderSkillPills(skills, 4)}</div>
            <div className="flex gap-2 lg:w-[240px]"><button type="button" className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-bold" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button><button type="button" className="flex-1 rounded-lg bg-slate-900 text-white py-2 text-xs font-bold" onClick={() => handleMessage(user.id)}>Message</button></div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'carddeck') {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><div><h3 className="text-sm font-black text-slate-900">{user.name || 'Member'}</h3><p className="text-xs text-slate-600">{getTagline(user)}</p></div></div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{isOnline ? 'LIVE' : 'IDLE'}</span>
          </div>
          <div className="mt-3">{renderSkillPills(skills, 5)}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="bg-slate-50 rounded-lg border border-slate-200 p-2"><p>Followers</p><p className="font-extrabold text-slate-900">{followers}</p></div><div className="bg-slate-50 rounded-lg border border-slate-200 p-2"><p>Groups</p><p className="font-extrabold text-slate-900">{groups}</p></div></div>
          <button type="button" className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-bold" onClick={() => navigate(`/profile/${user.id}`)}>View Member Profile</button>
        </div>
      )
    }

    if (layoutModel === 'table') {
      return (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 lg:col-span-4 flex items-center gap-3 min-w-0">
              <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
              <div className="min-w-0"><p className="text-sm font-extrabold text-slate-900 truncate">{user.name || 'Member'}</p><p className="text-xs text-slate-600 truncate">{getTagline(user)}</p></div>
            </div>
            <div className="col-span-4 lg:col-span-2 text-xs text-slate-700"><span className="font-bold">{followers}</span> followers</div>
            <div className="col-span-4 lg:col-span-2 text-xs text-slate-700"><span className="font-bold">{groups}</span> groups</div>
            <div className="col-span-4 lg:col-span-2 text-xs"><span className={`px-2 py-1 rounded-full font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{isOnline ? 'Online' : 'Offline'}</span></div>
            <div className="col-span-12 lg:col-span-2 flex gap-2"><button type="button" className="flex-1 text-xs font-bold rounded-md border border-slate-300 py-1.5" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button><button type="button" className="flex-1 text-xs font-bold rounded-md bg-slate-900 text-white py-1.5" onClick={() => handleMessage(user.id)}>Msg</button></div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'pulse') {
      return (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-4 relative overflow-hidden">
          <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          <div className="flex items-start gap-3">
            <Avatar src={user.avatar} name={user.name} userId={user.id} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-slate-900 truncate">{user.name || 'Member'}</h3>
              <p className="text-sm text-slate-600">{getTagline(user)}</p>
              <div className="mt-2">{renderSkillPills(skills, 4)}</div>
              <div className="mt-2 flex items-center gap-3 text-xs"><span className="text-indigo-700 font-bold">{followers} followers</span><span className="text-indigo-700 font-bold">{groups} groups</span>{isVerified ? <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold">Verified</span> : null}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2"><button type="button" className="flex-1 rounded-lg bg-indigo-600 text-white py-2 text-sm font-bold" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button><button type="button" className="flex-1 rounded-lg border border-indigo-200 text-indigo-700 py-2 text-sm font-bold" onClick={() => handleMessage(user.id)}>Connect</button></div>
        </div>
      )
    }

    if (layoutModel === 'ribbon') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-1 bg-slate-900 text-white text-[11px] font-bold tracking-wide">PROFESSIONAL DIRECTORY PROFILE</div>
          <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><div className="min-w-0"><h3 className="text-sm font-extrabold text-slate-900 truncate">{user.name || 'Member'}</h3><p className="text-xs text-slate-600 truncate">{getTagline(user)}</p></div></div>
            <div className="lg:w-[260px]">{renderSkillPills(skills, 3)}</div>
            <div className="text-xs text-slate-700 lg:w-[150px] text-left lg:text-right"><p><span className="font-bold">{followers}</span> followers</p><p><span className="font-bold">{groups}</span> groups</p></div>
            <button type="button" className="lg:w-[120px] rounded-lg bg-slate-900 text-white py-2 text-xs font-bold" onClick={() => navigate(`/profile/${user.id}`)}>Open</button>
          </div>
        </div>
      )
    }

    if (layoutModel === 'matrix') {
      return (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><div className="min-w-0"><h3 className="text-sm font-black text-slate-900 truncate">{user.name || 'Member'}</h3><p className="text-xs text-slate-600 truncate">{getTagline(user)}</p></div></div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] text-slate-500 uppercase">Followers</p><p className="font-extrabold text-slate-900">{followers}</p></div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] text-slate-500 uppercase">Groups</p><p className="font-extrabold text-slate-900">{groups}</p></div>
            <div className="col-span-2">{renderSkillPills(skills, 4)}</div>
            <div className="col-span-2 grid grid-cols-2 gap-2"><button type="button" className="rounded-lg border border-slate-300 py-2 text-xs font-bold" onClick={() => navigate(`/profile/${user.id}`)}>View</button><button type="button" className="rounded-lg bg-slate-900 text-white py-2 text-xs font-bold" onClick={() => handleMessage(user.id)}>Message</button></div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'minimal') {
      return (
        <div className="border-b border-slate-200 py-3 px-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><div className="min-w-0"><h3 className="text-sm font-bold text-slate-900 truncate">{user.name || 'Member'}</h3><p className="text-xs text-slate-600 truncate">{getTagline(user)}</p></div></div>
            <div className="text-xs text-slate-500 md:w-[230px]">{skills.slice(0, 3).join(' • ') || 'No skills listed'}</div>
            <div className="text-xs text-slate-700 md:w-[120px]"><span className="font-bold">{followers}</span>/<span className="font-bold">{groups}</span></div>
            <div className="flex gap-2 md:w-[170px]"><button type="button" className="flex-1 text-xs rounded-md border border-slate-300 py-1.5" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button><button type="button" className="flex-1 text-xs rounded-md bg-slate-900 text-white py-1.5" onClick={() => handleMessage(user.id)}>Message</button></div>
          </div>
        </div>
      )
    }

    if (layoutModel === 'split') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className={`lg:col-span-2 p-4 bg-gradient-to-br ${bannerClass} text-white`}>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-3"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><div><p className="font-black text-sm">{user.name || 'Member'}</p><p className="text-xs text-white/80">{isOnline ? 'Available now' : 'Currently away'}</p></div></div>
                <p className="text-xs mt-2 text-white/90">{getTagline(user)}</p>
              </div>
            </div>
            <div className="lg:col-span-3 p-4">
              <div className="flex items-center justify-between mb-2"><div className="text-xs text-slate-600">Followers: <span className="font-bold text-slate-900">{followers}</span></div><div className="text-xs text-slate-600">Groups: <span className="font-bold text-slate-900">{groups}</span></div></div>
              {renderSkillPills(skills, 5)}
              <div className="flex gap-2 mt-3"><button type="button" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold" onClick={() => navigate(`/profile/${user.id}`)}>View Profile</button><button type="button" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold" onClick={() => handleMessage(user.id)}>Send Message</button></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-300">
        <div className={`h-1.5 bg-gradient-to-r ${bannerClass}`} />
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="relative shrink-0"><Avatar src={user.avatar} name={user.name} userId={user.id} size="md" /><span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2"><h3 className="text-[17px] font-extrabold text-slate-900 truncate">{user.name || 'Member'}</h3>{isVerified ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200"><FiCheck size={12} /> Verified</span> : null}<span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{isOnline ? 'Available' : 'Away'}</span></div>
                <p className="text-sm text-slate-700 mt-1 line-clamp-1">{getTagline(user)}</p>
                <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-slate-600"><span><strong className="text-slate-900">{followers}</strong> followers</span><span><strong className="text-slate-900">{groups}</strong> groups</span></div>
                <div className="mt-2.5">{renderSkillPills(skills, 4)}</div>
              </div>
            </div>
            <div className="flex flex-row lg:flex-col gap-2 lg:w-[170px] shrink-0">
              <button type="button" className="flex-1 px-4 py-2.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition font-bold text-sm flex items-center justify-center gap-2" onClick={() => navigate(`/profile/${user.id}`)}><FiUser size={15} /> View Profile</button>
              <button type="button" className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-bold text-sm flex items-center justify-center gap-2" onClick={() => handleMessage(user.id)}><FiMessageSquare size={15} /> Message</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Explore People</h1>
            <p className="text-gray-600 mt-1">Connect with active members, mentors, and collaborators.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">
              <FiUsers className="inline mr-1" /> {filteredAndSorted.length} Members
            </span>
            <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-bold">
              <FiActivity className="inline mr-1" /> {onlineMembersCount} Online
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold">
              <FiTrendingUp className="inline mr-1" /> {topSkillTags.length} Hot Skills
            </span>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {featuredMembers.length > 0 ? featuredMembers.map((member) => (
            <button
              key={`story-${member.id}`}
              onClick={() => navigate(`/profile/${member.id}`)}
              className="shrink-0 w-24 text-center group"
            >
              <div className="relative mx-auto w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-fuchsia-500 via-orange-500 to-amber-400">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <Avatar src={member.avatar} name={member.name} userId={member.id} size="md" />
                </div>
                <span className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white ${member.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-700 truncate group-hover:text-indigo-700">{member.name || 'Member'}</p>
            </button>
          )) : (
            <p className="text-sm text-gray-500">No featured members yet</p>
          )}
        </div>
      </motion.section>

      <section className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2"><FiSliders className="text-indigo-600" /> Filters</h2>
            <div className="text-sm text-gray-600 mt-1">Showing <span className="font-bold text-gray-900">{showingCount}</span> of <span className="font-bold text-gray-900">{filteredAndSorted.length}</span></div>
          </div>

          <div className="lg:w-[720px]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Switch User View</p>
            <p className="text-xs text-blue-700 font-semibold mb-2">{MODEL_OPTIONS.length} models loaded</p>
            <div className="mb-2">
              <label htmlFor="layout-model-select" className="text-xs font-semibold text-gray-600">Choose model</label>
              <select
                id="layout-model-select"
                value={layoutModel}
                onChange={(e) => setLayoutModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Choose Explore user layout model"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={`select-${model.key}`} value={model.key}>{model.title} - {model.subtitle}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {MODEL_OPTIONS.map((model) => (
                <button
                  key={model.key}
                  type="button"
                  onClick={() => setLayoutModel(model.key)}
                  className={`text-left rounded-xl border px-3 py-2 transition ${layoutModel === model.key ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  aria-label={`Switch to ${model.title} ${model.subtitle}`}
                >
                  <p className="text-sm font-bold text-gray-900">{model.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{model.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

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

        {topSkillTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topSkillTags.map((skill) => (
              <button
                key={`top-skill-${skill.name}`}
                type="button"
                onClick={() => setSelectedSkill(skill.name)}
                className="px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                title={`Used by ${skill.count} members`}
              >
                #{skill.name} · {skill.count}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
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
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </div>
        </div>
      ) : visibleUsers.length > 0 ? (
        <div className={cardsContainerClass}>
          {visibleUsers.map((user, index) => {
            const isOnline = !!user.isOnline
            const followers = followersCounts[user.id] ?? 0
            const groups = groupsCounts[user.id] ?? 0
            const skills = uniqueList(getUserSkills(user)).slice(0, 4)
            const isVerified = !!(user?.verified || user?.isVerified)
            const bannerClass = PROFILE_BANNER_STYLES[hashToIndex(user.id || user.name, PROFILE_BANNER_STYLES.length)]
            const cardData = { isOnline, followers, groups, skills, isVerified, bannerClass }

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.25) }}
              >
                {renderModelCard(user, cardData)}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
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
