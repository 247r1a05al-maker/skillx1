import { ref, set, get, update, serverTimestamp } from 'firebase/database'
import { realtimeDb } from '../config/firebase'

/**
 * User Profile Service
 * Manages user profile data in Firebase
 */

export const userProfileService = {
  // Create user profile
  async createUserProfile(userId, profileData) {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`)
      await set(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`)
      const snapshot = await get(userRef)
      
      if (snapshot.exists()) {
        return {
          success: true,
          data: snapshot.val(),
        }
      } else {
        return {
          success: false,
          error: 'User profile not found',
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`)
      await update(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user skills
  async getUserSkills(userId) {
    try {
      const skillsRef = ref(realtimeDb, `users/${userId}/skills`)
      const snapshot = await get(skillsRef)
      
      if (snapshot.exists()) {
        return {
          success: true,
          data: snapshot.val(),
        }
      } else {
        return {
          success: true,
          data: [],
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Add user skill
  async addUserSkill(userId, skill) {
    try {
      const skillRef = ref(realtimeDb, `users/${userId}/skills/${skill.id}`)
      await set(skillRef, {
        ...skill,
        addedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Remove user skill
  async removeUserSkill(userId, skillId) {
    try {
      const skillRef = ref(realtimeDb, `users/${userId}/skills/${skillId}`)
      await update(skillRef, {
        deletedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user certificates
  async getUserCertificates(userId) {
    try {
      const certsRef = ref(realtimeDb, `users/${userId}/certificates`)
      const snapshot = await get(certsRef)
      
      if (snapshot.exists()) {
        return {
          success: true,
          data: snapshot.val(),
        }
      } else {
        return {
          success: true,
          data: [],
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Add certificate
  async addCertificate(userId, certificate) {
    try {
      const certRef = ref(realtimeDb, `users/${userId}/certificates/${certificate.id}`)
      await set(certRef, {
        ...certificate,
        earnedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user coins
  async getUserCoins(userId) {
    try {
      const coinsRef = ref(realtimeDb, `users/${userId}/coins`)
      const snapshot = await get(coinsRef)
      
      if (snapshot.exists()) {
        return {
          success: true,
          coins: snapshot.val(),
        }
      } else {
        return {
          success: true,
          coins: 0,
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user coins
  async updateUserCoins(userId, amount) {
    try {
      const coinsRef = ref(realtimeDb, `users/${userId}/coins`)
      const snapshot = await get(coinsRef)
      const currentCoins = snapshot.exists() ? snapshot.val() : 0
      
      await set(coinsRef, currentCoins + amount)
      return { success: true, coins: currentCoins + amount }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

export default userProfileService
