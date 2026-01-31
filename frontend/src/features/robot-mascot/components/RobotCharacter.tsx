import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { RobotMood } from '../types'

interface RobotCharacterProps {
  mood: RobotMood
  animation: string
  size: number
  direction?: 'left' | 'right'
  mousePos?: { x: number; y: number }
}

const moodEmojis: Record<RobotMood, string> = {
  happy: '😊',
  sleepy: '😴',
  excited: '🤩',
  bored: '😑',
  confused: '🤔',
  thinking: '💭',
}

const moodColors: Record<RobotMood, { head: string; body: string; accent: string }> = {
  happy: { head: '#FFD93D', body: '#6BCB77', accent: '#FF6B6B' },
  sleepy: { head: '#A8E6CF', body: '#FFD3B6', accent: '#FFAAA5' },
  excited: { head: '#FF8B94', body: '#FF6B9D', accent: '#FFC8DD' },
  bored: { head: '#B0B0B0', body: '#808080', accent: '#606060' },
  confused: { head: '#9D84B7', body: '#C4A9FF', accent: '#E7C9FF' },
  thinking: { head: '#FFE66D', body: '#FFA500', accent: '#FF8C00' },
}

export const RobotCharacter: React.FC<RobotCharacterProps> = ({
  mood,
  animation,
  size,
  direction = 'right',
  mousePos = { x: 0, y: 0 },
}) => {
  const colors = moodColors[mood]
  const scale = direction === 'left' ? -1 : 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `scaleX(${scale})` }}
      className="drop-shadow-lg"
    >
      {/* Head */}
      <motion.rect
        x="25"
        y="15"
        width="50"
        height="50"
        rx="8"
        fill={colors.head}
        animate={{
          y: animation === 'idle' ? [15, 12, 15] : undefined,
        }}
        transition={{
          duration: 2,
          repeat: animation === 'idle' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Eyes */}
      <motion.g
        animate={{
          scaleY: animation === 'sleeping' ? 0.2 : 1,
        }}
        transition={{
          duration: animation === 'sleeping' ? 0.3 : 0,
          repeat: animation === 'sleeping' ? Infinity : 0,
          repeatDelay: 1.5,
        }}
      >
        <circle cx="38" cy="35" r="5" fill="#000" />
        <circle cx="62" cy="35" r="5" fill="#000" />
        {/* Eye shine */}
        <circle cx="39" cy="34" r="1.5" fill="#fff" />
        <circle cx="63" cy="34" r="1.5" fill="#fff" />
      </motion.g>

      {/* Mouth */}
      <motion.path
        d={mood === 'happy' ? 'M 40 50 Q 50 55 60 50' : 'M 40 50 Q 50 48 60 50'}
        stroke="#000"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Body */}
      <motion.rect
        x="30"
        y="68"
        width="40"
        height="25"
        rx="5"
        fill={colors.body}
        animate={{
          y:
            animation === 'walking'
              ? [68, 64, 68, 64]
              : animation === 'jumping'
                ? [68, 30, 68]
                : animation === 'dancing'
                  ? [68, 63, 73, 63, 73, 68]
                  : 68,
        }}
        transition={{
          duration:
            animation === 'jumping'
              ? 0.8
              : animation === 'dancing'
                ? 1.2
                : 0.6,
          type: animation === 'jumping' ? 'spring' : 'easeInOut',
          repeat: animation === 'walking' || animation === 'dancing' ? Infinity : 0,
        }}
      />

      {/* Arms */}
      <motion.g
        animate={{
          rotate:
            animation === 'waving'
              ? [0, 20, -20, 0]
              : animation === 'dancing'
                ? [-10, 10, -10, 10, 0]
                : 0,
        }}
        transition={{
          duration: animation === 'waving' ? 0.6 : 1.2,
          repeat: animation === 'waving' || animation === 'dancing' ? Infinity : 0,
        }}
        origin="50% 68"
      >
        <rect x="10" y="65" width="18" height="12" rx="6" fill={colors.accent} />
        <rect x="72" y="65" width="18" height="12" rx="6" fill={colors.accent} />
      </motion.g>

      {/* Mood indicator */}
      <text x="50" y="15" textAnchor="middle" fontSize="20" dy="0.3em">
        {moodEmojis[mood]}
      </text>

      {/* Animation effects */}
      {animation === 'celebrating' && (
        <>
          <motion.circle
            cx="25"
            cy="20"
            r="2"
            fill={colors.accent}
            animate={{ y: [-10, -30], opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.circle
            cx="75"
            cy="20"
            r="2"
            fill={colors.accent}
            animate={{ y: [-10, -30], opacity: [1, 0] }}
            transition={{ duration: 0.8, delay: 0.2, repeat: Infinity }}
          />
        </>
      )}
    </svg>
  )
}
