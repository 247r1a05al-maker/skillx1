import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'normal'
    }
    return 'normal'
  })

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme)

    // Apply theme to document
    const root = document.documentElement
    if (theme === 'elite') {
      root.classList.remove('theme-normal')
      root.classList.add('theme-elite')
      document.body.style.background = '#0a0f1c'
    } else {
      root.classList.remove('theme-elite')
      root.classList.add('theme-normal')
      document.body.style.background = '#f3f4f6'
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'normal' ? 'elite' : 'normal'))
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
