import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiSmile, FiPaperclip, FiSend, FiArrowLeft, FiX, FiImage, FiFile, FiTrash2, FiVideo, FiDownload } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useUserPresence } from '../hooks/useFirebase'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import EmojiPicker from 'emoji-picker-react'
import Avatar from '../components/Avatar'

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'LIVDSRZULELA'
const LOCAL_GIF_PACK = [
  { id: 'hi', url: 'https://media.tenor.com/6ZUS2Z5lD0AAAAAC/hello-hi.gif' },
  { id: 'thumbs-up', url: 'https://media.tenor.com/8M53mHk8fE8AAAAC/thumbs-up.gif' },
  { id: 'laugh', url: 'https://media.tenor.com/LxggFGxwOjIAAAAC/laughing-funny.gif' },
  { id: 'wow', url: 'https://media.tenor.com/9J8nM8N0MuoAAAAC/wow-amazed.gif' },
  { id: 'party', url: 'https://media.tenor.com/Do8nZ6f4QfQAAAAC/party-celebrate.gif' },
  { id: 'clap', url: 'https://media.tenor.com/2roX3uxz_68AAAAC/clapping.gif' },
  { id: 'ok', url: 'https://media.tenor.com/bm8Q6yAlsPsAAAAC/ok-finger.gif' },
  { id: 'heart', url: 'https://media.tenor.com/8Q6F2f6t9vYAAAAC/heart-love.gif' },
]

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
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifQuery, setGifQuery] = useState('')
  const [gifResults, setGifResults] = useState(LOCAL_GIF_PACK)
  const [isGifLoading, setIsGifLoading] = useState(false)
  const [previewMedia, setPreviewMedia] = useState(null)
  const messagesEndRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const attachMenuRef = useRef(null)

  const selectedUserId = selectedConversation?.participantId || selectedConversation?.id
  const { isOnline: isSelectedOnline } = useUserPresence(selectedUserId)

  const isPreviewableAvatar = (value) => {
    if (!value || typeof value !== 'string') return false
    const lower = value.toLowerCase()
    // Block SVG/default generator avatars from opening in modal
    return !lower.includes('dicebear') && !lower.includes('.svg') && !lower.includes('image/svg')
  }

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

  const normalizeTimestamp = (value) => {
    if (!value) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsedDate = new Date(value).getTime()
      if (!Number.isNaN(parsedDate)) return parsedDate
      const parsedNumber = Number(value)
      return Number.isFinite(parsedNumber) ? parsedNumber : null
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      return value.seconds * 1000
    }
    return null
  }

  const formatMessageTime = (timestamp) => {
    const normalized = normalizeTimestamp(timestamp)
    if (!normalized) return 'Now'
    return new Date(normalized).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const sendAttachmentMessage = async (payload) => {
    if (!selectedConversation || !authUser) return
    const userId = authUser.uid || authUser.id
    const conversationId = [userId, selectedConversation.id].sort().join('_')
    await firebaseRealtime.sendMessage(conversationId, {
      ...payload,
      senderId: userId,
      senderName: authUser.name || authUser.displayName || 'User',
      senderAvatar: authUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      timestamp: new Date().toISOString(),
    })
  }

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

  // Hidden file input refs
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  // Handle image attachment
  const handleImageAttach = () => {
    imageInputRef.current?.click()
    setShowAttachMenu(false)
  }

  // Handle video attachment
  const handleVideoAttach = () => {
    videoInputRef.current?.click()
    setShowAttachMenu(false)
  }

  // Handle file attachment
  const handleFileAttach = () => {
    fileInputRef.current?.click()
    setShowAttachMenu(false)
  }

  // Handle selected image/gif file
  const handleImageFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Max 2MB.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      const isGif = file.type === 'image/gif'
      await sendAttachmentMessage({
        text: '',
        image: isGif ? undefined : dataUrl,
        gif: isGif ? dataUrl : undefined,
        fileType: file.type,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle selected video file
  const handleVideoFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('Video too large. Max 10MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      await sendAttachmentMessage({
        text: '',
        video: dataUrl,
        fileType: file.type,
        fileName: file.name,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle file selected for generic file
  const handleGenericFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      await sendAttachmentMessage({
        text: `📎 ${file.name}`,
        file: dataUrl,
        fileName: file.name,
        fileType: file.type,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGifAttach = () => {
    setShowGifPicker((prev) => !prev)
    setShowAttachMenu(false)
  }

  const searchGifs = async (query) => {
    const clean = query.trim()
    setIsGifLoading(true)
    try {
      const endpoint = clean
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(clean)}&key=${TENOR_API_KEY}&client_key=skill_exchange_platform&limit=24&media_filter=tinygif,gif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=skill_exchange_platform&limit=24&media_filter=tinygif,gif`

      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Failed to fetch GIFs')
      const data = await response.json()
      const results = (data.results || [])
        .map((item) => ({
          id: item.id,
          url: item.media_formats?.tinygif?.url || item.media_formats?.gif?.url,
        }))
        .filter((item) => !!item.url)

      setGifResults(results.length > 0 ? results : LOCAL_GIF_PACK)
    } catch (error) {
      console.error('GIF search failed, using local pack:', error)
      setGifResults(LOCAL_GIF_PACK)
    } finally {
      setIsGifLoading(false)
    }
  }

  useEffect(() => {
    if (showGifPicker) {
      searchGifs(gifQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGifPicker])

  const handleSendGif = async (gifUrl) => {
    await sendAttachmentMessage({
      text: '',
      gif: gifUrl,
      fileType: 'image/gif',
    })
    setShowGifPicker(false)
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
    <div className="w-full h-[calc(100vh-80px)] min-h-0 flex gap-0 bg-gray-50 overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileSelected} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileSelected} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleGenericFileSelected} />

      {/* Conversations List */}
      <Card className="w-full lg:w-80 hidden lg:flex flex-col p-0 overflow-hidden shadow-none bg-white border-r border-gray-200 rounded-none">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-gray-600 transition" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 transition font-medium placeholder:text-gray-400 text-gray-900"
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
            <motion.p className="text-xs text-white/90 mt-3 font-medium">
              Found <span className="font-bold text-white bg-white/20 px-2 py-1 rounded-lg inline-block ml-1">{filteredConversations.length}</span> result{filteredConversations.length !== 1 ? 's' : ''}
            </motion.p>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-lg transition-all duration-300 cursor-pointer group border ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                    : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
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
                          if (!isPreviewableAvatar(conv.avatar)) return
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
                          <p className={`font-semibold text-sm ${selectedConversation?.id === conv.id ? 'text-indigo-900' : 'text-gray-900'}`}>{conv.name}</p>
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
                        <p className={`text-xs mt-1 line-clamp-1 ${selectedConversation?.id === conv.id ? 'text-indigo-600' : 'text-gray-600'}`}>{conv.lastMessage}</p>
                        <p className={`text-xs mt-0.5 ${selectedConversation?.id === conv.id ? 'text-indigo-500' : 'text-gray-500'}`}>{conv.timestamp}</p>
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
                    className={`p-2 opacity-0 group-hover:opacity-100 rounded-lg transition hover:bg-red-50`}
                    title="Delete conversation"
                  >
                    <FiTrash2 size={16} className="text-red-500" />
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
        <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col h-full shadow-none bg-white border-l-0 border border-gray-200 rounded-none">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 text-gray-900 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => {
                  if (!isPreviewableAvatar(selectedConversation.avatar)) return
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
                <p className="font-semibold text-gray-900">{selectedConversation.name}</p>
                <p className={`text-xs ${isSelectedOnline ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                  {isSelectedOnline ? '● Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white">
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
                      key={msg.id || idx}
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
                          {(msg.image || msg.gif) && (
                            <button
                              onClick={() => setPreviewMedia({ type: 'image', url: msg.image || msg.gif })}
                              className="block"
                              title="Preview image"
                            >
                              <img
                                src={msg.image || msg.gif}
                                alt="Attachment"
                                className="max-w-[220px] rounded-xl mt-1 hover:opacity-90 transition"
                              />
                            </button>
                          )}

                          {msg.video && (
                            <video
                              src={msg.video}
                              controls
                              className="max-w-[220px] rounded-xl mt-1 bg-black"
                            />
                          )}

                          {msg.file && (
                            <a
                              href={msg.file}
                              download={msg.fileName || 'attachment'}
                              className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold underline ${isOwnMessage ? 'text-white' : 'text-indigo-700'}`}
                              title="Download file"
                            >
                              <FiDownload size={14} />
                              <span>{msg.fileName || 'Download file'}</span>
                            </a>
                          )}

                          {msg.text && <p className="text-sm font-medium leading-relaxed mt-1">{msg.text}</p>}

                          <p className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-100/80' : 'text-gray-500'}`}>
                            {formatMessageTime(msg.timestamp)}
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
          <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 relative w-full rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
              {/* Attach Button with Menu */}
              <div className="relative" ref={attachMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Attach files"
                >
                  <FiPaperclip size={18} className="text-gray-600" />
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
                      onClick={handleGifAttach}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition w-full text-left text-sm"
                    >
                      <FiSmile size={16} className="text-gray-600" />
                      <span className="text-gray-700 text-sm">Search GIF</span>
                    </button>
                    <button
                      onClick={handleImageAttach}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition w-full text-left border-t border-gray-100"
                    >
                      <FiImage size={16} className="text-gray-600" />
                      <span className="text-gray-700 text-sm">Send Image</span>
                    </button>
                    <button
                      onClick={handleVideoAttach}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition w-full text-left border-t border-gray-100"
                    >
                      <FiVideo size={16} className="text-gray-600" />
                      <span className="text-gray-700 text-sm">Send Video</span>
                    </button>
                    <button
                      onClick={handleFileAttach}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition w-full text-left border-t border-gray-100"
                    >
                      <FiFile size={16} className="text-gray-600" />
                      <span className="text-gray-700 text-sm">Send File</span>
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
                className="flex-1 px-3 py-2 bg-transparent border-0 rounded-lg focus:outline-none focus:ring-0 placeholder:text-gray-400 font-medium text-gray-900"
              />

              {/* Emoji Button with Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Add emoji"
                >
                  <FiSmile size={18} className="text-gray-600" />
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
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <FiSend size={18} />
              </motion.button>
            </div>

            {showGifPicker && (
              <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') searchGifs(gifQuery)
                    }}
                    placeholder="Search GIFs (happy, wow, hello...)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <Button size="sm" onClick={() => searchGifs(gifQuery)}>Search</Button>
                  <button
                    onClick={() => setShowGifPicker(false)}
                    className="text-gray-500 hover:text-gray-700 px-2 py-1"
                    title="Close GIF picker"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                {isGifLoading ? (
                  <p className="text-sm text-gray-500">Loading GIFs...</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                    {gifResults.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => handleSendGif(gif.url)}
                        className="rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400"
                        title="Send GIF"
                      >
                        <img src={gif.url} alt="GIF" className="w-full h-16 object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center bg-white p-12 overflow-y-auto">
          <div className="text-center max-w-md">
            <p className="text-gray-400 text-lg font-medium mb-2">📬 No Conversation Selected</p>
            <p className="text-gray-500 text-sm">Select a conversation from the list to start chatting</p>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow hover:bg-gray-100 z-10"
                title="Close preview"
              >
                <FiX size={18} className="text-gray-700" />
              </button>

              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt="Attachment preview"
                  className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
                />
              ) : (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
