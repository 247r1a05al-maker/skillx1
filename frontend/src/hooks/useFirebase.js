import { useState, useEffect, useCallback } from 'react'
import firebaseRealtime from '../services/firebase-realtime'

// Hook for user presence
export const useUserPresence = (userId) => {
  const [status, setStatus] = useState(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!userId) return

    const unsubscribe = firebaseRealtime.subscribeToUserStatus(userId, (userStatus) => {
      setStatus(userStatus)
      setIsOnline(userStatus?.state === 'online')
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId])

  return { status, isOnline }
}

// Hook for real-time messages
export const useRealtimeMessages = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) return

    setLoading(true)
    const unsubscribe = firebaseRealtime.subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages)
      setLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (message) => {
      if (!conversationId) return
      return await firebaseRealtime.sendMessage(conversationId, message)
    },
    [conversationId]
  )

  return { messages, loading, sendMessage }
}

// Hook for typing indicators
export const useTypingIndicator = (conversationId, currentUserId) => {
  const [typingUsers, setTypingUsers] = useState({})

  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = firebaseRealtime.subscribeToTyping(conversationId, (users) => {
      // Filter out current user
      const filteredUsers = Object.entries(users || {})
        .filter(([userId]) => userId !== currentUserId)
        .reduce((acc, [userId, data]) => ({ ...acc, [userId]: data }), {})
      
      setTypingUsers(filteredUsers)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [conversationId, currentUserId])

  const setTyping = useCallback(
    (isTyping) => {
      if (!conversationId || !currentUserId) return
      firebaseRealtime.setTyping(conversationId, currentUserId, isTyping)
    },
    [conversationId, currentUserId]
  )

  return { typingUsers, setTyping }
}

// Hook for notifications
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    const unsubscribe = firebaseRealtime.subscribeToNotifications(userId, (newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter((n) => !n.read).length)
      setLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId])

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!userId) return
      await firebaseRealtime.markNotificationAsRead(userId, notificationId)
    },
    [userId]
  )

  return { notifications, unreadCount, loading, markAsRead }
}

// Hook for exchange requests
export const useExchangeRequests = (userId) => {
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    const unsubscribe = firebaseRealtime.subscribeToExchangeRequests(userId, (newExchanges) => {
      setExchanges(newExchanges)
      setLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId])

  const updateStatus = useCallback(
    async (exchangeId, status) => {
      if (!userId) return
      await firebaseRealtime.updateExchangeStatus(userId, exchangeId, status)
    },
    [userId]
  )

  return { exchanges, loading, updateStatus }
}

// Hook for group messages
export const useGroupMessages = (groupId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return

    setLoading(true)
    const unsubscribe = firebaseRealtime.subscribeToGroupMessages(groupId, (newMessages) => {
      setMessages(newMessages)
      setLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId])

  const sendMessage = useCallback(
    async (message) => {
      if (!groupId) return
      return await firebaseRealtime.sendGroupMessage(groupId, message)
    },
    [groupId]
  )

  return { messages, loading, sendMessage }
}

// Hook for online users
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const unsubscribe = firebaseRealtime.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users)
      setOnlineCount(users.length)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return { onlineUsers, onlineCount }
}

// Hook for managing user online status
export const useUserOnlineStatus = (userId) => {
  useEffect(() => {
    if (!userId) return

    // Set user online when component mounts
    firebaseRealtime.setUserOnline(userId)

    // Set user offline when component unmounts or user leaves
    return () => {
      firebaseRealtime.setUserOffline(userId)
    }
  }, [userId])

  // Also handle page visibility changes
  useEffect(() => {
    if (!userId) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        firebaseRealtime.setUserOffline(userId)
      } else {
        firebaseRealtime.setUserOnline(userId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId])
}
