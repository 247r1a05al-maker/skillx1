import { 
  ref, 
  set, 
  onValue, 
  push, 
  update, 
  remove,
  serverTimestamp,
  onDisconnect,
  off,
  get
} from 'firebase/database'
import { realtimeDb } from '../config/firebase'

class FirebaseRealtimeService {
  constructor() {
    this.listeners = new Map()
  }

  // User presence management
  async setUserOnline(userId) {
    if (!userId) return

    const userStatusRef = ref(realtimeDb, `status/${userId}`)
    const connectedRef = ref(realtimeDb, '.info/connected')

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set user as online
        set(userStatusRef, {
          state: 'online',
          lastChanged: serverTimestamp(),
        })

        // When user disconnects, mark as offline
        onDisconnect(userStatusRef).set({
          state: 'offline',
          lastChanged: serverTimestamp(),
        })
      }
    })
  }

  async setUserOffline(userId) {
    if (!userId) return
    
    const userStatusRef = ref(realtimeDb, `status/${userId}`)
    await set(userStatusRef, {
      state: 'offline',
      lastChanged: serverTimestamp(),
    })
  }

  // Listen to user presence
  subscribeToUserStatus(userId, callback) {
    const userStatusRef = ref(realtimeDb, `status/${userId}`)
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      callback(snapshot.val())
    })
    
    this.listeners.set(`status-${userId}`, { ref: userStatusRef, unsubscribe })
    return () => this.unsubscribe(`status-${userId}`)
  }

  // Typing indicators
  async setTyping(conversationId, userId, isTyping) {
    const typingRef = ref(realtimeDb, `typing/${conversationId}/${userId}`)
    
    if (isTyping) {
      await set(typingRef, {
        isTyping: true,
        timestamp: serverTimestamp(),
      })
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        remove(typingRef)
      }, 3000)
    } else {
      await remove(typingRef)
    }
  }

  subscribeToTyping(conversationId, callback) {
    const typingRef = ref(realtimeDb, `typing/${conversationId}`)
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingUsers = snapshot.val() || {}
      callback(typingUsers)
    })
    
    this.listeners.set(`typing-${conversationId}`, { ref: typingRef, unsubscribe })
    return () => this.unsubscribe(`typing-${conversationId}`)
  }

  // Real-time messages
  async sendMessage(conversationId, message) {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
    const newMessageRef = push(messagesRef)
    
    await set(newMessageRef, {
      ...message,
      timestamp: serverTimestamp(),
      id: newMessageRef.key,
    })
    
    return newMessageRef.key
  }

  subscribeToMessages(conversationId, callback) {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages = []
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(messages)
    })
    
    this.listeners.set(`messages-${conversationId}`, { ref: messagesRef, unsubscribe })
    return () => this.unsubscribe(`messages-${conversationId}`)
  }

  // Notifications
  async sendNotification(userId, notification) {
    const notificationsRef = ref(realtimeDb, `notifications/${userId}`)
    const newNotificationRef = push(notificationsRef)
    
    await set(newNotificationRef, {
      ...notification,
      timestamp: serverTimestamp(),
      id: newNotificationRef.key,
      read: false,
    })
    
    return newNotificationRef.key
  }

  subscribeToNotifications(userId, callback) {
    const notificationsRef = ref(realtimeDb, `notifications/${userId}`)
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifications = []
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(notifications)
    })
    
    this.listeners.set(`notifications-${userId}`, { ref: notificationsRef, unsubscribe })
    return () => this.unsubscribe(`notifications-${userId}`)
  }

  async markNotificationAsRead(userId, notificationId) {
    const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`)
    await update(notificationRef, { read: true })
  }

  // Exchange requests real-time updates
  subscribeToExchangeRequests(userId, callback) {
    const exchangeRef = ref(realtimeDb, `exchanges/${userId}`)
    const unsubscribe = onValue(exchangeRef, (snapshot) => {
      const exchanges = []
      snapshot.forEach((childSnapshot) => {
        exchanges.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(exchanges)
    })
    
    this.listeners.set(`exchanges-${userId}`, { ref: exchangeRef, unsubscribe })
    return () => this.unsubscribe(`exchanges-${userId}`)
  }

  async updateExchangeStatus(userId, exchangeId, status) {
    const exchangeRef = ref(realtimeDb, `exchanges/${userId}/${exchangeId}`)
    await update(exchangeRef, {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  // Messaging - Conversations
  subscribeToConversations(userId, callback) {
    const conversationsRef = ref(realtimeDb, `conversations`)
    const usersRef = ref(realtimeDb, `users`)
    
    let allConversations = []
    let allUsers = {}
    
    // Load users first
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      allUsers = {}
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          allUsers[childSnapshot.key] = childSnapshot.val()
        })
      }
      
      // Update conversations with user data
      if (allConversations.length > 0) {
        emitConversations()
      }
    })
    
    // Load conversations
    const unsubscribeConversations = onValue(conversationsRef, (snapshot) => {
      allConversations = []
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const conv = childSnapshot.val()
          const conversationId = childSnapshot.key
          
          // Check if this conversation includes the current user
          if (conv.participants && conv.participants.includes(userId)) {
            // Find the other participant
            const otherParticipantId = conv.participants.find(id => id !== userId)
            
            allConversations.push({
              id: conversationId,
              participantId: otherParticipantId,
              ...conv,
            })
          }
        })
      }
      
      emitConversations()
    })
    
    const emitConversations = () => {
      // Enrich conversations with user data
      const enrichedConversations = allConversations
        .map(conv => {
          const otherUser = allUsers[conv.participantId]
          
          // Skip if other user doesn't exist
          if (!otherUser || !otherUser.name) {
            return null
          }
          
          return {
            ...conv,
            id: conv.participantId, // Use participant ID for easy access
            name: otherUser.name,
            avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participantId}`,
            bio: otherUser.bio || '',
            isOnline: otherUser.isOnline || false,
            lastMessage: conv.lastMessage || 'No messages yet',
            timestamp: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString() : '',
            unread: 0,
          }
        })
        .filter(conv => conv !== null) // Remove null entries (unknown users)
      
      callback(enrichedConversations)
    }
    
    this.listeners.set(`conversations-${userId}`, { ref: conversationsRef, unsubscribe: unsubscribeConversations })
    this.listeners.set(`conversations-users-${userId}`, { ref: usersRef, unsubscribe: unsubscribeUsers })
    
    return () => {
      this.unsubscribe(`conversations-${userId}`)
      this.unsubscribe(`conversations-users-${userId}`)
    }
  }

  // Messaging - Messages in a conversation
  subscribeToMessages(conversationId, callback) {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const msgs = []
      snapshot.forEach((childSnapshot) => {
        msgs.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      // Sort by timestamp
      msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      callback(msgs)
    })
    
    this.listeners.set(`messages-${conversationId}`, { ref: messagesRef, unsubscribe })
    return () => this.unsubscribe(`messages-${conversationId}`)
  }

  // Send a message
  async sendMessage(conversationId, message) {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
    const newMessageRef = push(messagesRef)
    
    await set(newMessageRef, {
      ...message,
      id: newMessageRef.key,
    })

    // Update conversation last message
    const conversationRef = ref(realtimeDb, `conversations/${message.senderId}/${conversationId}`)
    await update(conversationRef, {
      lastMessage: message.text,
      timestamp: new Date().toISOString(),
    })

    return newMessageRef.key
  }

  // Subscribe to all users
  subscribeToUsers(callback) {
    const usersRef = ref(realtimeDb, `users`)
    const statusRef = ref(realtimeDb, `status`)
    
    let users = []
    let statuses = {}

    // Subscribe to user statuses
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        statuses = snapshot.val()
      }
      // Emit combined data whenever status changes
      if (users.length > 0) {
        const usersWithStatus = users.map((user) => ({
          ...user,
          isOnline: statuses[user.id]?.state === 'online',
        }))
        callback(usersWithStatus)
      }
    })

    // Subscribe to users
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      users = []
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          users.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          })
        })
      }
      
      // Emit combined data with status
      const usersWithStatus = users.map((user) => ({
        ...user,
        isOnline: statuses[user.id]?.state === 'online',
      }))
      callback(usersWithStatus)
    })
    
    this.listeners.set('users', { ref: usersRef, unsubscribe: unsubscribeUsers })
    this.listeners.set('status-combined', { ref: statusRef, unsubscribe: unsubscribeStatus })
    
    return () => {
      this.unsubscribe('users')
      this.unsubscribe('status-combined')
    }
  }

  // Subscribe to specific user data (for current user sync)
  subscribeToCurrentUser(userId, callback) {
    const userRef = ref(realtimeDb, `users/${userId}`)
    const statusRef = ref(realtimeDb, `status/${userId}`)
    
    let userData = null
    let userStatus = null

    // Subscribe to user status
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        userStatus = snapshot.val()
      }
      // Emit combined data whenever status changes
      if (userData) {
        callback({
          ...userData,
          isOnline: userStatus?.state === 'online',
        })
      }
    })

    // Subscribe to user data
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        userData = {
          id: userId,
          ...snapshot.val(),
        }
        // Emit combined data with status
        callback({
          ...userData,
          isOnline: userStatus?.state === 'online',
        })
      }
    })
    
    this.listeners.set(`current-user-${userId}`, { ref: userRef, unsubscribe: unsubscribeUser })
    this.listeners.set(`current-user-status-${userId}`, { ref: statusRef, unsubscribe: unsubscribeStatus })
    
    return () => {
      this.unsubscribe(`current-user-${userId}`)
      this.unsubscribe(`current-user-status-${userId}`)
    }
  }

  // Group chat
  async sendGroupMessage(groupId, message) {
    const messagesRef = ref(realtimeDb, `groups/${groupId}/messages`)
    const newMessageRef = push(messagesRef)
    
    await set(newMessageRef, {
      ...message,
      timestamp: serverTimestamp(),
      id: newMessageRef.key,
    })
    
    return newMessageRef.key
  }

  subscribeToGroupMessages(groupId, callback) {
    const messagesRef = ref(realtimeDb, `groups/${groupId}/messages`)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages = []
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(messages)
    })
    
    this.listeners.set(`group-messages-${groupId}`, { ref: messagesRef, unsubscribe })
    return () => this.unsubscribe(`group-messages-${groupId}`)
  }

  // Online users count
  subscribeToOnlineUsers(callback) {
    const statusRef = ref(realtimeDb, 'status')
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const users = snapshot.val() || {}
      const onlineUsers = Object.entries(users)
        .filter(([_, status]) => status.state === 'online')
        .map(([userId, status]) => ({ userId, ...status }))
      
      callback(onlineUsers)
    })
    
    this.listeners.set('online-users', { ref: statusRef, unsubscribe })
    return () => this.unsubscribe('online-users')
  }

  // Create or get existing one-on-one conversation
  async createOrGetConversation(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) return null

    // Create a consistent conversation ID (sort both IDs to ensure same ID regardless of who initiates)
    const conversationId = [currentUserId, targetUserId].sort().join('_')
    const conversationRef = ref(realtimeDb, `conversations/${conversationId}`)

    try {
      // Check if conversation already exists
      const checkRef = ref(realtimeDb, `conversations/${conversationId}`)
      let exists = false

      await new Promise((resolve) => {
        onValue(checkRef, (snapshot) => {
          exists = !!snapshot.val()
          resolve()
        }, { onlyOnce: true })
      })

      // If conversation doesn't exist, create it
      if (!exists) {
        await set(conversationRef, {
          id: conversationId,
          participants: [currentUserId, targetUserId],
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: serverTimestamp(),
        })
      }

      return conversationId
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  // Follow Request System
  async sendFollowRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false
    
    try {
      const requestId = `${fromUserId}_${toUserId}`
      const followRequestRef = ref(realtimeDb, `followRequests/${toUserId}/${requestId}`)
      
      await set(followRequestRef, {
        id: requestId,
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      
      return true
    } catch (error) {
      console.error('Error sending follow request:', error)
      return false
    }
  }

  // Get follow requests for a user
  subscribeToFollowRequests(userId, callback) {
    if (!userId) return

    const followRequestsRef = ref(realtimeDb, `followRequests/${userId}`)
    const unsubscribe = onValue(followRequestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = Object.values(snapshot.val()).filter(
          (req) => req.status === 'pending'
        )
        callback(requests)
      } else {
        callback([])
      }
    })

    this.listeners.set(`followRequests-${userId}`, { ref: followRequestsRef, unsubscribe })
    return () => this.unsubscribe(`followRequests-${userId}`)
  }

  // Accept follow request
  async acceptFollowRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false

    try {
      const requestId = `${fromUserId}_${toUserId}`
      const followRequestRef = ref(realtimeDb, `followRequests/${toUserId}/${requestId}`)
      
      // Update request status
      await update(followRequestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      })

      // Add follower relationship
      await set(ref(realtimeDb, `followers/${toUserId}/${fromUserId}`), {
        userId: fromUserId,
        followedAt: serverTimestamp(),
      })

      // Add following relationship
      await set(ref(realtimeDb, `following/${fromUserId}/${toUserId}`), {
        userId: toUserId,
        followedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error('Error accepting follow request:', error)
      return false
    }
  }

  // Decline follow request
  async declineFollowRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false

    try {
      const requestId = `${fromUserId}_${toUserId}`
      const followRequestRef = ref(realtimeDb, `followRequests/${toUserId}/${requestId}`)
      
      await update(followRequestRef, {
        status: 'declined',
        declinedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error('Error declining follow request:', error)
      return false
    }
  }

  // Get followers count (one-time fetch)
  async getFollowersCount(userId) {
    if (!userId) return 0

    try {
      const followersRef = ref(realtimeDb, `followers/${userId}`)
      const snapshot = await get(followersRef)
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      console.log('📍 Fetched followers count for', userId, ':', count)
      return count
    } catch (error) {
      console.error('Error getting followers count:', error)
      return 0
    }
  }

  // Get following count (one-time fetch)
  async getFollowingCount(userId) {
    if (!userId) return 0

    try {
      const followingRef = ref(realtimeDb, `following/${userId}`)
      const snapshot = await get(followingRef)
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      console.log('📍 Fetched following count for', userId, ':', count)
      return count
    } catch (error) {
      console.error('Error getting following count:', error)
      return 0
    }
  }

  // Check if follow request exists
  async checkFollowRequestStatus(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return null

    try {
      const requestId = `${fromUserId}_${toUserId}`
      const followRequestRef = ref(realtimeDb, `followRequests/${toUserId}/${requestId}`)
      
      return new Promise((resolve) => {
        onValue(followRequestRef, (snapshot) => {
          if (snapshot.exists()) {
            resolve(snapshot.val().status) // 'pending', 'accepted', or 'declined'
          } else {
            resolve(null)
          }
        }, { onlyOnce: true })
      })
    } catch (error) {
      console.error('Error checking follow request:', error)
      return null
    }
  }

  // Subscribe to followers count (real-time) with fallback polling
  subscribeToFollowersCount(userId, callback) {
    if (!userId) return () => {}

    console.log('Subscribing to followers count for:', userId)
    const followersRef = ref(realtimeDb, `followers/${userId}`)
    
    // Real-time listener
    const unsubscribe = onValue(followersRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      console.log('Real-time followers count updated:', count, 'for user:', userId)
      callback(count)
    }, (error) => {
      console.error('Error subscribing to followers:', error)
      // Fallback: return 0 on error
      callback(0)
    })

    // Also set up periodic check as fallback (every 5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const snapshot = await get(followersRef)
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
        console.log('Polling followers count:', count, 'for user:', userId)
        callback(count)
      } catch (error) {
        console.error('Error polling followers count:', error)
      }
    }, 5000)

    this.listeners.set(`followersCount-${userId}`, { 
      ref: followersRef, 
      unsubscribe,
      pollInterval 
    })
    
    return () => {
      clearInterval(pollInterval)
      this.unsubscribe(`followersCount-${userId}`)
    }
  }

  // Subscribe to following count (real-time) with fallback polling
  subscribeToFollowingCount(userId, callback) {
    if (!userId) return () => {}

    console.log('Subscribing to following count for:', userId)
    const followingRef = ref(realtimeDb, `following/${userId}`)
    
    // Real-time listener
    const unsubscribe = onValue(followingRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      console.log('Real-time following count updated:', count, 'for user:', userId)
      callback(count)
    }, (error) => {
      console.error('Error subscribing to following:', error)
      // Fallback: return 0 on error
      callback(0)
    })

    // Also set up periodic check as fallback (every 5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const snapshot = await get(followingRef)
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
        console.log('Polling following count:', count, 'for user:', userId)
        callback(count)
      } catch (error) {
        console.error('Error polling following count:', error)
      }
    }, 5000)

    this.listeners.set(`followingCount-${userId}`, { 
      ref: followingRef, 
      unsubscribe,
      pollInterval 
    })
    
    return () => {
      clearInterval(pollInterval)
      this.unsubscribe(`followingCount-${userId}`)
    }
  }

  // Delete a single message
  async deleteMessage(conversationId, messageId) {
    if (!conversationId || !messageId) return false
    
    try {
      const messageRef = ref(realtimeDb, `messages/${conversationId}/${messageId}`)
      await remove(messageRef)
      return true
    } catch (error) {
      console.error('Error deleting message:', error)
      return false
    }
  }

  // Delete entire conversation and all messages
  async deleteConversation(userId, conversationId) {
    if (!userId || !conversationId) return false
    
    try {
      // Delete messages in the conversation
      const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
      await remove(messagesRef)
      
      // Delete conversation from current user's view
      const conversationRef = ref(realtimeDb, `conversations/${userId}/${conversationId}`)
      await remove(conversationRef)
      
      return true
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return false
    }
  }

  // Clear all messages in a conversation (keep conversation, just delete messages)
  async clearConversationMessages(conversationId) {
    if (!conversationId) return false
    
    try {
      const messagesRef = ref(realtimeDb, `messages/${conversationId}`)
      await remove(messagesRef)
      return true
    } catch (error) {
      console.error('Error clearing messages:', error)
      return false
    }
  }

  // Unsubscribe from a specific listener
  unsubscribe(key) {
    const listener = this.listeners.get(key)
    if (listener) {
      // Clear polling interval if it exists
      if (listener.pollInterval) {
        clearInterval(listener.pollInterval)
      }
      // Call the unsubscribe function returned by onValue
      if (listener.unsubscribe && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe()
      }
      this.listeners.delete(key)
      console.log('Unsubscribed from listener:', key)
    }
  }

  // ==================== GROUPS FEATURE ====================

  // Create a new group
  async createGroup(groupData) {
    if (!groupData.name || !groupData.createdBy) {
      throw new Error('Group name and creator are required')
    }

    try {
      const groupsRef = ref(realtimeDb, 'groups')
      const newGroupRef = push(groupsRef)
      const groupId = newGroupRef.key

      // Create group
      await set(newGroupRef, {
        id: groupId,
        name: groupData.name,
        description: groupData.description || '',
        skillCategory: groupData.skillCategory || 'General',
        createdBy: groupData.createdBy,
        createdAt: serverTimestamp(),
        memberCount: 1,
      })

      // Add creator as member
      await set(ref(realtimeDb, `groupMembers/${groupId}/${groupData.createdBy}`), {
        userId: groupData.createdBy,
        role: 'admin',
        joinedAt: serverTimestamp(),
      })

      return { success: true, groupId }
    } catch (error) {
      console.error('Error creating group:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all groups
  async getGroups() {
    try {
      const groupsRef = ref(realtimeDb, 'groups')
      const snapshot = await get(groupsRef)
      
      if (!snapshot.exists()) {
        return []
      }

      const groups = []
      snapshot.forEach((childSnapshot) => {
        groups.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })

      return groups
    } catch (error) {
      console.error('Error getting groups:', error)
      return []
    }
  }

  // Subscribe to all groups
  subscribeToGroups(callback) {
    try {
      const groupsRef = ref(realtimeDb, 'groups')
      const unsubscribe = onValue(groupsRef, (snapshot) => {
        const groups = []
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            groups.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            })
          })
        }
        callback(groups)
      })

      this.listeners.set('groups', { ref: groupsRef, unsubscribe })
      return () => this.unsubscribe('groups')
    } catch (error) {
      console.error('Error subscribing to groups:', error)
      return () => {}
    }
  }

  // Join a group
  async joinGroup(groupId, userId) {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required')
    }

    try {
      // Check if user is already a member (idempotency)
      const existingMemberRef = ref(realtimeDb, `groupMembers/${groupId}/${userId}`)
      const memberSnapshot = await get(existingMemberRef)
      
      if (memberSnapshot.exists()) {
        return { success: true, message: 'Already a member' }
      }

      // Add user to group members
      await set(existingMemberRef, {
        userId,
        role: 'member',
        joinedAt: serverTimestamp(),
      })

      // Update member count (only if newly added)
      const memberCountRef = ref(realtimeDb, `groups/${groupId}/memberCount`)
      const snapshot = await get(memberCountRef)
      const currentCount = snapshot.val() || 0
      await update(ref(realtimeDb, `groups/${groupId}`), {
        memberCount: currentCount + 1,
      })

      return { success: true }
    } catch (error) {
      console.error('Error joining group:', error)
      return { success: false, error: error.message }
    }
  }

  // Leave a group
  async leaveGroup(groupId, userId) {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required')
    }

    try {
      // Remove user from group members
      await remove(ref(realtimeDb, `groupMembers/${groupId}/${userId}`))

      // Update member count
      const memberCountRef = ref(realtimeDb, `groups/${groupId}/memberCount`)
      const snapshot = await get(memberCountRef)
      const currentCount = snapshot.val() || 1
      await update(ref(realtimeDb, `groups/${groupId}`), {
        memberCount: Math.max(0, currentCount - 1),
      })

      return { success: true }
    } catch (error) {
      console.error('Error leaving group:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to group members
  subscribeToGroupMembers(groupId, callback) {
    if (!groupId) return () => {}

    try {
      const membersRef = ref(realtimeDb, `groupMembers/${groupId}`)
      const unsubscribe = onValue(membersRef, (snapshot) => {
        const members = []
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            members.push(childSnapshot.val())
          })
        }
        callback(members)
      })

      this.listeners.set(`groupMembers-${groupId}`, { ref: membersRef, unsubscribe })
      return () => this.unsubscribe(`groupMembers-${groupId}`)
    } catch (error) {
      console.error('Error subscribing to group members:', error)
      return () => {}
    }
  }

  // Send group message
  async sendGroupMessage(groupId, message) {
    if (!groupId || !message.text) {
      throw new Error('Group ID and message text are required')
    }

    try {
      const messagesRef = ref(realtimeDb, `groupMessages/${groupId}`)
      const newMessageRef = push(messagesRef)

      await set(newMessageRef, {
        id: newMessageRef.key,
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        timestamp: serverTimestamp(),
      })

      // Update group last message
      await update(ref(realtimeDb, `groups/${groupId}`), {
        lastMessage: message.text,
        lastMessageTime: serverTimestamp(),
      })

      return { success: true, messageId: newMessageRef.key }
    } catch (error) {
      console.error('Error sending group message:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to group messages
  subscribeToGroupMessages(groupId, callback) {
    if (!groupId) return () => {}

    try {
      const messagesRef = ref(realtimeDb, `groupMessages/${groupId}`)
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messages = []
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            messages.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            })
          })
        }
        // Sort by timestamp
        messages.sort((a, b) => {
          const timeA = a.timestamp || 0
          const timeB = b.timestamp || 0
          return new Date(timeA) - new Date(timeB)
        })
        callback(messages)
      })

      this.listeners.set(`groupMessages-${groupId}`, { ref: messagesRef, unsubscribe })
      return () => this.unsubscribe(`groupMessages-${groupId}`)
    } catch (error) {
      console.error('Error subscribing to group messages:', error)
      return () => {}
    }
  }

  // Delete group message
  async deleteGroupMessage(groupId, messageId) {
    if (!groupId || !messageId) {
      throw new Error('Group ID and message ID are required')
    }

    try {
      await remove(ref(realtimeDb, `groupMessages/${groupId}/${messageId}`))
      return { success: true }
    } catch (error) {
      console.error('Error deleting group message:', error)
      return { success: false, error: error.message }
    }
  }

  // Invite user to group
  async inviteToGroup(groupId, userId, invitedBy) {
    if (!groupId || !userId || !invitedBy) {
      throw new Error('Group ID, user ID, and inviter ID are required')
    }

    try {
      const invitationId = `${invitedBy}_${Date.now()}`
      await set(ref(realtimeDb, `groupInvitations/${groupId}/${userId}`), {
        groupId,
        userId,
        invitedBy,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      return { success: true }
    } catch (error) {
      console.error('Error inviting to group:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to group invitations for a user
  subscribeToGroupInvitations(userId, callback) {
    if (!userId) return () => {}

    try {
      const invitationsRef = ref(realtimeDb, `groupInvitations`)
      const unsubscribe = onValue(invitationsRef, (snapshot) => {
        const invitations = []
        if (snapshot.exists()) {
          snapshot.forEach((groupSnapshot) => {
            groupSnapshot.forEach((userSnapshot) => {
              if (userSnapshot.key === userId) {
                invitations.push({
                  groupId: groupSnapshot.key,
                  ...userSnapshot.val(),
                })
              }
            })
          })
        }
        callback(invitations)
      })

      this.listeners.set(`groupInvitations-${userId}`, { ref: invitationsRef, unsubscribe })
      return () => this.unsubscribe(`groupInvitations-${userId}`)
    } catch (error) {
      console.error('Error subscribing to group invitations:', error)
      return () => {}
    }
  }

  // Accept group invitation
  async acceptGroupInvitation(groupId, userId) {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required')
    }

    try {
      // Join the group
      await this.joinGroup(groupId, userId)

      // Remove invitation
      await remove(ref(realtimeDb, `groupInvitations/${groupId}/${userId}`))

      return { success: true }
    } catch (error) {
      console.error('Error accepting group invitation:', error)
      return { success: false, error: error.message }
    }
  }

  // Decline group invitation
  async declineGroupInvitation(groupId, userId) {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required')
    }

    try {
      await remove(ref(realtimeDb, `groupInvitations/${groupId}/${userId}`))
      return { success: true }
    } catch (error) {
      console.error('Error declining group invitation:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's groups
  async getUserGroups(userId) {
    if (!userId) return []

    try {
      const membershipRef = ref(realtimeDb, `groupMembers`)
      const snapshot = await get(membershipRef)
      const userGroups = []

      if (snapshot.exists()) {
        snapshot.forEach((groupSnapshot) => {
          groupSnapshot.forEach((userSnapshot) => {
            if (userSnapshot.key === userId) {
              userGroups.push(groupSnapshot.key)
            }
          })
        })
      }

      return userGroups
    } catch (error) {
      console.error('Error getting user groups:', error)
      return []
    }
  }

  // Delete group (only by creator)
  async deleteGroup(groupId, userId) {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required')
    }

    try {
      const groupRef = ref(realtimeDb, `groups/${groupId}`)
      const snapshot = await get(groupRef)

      if (!snapshot.exists()) {
        throw new Error('Group not found')
      }

      const groupData = snapshot.val()
      if (groupData.createdBy !== userId) {
        throw new Error('Only group creator can delete the group')
      }

      // Delete messages
      await remove(ref(realtimeDb, `groupMessages/${groupId}`))

      // Delete members
      await remove(ref(realtimeDb, `groupMembers/${groupId}`))

      // Delete invitations
      await remove(ref(realtimeDb, `groupInvitations/${groupId}`))

      // Delete group
      await remove(groupRef)

      return { success: true }
    } catch (error) {
      console.error('Error deleting group:', error)
      return { success: false, error: error.message }
    }
  }

  // ==================== COMMUNITY POSTS FEATURE ====================
  
  // Create a new post
  async createPost(postData) {
    if (!postData.authorId || !postData.content) {
      const error = 'Author and content are required'
      console.error('Create post validation error:', error)
      return { success: false, error }
    }

    try {
      console.log('Creating post in Firebase:', postData)
      const postsRef = ref(realtimeDb, 'posts')
      const newPostRef = push(postsRef)
      const postId = newPostRef.key

      console.log('Post ID assigned:', postId)

      const postObject = {
        id: postId,
        authorId: postData.authorId,
        content: postData.content,
        image: postData.image || null,
        video: postData.video || null,
        tags: postData.tags || [],
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      }

      console.log('Saving post object:', postObject)
      await set(newPostRef, postObject)

      console.log('Post created successfully with ID:', postId)
      return { success: true, postId }
    } catch (error) {
      console.error('Firebase error creating post:', error)
      const errorMessage = error.message || 'Failed to create post'
      return { success: false, error: errorMessage }
    }
  }

  // Subscribe to all posts
  subscribeToPosts(callback) {
    const postsRef = ref(realtimeDb, 'posts')
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const posts = []
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          posts.push(childSnapshot.val())
        })
      }
      // Sort by createdAt (newest first)
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      callback(posts)
    })

    this.listeners.set('posts', { ref: postsRef, unsubscribe })
    return () => this.unsubscribe('posts')
  }

  // Like/Unlike a post
  async toggleLike(postId, userId) {
    if (!postId || !userId) return { success: false, error: 'Post ID and User ID required' }

    try {
      const likeRef = ref(realtimeDb, `postLikes/${postId}/${userId}`)
      const snapshot = await get(likeRef)

      if (snapshot.exists()) {
        // Unlike: Remove like
        await remove(likeRef)
        
        // Decrement likes count
        const postRef = ref(realtimeDb, `posts/${postId}`)
        const postSnapshot = await get(postRef)
        if (postSnapshot.exists()) {
          const currentCount = postSnapshot.val().likesCount || 0
          await update(postRef, { likesCount: Math.max(0, currentCount - 1) })
        }
        
        return { success: true, liked: false }
      } else {
        // Like: Add like
        await set(likeRef, {
          userId,
          likedAt: serverTimestamp(),
        })
        
        // Increment likes count
        const postRef = ref(realtimeDb, `posts/${postId}`)
        const postSnapshot = await get(postRef)
        if (postSnapshot.exists()) {
          const currentCount = postSnapshot.val().likesCount || 0
          await update(postRef, { likesCount: currentCount + 1 })
        }
        
        return { success: true, liked: true }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if user liked a post
  async checkIfLiked(postId, userId) {
    if (!postId || !userId) return false

    try {
      const likeRef = ref(realtimeDb, `postLikes/${postId}/${userId}`)
      const snapshot = await get(likeRef)
      return snapshot.exists()
    } catch (error) {
      console.error('Error checking like status:', error)
      return false
    }
  }

  // Add comment to post
  async addComment(postId, userId, commentText) {
    if (!postId || !userId || !commentText) {
      return { success: false, error: 'Post ID, User ID, and comment text required' }
    }

    try {
      const commentsRef = ref(realtimeDb, `postComments/${postId}`)
      const newCommentRef = push(commentsRef)
      const commentId = newCommentRef.key

      await set(newCommentRef, {
        id: commentId,
        postId,
        userId,
        text: commentText,
        createdAt: serverTimestamp(),
      })

      // Increment comments count
      const postRef = ref(realtimeDb, `posts/${postId}`)
      const postSnapshot = await get(postRef)
      if (postSnapshot.exists()) {
        const currentCount = postSnapshot.val().commentsCount || 0
        await update(postRef, { commentsCount: currentCount + 1 })
      }

      return { success: true, commentId }
    } catch (error) {
      console.error('Error adding comment:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to comments for a post
  subscribeToComments(postId, callback) {
    if (!postId) return () => {}

    const commentsRef = ref(realtimeDb, `postComments/${postId}`)
    
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const comments = []
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          comments.push(childSnapshot.val())
        })
      }
      // Sort by createdAt (oldest first for comments)
      comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      callback(comments)
    })

    this.listeners.set(`comments-${postId}`, { ref: commentsRef, unsubscribe })
    return () => this.unsubscribe(`comments-${postId}`)
  }

  // Delete a post
  async deletePost(postId, userId) {
    if (!postId || !userId) return { success: false, error: 'Post ID and User ID required' }

    try {
      // Check if user is the author
      const postRef = ref(realtimeDb, `posts/${postId}`)
      const postSnapshot = await get(postRef)
      
      if (!postSnapshot.exists()) {
        return { success: false, error: 'Post not found' }
      }

      if (postSnapshot.val().authorId !== userId) {
        return { success: false, error: 'Not authorized to delete this post' }
      }

      // Delete post
      await remove(postRef)
      
      // Delete all likes
      await remove(ref(realtimeDb, `postLikes/${postId}`))
      
      // Delete all comments
      await remove(ref(realtimeDb, `postComments/${postId}`))

      return { success: true }
    } catch (error) {
      console.error('Error deleting post:', error)
      return { success: false, error: error.message }
    }
  }

  // Get followers list for a user
  async getUserFollowers(userId) {
    if (!userId) return { success: false, followers: [] }

    try {
      const followersRef = ref(realtimeDb, `followers/${userId}`)
      const snapshot = await get(followersRef)
      
      if (!snapshot.exists()) {
        return { success: true, followers: [] }
      }

      const followerIds = Object.keys(snapshot.val())
      const followers = []

      for (const followerId of followerIds) {
        try {
          const userRef = ref(realtimeDb, `users/${followerId}`)
          const userSnapshot = await get(userRef)
          if (userSnapshot.exists()) {
            followers.push({
              uid: followerId,
              ...userSnapshot.val()
            })
          }
        } catch (error) {
          console.error(`Error fetching user data for ${followerId}:`, error)
        }
      }

      return { success: true, followers }
    } catch (error) {
      console.error('Error fetching followers:', error)
      return { success: false, error: error.message, followers: [] }
    }
  }

  // Get following list for a user
  async getUserFollowing(userId) {
    if (!userId) return { success: false, following: [] }

    try {
      const followingRef = ref(realtimeDb, `following/${userId}`)
      const snapshot = await get(followingRef)
      
      if (!snapshot.exists()) {
        return { success: true, following: [] }
      }

      const followingIds = Object.keys(snapshot.val())
      const following = []

      for (const followingId of followingIds) {
        try {
          const userRef = ref(realtimeDb, `users/${followingId}`)
          const userSnapshot = await get(userRef)
          if (userSnapshot.exists()) {
            following.push({
              uid: followingId,
              ...userSnapshot.val()
            })
          }
        } catch (error) {
          console.error(`Error fetching user data for ${followingId}:`, error)
        }
      }

      return { success: true, following }
    } catch (error) {
      console.error('Error fetching following:', error)
      return { success: false, error: error.message, following: [] }
    }
  }

  // Subscribe to followers list (real-time updates)
  subscribeToFollowers(userId, callback) {
    if (!userId) return () => {}

    const followersRef = ref(realtimeDb, `followers/${userId}`)
    
    const unsubscribe = onValue(followersRef, async (snapshot) => {
      const followerIds = snapshot.exists() ? Object.keys(snapshot.val()) : []
      const followers = []

      for (const followerId of followerIds) {
        try {
          const userRef = ref(realtimeDb, `users/${followerId}`)
          const userSnapshot = await get(userRef)
          if (userSnapshot.exists()) {
            followers.push({
              uid: followerId,
              ...userSnapshot.val()
            })
          }
        } catch (error) {
          console.error(`Error fetching user data for ${followerId}:`, error)
        }
      }

      callback(followers)
    })

    this.listeners.set(`followers-${userId}`, { ref: followersRef, unsubscribe })
    return () => this.unsubscribe(`followers-${userId}`)
  }

  // Subscribe to following list (real-time updates)
  subscribeToFollowing(userId, callback) {
    if (!userId) return () => {}

    const followingRef = ref(realtimeDb, `following/${userId}`)
    
    const unsubscribe = onValue(followingRef, async (snapshot) => {
      const followingIds = snapshot.exists() ? Object.keys(snapshot.val()) : []
      const following = []

      for (const followingId of followingIds) {
        try {
          const userRef = ref(realtimeDb, `users/${followingId}`)
          const userSnapshot = await get(userRef)
          if (userSnapshot.exists()) {
            following.push({
              uid: followingId,
              ...userSnapshot.val()
            })
          }
        } catch (error) {
          console.error(`Error fetching user data for ${followingId}:`, error)
        }
      }

      callback(following)
    })

    this.listeners.set(`following-${userId}`, { ref: followingRef, unsubscribe })
    return () => this.unsubscribe(`following-${userId}`)
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.listeners.forEach((listener, key) => {
      off(listener.ref)
    })
    this.listeners.clear()
  }

  // ============================================
  // SKILL EXCHANGE - CREDIT BASED SYSTEM
  // ============================================

  // Create a teaching session listing (user offers to teach)
  async createTeachingSession(userId, sessionData) {
    const sessionRef = push(ref(realtimeDb, 'teachingSessions'))
    const session = {
      teacherId: userId,
      skillName: sessionData.skillName,
      skillLevel: sessionData.skillLevel,
      category: sessionData.category,
      description: sessionData.description,
      duration: sessionData.duration || 60, // minutes
      coinsCost: sessionData.coinsCost || 100,
      maxLearners: sessionData.maxLearners || 1,
      availableSlots: sessionData.availableSlots || [],
      rating: 0,
      totalReviews: 0,
      totalSessions: 0,
      status: 'active',
      createdAt: serverTimestamp(),
    }
    
    await set(sessionRef, session)
    return { id: sessionRef.key, ...session }
  }

  // Get all available teaching sessions
  async getAvailableTeachingSessions() {
    const sessionsRef = ref(realtimeDb, 'teachingSessions')
    const snapshot = await get(sessionsRef)
    
    if (!snapshot.exists()) return []
    
    const sessions = []
    snapshot.forEach((child) => {
      if (child.val().status === 'active') {
        sessions.push({ id: child.key, ...child.val() })
      }
    })
    
    return sessions
  }

  // Subscribe to teaching sessions (real-time marketplace)
  subscribeToTeachingSessions(callback) {
    const sessionsRef = ref(realtimeDb, 'teachingSessions')
    const unsubscribe = onValue(sessionsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback([])
        return
      }
      
      const sessions = []
      const sessionPromises = []
      
      snapshot.forEach((child) => {
        if (child.val().status === 'active') {
          const sessionData = { id: child.key, ...child.val() }
          
          // Fetch teacher details
          const teacherPromise = get(ref(realtimeDb, `users/${child.val().teacherId}`))
            .then(teacherSnap => {
              if (teacherSnap.exists()) {
                sessionData.teacher = teacherSnap.val()
              }
              sessions.push(sessionData)
            })
          
          sessionPromises.push(teacherPromise)
        }
      })
      
      await Promise.all(sessionPromises)
      callback(sessions)
    })
    
    this.listeners.set('teachingSessions', { ref: sessionsRef, unsubscribe })
    return () => this.unsubscribe('teachingSessions')
  }

  // Book a teaching session
  async bookSession(sessionId, learnerId, selectedSlot) {
    const bookingRef = push(ref(realtimeDb, 'sessionBookings'))
    const sessionRef = ref(realtimeDb, `teachingSessions/${sessionId}`)
    
    // Get session details
    const sessionSnapshot = await get(sessionRef)
    if (!sessionSnapshot.exists()) {
      throw new Error('Session not found')
    }
    
    const session = sessionSnapshot.val()
    
    // Get learner coins
    const learnerRef = ref(realtimeDb, `users/${learnerId}`)
    const learnerSnapshot = await get(learnerRef)
    const learnerData = learnerSnapshot.val()
    
    if ((learnerData.coins || 0) < session.coinsCost) {
      throw new Error('Insufficient coins')
    }
    
    // Create booking
    const booking = {
      sessionId,
      teacherId: session.teacherId,
      learnerId,
      skillName: session.skillName,
      duration: session.duration,
      coinsCost: session.coinsCost,
      scheduledTime: selectedSlot,
      status: 'pending', // pending, confirmed, completed, cancelled
      createdAt: serverTimestamp(),
    }
    
    await set(bookingRef, booking)
    
    // Deduct coins from learner (held in escrow)
    await update(learnerRef, {
      coins: (learnerData.coins || 0) - session.coinsCost,
      coinsInEscrow: ((learnerData.coinsInEscrow || 0) + session.coinsCost)
    })
    
    return { id: bookingRef.key, ...booking }
  }

  // Complete a session (teacher marks as done)
  async completeSession(bookingId, teacherRating = 5) {
    const bookingRef = ref(realtimeDb, `sessionBookings/${bookingId}`)
    const bookingSnapshot = await get(bookingRef)
    
    if (!bookingSnapshot.exists()) {
      throw new Error('Booking not found')
    }
    
    const booking = bookingSnapshot.val()
    
    // Update booking status
    await update(bookingRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      teacherRating
    })
    
    // Transfer coins from escrow to teacher
    const learnerRef = ref(realtimeDb, `users/${booking.learnerId}`)
    const teacherRef = ref(realtimeDb, `users/${booking.teacherId}`)
    
    const learnerSnapshot = await get(learnerRef)
    const teacherSnapshot = await get(teacherRef)
    
    const learnerData = learnerSnapshot.val()
    const teacherData = teacherSnapshot.val()
    
    // Update learner
    await update(learnerRef, {
      coinsInEscrow: (learnerData.coinsInEscrow || 0) - booking.coinsCost,
      totalCoinsSpent: (learnerData.totalCoinsSpent || 0) + booking.coinsCost,
      skillsLearned: (learnerData.skillsLearned || 0) + 1
    })
    
    // Update teacher (earn coins + bonus)
    const bonusCoins = Math.floor(booking.coinsCost * 0.1) // 10% bonus
    await update(teacherRef, {
      coins: (teacherData.coins || 0) + booking.coinsCost + bonusCoins,
      totalCoinsEarned: (teacherData.totalCoinsEarned || 0) + booking.coinsCost + bonusCoins,
      skillsTaught: (teacherData.skillsTaught || 0) + 1
    })
    
    // Update teaching session stats
    const sessionRef = ref(realtimeDb, `teachingSessions/${booking.sessionId}`)
    const sessionSnapshot = await get(sessionRef)
    const sessionData = sessionSnapshot.val()
    
    await update(sessionRef, {
      totalSessions: (sessionData.totalSessions || 0) + 1,
      rating: ((sessionData.rating || 0) * (sessionData.totalReviews || 0) + teacherRating) / ((sessionData.totalReviews || 0) + 1),
      totalReviews: (sessionData.totalReviews || 0) + 1
    })
    
    return { success: true, coinsEarned: booking.coinsCost + bonusCoins }
  }

  // Get user's session bookings
  async getUserBookings(userId) {
    const bookingsRef = ref(realtimeDb, 'sessionBookings')
    const snapshot = await get(bookingsRef)
    
    if (!snapshot.exists()) return { asLearner: [], asTeacher: [] }
    
    const asLearner = []
    const asTeacher = []
    
    snapshot.forEach((child) => {
      const booking = { id: child.key, ...child.val() }
      if (booking.learnerId === userId) {
        asLearner.push(booking)
      }
      if (booking.teacherId === userId) {
        asTeacher.push(booking)
      }
    })
    
    return { asLearner, asTeacher }
  }

  // Subscribe to user bookings
  subscribeToUserBookings(userId, callback) {
    const bookingsRef = ref(realtimeDb, 'sessionBookings')
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback({ asLearner: [], asTeacher: [] })
        return
      }
      
      const asLearner = []
      const asTeacher = []
      
      snapshot.forEach((child) => {
        const booking = { id: child.key, ...child.val() }
        if (booking.learnerId === userId) {
          asLearner.push(booking)
        }
        if (booking.teacherId === userId) {
          asTeacher.push(booking)
        }
      })
      
      callback({ asLearner, asTeacher })
    })
    
    this.listeners.set(`bookings-${userId}`, { ref: bookingsRef, unsubscribe })
    return () => this.unsubscribe(`bookings-${userId}`)
  }

  // Rate and review a session
  async rateSession(bookingId, learnerId, rating, review) {
    const reviewRef = push(ref(realtimeDb, 'sessionReviews'))
    const reviewData = {
      bookingId,
      learnerId,
      rating,
      review,
      createdAt: serverTimestamp()
    }
    
    await set(reviewRef, reviewData)
    
    // Update booking
    const bookingRef = ref(realtimeDb, `sessionBookings/${bookingId}`)
    await update(bookingRef, {
      learnerRating: rating,
      learnerReview: review
    })
    
    return reviewData
  }

  // Get leaderboard (top earners)
  async getLeaderboard(limit = 10) {
    const usersRef = ref(realtimeDb, 'users')
    const snapshot = await get(usersRef)
    
    if (!snapshot.exists()) return []
    
    const users = []
    snapshot.forEach((child) => {
      const userData = child.val()
      if (userData.totalCoinsEarned) {
        users.push({
          uid: child.key,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          totalCoinsEarned: userData.totalCoinsEarned,
          skillsTaught: userData.skillsTaught || 0,
          rating: userData.rating || 0
        })
      }
    })
    
    // Sort by coins earned
    users.sort((a, b) => b.totalCoinsEarned - a.totalCoinsEarned)
    
    return users.slice(0, limit)
  }

  // Search teaching sessions
  async searchTeachingSessions(query) {
    const sessionsRef = ref(realtimeDb, 'teachingSessions')
    const snapshot = await get(sessionsRef)
    
    if (!snapshot.exists()) return []
    
    const sessions = []
    const searchLower = query.toLowerCase()
    
    snapshot.forEach((child) => {
      const session = child.val()
      if (session.status === 'active' && 
          (session.skillName.toLowerCase().includes(searchLower) ||
           session.description?.toLowerCase().includes(searchLower) ||
           session.category?.toLowerCase().includes(searchLower))) {
        sessions.push({ id: child.key, ...session })
      }
    })
    
    return sessions
  }

  // ============================================
  // COIN MANAGEMENT SYSTEM
  // ============================================

  // Award coins to user
  async awardCoins(userId, amount, reason) {
    if (!userId || !amount) return { success: false, error: 'Invalid parameters' }

    try {
      const userRef = ref(realtimeDb, `users/${userId}`)
      const userSnapshot = await get(userRef)
      
      if (!userSnapshot.exists()) {
        return { success: false, error: 'User not found' }
      }

      const userData = userSnapshot.val()
      const currentCoins = userData.coins || 0

      // Update user coins
      await update(userRef, {
        coins: currentCoins + amount
      })

      // Record transaction
      const transactionRef = push(ref(realtimeDb, `coinTransactions/${userId}`))
      await set(transactionRef, {
        type: 'earned',
        amount,
        reason,
        timestamp: serverTimestamp(),
        balanceAfter: currentCoins + amount
      })

      return { success: true, newBalance: currentCoins + amount }
    } catch (error) {
      console.error('Error awarding coins:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if user has claimed registration bonus
  async checkRegistrationBonusClaimed(userId) {
    if (!userId) return true

    try {
      const claimRef = ref(realtimeDb, `userRewards/${userId}/registrationBonus`)
      const snapshot = await get(claimRef)
      return snapshot.exists() && snapshot.val().claimed === true
    } catch (error) {
      console.error('Error checking registration bonus:', error)
      return true
    }
  }

  // Claim registration bonus (20 coins - one time)
  async claimRegistrationBonus(userId) {
    if (!userId) return { success: false, error: 'Invalid user ID' }

    try {
      // Check if already claimed
      const alreadyClaimed = await this.checkRegistrationBonusClaimed(userId)
      if (alreadyClaimed) {
        return { success: false, error: 'Registration bonus already claimed' }
      }

      // Award 20 coins
      const result = await this.awardCoins(userId, 20, 'Registration Bonus')
      
      if (result.success) {
        // Mark as claimed
        const claimRef = ref(realtimeDb, `userRewards/${userId}/registrationBonus`)
        await set(claimRef, {
          claimed: true,
          timestamp: serverTimestamp()
        })

        return { success: true, coins: 20 }
      }

      return result
    } catch (error) {
      console.error('Error claiming daily login:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if profile completion bonus claimed
  async checkProfileCompletionClaimed(userId) {
    if (!userId) return true

    try {
      const claimRef = ref(realtimeDb, `userRewards/${userId}/profileCompletion`)
      const snapshot = await get(claimRef)
      return snapshot.exists()
    } catch (error) {
      console.error('Error checking profile completion:', error)
      return true
    }
  }

  // Claim profile completion bonus
  async claimProfileCompletion(userId) {
    if (!userId) return { success: false, error: 'Invalid user ID' }

    try {
      // Check if already claimed
      const alreadyClaimed = await this.checkProfileCompletionClaimed(userId)
      if (alreadyClaimed) {
        return { success: false, error: 'Profile completion bonus already claimed' }
      }

      // Award 5 coins
      const result = await this.awardCoins(userId, 5, 'Profile Completion Bonus')
      
      if (result.success) {
        // Mark as claimed
        const claimRef = ref(realtimeDb, `userRewards/${userId}/profileCompletion`)
        await set(claimRef, {
          claimed: true,
          timestamp: serverTimestamp()
        })

        return { success: true, coins: 5 }
      }

      return result
    } catch (error) {
      console.error('Error claiming profile completion:', error)
      return { success: false, error: error.message }
    }
  }

  // Check follow 10 members milestone
  async checkFollowMilestoneClaimed(userId, milestone) {
    if (!userId) return true

    try {
      const claimRef = ref(realtimeDb, `userRewards/${userId}/followMilestone/${milestone}`)
      const snapshot = await get(claimRef)
      return snapshot.exists()
    } catch (error) {
      console.error('Error checking follow milestone:', error)
      return true
    }
  }

  // Claim follow milestone bonus
  async claimFollowMilestone(userId, milestone = 10) {
    if (!userId) return { success: false, error: 'Invalid user ID' }

    try {
      // Check if already claimed
      const alreadyClaimed = await this.checkFollowMilestoneClaimed(userId, milestone)
      if (alreadyClaimed) {
        return { success: false, error: 'Milestone already claimed' }
      }

      // Check if user has enough follows
      const followingCount = await this.getFollowingCount(userId)
      if (followingCount < milestone) {
        return { success: false, error: `Follow ${milestone} members to claim this bonus` }
      }

      // Award coins based on milestone
      const coinsReward = milestone === 10 ? 20 : milestone === 50 ? 50 : 100
      const result = await this.awardCoins(userId, coinsReward, `Follow ${milestone} Members Milestone`)
      
      if (result.success) {
        // Mark as claimed
        const claimRef = ref(realtimeDb, `userRewards/${userId}/followMilestone/${milestone}`)
        await set(claimRef, {
          claimed: true,
          timestamp: serverTimestamp(),
          count: followingCount
        })

        return { success: true, coins: coinsReward }
      }

      return result
    } catch (error) {
      console.error('Error claiming follow milestone:', error)
      return { success: false, error: error.message }
    }
  }

  // Check join group bonus
  async checkJoinGroupClaimed(userId) {
    if (!userId) return true

    try {
      const claimRef = ref(realtimeDb, `userRewards/${userId}/joinGroup`)
      const snapshot = await get(claimRef)
      return snapshot.exists()
    } catch (error) {
      console.error('Error checking join group:', error)
      return true
    }
  }

  // Claim join group bonus
  async claimJoinGroupBonus(userId) {
    if (!userId) return { success: false, error: 'Invalid user ID' }

    try {
      // Check if already claimed
      const alreadyClaimed = await this.checkJoinGroupClaimed(userId)
      if (alreadyClaimed) {
        return { success: false, error: 'Join group bonus already claimed' }
      }

      // Check if user has joined at least one group
      const userGroups = await this.getUserGroups(userId)
      if (userGroups.length === 0) {
        return { success: false, error: 'Join a group to claim this bonus' }
      }

      // Award 10 coins
      const result = await this.awardCoins(userId, 10, 'Join First Group Bonus')
      
      if (result.success) {
        // Mark as claimed
        const claimRef = ref(realtimeDb, `userRewards/${userId}/joinGroup`)
        await set(claimRef, {
          claimed: true,
          timestamp: serverTimestamp()
        })

        return { success: true, coins: 10 }
      }

      return result
    } catch (error) {
      console.error('Error claiming join group bonus:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's earning opportunities
  async getEarningOpportunities(userId) {
    if (!userId) return []

    try {
      const opportunities = []

      // Registration Bonus
      const registrationClaimed = await this.checkRegistrationBonusClaimed(userId)
      opportunities.push({
        id: 'registration-bonus',
        title: 'Registration Bonus',
        description: 'Welcome! Claim your one-time registration reward',
        coins: 20,
        icon: '🎁',
        claimed: registrationClaimed,
        canClaim: !registrationClaimed,
        action: 'claimRegistrationBonus'
      })

      // Profile Completion
      const profileClaimed = await this.checkProfileCompletionClaimed(userId)
      opportunities.push({
        id: 'profile-completion',
        title: 'Complete Your Profile',
        description: 'Add bio, skills, and update profile details',
        coins: 5,
        icon: '✍️',
        claimed: profileClaimed,
        canClaim: !profileClaimed,
        action: 'claimProfileCompletion'
      })

      // Join Group
      const joinGroupClaimed = await this.checkJoinGroupClaimed(userId)
      opportunities.push({
        id: 'join-group',
        title: 'Join a Group',
        description: 'Connect with community by joining a group',
        coins: 10,
        icon: '👥',
        claimed: joinGroupClaimed,
        canClaim: !joinGroupClaimed,
        action: 'claimJoinGroupBonus'
      })

      // Follow 10 Members
      const follow10Claimed = await this.checkFollowMilestoneClaimed(userId, 10)
      const followingCount = await this.getFollowingCount(userId)
      opportunities.push({
        id: 'follow-10',
        title: 'Follow 10 Members',
        description: `Build your network (${followingCount}/10)`,
        coins: 20,
        icon: '🤝',
        claimed: follow10Claimed,
        canClaim: !follow10Claimed && followingCount >= 10,
        progress: followingCount,
        required: 10,
        action: 'claimFollowMilestone'
      })

      return opportunities
    } catch (error) {
      console.error('Error getting earning opportunities:', error)
      return []
    }
  }

  // Get coin transaction history
  async getCoinTransactions(userId, limit = 20) {
    if (!userId) return []

    try {
      const transactionsRef = ref(realtimeDb, `coinTransactions/${userId}`)
      const snapshot = await get(transactionsRef)

      if (!snapshot.exists()) return []

      const transactions = []
      snapshot.forEach((child) => {
        transactions.push({
          id: child.key,
          ...child.val()
        })
      })

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

      return transactions.slice(0, limit)
    } catch (error) {
      console.error('Error getting transactions:', error)
      return []
    }
  }

  // Certificate Management
  async issueCertificate(certificateData) {
    try {
      const { userId, skillName, issuerName, sessionDetails } = certificateData
      const certificatesRef = ref(realtimeDb, `certificates/${userId}`)
      const newCertificateRef = push(certificatesRef)
      
      const certificate = {
        id: newCertificateRef.key,
        skillName,
        issuerName,
        sessionDetails,
        issuedAt: new Date().toISOString(),
        verified: true,
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      }

      await set(newCertificateRef, certificate)

      // Send notification
      await this.sendNotification(userId, {
        type: 'certificate',
        message: `issued you a certificate for ${skillName}`,
        fromUserName: issuerName,
        link: '/certificates',
        createdAt: new Date().toISOString(),
      })

      return { success: true, certificateId: newCertificateRef.key, certificate }
    } catch (error) {
      console.error('Error issuing certificate:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserCertificates(userId) {
    try {
      const certificatesRef = ref(realtimeDb, `certificates/${userId}`)
      const snapshot = await get(certificatesRef)
      
      const certificates = []
      snapshot.forEach((childSnapshot) => {
        certificates.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })

      return certificates.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    } catch (error) {
      console.error('Error getting certificates:', error)
      return []
    }
  }

  subscribeToUserCertificates(userId, callback) {
    const certificatesRef = ref(realtimeDb, `certificates/${userId}`)
    const unsubscribe = onValue(certificatesRef, (snapshot) => {
      const certificates = []
      snapshot.forEach((childSnapshot) => {
        certificates.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(certificates.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)))
    })
    
    this.listeners.set(`certificates-${userId}`, { ref: certificatesRef, unsubscribe })
    return () => this.unsubscribe(`certificates-${userId}`)
  }

  async verifyCertificate(certificateNumber) {
    try {
      // Search all users' certificates for the certificate number
      const usersRef = ref(realtimeDb, 'certificates')
      const snapshot = await get(usersRef)
      
      let foundCertificate = null
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((certSnapshot) => {
          const cert = certSnapshot.val()
          if (cert.certificateNumber === certificateNumber) {
            foundCertificate = {
              id: certSnapshot.key,
              userId: userSnapshot.key,
              ...cert,
            }
          }
        })
      })

      return foundCertificate
    } catch (error) {
      console.error('Error verifying certificate:', error)
      return null
    }
  }
}

export default new FirebaseRealtimeService()
