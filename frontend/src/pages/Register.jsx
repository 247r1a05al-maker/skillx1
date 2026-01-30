import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiUser } from 'react-icons/fi'
import { useAuthStore } from '../store'
import { authService } from '../services/auth'
import { userProfileService } from '../services/user-profile'
import { Input, Button } from '../components/UI'

const Register = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address (e.g., user@example.com)')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    
    try {
      const result = await authService.register(
        formData.email,
        formData.password,
        formData.name
      )
      
      if (result.success) {
        // Create user profile in Firebase Realtime Database
        const userId = result.user.id
        await userProfileService.createUserProfile(userId, {
          id: userId,
          name: formData.name,
          email: formData.email,
          bio: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          followers: 0,
          following: 0,
          coins: 0,
          certificates: 0,
          groups: 0,
          skills: {
            teaching: [],
            learning: [],
          },
        })
        
        setAuth(result.user.token, result.user)
        
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate('/dashboard')
        }, 100)
      } else {
        // Firebase error messages
        let errorMsg = result.error || 'Registration failed'
        
        // Translate Firebase errors to user-friendly messages
        if (errorMsg.includes('email-already-in-use')) {
          errorMsg = 'This email is already registered. Please login instead.'
        } else if (errorMsg.includes('weak-password')) {
          errorMsg = 'Password is too weak. Use at least 6 characters.'
        } else if (errorMsg.includes('invalid-email')) {
          errorMsg = 'Invalid email format.'
        } else if (errorMsg.includes('too-many-requests')) {
          errorMsg = 'Too many registration attempts. Please try again later.'
        }
        
        setError(errorMsg)
      }
    } catch (err) {
      setError('An error occurred during registration')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              SE
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SkillEx</h1>
            <p className="text-gray-600 mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={error && !formData.name ? 'Name is required' : ''}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              error={error && !formData.email ? 'Email is required' : ''}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={error && formData.password !== formData.confirmPassword ? error : ''}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {error && !formData.password && <p className="text-red-500 text-sm">{error}</p>}

            <Button variant="primary" size="lg" className="w-full mt-6" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Register
