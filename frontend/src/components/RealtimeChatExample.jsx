import { useState, useEffect, useRef } from 'react'
import { useRealtimeMessages, useTypingIndicator, useUserPresence } from '../hooks/useFirebase'

/**
 * Example Real-time Chat Component using Firebase
 * 
 * This component demonstrates:
 * - Real-time message updates
 * - Typing indicators
 * - User online status
 * - Sending messages
 */

export default function RealtimeChatExample({ conversationId, currentUser, otherUser }) {
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)
  
  // Firebase hooks
  const { messages, loading, sendMessage } = useRealtimeMessages(conversationId)
  const { typingUsers, setTyping } = useTypingIndicator(conversationId, currentUser.id)
  const { isOnline } = useUserPresence(otherUser.id)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing
  const handleInputChange = (e) => {
    setMessageText(e.target.value)
    setTyping(e.target.value.length > 0)
  }

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageText.trim()) return

    try {
      await sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: messageText.trim(),
        type: 'text',
      })
      
      setMessageText('')
      setTyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Check if someone is typing (excluding current user)
  const isTyping = Object.keys(typingUsers).length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={otherUser.avatar || '/default-avatar.png'}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full"
            />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {otherUser.name}
            </h3>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.id
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-semibold mb-1">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm">{message.text}</p>
                  {message.timestamp && (
                    <p className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={handleInputChange}
            onBlur={() => setTyping(false)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

// Usage example:
// import RealtimeChatExample from './components/RealtimeChatExample'
// 
// function MyComponent() {
//   const currentUser = { id: 'user-1', name: 'John' }
//   const otherUser = { id: 'user-2', name: 'Jane', avatar: '/jane.jpg' }
//   const conversationId = 'conv-123'
//   
//   return (
//     <RealtimeChatExample
//       conversationId={conversationId}
//       currentUser={currentUser}
//       otherUser={otherUser}
//     />
//   )
// }
