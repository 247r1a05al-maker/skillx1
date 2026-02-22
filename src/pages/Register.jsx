import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getDatabase, ref, set, get } from 'firebase/database'
import './Register.css'

// Helper function to encode email for Firebase paths (safe for any special characters)
const encodeEmailForPath = (email) => {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
}

const Register = () => {
  const navigate = useNavigate()
  const auth = getAuth()
  const db = getDatabase()
  const EMAIL_WORKER_URL = import.meta.env.VITE_EMAIL_WORKER_URL

  // Form states
  const [step, setStep] = useState(1) // Step 1: Email, Step 2: OTP, Step 3: Registration
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
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

  // Step 1: Send OTP (Firebase)
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
      // Generate 6-digit OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(newOtp)
      setOtp(newOtp)

      // Store OTP in Firebase with 10-minute expiry (using encoded email as key)
      const encodedEmail = encodeEmailForPath(email)
      const otpRef = ref(db, `otps/${encodedEmail}`)
      await set(otpRef, {
        code: newOtp,
        timestamp: Date.now(),
        expiry: Date.now() + 600000, // 10 minutes
      })

      if (EMAIL_WORKER_URL) {
        // Send OTP via Cloudflare Worker (Brevo API key stays on server)
        const response = await fetch(`${EMAIL_WORKER_URL}/send-otp`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            to: email,
            code: newOtp
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to send email')
        }

        setSuccess('OTP sent to your email. Please check your inbox/spam.')
      } else {
        // Email service not configured: use manual OTP auto-fill
        setSuccess('OTP generated. Please verify the auto-filled code.')
      }
      setStep(2)
      setOtpCountdown(60)
    } catch (err) {
      console.error('❌ OTP send error:', err)
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP (Firebase)
  const handleVerifyOtp = async () => {
    setError('')
    setSuccess('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      // Get OTP from Firebase (using encoded email as key)
      const encodedEmail = encodeEmailForPath(email)
      console.log('🔍 Looking for OTP with encoded email:', encodedEmail)
      const otpRef = ref(db, `otps/${encodedEmail}`)
      const snapshot = await get(otpRef)

      if (!snapshot.exists()) {
        console.error('❌ OTP not found in Firebase')
        throw new Error('OTP not found. Please request a new one.')
      }

      const otpData = snapshot.val()
      console.log('📦 Retrieved OTP data:', otpData)

      // Check if OTP is expired
      if (Date.now() > otpData.expiry) {
        throw new Error('OTP has expired. Please request a new one.')
      }

      // Check if OTP matches
      if (otp !== otpData.code) {
        throw new Error('Invalid OTP. Please try again.')
      }

      console.log('✅ OTP verified successfully')
      setSuccess('Email verified! Now create your account.')
      setStep(3)
    } catch (err) {
      console.error('❌ OTP verification error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Register (Firebase)
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
      // Check if username already exists
      const usersRef = ref(db, 'users')
      const snapshot = await get(usersRef)
      if (snapshot.exists()) {
        const users = snapshot.val()
        for (const userId in users) {
          if (users[userId].username === username.toLowerCase()) {
            throw new Error('Username already taken')
          }
        }
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid

      // Store user data in Realtime Database
      const userRef = ref(db, `users/${userId}`)
      await set(userRef, {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        name: username,
        avatar: '',
        bio: '',
        followers: 0,
        following: 0,
        coins: 0,
        certificates: 0,
        groups: 0,
        skills: {
          teaching: [],
          learning: [],
        },
        createdAt: Date.now(),
      })

      // Clean up OTP
      const encodedEmail = encodeEmailForPath(email)
      const otpRef = ref(db, `otps/${encodedEmail}`)
      await set(otpRef, null)

      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Registration failed')
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
