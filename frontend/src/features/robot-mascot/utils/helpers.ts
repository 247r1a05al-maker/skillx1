import { RobotMood } from '../types'

export const jokes = [
  'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
  'How many programmers does it take to change a light bulb? None, that\'s a hardware problem! 💡',
  'Why did the robot go to school? To improve its AI-Q! 🤖',
  'What\'s my favorite language? Binary! It\'s either yes or no! 01010101',
  'I tried to tell a programming joke, but nobody got it... It was too complex! 🤓',
]

export const tips = [
  'Use voice commands by clicking the microphone icon! 🎤',
  'Double-click me to hear a joke! 😂',
  'You can drag me around the screen! 👋',
  'Check out the Explore page to find cool people! 🔍',
  'Join groups to connect with others! 👥',
  'Try asking me for help with anything! 💬',
  'I learn from every conversation we have! 🧠',
  'Click on me to open the chat! 💭',
]

export const motivationalMessages = [
  'You\'re doing great! Keep it up! 🚀',
  'Every interaction makes me happy! 😊',
  'I believe in you! 💪',
  'You\'re on fire today! 🌟',
  'Keep exploring and discovering! 🗺️',
  'Every step counts! 👣',
  'Let\'s learn something new together! 🧠',
  'You\'ve got this! 💯',
]

export const moodMessages: Record<RobotMood, string[]> = {
  happy: [
    'I\'m so happy right now! 😊',
    'Life is great! ✨',
    'This is awesome! 🎉',
  ],
  sleepy: [
    'I\'m so tired... 😴',
    'Need some rest... zzz',
    'Can\'t keep my eyes open... 😪',
  ],
  excited: [
    'This is incredible! 🤩',
    'I\'m so excited! 🎊',
    'Wow! Amazing! 🚀',
  ],
  bored: [
    'Hmm, anything interesting? 😑',
    'I could use some excitement...',
    'Anything fun you want to do? 🤔',
  ],
  confused: [
    'Wait, what? 🤔',
    'I\'m a bit confused... 😕',
    'Can you explain that? 👀',
  ],
  thinking: [
    'Let me think about that... 💭',
    'Interesting question! 🤔',
    'That\'s a good one! 👍',
  ],
}

export const getRandomJoke = (): string => jokes[Math.floor(Math.random() * jokes.length)]

export const getRandomTip = (): string => tips[Math.floor(Math.random() * tips.length)]

export const getRandomMotivation = (): string =>
  motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

export const getRandomMoodMessage = (mood: RobotMood): string => {
  const messages = moodMessages[mood]
  return messages[Math.floor(Math.random() * messages.length)]
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const getCurrentHour = (): number => new Date().getHours()

export const getMoodBasedOnTime = (): RobotMood => {
  const hour = getCurrentHour()
  if (hour >= 23 || hour < 6) return 'sleepy'
  if (hour >= 9 && hour < 12) return 'excited'
  if (hour >= 14 && hour < 16) return 'bored'
  return 'happy'
}
