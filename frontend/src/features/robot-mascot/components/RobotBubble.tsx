import React from 'react'
import { motion } from 'framer-motion'
import { chatBubbleVariants, typingDotVariants } from '../utils/animations'

interface RobotBubbleProps {
  message: string
  isTyping?: boolean
  position: { x: number; y: number }
}

export const RobotBubble: React.FC<RobotBubbleProps> = ({
  message,
  isTyping = false,
  position,
}) => {
  return (
    <div
      className="fixed z-40"
      style={{
        left: Math.max(10, Math.min(position.x - 80, window.innerWidth - 220)),
        top: Math.max(10, position.y - 140),
      }}
    >
      <motion.div
        variants={chatBubbleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ width: '100%' }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-4 w-48 relative">
          {/* Arrow */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />

          {/* Content */}
          <div className="text-gray-800 text-sm leading-relaxed">
            {isTyping ? (
              <div className="flex gap-1 h-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    style={{
                      animation: `bounce 1.4s infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              message
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
