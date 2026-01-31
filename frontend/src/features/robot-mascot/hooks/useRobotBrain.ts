import { useState, useCallback } from 'react'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const useRobotBrain = () => {
  const [isThinking, setIsThinking] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    {
      role: 'assistant',
      content: `You are an adorable, helpful AI robot mascot for a skill exchange platform. 
You are cute, playful, and intelligent. Keep responses under 100 words. Be friendly and encouraging!`,
    },
  ])

  const generateResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      if (!OPENAI_API_KEY) {
        return getOfflineResponse(userMessage)
      }

      try {
        setIsThinking(true)

        const newHistory: Message[] = [
          ...conversationHistory,
          {
            role: 'user',
            content: userMessage,
          },
        ]

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: newHistory,
            temperature: 0.8,
            max_tokens: 120,
          }),
        })

        if (!response.ok) {
          return getOfflineResponse(userMessage)
        }

        const data = await response.json()
        const assistantMessage = data.choices[0].message.content

        setConversationHistory([
          ...newHistory,
          {
            role: 'assistant',
            content: assistantMessage,
          },
        ])

        setIsThinking(false)
        return assistantMessage
      } catch (error) {
        console.error('AI generation error:', error)
        setIsThinking(false)
        return getOfflineResponse(userMessage)
      }
    },
    [conversationHistory]
  )

  const clearHistory = useCallback(() => {
    setConversationHistory([conversationHistory[0]])
  }, [conversationHistory])

  return {
    generateResponse,
    isThinking,
    clearHistory,
  }
}

function getOfflineResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (lower.includes('help') || lower.includes('what can you do')) {
    return `I can chat with you, answer questions, and guide you through the platform! Ask me anything! 🤖`
  }

  if (lower.includes('hello') || lower.includes('hi')) {
    return `Hey there! I'm your robot assistant! How can I help? 👋`
  }

  if (lower.includes('joke')) {
    return `Why did the robot go to school? To improve its AI-Q! 🤖`
  }

  if (lower.includes('explore') || lower.includes('learn')) {
    return `Check out the Explore page to find amazing people to learn from! 🔍`
  }

  if (lower.includes('group')) {
    return `Groups are awesome! Join or create one based on your interests! 👥`
  }

  const responses = [
    'That\'s interesting! Tell me more! 😊',
    'I like the way you think! 🧠',
    'Let\'s keep learning together! 📚',
    'You\'re doing great! 💪',
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
