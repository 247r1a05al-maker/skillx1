import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiArrowRight } from 'react-icons/fi'
import { Button } from './UI'

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to SkillEx!',
    content: 'Your platform for skill exchange and learning. Let me show you around!',
    highlight: null
  },
  {
    id: 'coins',
    title: '💰 Earn Coins',
    content: 'Complete challenges and tasks to earn coins. Use them to book learning sessions!',
    highlight: 'coins'
  },
  {
    id: 'challenges',
    title: '🎯 Daily Challenges',
    content: 'Complete daily challenges to stay engaged and earn bonus rewards!',
    highlight: 'challenges'
  },
  {
    id: 'badges',
    title: '🏆 Unlock Badges',
    content: 'Collect achievement badges as you progress. Show off your accomplishments!',
    highlight: 'badges'
  },
  {
    id: 'explore',
    title: '🔍 Discover People',
    content: 'Browse amazing mentors and learners. Connect and start exchanging skills!',
    highlight: 'explore'
  }
]

export const WelcomeTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour')
    if (!hasSeenTour) {
      setTimeout(() => setShow(true), 1000)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('hasSeenTour', 'true')
    setShow(false)
    onComplete?.()
  }

  if (!show) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={24} />
          </button>

          {/* Content */}
          <div className="text-center">
            <motion.div
              key={step.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                {step.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {step.content}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-8 bg-indigo-600'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleSkip}
              >
                Skip Tour
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleNext}
              >
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <>
                    Next <FiArrowRight />
                  </>
                ) : (
                  'Get Started!'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default WelcomeTour
