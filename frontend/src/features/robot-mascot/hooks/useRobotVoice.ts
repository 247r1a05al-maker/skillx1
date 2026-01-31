import { useState, useCallback } from 'react'

export const useRobotVoice = (onCommandDetected?: (command: string) => void) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1.2
      utterance.volume = 1

      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }

      const command = parseVoiceCommand(transcript.toLowerCase())
      if (command && event.results[event.results.length - 1].isFinal) {
        onCommandDetected?.(command)
      }
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
  }, [onCommandDetected])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  return {
    speak,
    startListening,
    stopListening,
    isListening,
    isSpeaking,
  }
}

function parseVoiceCommand(transcript: string): string | null {
  const commands: Record<string, string[]> = {
    stop: ['stop', 'halt', 'pause'],
    move: ['move', 'go', 'walk'],
    home: ['home', 'go home', 'return'],
    help: ['help', 'assist'],
    chat: ['chat', 'talk'],
    joke: ['joke', 'funny', 'laugh'],
    dance: ['dance', 'party'],
    sleep: ['sleep', 'rest'],
  }

  for (const [command, keywords] of Object.entries(commands)) {
    if (keywords.some((kw) => transcript.includes(kw))) {
      return command
    }
  }

  return null
}
