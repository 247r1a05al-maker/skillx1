import React, { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

const CursorLight = () => {
  const { isElite } = useTheme()
  const cursorRef = useRef(null)
  const mousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isElite) return

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY }

      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1'
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
    }

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isElite])

  if (!isElite) return null

  return (
    <>
      {/* Cursor Glow Light - Enhanced Neon */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-0 opacity-0 transition-opacity duration-300"
        style={{
          width: '400px',
          height: '400px',
          marginLeft: '-200px',
          marginTop: '-200px',
          background: `
            radial-gradient(circle, 
              rgba(0, 240, 255, 0.25) 0%, 
              rgba(0, 217, 255, 0.15) 40%,
              rgba(0, 191, 255, 0.08) 70%, 
              transparent 85%)
          `,
          borderRadius: '50%',
          filter: 'blur(50px)',
          willChange: 'transform',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.4)',
        }}
      />

      {/* Static background glow - More vibrant */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(0, 191, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(0, 217, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 20%, rgba(0, 240, 255, 0.1) 0%, transparent 40%)
          `,
        }}
      />
    </>
  )
}

export default CursorLight
