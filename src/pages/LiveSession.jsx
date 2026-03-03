import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiMic, FiMicOff, FiSend, FiUsers, FiPhone } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import SCoinIcon from '../components/SCoinIcon'
import { useAuthStore } from '../store/index'
import firebaseRealtimeService from '../services/firebase-realtime'
import { useToast } from '../hooks/index'

const LiveSession = ({ 
  booking, 
  session, 
  onClose, 
  onSessionEnd,
  teacherData
}) => {
  const { user } = useAuthStore()
  const { success, error: showError } = useToast()
  
  const [timeRemaining, setTimeRemaining] = useState(session.duration * 60)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  
  const unsubscribeParticipants = useRef(null)
  const unsubscribeMessages = useRef(null)
  const roomId = booking.id

  useEffect(() => {
    // Subscribe to participants in real-time
    unsubscribeParticipants.current = firebaseRealtimeService.subscribeToRoomParticipants(
      roomId,
      (participantsList) => {
        setParticipants(participantsList)
      }
    )

    // Subscribe to messages in real-time
    unsubscribeMessages.current = firebaseRealtimeService.subscribeToRoomMessages(
      roomId,
      (messagesList) => {
        setMessages(messagesList)
      }
    )

    return () => {
      if (unsubscribeParticipants.current) unsubscribeParticipants.current()
      if (unsubscribeMessages.current) unsubscribeMessages.current()
    }
  }, [roomId])

  // Timer countdown
  useEffect(() => {
    if (sessionEnded) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSessionEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionEnded])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    try {
      await firebaseRealtimeService.sendRoomMessage(
        roomId,
        user.uid || user.id,
        user.name || 'User',
        user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        messageInput
      )
      setMessageInput('')
    } catch (err) {
      showError('Failed to send message')
    }
  }

  const handleSessionEnd = async () => {
    setSessionEnded(true)
    
    try {
      // Only teacher can end session
      const isTeacher = user.uid === booking.teacherId || user.id === booking.teacherId
      
      if (isTeacher) {
        // Complete demo and deduct coins after session ends
        await firebaseRealtimeService.completeSession(booking.id, 5)
        await firebaseRealtimeService.endSessionRoom(roomId)
        
        // Log completion event
        await firebaseRealtimeService.logSessionEvent(booking.learnerId, 'session_ended', {
          sessionId: session.id,
          bookingId: roomId,
          isDemoCourse: session.isDemoCourse,
          completedBy: 'teacher'
        })
      }

      console.log('✅ Demo ended. Coins deducted after demo completion.')
      success('Session ended successfully')
      if (onSessionEnd) onSessionEnd()
    } catch (err) {
      console.error('Error ending session:', err)
      showError('Error ending session')
    }
  }

  const handleLeaveSession = async () => {
    try {
      // 📝 Log that user left session
      await firebaseRealtimeService.logSessionEvent(user.uid || user.id, 'user_left_session', {
        sessionId: session.id,
        bookingId: roomId,
        isDemoCourse: session.isDemoCourse,
        timeRemaining // How much time was left when user left
      })
      
      await firebaseRealtimeService.leaveSessionRoom(roomId, user.uid || user.id)
      
      // Coins are deducted after demo ends
      success('You left the demo. (Coins will be deducted after the demo ends)')
      onClose()
    } catch (err) {
      showError('Error leaving session')
    }
  }

  const isTeacher = user.uid === booking.teacherId || user.id === booking.teacherId
  const progressPercent = ((session.duration * 60 - timeRemaining) / (session.duration * 60)) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-7xl h-screen max-h-screen flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 flex items-center justify-between border-b border-indigo-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{session.skillName}</h2>
            <p className="text-indigo-200 text-sm">
              🎓 Demo Class • 
              {isTeacher ? ' You are teaching' : ' Live with ' + (teacherData?.name || 'Instructor')}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${sessionEnded ? 'text-green-400' : 'text-yellow-400'}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-indigo-200 text-xs mt-1">
              {sessionEnded ? '✓ Session Complete' : 'Time Remaining'}
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
          {/* Video Area - Jitsi Meet Integration */}
          <div className="flex-1 flex flex-col bg-black rounded-lg overflow-hidden relative border-2 border-indigo-700">
            {/* Jitsi Meet iframe */}
            <iframe
              allow="camera; microphone; display-capture"
              src={`https://meet.jitsi.com/${roomId}?userInfo.displayName=${encodeURIComponent(user.name || 'User')}`}
              style={{
                height: '100%',
                width: '100%',
                border: 'none',
              }}
              title="Live Class Video"
            />
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 flex flex-col bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {/* Participants */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 border-b border-indigo-700">
              <div className="flex items-center gap-2 text-white font-bold">
                <FiUsers size={20} />
                <span>{participants.length} Active</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-40">
              {participants.map((participantId) => (
                <div key={participantId} className="flex items-center gap-2 text-sm text-indigo-200 bg-gray-700 p-2 rounded">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="truncate">{participantId === booking.teacherId ? '👨‍🏫 Teacher' : '📚 Student'}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-700"></div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <p className="text-indigo-300 font-semibold text-xs">{msg.userName}</p>
                    <p className="text-gray-200 break-words text-xs mt-1">{msg.text}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-700 bg-gray-900 space-y-2">
              {sessionEnded ? (
                <div className="text-center text-green-400 font-semibold text-sm">
                  ✓ Session Complete
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      <FiSend size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition flex items-center justify-center gap-1 ${
                        isMuted
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isMuted ? <FiMicOff size={16} /> : <FiMic size={16} />}
                      {isMuted ? 'Muted' : 'Unmuted'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        {!sessionEnded && (
          <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-200">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Live Session Active</span>
            </div>
            <div className="flex gap-3">
              {session.isDemoCourse && (
                <div className="flex items-center gap-2 text-yellow-300 font-semibold">
                  <SCoinIcon size={20} />
                  <span>25 coins on completion</span>
                </div>
              )}
              {isTeacher ? (
                <Button
                  variant="primary"
                  onClick={handleSessionEnd}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <FiPhone size={18} />
                  End Session
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleLeaveSession}
                  className="flex items-center gap-2"
                >
                  <FiX size={18} />
                  Leave
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Session Ended Panel */}
        {sessionEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-t border-green-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-xl font-bold mb-2">🎉 Session Complete!</h3>
                <p className="text-green-200">Thankyou for attending!</p>
                {session.isDemoCourse && (
                  <div className="flex items-center gap-2 text-yellow-300 mt-2 font-semibold">
                    <SCoinIcon size={20} />
                    <span>25 coins deducted from your balance</span>
                  </div>
                )}
              </div>
              <Button variant="primary" onClick={handleLeaveSession}>
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default LiveSession
