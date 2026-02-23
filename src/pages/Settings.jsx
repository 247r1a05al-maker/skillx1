import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiEdit2, FiLock, FiBell, FiEye, FiTrash2, FiSun, FiMoon, FiAward } from 'react-icons/fi'
import { Card, Button, Input, Modal } from '../components/UI'
import { useTheme } from '../context/ThemeContext'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'

const Settings = () => {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { user: authUser } = useAuthStore()
  const [settings, setSettings] = useState({
    email: 'john@example.com',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsMessages: true,
    profilePublic: true,
    showOwnerBadge: false,
    hideFromLeaderboard: false,
  })
  const [hasOwnerBadge, setHasOwnerBadge] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Check if user is owner on mount
  useEffect(() => {
    if (authUser?.id) {
      const ownerIds = ['karthikgajabheemkar@gmail.com', '247r1a05al@cmrtc.ac.in', 'karthik'] // Owner IDs
      const isOwner = ownerIds.includes(authUser.id) || 
                      ownerIds.includes(authUser.email) || 
                      ownerIds.includes(authUser.username)
      setHasOwnerBadge(isOwner)
      
      // Load user's preferences
      firebaseRealtime.getUserData(authUser.id).then((data) => {
        if (data) {
          if (isOwner && data.showOwnerBadge !== undefined) {
            setSettings(prev => ({ ...prev, showOwnerBadge: data.showOwnerBadge }))
          }
          if (data.hideFromLeaderboard !== undefined) {
            setSettings(prev => ({ ...prev, hideFromLeaderboard: data.hideFromLeaderboard }))
          }
        }
      })
    }
  }, [authUser])

  const handleSettingChange = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    
    // Auto-save privacy setting to Firebase
    if (key === 'hideFromLeaderboard' && authUser?.id) {
      firebaseRealtime.updateUserData(authUser.id, {
        hideFromLeaderboard: !settings.hideFromLeaderboard,
      }).then(() => {
        console.log('✅ Privacy setting saved')
      }).catch(error => {
        console.error('❌ Failed to save privacy setting:', error)
      })
    }
  }

  const handleSaveOwnerBadge = async () => {
    if (hasOwnerBadge && authUser?.id) {
      try {
        await firebaseRealtime.updateUserData(authUser.id, {
          showOwnerBadge: settings.showOwnerBadge,
          hasOwnerBadge: true,
        })
        alert('Owner badge preference saved!')
      } catch (error) {
        alert('Failed to save preference')
      }
    }
  }

  const handleDeleteAccount = () => {
    alert('Account deletion process started')
    setShowDeleteModal(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account and preferences</p>
      </motion.div>

      {/* Account Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiEdit2 size={20} /> Account Settings
          </h2>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="flex gap-3">
                <Input value={settings.email} readOnly className="flex-1" />
                <Button variant="secondary" size="md">
                  Update
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiBell size={20} /> Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-semibold text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEmail}
                onChange={() => handleSettingChange('notificationsEmail')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-semibold text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Get real-time alerts on your device</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsPush}
                onChange={() => handleSettingChange('notificationsPush')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-semibold text-gray-900">Message Notifications</p>
                <p className="text-sm text-gray-600">Get notified about new messages</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsMessages}
                onChange={() => handleSettingChange('notificationsMessages')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiEye size={20} /> Privacy & Display
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-semibold text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-600">Allow others to view your profile</p>
              </div>
              <input
                type="checkbox"
                checked={settings.profilePublic}
                onChange={() => handleSettingChange('profilePublic')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-semibold text-gray-900">Hide from Leaderboard</p>
                <p className="text-sm text-gray-600">Don't show my name or streak on the leaderboard</p>
              </div>
              <input
                type="checkbox"
                checked={settings.hideFromLeaderboard}
                onChange={() => handleSettingChange('hideFromLeaderboard')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
              <div className="flex items-center gap-3">
                {isDarkMode ? <FiMoon className="text-indigo-600" size={20} /> : <FiSun className="text-yellow-500" size={20} />}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use dark theme throughout the app</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Owner Badge Section - Only visible to owners */}
      {hasOwnerBadge && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-yellow-200 bg-yellow-50">
            <h2 className="text-xl font-bold text-yellow-900 mb-6 flex items-center gap-2">
              <FiAward size={20} /> 👑 Owner Badge
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold mb-2">Premium Owner Status</p>
                <p className="text-sm text-yellow-700">You have owner privileges. Control how your owner badge appears on your profile.</p>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-yellow-100 rounded-lg transition">
                <div>
                  <p className="font-semibold text-gray-900">Show Owner Badge</p>
                  <p className="text-sm text-gray-600">Display 👑 crown symbol on your profile and in Explore</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showOwnerBadge}
                  onChange={() => handleSettingChange('showOwnerBadge')}
                  className="w-5 h-5 accent-yellow-600 rounded"
                />
              </div>

              <Button 
                variant="primary" 
                onClick={handleSaveOwnerBadge}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Save Badge Preference
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-red-200 bg-red-50">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <FiTrash2 size={20} /> Danger Zone
          </h2>

          <div className="space-y-3">
            <p className="text-sm text-red-800">These actions cannot be undone. Please be careful.</p>
            <Button variant="secondary" onClick={() => setShowDeleteModal(true)} className="w-full">
              Delete Account
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex gap-3">
          <Button variant="primary" size="lg" className="flex-1">
            Save Changes
          </Button>
          <Button variant="secondary" size="lg" className="flex-1">
            Cancel
          </Button>
        </div>
      </motion.div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Settings
