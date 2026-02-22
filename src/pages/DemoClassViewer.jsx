import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiMic, FiMicOff, FiVideo, FiVideoOff, FiSend, FiClock, FiCheckCircle, FiZoomOut } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import Avatar from '../components/Avatar'
import SCoinIcon from '../components/SCoinIcon'
import { useAuthStore } from '../store'
import firebaseRealtimeService from '../services/firebase-realtime'
import { useToast } from '../hooks'

const DemoClassViewer = ({ booking, session, onClose, onContinueCourse }) => {
  const { user } = useAuthStore()
  const { success, error: showError } = useToast()
  
  const [timeRemaining, setTimeRemaining] = useState(session.duration * 60) // in seconds
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: { name: session.teacher?.displayName || 'Teacher', avatar: session.teacher?.photoURL },
      text: '👋 Welcome to the demo class! Feel free to ask questions in the chat.',
      timestamp: new Date(),
    },
  ])
  const [messageInput, setMessageInput] = useState('')
  const [demoEnded, setDemoEnded] = useState(false)
  const [coinsDeducted, setCoinsDeducted] = useState(false)

  // Handle timer countdown
  useEffect(() => {
    if (demoEnded) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleDemoEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [demoEnded])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Send chat message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage = {
      id: messages.length + 1,
      sender: { name: user.name || 'You', avatar: user.avatar },
      text: messageInput,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessageInput('')
  }

  // Handle demo end
  const handleDemoEnd = async () => {
    setDemoEnded(true)

    try {
      // Deduct coins from learner after demo completes
      const result = await firebaseRealtimeService.deductCoinsForDemoCompletion(
        booking.learnerId,
        session.coinsCost,
        session.skillName,
        booking.id
      )

      if (result.success) {
        setCoinsDeducted(true)
        success(`Demo completed! ${session.coinsCost} coins deducted.`)
      } else {
        showError(result.error || 'Error deducting coins')
      }
    } catch (err) {
      console.error('Error completing demo:', err)
      showError('Error completing demo')
    }
  }

  const progressPercent = ((session.duration * 60 - timeRemaining) / (session.duration * 60)) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-6xl h-screen max-h-screen flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 flex items-center justify-between border-b border-indigo-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{session.skillName} - Demo Class</h2>
            <p className="text-indigo-200 text-sm">Teacher: {session.teacher?.displayName || 'Instructor'}</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${demoEnded ? 'text-green-400' : 'text-yellow-400'}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-indigo-200 text-xs mt-1">
              {demoEnded ? '✓ Demo Complete' : 'Time Remaining'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden gap-4 p-6">
          {/* Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Teacher Video */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative flex items-center justify-center border-2 border-indigo-700">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                  <FiZoomOut size={64} className="text-white" />
                </div>
                <p className="text-gray-300 text-center">
                  <strong>Live Class</strong>
                  <br />
                  Video & Audio Active
                </p>
              </div>
              {/* Teacher Avatar */}
              <div className="absolute top-4 right-4">
                <Avatar
                  src={session.teacher?.photoURL}
                  name={session.teacher?.displayName || 'Teacher'}
                  size="lg"
                  className="border-4 border-white"
                />
              </div>
            </div>

            {/* User Video Thumbnail */}
            <div className="h-20 bg-black rounded-lg border-2 border-gray-700 p-2 flex items-center justify-center relative">
              <Avatar
                src={user?.avatar}
                name={user?.name || 'You'}
                size="sm"
              />
              <span className="text-xs text-gray-400 ml-2">You (Muted)</span>
              {/* Controls */}
              <div className="absolute right-2 flex gap-2">
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-2 rounded-full transition ${
                    isAudioOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isAudioOn ? 'Mute' : 'Unmute'}
                >
                  {isAudioOn ? <FiMic className="text-white" /> : <FiMicOff className="text-white" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2 rounded-full transition ${
                    isVideoOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isVideoOn ? 'Stop Video' : 'Start Video'}
                >
                  {isVideoOn ? <FiVideo className="text-white" /> : <FiVideoOff className="text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="w-80 flex flex-col bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 border-b border-indigo-700">
              <h3 className="text-white font-bold">Class Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2 text-sm">
                  <Avatar src={msg.sender.avatar} name={msg.sender.name} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-indigo-300 font-semibold text-xs">{msg.sender.name}</p>
                    <p className="text-gray-200 break-words">{msg.text}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-900">
              {demoEnded ? (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-400 font-semibold">
                    <FiCheckCircle size={20} />
                    <span>Demo Complete!</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Ended Panel */}
        {demoEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-t border-green-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-xl font-bold mb-2">🎉 Demo Class Complete!</h3>
                <p className="text-green-200">Did you like this teaching style?</p>
                {coinsDeducted && (
                  <div className="flex items-center gap-2 text-yellow-300 mt-2 font-semibold">
                    <SCoinIcon className="text-yellow-400" size={20} />
                    <span>{session.coinsCost} coins deducted from your balance</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={onContinueCourse}
                  className="flex items-center gap-2"
                >
                  ✓ Continue Full Course
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Close Button */}
        {!demoEnded && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
            title="Leave Class"
          >
            <FiX size={24} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default DemoClassViewer
