import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { getDatabase, ref, get } from 'firebase/database'
import { auth } from '../config/firebase'

/**
 * Firebase Authentication Service
 * Handles user registration, login, and logout
 */

export const authService = {
  // Register new user
  async register(email, password, displayName) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        })
      }
      
      return {
        success: true,
        user: {
          id: userCredential.user.uid,
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || 'User',
          token: await userCredential.user.getIdToken(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  },

  // Login with email and password
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      
      // INSTANTLY load user data from Firebase (including coins) - using static import
      const db = getDatabase()
      const userRef = ref(db, `users/${userCredential.user.uid}`)
      const snapshot = await get(userRef)
      
      let userData = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        token: token,
        coins: 0, // Default
      }
      
      // If user data exists in Firebase, merge it
      if (snapshot.exists()) {
        const firebaseData = snapshot.val()
        userData = {
          ...userData,
          name: firebaseData.name || userData.name,
          coins: firebaseData.coins || 0,
          avatar: firebaseData.avatar,
          bio: firebaseData.bio,
          followers: firebaseData.followers || 0,
          following: firebaseData.following || 0,
          totalCoinsEarned: firebaseData.totalCoinsEarned || 0,
          skillsTaught: firebaseData.skillsTaught || 0,
          skillsLearned: firebaseData.skillsLearned || 0,
        }
        console.log(`🚀 LOGIN: User data loaded instantly | Coins: ${userData.coins}`)
      }
      
      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current user
  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken()
          
          // Load user data from Firebase including coins - using static import
          const db = getDatabase()
          const userRef = ref(db, `users/${user.uid}`)
          const snapshot = await get(userRef)
          
          let userData = {
            id: user.uid,
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            token: token,
            coins: 0,
          }
          
          if (snapshot.exists()) {
            const firebaseData = snapshot.val()
            userData = {
              ...userData,
              name: firebaseData.name || userData.name,
              coins: firebaseData.coins || 0,
              avatar: firebaseData.avatar,
              bio: firebaseData.bio,
            }
          }
          
          resolve(userData)
        } else {
          resolve(null)
        }
        unsubscribe()
      })
    })
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        callback({
          id: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          token: token,
        })
      } else {
        callback(null)
      }
    })
  },

  // Check if email exists in Firebase Auth
  async checkEmailExists(email) {
    try {
      // Try to sign in with the email (will fail if doesn't exist)
      // We use fetchSignInMethodsForEmail if available, or try login to test
      const methods = await auth.fetchSignInMethodsForEmail(email)
      return methods && methods.length > 0
    } catch (error) {
      // If email doesn't exist, Firebase will throw error
      if (error.code === 'auth/user-not-found') {
        return false
      }
      // For other errors, we'll try a different approach
      return false
    }
  },

  // Check if email is already registered
  async isEmailRegistered(email) {
    try {
      const methods = await auth.fetchSignInMethodsForEmail(email)
      return methods && methods.length > 0
    } catch (error) {
      return false
    }
  },
}

export default authService
