import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiLogOut, FiUserPlus, FiUsers, FiCheckCircle, FiX, FiMenu, FiHeadphones, FiSend } from 'react-icons/fi'
import { useAuthStore, useUIStore } from '../store'
import { useTheme } from '../context/ThemeContext'
import { useDebounce } from '../hooks'
import { authService } from '../services/auth'
import firebaseRealtime from '../services/firebase-realtime'
import Avatar from './Avatar'

const normalizeString = (value) => (value || '').toString().trim().toLowerCase()

const getUserSkills = (user) => {
  if (!user) return []
  if (Array.isArray(user.skills)) return user.skills.filter(Boolean)
  const teaching = Array.isArray(user.skills?.teaching) ? user.skills.teaching : []
  const learning = Array.isArray(user.skills?.learning) ? user.skills.learning : []
  return [...teaching, ...learning].filter(Boolean)
}

const Navbar = () => {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const { isElite } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showSupportChat, setShowSupportChat] = useState(false)
  const [supportInput, setSupportInput] = useState('')
  const [supportMessages, setSupportMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! Ask me basic questions about Skill Exchange. I can help with Profile, Community, Explore, Posts, Badges, Coins, Groups, and Inbox.',
    },
  ])
  const [loggingOut, setLoggingOut] = useState(false)
  const [followRequestCount, setFollowRequestCount] = useState(0)
  const [groupInvitationCount, setGroupInvitationCount] = useState(0)
  const [allUsers, setAllUsers] = useState([])
  const [allGroups, setAllGroups] = useState([])
  const supportRef = useRef(null)
  const searchRef = useRef(null)

  const currentUserId = user?.uid || user?.id

  const handleSearch = useDebounce((query) => {
    const clean = normalizeString(query)
    if (!clean) {
      setSearchResults([])
      return
    }

    const userResults = allUsers
      .filter((item) => item?.id && item.id !== currentUserId)
      .filter((item) => {
        const name = normalizeString(item.name)
        const bio = normalizeString(item.bio)
        const role = normalizeString(item.role || item.title)
        const skills = getUserSkills(item).map(normalizeString)
        return name.includes(clean) || bio.includes(clean) || role.includes(clean) || skills.some((skill) => skill.includes(clean))
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name || 'User',
        subtitle: item.role || item.title || item.bio || 'Member',
        type: 'user',
        avatar: item.avatar || '',
      }))

    const skillMap = new Map()
    allUsers.forEach((item) => {
      getUserSkills(item).forEach((skill) => {
        const label = (skill || '').toString().trim()
        if (!label) return
        if (!normalizeString(label).includes(clean)) return
        const existing = skillMap.get(label) || { count: 0 }
        skillMap.set(label, { count: existing.count + 1 })
      })
    })
    const skillResults = Array.from(skillMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([name, meta]) => ({
        id: name,
        name,
        subtitle: `${meta.count} member${meta.count !== 1 ? 's' : ''} mention this skill`,
        type: 'skill',
      }))

    const groupResults = allGroups
      .filter((group) => {
        const name = normalizeString(group.name)
        const description = normalizeString(group.description)
        const category = normalizeString(group.skillCategory)
        return name.includes(clean) || description.includes(clean) || category.includes(clean)
      })
      .slice(0, 4)
      .map((group) => ({
        id: group.id,
        name: group.name || 'Group',
        subtitle: group.skillCategory || group.description || 'Group',
        type: 'group',
      }))

    setSearchResults([...userResults, ...skillResults, ...groupResults].slice(0, 10))
  }, 300)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    handleSearch(e.target.value)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authService.logout()
      clearAuth()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  // Subscribe to follow requests count
  useEffect(() => {
    if (!user?.uid && !user?.id) return

    const userId = user.uid || user.id
    const unsubscribe = firebaseRealtime.subscribeToFollowRequests(userId, (requests) => {
      setFollowRequestCount(requests.length)
    })

    return () => unsubscribe?.()
  }, [user])

  // Subscribe to group invitations count
  useEffect(() => {
    if (!user?.uid && !user?.id) return

    const userId = user.uid || user.id
    const unsubscribe = firebaseRealtime.subscribeToGroupInvitations(userId, (invites) => {
      setGroupInvitationCount(invites.length)
    })

    return () => unsubscribe?.()
  }, [user])

  // Subscribe to users for real global search
  useEffect(() => {
    if (!currentUserId) return () => {}

    const unsubscribe = firebaseRealtime.subscribeToUsers((users) => {
      const uniqueUsers = Array.from(new Map((users || []).map((item) => [item.id, item])).values())
      setAllUsers(uniqueUsers)
    })

    return () => unsubscribe?.()
  }, [currentUserId])

  // Subscribe to groups for real global search
  useEffect(() => {
    const unsubscribe = firebaseRealtime.subscribeToGroups((groups) => {
      const uniqueGroups = Array.from(new Map((groups || []).map((item) => [item.id, item])).values())
      setAllGroups(uniqueGroups)
    })

    return () => unsubscribe?.()
  }, [])

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setShowSupportChat(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSupportReply = (query) => {
    const q = normalizeString(query)
    if (!q) return 'Please type your question.'
    if (q.includes('useful') || q.includes('what is this') || q.includes('website')) {
      return 'Skill Exchange helps users teach and learn skills, create posts, join groups, and connect with community members.'
    }
    if (q.includes('badge') || q.includes('batch')) {
      return 'Badges are earned by activity like posting, joining groups, following users, and regular engagement.'
    }
    if (q.includes('coin')) {
      return 'Coins are earned from platform activity and can be tracked on the Coins page.'
    }
    if (q.includes('post') && q.includes('community')) {
      return 'Create a post from Profile and choose Community in visibility targets to show it in Community feed.'
    }
    if (q.includes('delete') && q.includes('community')) {
      return 'Deleting from Community removes that post from Community feed only. Full delete from all places is available in Profile.'
    }
    if (q.includes('explore')) {
      return 'Explore helps you discover users and skills, then connect or follow based on your interests.'
    }
    if (q.includes('group')) {
      return 'Use Groups to join communities, chat with members, and collaborate around shared skills.'
    }
    if (q.includes('inbox') || q.includes('message') || q.includes('chat')) {
      return 'Use Inbox to send direct messages, images, GIFs, and files to other users.'
    }
    return 'I can help with Skill Exchange basics. Try asking about Profile, Posts, Community, Explore, Coins, Badges, Groups, or Inbox.'
  }

  const sendSupportMessage = () => {
    const text = supportInput.trim()
    if (!text) return

    const userMessage = { id: `u-${Date.now()}`, role: 'user', text }
    const botMessage = { id: `a-${Date.now() + 1}`, role: 'assistant', text: getSupportReply(text) }

    setSupportMessages((prev) => [...prev, userMessage, botMessage])
    setSupportInput('')
  }

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 h-16 theme-navbar flex items-center justify-between px-6 z-30 shadow-sm">
      {/* Mobile Menu + Search Bar */}
      <div className="flex items-center flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          className="lg:hidden mr-3 p-2 theme-bg-primary rounded-lg shadow"
          aria-label="Open menu"
        >
          <FiMenu size={22} />
        </button>

        <div className="relative flex-1">
          <div className="relative" ref={searchRef}>
            <FiSearch className="absolute left-3 top-3 theme-text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Search users, skills, groups..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-10 pr-4 py-2 theme-input rounded-lg focus:outline-none transition"
            />
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full mt-2 w-full theme-card rounded-lg shadow-lg z-50 border">
              {searchResults.length > 0 ? searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    if (result.type === 'user') navigate(`/profile/${result.id}`)
                    if (result.type === 'skill') navigate(`/explore?q=${encodeURIComponent(result.name)}`)
                    if (result.type === 'group') navigate(`/groups?q=${encodeURIComponent(result.name)}`)
                    setSearchQuery('')
                    setSearchResults([])
                    setShowSearchDropdown(false)
                  }}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  {result.type === 'user' && (
                    <Avatar src={result.avatar} name={result.name} userId={result.id} size="sm" />
                  )}
                  {result.type === 'skill' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">#</div>
                  )}
                  {result.type === 'group' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold"><FiUsers size={14} /></div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{result.type} {result.subtitle ? `• ${result.subtitle}` : ''}</p>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-4 text-sm text-gray-500">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Group Invitations */}
        <button 
          onClick={() => navigate('/group-invitations')}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          title="Group Invitations"
        >
          <FiUsers size={20} className="text-gray-600" />
          {groupInvitationCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {groupInvitationCount > 9 ? '9+' : groupInvitationCount}
            </span>
          )}
        </button>

        {/* Follow Requests */}
        <button 
          onClick={() => navigate('/follow-requests')}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          title="Follow Requests"
        >
          <FiUserPlus size={20} className="text-gray-600" />
          {followRequestCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {followRequestCount > 9 ? '9+' : followRequestCount}
            </span>
          )}
        </button>

        {/* Support */}
        <div className="relative" ref={supportRef}>
          <button 
            onClick={() => setShowSupportChat(!showSupportChat)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            title="Support"
          >
            <FiHeadphones size={20} className="text-gray-600" />
          </button>

          {/* Support Chat Panel */}
          <AnimatePresence>
            {showSupportChat && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 h-[460px] flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Support Chat</h3>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>

                {/* Messages */}
                <div className="overflow-y-auto flex-1">
                  <div className="p-3 space-y-2">
                    {supportMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          msg.role === 'assistant'
                            ? 'bg-gray-100 text-gray-800 mr-auto'
                            : 'bg-indigo-600 text-white ml-auto'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          sendSupportMessage()
                        }
                      }}
                      placeholder="Ask about Profile, Posts, Coins, Badges..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={sendSupportMessage}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      title="Send"
                    >
                      <FiSend size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu */}
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white hover:shadow-lg transition"
        >
          <span className="text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Logout"
        >
          <FiLogOut size={20} className="text-gray-600" />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
