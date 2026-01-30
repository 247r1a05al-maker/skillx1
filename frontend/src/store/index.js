import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUserFromToken: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      try {
        const userData = JSON.parse(user)
        set({ token, user: userData, isAuthenticated: true })
        return true
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return false
      }
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
