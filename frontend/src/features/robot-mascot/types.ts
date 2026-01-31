export type RobotMood = 'happy' | 'sleepy' | 'excited' | 'bored' | 'confused' | 'thinking'
export type RobotAnimation = 'idle' | 'walking' | 'jumping' | 'waving' | 'typing' | 'dancing' | 'sleeping' | 'celebrating' | 'blinking'
export type RobotState = 'idle' | 'moving' | 'chatting' | 'listening' | 'thinking' | 'celebrating'

export interface Position {
  x: number
  y: number
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'robot' | 'user'
  timestamp: Date
}

export interface RobotContextData {
  position: Position
  mood: RobotMood
  state: RobotState
  animation: RobotAnimation
  isVisible: boolean
  isChatOpen: boolean
  isListening: boolean
  messages: ChatMessage[]
  xp: number
  level: number
  size: number
  isDragging: boolean
}

export interface GameState {
  xp: number
  level: number
  achievements: string[]
  streak: number
  lastActive: Date
}

export interface VoiceCommandMap {
  [key: string]: string
}
