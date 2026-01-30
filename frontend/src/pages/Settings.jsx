import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiEdit2, FiLock, FiBell, FiEye, FiTrash2, FiSun } from 'react-icons/fi'
import { Card, Button, Input, Modal } from '../components/UI'

const Settings = () => {
  const [settings, setSettings] = useState({
    email: 'john@example.com',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsMessages: true,
    profilePublic: true,
    darkMode: false,
  })

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleSettingChange = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
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
                <p className="font-semibold text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-600">Use dark theme throughout the app</p>
              </div>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleSettingChange('darkMode')}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>
          </div>
        </Card>
      </motion.div>

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
