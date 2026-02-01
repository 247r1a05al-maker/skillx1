import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { initializeSocket, disconnectSocket } from './services/socket'
import { useUserOnlineStatus } from './hooks/useFirebase'
import { useToast } from './hooks'
import { authService } from './services/auth'
import firebaseRealtime from './services/firebase-realtime'
import Layout from './components/Layout'
import ThemeToggle from './components/ThemeToggle'
import CursorLight from './components/CursorLight'
import CommandPalette from './components/CommandPalette'
import { ToastContainer } from './components/Toast'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'
import SkillExchange from './pages/SkillExchange'
import Inbox from './pages/Inbox'
import Groups from './pages/Groups'
import GroupChat from './pages/GroupChat'
import GroupInvitations from './pages/GroupInvitations'
import Community from './pages/Community'
import Coins from './pages/Coins'
import Certificates from './pages/Certificates'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import FollowRequests from './pages/FollowRequests'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Auth Route Component (redirect to dashboard if already logged in)
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// Firebase Connection Manager
const FirebaseConnectionManager = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  // Initialize Firebase real-time when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.token) {
      console.log('🔥 Initializing Firebase for user:', user.id)
      initializeSocket(user.token, user.id)
      
      return () => {
        console.log('🔥 Disconnecting Firebase')
        disconnectSocket()
      }
    }
  }, [isAuthenticated, user?.id, user?.token])
  
  // Manage user online/offline status
  useUserOnlineStatus(isAuthenticated ? user?.id : null)
  
  return null
}

// Auth State Manager - Check if user is already logged in
const AuthStateManager = () => {
  const { loadUserFromToken } = useAuthStore()
  
  useEffect(() => {
    // Load from localStorage on app start
    loadUserFromToken()
  }, [loadUserFromToken])
  
  return null
}

// User Data Sync - Keep user data synced with Firebase in real-time
const UserDataSync = () => {
  const { user, setUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || (!user?.uid && !user?.id)) return

    const userId = user.uid || user.id

    // Subscribe to ONLY current user's data (not all users)
    const unsubscribe = firebaseRealtime.subscribeToCurrentUser(userId, (currentUser) => {
      if (currentUser) {
        // Update user in store with latest data from Firebase
        setUser({
          ...user,
          coins: currentUser.coins || 0,
          name: currentUser.name || user.name,
          avatar: currentUser.avatar || user.avatar,
          bio: currentUser.bio || user.bio,
        })
        
        // Also update localStorage
        const updatedUser = {
          ...user,
          coins: currentUser.coins || 0,
          name: currentUser.name || user.name,
          avatar: currentUser.avatar || user.avatar,
          bio: currentUser.bio || user.bio,
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    })

    return () => unsubscribe?.()
  }, [isAuthenticated, user?.id, user?.uid])

  return null
}

// Keyboard Listener Component (inside ThemeProvider)
const KeyboardListener = ({ onOpenPalette }) => {
  const { isElite } = useTheme()

  useEffect(() => {
    if (!isElite) return

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        onOpenPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isElite, onOpenPalette])

  return null
}

function App() {
  const { isAuthenticated } = useAuthStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { toasts, removeToast } = useToast()

  return (
    <ThemeProvider>
      <AuthStateManager />
      <UserDataSync />
      <FirebaseConnectionManager />
      <KeyboardListener onOpenPalette={() => setCommandPaletteOpen(true)} />
      <CursorLight />
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Router basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Auth Routes - redirect to dashboard if already logged in */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchange"
            element={
              <ProtectedRoute>
                <SkillExchange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coins"
            element={
              <ProtectedRoute>
                <Coins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <Certificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow-requests"
            element={
              <ProtectedRoute>
                <FollowRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-chat/:groupId"
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-invitations"
            element={
              <ProtectedRoute>
                <GroupInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Layout>
      <ThemeToggle />
    </Router>
    </ThemeProvider>
  )
}

export default App
