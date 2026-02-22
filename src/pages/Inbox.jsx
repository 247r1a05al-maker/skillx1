import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiSmile, FiPaperclip, FiSend, FiArrowLeft, FiX, FiImage, FiFile, FiTrash2 } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useUserPresence } from '../hooks/useFirebase'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import EmojiPicker from 'emoji-picker-react'
import Avatar from '../components/Avatar'

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
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarModalUrl, setAvatarModalUrl] = useState('')
  const messagesEndRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const attachMenuRef = useRef(null)

  const selectedUserId = selectedConversation?.participantId || selectedConversation?.id
  const { isOnline: isSelectedOnline } = useUserPresence(selectedUserId)

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
      // Deduplicate conversations by ID
      const uniqueConvs = Array.from(new Map(convs.map(c => [c.id, c])).values())
      setConversations(uniqueConvs)
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
        senderAvatar: authUser.avatar || '',
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
    <div className="w-full h-[calc(100vh-80px)] flex gap-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      {/* Conversations List */}
      <Card className="w-full lg:w-96 hidden lg:flex flex-col p-0 overflow-hidden shadow-2xl bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl">
        {/* Search */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 sticky top-0 z-10 rounded-t-2xl">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-3 text-white/80 group-focus-within:text-white transition" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-12 py-2.5 bg-white/95 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/60 transition font-medium placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-white/60 hover:text-white transition"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <motion.p className="text-xs text-white/90 mt-3 font-medium">
              Found <span className="font-bold text-white bg-white/20 px-2 py-1 rounded-lg inline-block ml-1">{filteredConversations.length}</span> result{filteredConversations.length !== 1 ? 's' : ''}
            </motion.p>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent hover:scrollbar-thumb-indigo-500">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-lg text-white' 
                    : 'hover:bg-white/80 backdrop-blur-sm border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(conv)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAvatarModalUrl(conv.avatar)
                          setShowAvatarModal(true)
                        }}
                        className="relative bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition"
                        title="View profile photo"
                      >
                        <Avatar src={conv.avatar} name={conv.name} size="md" />
                        {conv.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-bold text-sm ${selectedConversation?.id === conv.id ? 'text-white' : 'text-gray-900'}`}>{conv.name}</p>
                          {conv.unread > 0 && (
                            <motion.span 
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                            >
                              {conv.unread}
                            </motion.span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 line-clamp-1 ${selectedConversation?.id === conv.id ? 'text-white/80' : 'text-gray-600'}`}>{conv.lastMessage}</p>
                        <p className={`text-xs mt-0.5 ${selectedConversation?.id === conv.id ? 'text-white/60' : 'text-gray-500'}`}>{conv.timestamp}</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete Button - Shows on hover */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conv.id)
                    }}
                    className={`p-2 opacity-0 group-hover:opacity-100 rounded-lg transition ${selectedConversation?.id === conv.id ? 'hover:bg-white/20' : 'hover:bg-red-100'}`}
                    title="Delete conversation"
                  >
                    <FiTrash2 size={16} className={selectedConversation?.id === conv.id ? 'text-white/80' : 'text-red-500'} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiSearch size={40} className="text-gray-400/60 mb-3" />
              </motion.div>
              {searchQuery ? (
                <>
                  <p className="font-bold text-sm text-gray-700">No conversations found</p>
                  <p className="text-xs mt-2 text-gray-500">Try searching with a different name or message</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg text-gray-700 mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs">Start connecting with other members to exchange skills and knowledge</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/#/explore'}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <FiSearch size={18} />
                    <span>Explore People</span>
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      {selectedConversation ? (
        <Card className="flex-1 p-0 overflow-hidden flex flex-col h-full shadow-2xl bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl">
          {/* Chat Header */}
          <motion.div layoutId="chatHeader" className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 sticky top-0 text-white shadow-lg rounded-t-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft size={20} />
              </button>
              <button
                onClick={() => {
                  setAvatarModalUrl(selectedConversation.avatar)
                  setShowAvatarModal(true)
                }}
                className="relative bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition"
                title="View profile photo"
              >
                <Avatar src={selectedConversation.avatar} name={selectedConversation.name} size="sm" />
                {isSelectedOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </button>
              <div>
                <p className="font-bold text-lg text-white">{selectedConversation.name}</p>
                <motion.p 
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`text-xs ${isSelectedOnline ? 'text-green-200 font-semibold' : 'text-white/60'}`}
                >
                  {isSelectedOnline ? '● Online' : 'Offline'}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
                />
              </div>
            ) : messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <motion.p className="text-gray-400 text-sm">Start a new conversation!</motion.p>
                </div>
              </motion.div>
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
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`max-w-xs px-4 py-2.5 rounded-2xl shadow-md backdrop-blur-sm ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-none'
                              : 'bg-white/90 text-gray-900 border border-white/30 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                          <p className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-100/80' : 'text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </motion.div>
                        
                        {/* Delete button - only for own messages */}
                        {isOwnMessage && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              if (window.confirm('Delete this message?')) {
                                const userId = authUser.uid || authUser.id
                                const conversationId = [userId, selectedConversation.id].sort().join('_')
                                await firebaseRealtime.deleteMessage(conversationId, msg.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition"
                            title="Delete message"
                          >
                            <FiX size={16} className="text-red-500" />
                          </motion.button>
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
          <div className="p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-t border-white/20 sticky bottom-0 rounded-b-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 relative">
              {/* Attach Button with Menu */}
              <div className="relative" ref={attachMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2.5 hover:bg-indigo-200/50 rounded-xl transition backdrop-blur-sm"
                  title="Attach files"
                >
                  <FiPaperclip size={20} className="text-indigo-600" />
                </motion.button>

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
                className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400 font-medium"
              />

              {/* Emoji Button with Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 hover:bg-indigo-200/50 rounded-xl transition backdrop-blur-sm"
                  title="Add emoji"
                >
                  <FiSmile size={20} className="text-indigo-600" />
                </motion.button>

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

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <FiSend size={20} />
              </motion.button>
            </div>
          </div>
        </Card>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 hidden lg:flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-12 overflow-y-auto"
        >
          <div className="text-center max-w-2xl w-full">
            {/* Animated Icons */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <FiSmile size={32} className="text-white" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <FiSend size={40} className="text-white" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <FiImage size={32} className="text-white" />
              </motion.div>
            </div>

            {/* Title and Description */}
            <h2 className="text-4xl font-black text-white mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text">
              Welcome to Your Inbox
            </h2>
            <p className="text-xl text-blue-200 mb-8 font-medium">
              Connect, collaborate, and exchange skills with the community
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition cursor-default"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <FiSmile size={24} className="text-white" />
                </div>
                <h4 className="text-white font-bold mb-1 text-sm">Real-time Chat</h4>
                <p className="text-white/60 text-xs">Instant messaging with typing indicators</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition cursor-default"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <FiPaperclip size={24} className="text-white" />
                </div>
                <h4 className="text-white font-bold mb-1 text-sm">Rich Media</h4>
                <p className="text-white/60 text-xs">Share images, files, and emojis</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition cursor-default"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <FiSmile size={24} className="text-white" />
                </div>
                <h4 className="text-white font-bold mb-1 text-sm">Smart Emojis</h4>
                <p className="text-white/60 text-xs">Express yourself with emoji picker</p>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/#/explore'}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-2xl transition flex items-center justify-center gap-3 group"
              >
                <FiSearch size={20} />
                <span>Explore People</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/#/groups'}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/30 transition flex items-center justify-center gap-3"
              >
                <FiSmile size={20} />
                <span>Browse Groups</span>
              </motion.button>
            </div>

            {/* Tip */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mt-10 text-white/50 text-sm"
            >
              💡 Select a conversation from the sidebar or start a new one from the Explore page
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Avatar Preview Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAvatarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAvatarModal(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100 z-10"
                title="Close"
              >
                <FiX size={18} className="text-gray-700" />
              </button>
              <img
                src={avatarModalUrl}
                alt="Profile"
                className="w-64 h-64 rounded-full shadow-2xl object-cover border-4 border-white"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default Inbox
