import express from 'express'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set } from 'firebase/database'

const router = express.Router()

// Firebase config (same as frontend)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBe5Eyt_5f5p6vxLxB_8qH5m2nZ7eJ2qK1',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'skill-exchange-d4f26.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'skill-exchange-d4f26',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'skill-exchange-d4f26.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '382865728329',
  appId: process.env.FIREBASE_APP_ID || '1:382865728329:web:c1f2e8a3b4d5e6f7g8h9i0j',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://skill-exchange-d4f26-default-rtdb.firebaseio.com'
}

const firebaseApp = initializeApp(firebaseConfig)
const realtimeDb = getDatabase(firebaseApp)

// In-memory stores (demo only)
const otpStore = new Map()
const verifiedStore = new Map()
const userStore = new Map() // key: email -> user
const usernameStore = new Map() // key: username -> email

const getMailUser = () => process.env.GMAIL_USER || process.env.MAIL_USER
const getMailPass = () => process.env.GMAIL_APP_PASSWORD || process.env.MAIL_PASSWORD

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: getMailUser(),
    pass: getMailPass(),
  },
})

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

const setOtp = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  })
}

const markVerified = (email) => {
  verifiedStore.set(email, {
    token: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + 30 * 60 * 1000,
  })
}

const isVerified = (email) => {
  const entry = verifiedStore.get(email)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    verifiedStore.delete(email)
    return false
  }
  return true
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    if (userStore.has(email.toLowerCase())) {
      return res.status(400).json({ message: 'This email is already registered' })
    }

    const otp = generateOTP()
    setOtp(email, otp)

    await transporter.sendMail({
      from: getMailUser(),
      to: email,
      subject: 'Your SkillEx OTP',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your OTP</h2>
          <p>Use this code to verify your email:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    })

    return res.json({ message: 'OTP sent' })
  } catch (err) {
    console.error('send-otp error:', err)
    return res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' })
    }

    const entry = otpStore.get(email)
    if (!entry) {
      return res.status(400).json({ message: 'OTP not found. Please request again.' })
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ message: 'OTP expired. Please request again.' })
    }

    if (entry.attempts >= 5) {
      otpStore.delete(email)
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' })
    }

    if (entry.otp !== otp) {
      entry.attempts += 1
      otpStore.set(email, entry)
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    otpStore.delete(email)
    markVerified(email)

    return res.json({ message: 'OTP verified' })
  } catch (err) {
    console.error('verify-otp error:', err)
    return res.status(500).json({ message: 'Failed to verify OTP' })
  }
})

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required' })
    }

    if (!isVerified(email)) {
      return res.status(400).json({ message: 'Email not verified' })
    }

    const emailKey = email.toLowerCase()
    const usernameKey = username.toLowerCase()

    if (userStore.has(emailKey)) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    if (usernameStore.has(usernameKey)) {
      return res.status(400).json({ message: 'Username already taken' })
    }

    const user = {
      id: crypto.randomBytes(12).toString('hex'),
      email: emailKey,
      username: usernameKey,
      name: username,
      coins: 0,
      followers: 0,
      following: 0,
      completedExchanges: 0,
      rating: 0,
      skills: [],
      bio: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    }

    userStore.set(emailKey, user)
    usernameStore.set(usernameKey, emailKey)
    verifiedStore.delete(email)

    // Sync user to Firebase Realtime Database
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`)
      await set(userRef, {
        ...user,
        isOnline: true,
      })
      console.log('✅ User synced to Firebase:', user.id)
    } catch (firebaseErr) {
      console.error('⚠️ Firebase sync error:', firebaseErr)
      // Don't fail registration if Firebase sync fails
    }

    return res.status(201).json({
      message: 'Registered successfully',
      user,
    })
  } catch (err) {
    console.error('register error:', err)
    return res.status(500).json({ message: 'Registration failed' })
  }
})

export default router
