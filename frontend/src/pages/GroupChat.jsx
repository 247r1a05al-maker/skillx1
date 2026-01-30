import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiUsers, FiMessageSquare, FiX, FiSmile, FiSend, FiUserPlus, FiMenu } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import EmojiPicker from 'emoji-picker-react'

const GroupChat = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const messagesEndRef = useRef(null)
  const emojiPickerRef = useRef(null)

  // Load group data
  useEffect(() => {
    if (!groupId || !authUser) return

    try {
      // Get group data
      const loadGroup = async () => {
        const groups = await firebaseRealtime.getGroups()
        const currentGroup = groups.find((g) => g.id === groupId)
        setGroup(currentGroup)
        setIsLoading(false)
      }

      loadGroup()

      // Subscribe to group messages
      const unsubscribeMessages = firebaseRealtime.subscribeToGroupMessages(groupId, (msgs) => {
        setMessages(msgs)
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })

      // Subscribe to group members
      const unsubscribeMembers = firebaseRealtime.subscribeToGroupMembers(groupId, (mbrs) => {
        setMembers(mbrs)
      })

      // Get all users for invite
      const unsubscribeUsers = firebaseRealtime.subscribeToUsers((users) => {
        setAllUsers(users)
      })

      return () => {
        unsubscribeMessages()
        unsubscribeMembers()
        unsubscribeUsers()
      }
    } catch (error) {
      console.error('Error loading group:', error)
      setIsLoading(false)
    }
  }, [groupId, authUser])

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !group || !authUser) return

    try {
      const result = await firebaseRealtime.sendGroupMessage(groupId, {
        text: messageInput,
        senderId: authUser.uid || authUser.id,
        senderName: authUser.name || authUser.displayName || 'User',
        senderAvatar: authUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
      })

      if (result.success) {
        setMessageInput('')
      } else {
        alert('Error sending message: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        const result = await firebaseRealtime.deleteGroupMessage(groupId, messageId)
        if (!result.success) {
          alert('Error: ' + result.error)
        }
      } catch (error) {
        console.error('Error deleting message:', error)
        alert('Error deleting message')
      }
    }
  }

  // Invite member
  const handleInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setInviteError('Please select a user')
      return
    }

    try {
      const userId = inviteEmail // In this case it's actually userId
      const result = await firebaseRealtime.inviteToGroup(
        groupId,
        userId,
        authUser.uid || authUser.id
      )

      if (result.success) {
        setInviteEmail('')
        setInviteError('')
        setShowInviteModal(false)
        alert('Invitation sent successfully!')
      } else {
        setInviteError(result.error || 'Error sending invitation')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      setInviteError(error.message || 'Error sending invitation')
    }
  }

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji)
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
        </div>
      </div>
    )
  }

  const isMember = members.some((m) => m.userId === (authUser?.uid || authUser?.id))

  if (!isMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <FiUsers size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You are not a member of this group</p>
          <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-600">{members.length} members</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2"
          >
            <FiUserPlus size={18} /> Invite
          </Button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiMenu size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6 p-6">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <FiMessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, idx) => {
                  const isOwnMessage = msg.senderId === (authUser?.uid || authUser?.id)
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-end gap-2">
                        {!isOwnMessage && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}

                        <div>
                          {!isOwnMessage && (
                            <p className="text-xs text-gray-600 mb-1">{msg.senderName}</p>
                          )}
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {isOwnMessage && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition ml-2"
                              title="Delete message"
                            >
                              <FiX size={16} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <Card className="p-4">
            <div className="flex items-center gap-3 relative">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />

              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiSmile size={20} className="text-gray-600" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                      searchPlaceHolder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <FiSend size={20} />
              </button>
            </div>
          </Card>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="w-64 bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiUsers size={20} />
                Members ({members.length})
              </h3>
              <button onClick={() => setShowMembers(false)}>
                <FiX size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {members.map((member) => {
                const user = allUsers.find((u) => u.id === member.userId || u.uid === member.userId)
                return (
                  <div key={member.userId} className="p-2 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center gap-2">
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                      {member.role === 'admin' && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Admin</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Invite Members</h2>
                <button onClick={() => setShowInviteModal(false)}>
                  <FiX size={24} className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
                  <select
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose a user...</option>
                    {allUsers
                      .filter((u) => !members.some((m) => m.userId === (u.id || u.uid)))
                      .map((user) => (
                        <option key={user.id} value={user.id || user.uid}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>

                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {inviteError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupChat
