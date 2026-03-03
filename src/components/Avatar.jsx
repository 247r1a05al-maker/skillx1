import React from 'react'

const isSvgAvatar = (value) => {
  if (!value) return false
  // Always treat SVG/dicebear as placeholders - show initials instead
  const lower = value.toLowerCase()
  return lower.includes('dicebear') || lower.includes('.svg') || lower.includes('image/svg')
}

// Convert SVG avatars to initials fallback for cleaner UI
const shouldShowInitials = (value) => {
  const lower = (value || '').toLowerCase()
  return lower.includes('dicebear') || lower.includes('.svg') || lower.includes('image/svg')
}

const Avatar = ({ src, name, userId, size = 'md', className = '' }) => {
  // If user has uploaded a custom image, show it (no SVGs)
  if (src && !isSvgAvatar(src)) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{
          width: size === 'sm' ? '32px' : size === 'md' ? '48px' : '128px',
          height: size === 'sm' ? '32px' : size === 'md' ? '48px' : '128px',
        }}
      />
    )
  }

  // Generate initials and color from name
  const initials = (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Generate consistent color based on userId or name
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ]
  
  const hash = (userId || name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorClass = colors[hash % colors.length]

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-32 h-32 text-4xl',
  }

  return (
    <div
      className={`${colorClass} rounded-full flex items-center justify-center text-white font-bold ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  )
}

export default Avatar
