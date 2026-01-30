import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiSmile, FiPaperclip, FiSend, FiArrowLeft, FiX, FiImage, FiFile, FiTrash2 } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import EmojiPicker from 'emoji-picker-react'

const Inbox = () => {
  const { user: authUser } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [typingStatus, setTypingStatus] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const attachMenuRef = useRef(null)

  // Handle user query parameter to create/open conversation
  useEffect(() => {
    const targetUserId = searchParams.get('user')
    if (targetUserId && authUser) {
      const userId = authUser.uid || authUser.id
      // Create or get conversation with target user
      firebaseRealtime.createOrGetConversation(userId, targetUserId).then((conversationId) => {
        if (conversationId) {
          // Create a conversation object
          const conv = {
            id: targetUserId,
            participantId: targetUserId,
            conversationId,
          }
          setSelectedConversation(conv)
        }
      })
    }
  }, [searchParams, authUser])

  // Load conversations on mount
  useEffect(() => {
    if (!authUser?.uid && !authUser?.id) return

    const userId = authUser.uid || authUser.id
    
    // Subscribe to conversations
    const unsubscribe = firebaseRealtime.subscribeToConversations(userId, (convs) => {
      setConversations(convs)
    })

    return () => unsubscribe?.()
  }, [authUser])

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !authUser) return

    setIsLoadingMessages(true)
    const userId = authUser.uid || authUser.id
    const conversationId = [userId, selectedConversation.id].sort().join('_')

    // Subscribe to messages
    const unsubscribe = firebaseRealtime.subscribeToMessages(
      conversationId,
      (msgs) => {
        setMessages(msgs)
        setIsLoadingMessages(false)
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    )

    return () => unsubscribe?.()
  }, [selectedConversation, authUser])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !authUser) return

    const userId = authUser.uid || authUser.id
    const conversationId = [userId, selectedConversation.id].sort().join('_')

    try {
      // Send message
      await firebaseRealtime.sendMessage(conversationId, {
        senderId: userId,
        senderName: authUser.name || authUser.displayName || 'User',
        senderAvatar: authUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        text: messageInput,
        timestamp: new Date().toISOString(),
      })

      setMessageInput('')

      // Simulate typing status
      setTypingStatus(true)
      setTimeout(() => setTypingStatus(false), 1500)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) return true
    
    // Search by name (case-insensitive)
    if (conv.name?.toLowerCase().includes(searchLower)) return true
    
    // Search by last message content
    if (conv.lastMessage?.toLowerCase().includes(searchLower)) return true
    
    return false
  })

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji)
  }

  // Close emoji picker and attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle file attachment
  const handleFileAttach = () => {
    alert('File attachment feature - coming soon!')
    setShowAttachMenu(false)
  }

  // Handle image attachment
  const handleImageAttach = () => {
    alert('Image attachment feature - coming soon!')
    setShowAttachMenu(false)
  }

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation and all messages? This action cannot be undone.')) {
      if (!authUser) return
      
      const userId = authUser.uid || authUser.id
      try {
        await firebaseRealtime.deleteConversation(userId, conversationId)
        
        // Clear selected conversation if it's the one being deleted
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
        }
        
        console.log('Conversation deleted successfully')
      } catch (error) {
        console.error('Error deleting conversation:', error)
        alert('Error deleting conversation')
      }
    }
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] flex gap-6 bg-gray-50">
      {/* Conversations List */}
      <Card className="w-full lg:w-96 hidden lg:flex flex-col p-0 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations by name or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2">
              Found <span className="font-semibold text-indigo-600">{filteredConversations.length}</span> conversation{filteredConversations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ backgroundColor: '#f9fafb' }}
                className={`p-4 border-b border-gray-100 text-left transition group ${
                  selectedConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(conv)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
                        {conv.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{conv.name}</p>
                          {conv.unread > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-500">{conv.timestamp}</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete Button - Shows on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conv.id)
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"
                    title="Delete conversation"
                  >
                    <FiTrash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
              <FiSearch size={32} className="text-gray-300 mb-3" />
              {searchQuery ? (
                <>
                  <p className="font-semibold">No conversations found</p>
                  <p className="text-xs mt-1">Try searching with a different name or message content</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">No conversations yet</p>
                  <p className="text-xs mt-1">Start a conversation from Explore page</p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      {selectedConversation ? (
        <Card className="flex-1 p-0 overflow-hidden flex flex-col h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft size={20} />
              </button>
              <img
                src={selectedConversation.avatar}
                alt={selectedConversation.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{selectedConversation.name}</p>
                <p className={`text-xs ${selectedConversation.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedConversation.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
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
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {/* Delete button - only for own messages */}
                        {isOwnMessage && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this message?')) {
                                const userId = authUser.uid || authUser.id
                                const conversationId = [userId, selectedConversation.id].sort().join('_')
                                await firebaseRealtime.deleteMessage(conversationId, msg.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition"
                            title="Delete message"
                          >
                            <FiX size={16} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}

            {/* Typing Indicator */}
            {typingStatus && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
            <div className="flex items-center gap-3 relative">
              {/* Attach Button with Menu */}
              <div className="relative" ref={attachMenuRef}>
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiPaperclip size={20} className="text-gray-600" />
                </button>

                {/* Attach Menu */}
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <button
                      onClick={handleImageAttach}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition w-full text-left"
                    >
                      <FiImage size={18} className="text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Send Image</span>
                    </button>
                    <button
                      onClick={handleFileAttach}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition w-full text-left border-t border-gray-100"
                    >
                      <FiFile size={18} className="text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Send File</span>
                    </button>
                  </motion.div>
                )}
              </div>

              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />

              {/* Emoji Button with Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiSmile size={20} className="text-gray-600" />
                </button>

                {/* Emoji Picker */}
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
          </div>
        </Card>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSmile size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Select a conversation</h3>
            <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inbox
