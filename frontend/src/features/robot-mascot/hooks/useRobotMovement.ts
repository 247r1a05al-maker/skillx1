import { useState, useEffect, useCallback } from 'react'
import { Position } from '../types'
import { moveTowards, getRandomPosition, getHomePosition, shouldRobotWalk } from '../utils/physics'

const ANIMATION_FRAME_RATE = 60

export const useRobotMovement = (isMoving: boolean = true) => {
  const [position, setPosition] = useState(() => getHomePosition())
  const [targetPosition, setTargetPosition] = useState(() => getRandomPosition())
  const [isDragging, setIsDragging] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const newPos: Position = {
        x: e.clientX - 40,
        y: e.clientY - 40,
      }

      setPosition(newPos)
      setDirection(newPos.x > position.x ? 'right' : 'left')
    },
    [isDragging, position.x]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Update target position
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && isMoving && shouldRobotWalk()) {
        setTargetPosition(getRandomPosition())
      }
    }, 3000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [isDragging, isMoving])

  // Movement loop
  useEffect(() => {
    if (isDragging) return

    let animationFrameId: number

    const moveRobot = () => {
      setPosition((prev) => {
        const newPos = isMoving ? moveTowards(prev, targetPosition, 2) : prev
        setDirection(newPos.x > prev.x ? 'right' : 'left')
        return newPos
      })

      animationFrameId = requestAnimationFrame(moveRobot)
    }

    animationFrameId = requestAnimationFrame(moveRobot)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isMoving, targetPosition, isDragging])

  const goToPosition = useCallback((pos: Position) => {
    setTargetPosition(pos)
  }, [])

  const returnHome = useCallback(() => {
    setTargetPosition(getHomePosition())
  }, [])

  const stopMovement = useCallback(() => {
    setTargetPosition(position)
  }, [position])

  return {
    position,
    setPosition,
    direction,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    goToPosition,
    returnHome,
    stopMovement,
  }
}
