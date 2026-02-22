import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, set as firebaseSet, get as firebaseGet, remove } from 'firebase/database'

const saveAuthToFirebase = async (userId, token, user) => {
  try {
    const db = getDatabase()
    const authRef = ref(db, `auth/${userId}`)
    await firebaseSet(authRef, { token, user, timestamp: Date.now() })
  } catch (error) {
    console.error('Error saving auth to Firebase:', error)
  }
}

const removeAuthFromFirebase = async (userId) => {
  try {
    const db = getDatabase()
    const authRef = ref(db, `auth/${userId}`)
    await remove(authRef)
  } catch (error) {
    console.error('Error removing auth from Firebase:', error)
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    const userId = user?.uid || user?.id
    if (userId) {
      saveAuthToFirebase(userId, token, user)
    }
    // Persist to localStorage
    try {
      localStorage.setItem('authToken', token)
      localStorage.setItem('authUser', JSON.stringify(user))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
    set({ token, user, isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    const auth = getAuth()
    if (auth.currentUser) {
      removeAuthFromFirebase(auth.currentUser.uid)
    }
    // Clear localStorage
    try {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  logout: () => {
    const auth = getAuth()
    if (auth.currentUser) {
      removeAuthFromFirebase(auth.currentUser.uid)
    }
    // Clear localStorage
    try {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUserFromFirebase: async () => {
    try {
      const auth = getAuth()
      if (!auth.currentUser) return false

      const db = getDatabase()
      const authRef = ref(db, `auth/${auth.currentUser.uid}`)
      const snapshot = await firebaseGet(authRef)

      if (snapshot.exists()) {
        const { token, user } = snapshot.val()
        set({ token, user, isAuthenticated: true })
        return true
      }
      return false
    } catch (error) {
      console.error('Error loading from Firebase:', error)
      return false
    }
  },

  loadUserFromToken: () => {
    // Try localStorage first for instant auth restoration
    try {
      const token = localStorage.getItem('authToken')
      const userJson = localStorage.getItem('authUser')
      
      if (token && userJson) {
        const user = JSON.parse(userJson)
        set({ token, user, isAuthenticated: true })
        console.log('✅ Auth restored from localStorage:', user.email)
        return true
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    
    // Fallback to Firebase
    const auth = getAuth()
    if (auth.currentUser) {
      return true
    }
    return false
  },
}))

export const useUIStore = create((set) => ({
  isDarkMode: false,
  sidebarOpen: true,
  activeTab: 'dashboard',

  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  setUnreadCount: (count) =>
    set({
      unreadCount: count,
    }),
}))

export const useOnlineStore = create((set) => ({
  onlineUsers: new Set(),

  setOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers)
      newSet.add(userId)
      return { onlineUsers: newSet }
    }),

  setOfflineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers)
      newSet.delete(userId)
      return { onlineUsers: newSet }
    }),

  isUserOnline: (userId) => {
    const state = useOnlineStore.getState()
    return state.onlineUsers.has(userId)
  },
}))
