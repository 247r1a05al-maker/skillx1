// Firebase Realtime Service Wrapper
// This replaces Socket.io with Firebase Realtime Database
import firebaseRealtime from './firebase-realtime'

let currentUserId = null
let isInitialized = false

export const initializeSocket = (token, userId) => {
  if (isInitialized) {
    console.log('Firebase realtime already initialized')
    return
  }

  currentUserId = userId
  
  // Set user online status
  firebaseRealtime.setUserOnline(userId)
  
  console.log('Firebase realtime initialized for user:', userId)
  isInitialized = true
  
  return firebaseRealtime
}

export const getSocket = () => {
  if (!isInitialized) {
    console.warn('Firebase realtime not initialized. Call initializeSocket first.')
  }
  return firebaseRealtime
}

export const disconnectSocket = () => {
  if (currentUserId) {
    firebaseRealtime.setUserOffline(currentUserId)
    firebaseRealtime.unsubscribeAll()
  }
  isInitialized = false
  currentUserId = null
}

// Event types for backward compatibility
export const socketEvents = {
  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  TYPING: 'message:typing',

  // Message events
  NEW_MESSAGE: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  SEEN_STATUS: 'message:seen',

  // Notification events
  NEW_NOTIFICATION: 'notification:new',

  // Search events
  SEARCH_RESULTS: 'search:results',

  // Exchange events
  EXCHANGE_REQUEST: 'exchange:request',
  EXCHANGE_ACCEPTED: 'exchange:accepted',
  EXCHANGE_REJECTED: 'exchange:rejected',

  // Group events
  GROUP_MESSAGE: 'group:message',
  GROUP_MEMBER_JOINED: 'group:member-joined',
  GROUP_MEMBER_LEFT: 'group:member-left',

  // Coins events
  COINS_EARNED: 'coins:earned',
}

// Helper functions for Firebase operations
export const firebaseHelpers = {
  // Set typing indicator
  setTyping: (conversationId, userId, isTyping) => {
    return firebaseRealtime.setTyping(conversationId, userId, isTyping)
  },

  // Send message
  sendMessage: (conversationId, message) => {
    return firebaseRealtime.sendMessage(conversationId, message)
  },

  // Send group message
  sendGroupMessage: (groupId, message) => {
    return firebaseRealtime.sendGroupMessage(groupId, message)
  },

  // Send notification
  sendNotification: (userId, notification) => {
    return firebaseRealtime.sendNotification(userId, notification)
  },

  // Subscribe to presence
  subscribeToUserStatus: (userId, callback) => {
    return firebaseRealtime.subscribeToUserStatus(userId, callback)
  },

  // Subscribe to messages
  subscribeToMessages: (conversationId, callback) => {
    return firebaseRealtime.subscribeToMessages(conversationId, callback)
  },

  // Subscribe to notifications
  subscribeToNotifications: (userId, callback) => {
    return firebaseRealtime.subscribeToNotifications(userId, callback)
  },

  // Subscribe to typing
  subscribeToTyping: (conversationId, callback) => {
    return firebaseRealtime.subscribeToTyping(conversationId, callback)
  },

  // Subscribe to exchanges
  subscribeToExchangeRequests: (userId, callback) => {
    return firebaseRealtime.subscribeToExchangeRequests(userId, callback)
  },

  // Subscribe to group messages
  subscribeToGroupMessages: (groupId, callback) => {
    return firebaseRealtime.subscribeToGroupMessages(groupId, callback)
  },

  // Subscribe to online users
  subscribeToOnlineUsers: (callback) => {
    return firebaseRealtime.subscribeToOnlineUsers(callback)
  },
}

export default firebaseRealtime
