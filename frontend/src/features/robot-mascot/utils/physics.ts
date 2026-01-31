import { Position } from '../types'

const SCREEN_PADDING = 50
const ROBOT_SIZE = 80
const BASE_SPEED = 2

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export const clampPosition = (pos: Position, size: number = ROBOT_SIZE): Position => {
  const maxX = window.innerWidth - size - SCREEN_PADDING
  const maxY = window.innerHeight - size - SCREEN_PADDING

  return {
    x: Math.max(SCREEN_PADDING, Math.min(pos.x, maxX)),
    y: Math.max(SCREEN_PADDING, Math.min(pos.y, maxY)),
  }
}

export const moveTowards = (current: Position, target: Position, speed: number = BASE_SPEED): Position => {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const distance = calculateDistance(current.x, current.y, target.x, target.y)

  if (distance < 5) return target

  const moveDistance = Math.min(speed, distance)
  const angle = Math.atan2(dy, dx)

  return clampPosition({
    x: current.x + Math.cos(angle) * moveDistance,
    y: current.y + Math.sin(angle) * moveDistance,
  })
}

export const getRandomPosition = (): Position => {
  const maxX = Math.max(window.innerWidth - ROBOT_SIZE - SCREEN_PADDING * 2, 100)
  const maxY = Math.max(window.innerHeight - ROBOT_SIZE - SCREEN_PADDING * 2, 100)

  return clampPosition({
    x: SCREEN_PADDING + Math.random() * maxX,
    y: SCREEN_PADDING + Math.random() * maxY,
  })
}

export const getHomePosition = (): Position => {
  return clampPosition({
    x: window.innerWidth - ROBOT_SIZE - SCREEN_PADDING - 20,
    y: window.innerHeight - ROBOT_SIZE - SCREEN_PADDING - 20,
  })
}

export const shouldRobotWalk = (): boolean => {
  return Math.random() > 0.7
}

export const getDirection = (from: Position, to: Position): 'left' | 'right' => {
  return to.x > from.x ? 'right' : 'left'
}
