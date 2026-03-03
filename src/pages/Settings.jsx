import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiEdit2, FiLock, FiBell, FiEye, FiTrash2, FiSun, FiMoon, FiAward } from 'react-icons/fi'
import { Card, Button, Input, Modal } from '../components/UI'
import { useTheme } from '../context/ThemeContext'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'

const Settings = () => {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { user: authUser, logout } = useAuthStore()
  const [settings, setSettings] = useState({
    email: 'john@example.com',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsMessages: true,
    profilePublic: true,
    showOwnerBadge: false,
    hideEmail: false,
  })
  const [teacherProfile, setTeacherProfile] = useState({
    bio: '',
    experience: '',
    expertise: '',
    youtube: '',
    instagram: '',
    linkedin: '',
    github: '',
    demoVideo1: '',
    demoVideo2: '',
    identityProofUrl: '',
    verificationStatus: 'unverified',
    profileStrength: 0,
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
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
          if (data.hideEmail !== undefined) {
            setSettings(prev => ({ ...prev, hideEmail: data.hideEmail }))
          }
          if (data.profilePublic !== undefined) {
            setSettings(prev => ({ ...prev, profilePublic: data.profilePublic }))
          }
        }
      })

      // Load teacher profile data
      firebaseRealtime.getTeacherProfile(authUser.id).then((profileData) => {
        const profile = profileData?.profile || {}
        const links = profileData?.links || {}
        const media = profileData?.media || {}
        const demoVideos = Array.isArray(media.demoVideos) ? media.demoVideos : []

        setTeacherProfile(prev => ({
          ...prev,
          bio: profile.bio || '',
          experience: profile.experience || '',
          expertise: profile.expertise || '',
          identityProofUrl: profile.identityProofUrl || '',
          verificationStatus: profile.verificationStatus || 'unverified',
          profileStrength: profile.profileStrength || 0,
          youtube: links.youtube?.url || '',
          instagram: links.instagram?.url || '',
          linkedin: links.linkedin?.url || '',
          github: links.github?.url || '',
          demoVideo1: demoVideos[0] || '',
          demoVideo2: demoVideos[1] || '',
        }))
      })
    }
  }, [authUser])

  const handleSettingChange = (key) => {
    const newValue = !settings[key]
    setSettings((prev) => ({ ...prev, [key]: newValue }))
    
    // Auto-save all privacy settings to Firebase
    if (authUser?.id) {
      const updates = {}
      if (key === 'profilePublic') {
        updates.profilePublic = newValue
      } else if (key === 'hideEmail') {
        updates.hideEmail = newValue
      } else if (key === 'showOwnerBadge') {
        updates.showOwnerBadge = newValue
      }
      
      console.log('💾 Saving to Firebase:', { key, newValue, updates })
      firebaseRealtime.updateUserData(authUser.id, updates).then(() => {
        console.log('✅ Setting saved:', key, '=', newValue)
      }).catch(error => {
        console.error('❌ Failed to save setting:', error)
        // Revert on error
        setSettings((prev) => ({ ...prev,  [key]: !newValue }))
      })
    }
  }

  const isValidUrl = (value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const isAllowedDomain = (value, allowedDomains) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return allowedDomains.some((domain) => url.hostname.includes(domain))
    } catch {
      return false
    }
  }

  const calculateProfileStrength = (profile) => {
    let score = 0
    if (profile.bio?.trim()) score += 20
    if (profile.experience?.trim()) score += 15
    if (profile.expertise?.trim()) score += 15
    if (profile.youtube?.trim()) score += 10
    if (profile.instagram?.trim()) score += 10
    if (profile.linkedin?.trim()) score += 10
    if (profile.github?.trim()) score += 10
    if (profile.demoVideo1?.trim() || profile.demoVideo2?.trim()) score += 10
    return Math.min(100, score)
  }

  const handleSaveTeacherProfile = async () => {
    if (!authUser?.id) return

    const checks = [
      { label: 'YouTube', value: teacherProfile.youtube, domains: ['youtube.com', 'youtu.be'] },
      { label: 'Instagram', value: teacherProfile.instagram, domains: ['instagram.com'] },
      { label: 'LinkedIn', value: teacherProfile.linkedin, domains: ['linkedin.com'] },
      { label: 'GitHub', value: teacherProfile.github, domains: ['github.com'] },
      { label: 'Demo Video 1', value: teacherProfile.demoVideo1, domains: ['youtube.com', 'youtu.be', 'vimeo.com'] },
      { label: 'Demo Video 2', value: teacherProfile.demoVideo2, domains: ['youtube.com', 'youtu.be', 'vimeo.com'] },
      { label: 'Identity Proof', value: teacherProfile.identityProofUrl, domains: [] },
    ]

    for (const check of checks) {
      if (check.value && !isValidUrl(check.value)) {
        alert(`${check.label} link is not a valid URL`) 
        return
      }
      if (check.value && check.domains.length > 0 && !isAllowedDomain(check.value, check.domains)) {
        alert(`${check.label} link must be from an approved domain`) 
        return
      }
    }

    setIsSavingProfile(true)
    try {
      const strength = calculateProfileStrength(teacherProfile)
      const verificationStatus = teacherProfile.verificationStatus === 'verified'
        ? 'verified'
        : (teacherProfile.identityProofUrl ? 'pending' : 'unverified')

      const links = {}
      if (teacherProfile.youtube) links.youtube = { type: 'youtube', url: teacherProfile.youtube }
      if (teacherProfile.instagram) links.instagram = { type: 'instagram', url: teacherProfile.instagram }
      if (teacherProfile.linkedin) links.linkedin = { type: 'linkedin', url: teacherProfile.linkedin }
      if (teacherProfile.github) links.github = { type: 'github', url: teacherProfile.github }

      const demoVideos = [teacherProfile.demoVideo1, teacherProfile.demoVideo2].filter(Boolean)
      const media = { demoVideos }

      await firebaseRealtime.updateUserData(authUser.id, {
        bio: teacherProfile.bio,
        experience: teacherProfile.experience,
        expertise: teacherProfile.expertise,
        identityProofUrl: teacherProfile.identityProofUrl,
        verificationStatus,
        profileStrength: strength,
      })
      await firebaseRealtime.setTeacherLinks(authUser.id, links)
      await firebaseRealtime.setTeacherMedia(authUser.id, media)

      setTeacherProfile((prev) => ({
        ...prev,
        verificationStatus,
        profileStrength: strength,
      }))

      alert('Teacher profile saved successfully!')
    } catch (error) {
      alert('Failed to save teacher profile')
    } finally {
      setIsSavingProfile(false)
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

  const handleDeleteAccount = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete your account? This action CANNOT be undone.')) {
      if (window.confirm('Please confirm again. Deleting your account will:  \n- Remove all your data\n- Cancel all pending activities\n- Delete your profile')) {
        try {
          // Call Firebase service to delete account
          const result = await firebaseRealtime.deleteUserAccount(authUser.id)
          if (result.success) {
            alert('✅ Your account has been deleted successfully')
            // Logout after deletion
            logout()
            // Redirect to home
            window.location.href = '/'
          } else {
            alert('❌ Failed to delete account: ' + (result.error || 'Unknown error'))
          }
        } catch (error) {
          alert('❌ Error deleting account: ' + error.message)
        }
      }
    }
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
                <p className="font-semibold text-gray-900">Hide Email in Profile</p>
                <p className="text-sm text-gray-600">Don't show your email when others view your profile</p>
              </div>
              <input
                type="checkbox"
                checked={settings.hideEmail}
                onChange={() => handleSettingChange('hideEmail')}
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
