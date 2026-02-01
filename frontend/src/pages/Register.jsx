import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './Register.css'

const Register = () => {
  const navigate = useNavigate()

  // Form states
  const [step, setStep] = useState(1) // Step 1: Email, Step 2: OTP, Step 3: Registration
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(0)

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCountdown])

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }

      setSuccess('OTP sent to your email!')
      setStep(2)
      setOtpCountdown(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError('')
    setSuccess('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP')
      }

      setSuccess('Email verified! Now create your account.')
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Register
  const handleRegister = async () => {
    setError('')
    setSuccess('')

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <motion.div className="register-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Register</h1>

        <AnimatePresence>
          {error && (
            <motion.div className="alert alert-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div className="alert alert-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckCircle size={20} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Email */}
        {step === 1 && (
          <motion.div className="form-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-group">
                <Mail size={20} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
              {loading ? <Loader size={20} className="spinner" /> : 'Send OTP'}
            </button>
          </motion.div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <motion.div className="form-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="form-group">
              <label>Enter OTP</label>
              <div className="input-group">
                <Lock size={20} />
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>
              <span className="countdown">{otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Code expired'}</span>
            </div>
            <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? <Loader size={20} className="spinner" /> : 'Verify OTP'}
            </button>
          </motion.div>
        )}

        {/* Step 3: Register */}
        {step === 3 && (
          <motion.div className="form-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-group">
                <User size={20} />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-group">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-group">
                <Lock size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? <Loader size={20} className="spinner" /> : 'Create Account'}
            </button>
          </motion.div>
        )}

        <p className="login-link">
          Already have an account? <a href="/skillx1/#/login">Login here</a>
        </p>
      </motion.div>
    </div>
  )
}

export default Register
