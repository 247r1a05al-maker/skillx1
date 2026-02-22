import React, { createContext, useContext, useEffect, useState } from 'react'
import { getDatabase, ref, set as firebaseSet, get as firebaseGet } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

const saveThemeToFirebase = async (userId, theme) => {
  try {
    const db = getDatabase()
    const themeRef = ref(db, `preferences/${userId}/theme`)
    await firebaseSet(themeRef, theme)
  } catch (error) {
    console.error('Error saving theme to Firebase:', error)
  }
}

const loadThemeFromFirebase = async (userId) => {
  try {
    const db = getDatabase()
    const themeRef = ref(db, `preferences/${userId}/theme`)
    const snapshot = await firebaseGet(themeRef)
    return snapshot.exists() ? snapshot.val() : 'normal'
  } catch (error) {
    console.error('Error loading theme from Firebase:', error)
    return 'normal'
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('normal')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    const loadTheme = async () => {
      if (auth.currentUser) {
        const savedTheme = await loadThemeFromFirebase(auth.currentUser.uid)
        setTheme(savedTheme)
      }
      setIsLoading(false)
    }
    loadTheme()
  }, [])

  useEffect(() => {
    const auth = getAuth()
    if (auth.currentUser && !isLoading) {
      saveThemeToFirebase(auth.currentUser.uid, theme)
    }

    // Apply theme to document
    const root = document.documentElement
    console.log('🎨 Switching theme to:', theme)
    if (theme === 'elite') {
      root.classList.remove('theme-normal')
      root.classList.add('theme-elite')
      document.body.style.background = '#0a0f1c'
      console.log('✅ Elite mode activated - classes:', root.className)
    } else {
      root.classList.remove('theme-elite')
      root.classList.add('theme-normal')
      document.body.style.background = '#f3f4f6'
      console.log('✅ Normal mode activated - classes:', root.className)
    }
  }, [theme, isLoading])

  const toggleTheme = () => {
    console.log('🔄 Toggle theme called, current:', theme)
    setTheme((prev) => {
      const newTheme = prev === 'normal' ? 'elite' : 'normal'
      console.log('🔄 Updating theme from', prev, 'to', newTheme)
      return newTheme
    })
  }

  const value = {
    theme,
    toggleTheme,
    isElite: theme === 'elite',
    isNormal: theme === 'normal',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext
