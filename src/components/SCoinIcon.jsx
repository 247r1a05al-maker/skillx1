import React from 'react'

const SCoinIcon = ({ size = 24, className = '' }) => {
  const iconSize = Number(size) || 24

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="28" fill="#FBBF24" stroke="#F59E0B" strokeWidth="4" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill="#9A3412"
        fontFamily="Arial, sans-serif"
      >
        S
      </text>
    </svg>
  )
}

export default SCoinIcon
