import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store'
import { authService } from '../services/auth'
import { userProfileService } from '../services/user-profile'
import { Input, Button } from '../components/UI'

const Login = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    console.log('🔵 handleSubmit called!', { email: formData.email })
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    
    try {
      console.log('🟡 Attempting login with:', formData.email)
      const result = await authService.login(formData.email, formData.password)
      console.log('🟢 Login result:', result)
      
      if (result.success) {
        // Check if user profile exists, if not create it
        const userId = result.user.id
        const profileResult = await userProfileService.getUserProfile(userId)
        
        if (!profileResult.success) {
          // Create profile if it doesn't exist
          await userProfileService.createUserProfile(userId, {
            id: userId,
            name: result.user.name,
            email: result.user.email,
            bio: '',
            avatar: null,
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
        }
        
        setAuth(result.user.token, result.user)
        
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate('/dashboard')
        }, 100)
      } else {
        // Firebase error messages
        let errorMsg = result.error || 'Login failed'
        
        // Translate Firebase errors to user-friendly messages
        if (errorMsg.includes('user-not-found')) {
          errorMsg = 'Email does not exist. Please register first.'
        } else if (errorMsg.includes('wrong-password')) {
          errorMsg = 'Incorrect password. Please try again.'
        } else if (errorMsg.includes('invalid-email')) {
          errorMsg = 'Invalid email format.'
        } else if (errorMsg.includes('too-many-requests')) {
          errorMsg = 'Too many login attempts. Please try again later.'
        }
        
        setError(errorMsg)
      }
    } catch (err) {
      setError('An error occurred during login')
      console.error('Login error:', err)
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
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              className="w-full mt-6" 
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-indigo-600 font-semibold hover:underline">
              Create one
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
