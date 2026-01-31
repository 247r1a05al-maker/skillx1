import { Variants } from 'framer-motion'

export const robotContainerVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
}

export const breathingVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const walkingVariants: Variants = {
  animate: {
    x: [0, 8, -8, 0],
    y: [0, -4, 0, -4],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const blinkingVariants: Variants = {
  animate: {
    scaleY: [1, 0.05, 1],
    transition: {
      duration: 0.2,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
}

export const jumpingVariants: Variants = {
  animate: {
    y: [0, -50, 0],
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
    },
  },
}

export const wavingVariants: Variants = {
  animate: {
    rotate: [0, 20, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
}

export const dancingVariants: Variants = {
  animate: {
    rotate: [0, -10, 10, -10, 10, 0],
    y: [0, -10, -5, -10, -5, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const sleepingVariants: Variants = {
  animate: {
    y: [0, -3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const celebratingVariants: Variants = {
  animate: {
    y: [0, -20, -15, -20, 0],
    rotate: [0, 15, -15, 15, 0],
    scale: [1, 1.1, 1.05, 1.1, 1],
    transition: {
      duration: 1,
      ease: 'easeInOut',
    },
  },
}

export const chatBubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: { duration: 0.2 },
  },
}

export const typingDotVariants: Variants = {
  animate: (custom: number) => ({
    y: [0, -10, 0],
    transition: {
      delay: custom * 0.1,
      duration: 0.6,
      repeat: Infinity,
    },
  }),
}

export const eyeFollowVariants: Variants = {
  animate: (mousePos: { x: number; y: number }) => ({
    x: mousePos.x * 0.1,
    y: mousePos.y * 0.1,
    transition: { duration: 0.2 },
  }),
}
