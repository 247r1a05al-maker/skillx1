import { useState, useEffect, useCallback } from 'react'
import { RobotMood } from '../types'
import { getMoodBasedOnTime } from '../utils/helpers'

export const useRobotMood = () => {
  const [mood, setMood] = useState(() => getMoodBasedOnTime())
  const [xp, setXP] = useState(() => {
    const saved = localStorage.getItem('robot-xp')
    return saved ? parseInt(saved) : 0
  })
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('robot-level')
    return saved ? parseInt(saved) : 1
  })

  // Update mood every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMood(getMoodBasedOnTime())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Save XP and level to localStorage
  useEffect(() => {
    localStorage.setItem('robot-xp', xp.toString())
    localStorage.setItem('robot-level', level.toString())
  }, [xp, level])

  const addXP = useCallback((amount: number) => {
    setXP((prev: number) => {
      const newXP = prev + amount
      const newLevel = Math.floor(newXP / 100) + 1
      setLevel(newLevel)

      // Update mood based on progress
      if (newLevel > level) {
        setMood('excited')
        setTimeout(() => setMood(getMoodBasedOnTime()), 3000)
      }

      return newXP
    })
  }, [level])

  const setMoodManually = useCallback((newMood: RobotMood) => {
    setMood(newMood)
  }, [])

  const resetXP = useCallback(() => {
    setXP(0)
    setLevel(1)
  }, [])

  return {
    mood,
    xp,
    level,
    addXP,
    setMood: setMoodManually,
    resetXP,
  }
}
