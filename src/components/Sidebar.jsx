import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiSearch,
  FiMessageSquare,
  FiUsers,
  FiCommand,
  FiAward,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiTrendingUp,
} from 'react-icons/fi'
import { useAuthStore, useUIStore } from '../store'
import { useUserOnlineStatus } from '../hooks/useFirebase'
import { motion } from 'framer-motion'
import SCoinIcon from '../components/SCoinIcon'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const isMobileOpen = sidebarOpen
  
  // Set user online status
  useUserOnlineStatus(user?.id || user?.uid)

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiSearch, label: 'Explore', path: '/explore' },
    // { icon: FiMessageSquare, label: 'Skill Exchange', path: '/exchange' }, // HIDDEN - Coming next year
    { icon: FiMessageSquare, label: 'Inbox', path: '/inbox' },
    { icon: FiUsers, label: 'Groups', path: '/groups' },
    { icon: FiCommand, label: 'Community', path: '/community' },
    { icon: SCoinIcon, label: 'Coins', path: '/coins' },
    { icon: FiAward, label: 'Certificates', path: '/certificates' },
    { icon: FiUser, label: 'Profile', path: '/profile' },
    { icon: FiSettings, label: 'Settings', path: '/settings' },
  ]

  const SidebarContent = () => (
    <div className="h-full flex flex-col theme-sidebar">
      {/* Logo */}
      <div className="p-6 theme-border border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">
              SE
            </div>
            <h1 className="text-xl font-bold theme-text-primary">SkillEx</h1>
          </div>
          {/* Online Status Indicator */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <motion.button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setSidebarOpen(false)
              }}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition theme-sidebar-item ${
                isActive
                  ? 'theme-normal:bg-indigo-100 theme-normal:text-indigo-700 theme-elite:bg-cyan-400/10 theme-elite:text-cyan-400 font-semibold'
                  : 'theme-text-secondary hover:theme-bg-secondary'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 theme-bg-primary rounded-lg shadow"
      >
        {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 theme-sidebar shadow-lg theme-border border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute top-0 left-0 h-screen w-64 theme-sidebar shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
