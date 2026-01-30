import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiBell, FiUser, FiLogOut, FiUserPlus, FiUsers, FiHeart, FiMessageCircle, FiCheckCircle, FiX } from 'react-icons/fi'
import { useAuthStore, useNotificationStore } from '../store'
import { useTheme } from '../context/ThemeContext'
import { useDebounce } from '../hooks'
import { authService } from '../services/auth'
import firebaseRealtime from '../services/firebase-realtime'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { unreadCount, setUnreadCount } = useNotificationStore()
  const { isElite } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loggingOut, setLoggingOut] = useState(false)
  const [followRequestCount, setFollowRequestCount] = useState(0)
  const [groupInvitationCount, setGroupInvitationCount] = useState(0)
  const notificationRef = useRef(null)

  const handleSearch = useDebounce((query) => {
    if (query.trim()) {
      // Mock search results
      setSearchResults([
        { id: 1, name: 'John Doe', type: 'user', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
        { id: 2, name: 'JavaScript', type: 'skill' },
        { id: 3, name: 'Web Development', type: 'group' },
      ])
    } else {
      setSearchResults([])
    }
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.uid && !user?.id) return

    const userId = user.uid || user.id
    const unsubscribe = firebaseRealtime.subscribeToNotifications(userId, (notifs) => {
      setNotifications(notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      const unread = notifs.filter(n => !n.read).length
      setUnreadCount(unread)
    })

    return () => unsubscribe?.()
  }, [user, setUnreadCount])

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

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    const userId = user.uid || user.id
    await firebaseRealtime.markNotificationAsRead(userId, notificationId)
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const userId = user.uid || user.id
    for (const notif of notifications) {
      if (!notif.read) {
        await firebaseRealtime.markNotificationAsRead(userId, notif.id)
      }
    }
  }

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <FiHeart className="text-red-500" />
      case 'comment': return <FiMessageCircle className="text-blue-500" />
      case 'follow': return <FiUserPlus className="text-green-500" />
      case 'message': return <FiMessageCircle className="text-purple-500" />
      default: return <FiBell className="text-gray-500" />
    }
  }

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 h-16 theme-navbar flex items-center justify-between px-6 z-30 shadow-sm">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
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
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full theme-card rounded-lg shadow-lg z-50 border">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  if (result.type === 'user') navigate(`/profile/${result.id}`)
                  setSearchQuery('')
                  setShowSearchDropdown(false)
                }}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
              >
                {result.type === 'user' && (
                  <img src={result.avatar} alt={result.name} className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{result.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiBell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FiBell size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No notifications yet</p>
                      <p className="text-sm mt-1">We'll notify you when something happens</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id)
                          if (notif.link) navigate(notif.link)
                        }}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                          !notif.read ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">{notif.fromUserName || 'Someone'}</span>{' '}
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
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
