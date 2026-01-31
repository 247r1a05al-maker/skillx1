import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RobotCharacter } from './RobotCharacter'
import { RobotBubble } from './RobotBubble'
import { RobotChat } from './RobotChat'
import { useRobotMovement } from '../hooks/useRobotMovement'
import { useRobotBrain } from '../hooks/useRobotBrain'
import { useRobotVoice } from '../hooks/useRobotVoice'
import { useRobotMood } from '../hooks/useRobotMood'
import { robotContainerVariants, breathingVariants } from '../utils/animations'
import { getRandomJoke, getRandomTip, getRandomMoodMessage, generateId } from '../utils/helpers'
import { RobotAnimation, RobotMood, ChatMessage } from '../types'

export const RobotMascot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentBubble, setCurrentBubble] = useState<string | null>(null)
  const [animation, setAnimation] = useState<RobotAnimation>('idle')
  const [isMoving, setIsMoving] = useState(true)
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState(80)

  const { position, setPosition, direction, isDragging, handleMouseDown, handleMouseMove, handleMouseUp, goToPosition, returnHome, stopMovement } = useRobotMovement(isMoving)
  const { generateResponse, isThinking } = useRobotBrain()
  const { speak, startListening, stopListening, isListening, isSpeaking } = useRobotVoice((command) => handleVoiceCommand(command))
  const { mood, xp, level, addXP, setMood } = useRobotMood()

  // Update animation based on state
  useEffect(() => {
    if (isSpeaking) {
      setAnimation('typing' as RobotAnimation)
    } else if (isThinking) {
      setAnimation('idle' as RobotAnimation)
    } else if (!isMoving) {
      setAnimation('sleeping' as RobotAnimation)
    } else {
      setAnimation('idle' as RobotAnimation)
    }
  }, [isSpeaking, isThinking, isMoving])

  // Handle inactivity
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      setIsMoving(true) // Wake up immediately on activity

      const timer = setTimeout(() => {
        setAnimation('sleeping' as RobotAnimation)
        setIsMoving(false)
      }, 60000) // 60 seconds

      setInactivityTimer(timer)
    }

    resetInactivityTimer()
    window.addEventListener('mousemove', resetInactivityTimer)
    window.addEventListener('click', resetInactivityTimer)

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer)
      window.removeEventListener('click', resetInactivityTimer)
      if (inactivityTimer) clearTimeout(inactivityTimer)
    }
  }, [inactivityTimer])

  // Random tips
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChatOpen) {
        const tip = getRandomTip()
        setCurrentBubble(tip)
        setTimeout(() => setCurrentBubble(null), 5000)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isChatOpen])

  const handleVoiceCommand = useCallback((command: string) => {
    switch (command) {
      case 'stop':
        stopMovement()
        setIsMoving(false)
        speak('Stopping for you!')
        break
      case 'move':
        setIsMoving(true)
        speak('Let\'s go!')
        break
      case 'home':
        returnHome()
        speak('Heading home!')
        break
      case 'help':
        handleChatOpen()
        speak('Opening chat to help you!')
        break
      case 'joke':
        const joke = getRandomJoke()
        speak(joke)
        setCurrentBubble(joke)
        addXP(5)
        break
      case 'dance':
        setAnimation('dancing')
        speak('Let\'s dance!')
        addXP(3)
        break
      default:
        break
    }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isChatOpen) return

    const now = Date.now()
    const lastClick = (window as any).lastRobotClick || 0

    if (now - lastClick < 300) {
      // Double click - tell joke
      const joke = getRandomJoke()
      setCurrentBubble(joke)
      speak(joke)
      setAnimation('celebrating')
      addXP(5)
      setTimeout(() => setAnimation('idle'), 1000)
    } else {
      // Single click - open chat
      handleChatOpen()
    }

    (window as any).lastRobotClick = now
  }

  const handleChatOpen = () => {
    setIsChatOpen(true)
    setIsMoving(false)
    setAnimation('typing')
    addXP(2)

    // Add greeting if no messages
    if (messages.length === 0) {
      const greeting: ChatMessage = {
        id: generateId(),
        text: getRandomMoodMessage(mood),
        sender: 'robot',
        timestamp: new Date(),
      }
      setMessages([greeting])
    }
  }

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    addXP(1)

    // Get robot response
    const response = await generateResponse(text)
    const robotMsg: ChatMessage = {
      id: generateId(),
      text: response,
      sender: 'robot',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, robotMsg])

    // Speak response
    await speak(response)
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="fixed bottom-0 right-0 w-screen h-screen pointer-events-none">
      {/* Main Robot */}
      <div
        className="fixed pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{
          left: position.x,
          top: position.y,
          width: size,
          height: size,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      >
        <motion.div
          variants={robotContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Robot Character */}
          <motion.div variants={animation === 'idle' ? breathingVariants : {}}>
            <RobotCharacter
              mood={mood}
              animation={animation}
              size={size}
              direction={direction}
              mousePos={mousePos}
            />
          </motion.div>

          {/* Stats */}
          <div className="absolute -top-8 left-0 right-0 text-center text-xs font-bold">
            <span className="bg-white/80 px-2 py-1 rounded-full text-gray-700">
              Lvl {level} • {xp} XP
            </span>
          </div>
        </motion.div>
      </div>

      {/* Chat Bubble */}
      <AnimatePresence>
        {currentBubble && !isChatOpen && (
          <RobotBubble
            message={currentBubble}
            position={position}
            isTyping={isThinking}
          />
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <RobotChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        isThinking={isThinking}
      />
    </div>
  )
}

export default RobotMascot
