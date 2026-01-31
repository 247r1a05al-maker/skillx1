import React, { useRef, useEffect, useState, FunctionComponent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mic, MicOff } from 'lucide-react'
import { ChatMessage } from '../types'
import { formatTime } from '../utils/helpers'

interface RobotChatProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (text: string) => Promise<void>
  isListening: boolean
  onToggleListening: () => void
  isThinking: boolean
}

const RobotChat: FunctionComponent<RobotChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isListening,
  onToggleListening,
  isThinking,
}) => {
  const [input, setInput] = React.useState('')
  const messagesEndRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed bottom-32 right-6 w-96 h-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between text-white">
            <div>
              <h3 className="font-bold">Chat with GIPJ</h3>
              <p className="text-xs opacity-75">Always here to help</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
                <p>Start a conversation with me! 👋</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'robot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === 'robot'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isThinking}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={onToggleListening}
              className={`p-2 rounded-lg transition ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export { RobotChat }
export default RobotChat
