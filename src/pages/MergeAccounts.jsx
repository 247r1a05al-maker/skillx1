import React, { useState } from 'react'
import { getDatabase, ref, set, get as firebaseGet, remove } from 'firebase/database'
import { getApp } from 'firebase/app'

export default function MergeAccountsPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMerge = async () => {
    setLoading(true)
    setStatus('Fetching user data from Firebase...')

    try {
      // Use existing Firebase app instance
      const firebaseApp = getApp()
      const realtimeDb = getDatabase(firebaseApp)

      const usersRef = ref(realtimeDb, 'users')
      const snapshot = await firebaseGet(usersRef)

      if (!snapshot.exists()) {
        setStatus('❌ No users found')
        setLoading(false)
        return
      }

      const users = snapshot.val()
      let karthikUser = null
      let karthik02User = null
      let karthikId = null
      let karthik02Id = null

      // Find both accounts
      for (const [userId, userData] of Object.entries(users)) {
        if (userData.username === 'karthik') {
          karthikUser = userData
          karthikId = userId
        }
        if (userData.username === 'karthik_02_') {
          karthik02User = userData
          karthik02Id = userId
        }
      }

      if (!karthikUser) {
        setStatus('❌ karthik account not found')
        setLoading(false)
        return
      }

      if (!karthik02User) {
        setStatus('❌ karthik_02_ account not found')
        setLoading(false)
        return
      }

      setStatus('Updating karthik account with your email...')
      
      // Update karthik with email
      karthikUser.email = '247r1a05al@cmrtc.ac.in'
      await set(ref(realtimeDb, `users/${karthikId}`), karthikUser)

      setStatus('Deleting karthik_02_ account...')
      
      // Delete karthik_02_
      await remove(ref(realtimeDb, `users/${karthik02Id}`))

      setStatus('✨ Success! Your karthik_02_ account has been deleted and your email is now connected to the karthik account!')
      setLoading(false)
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Merge Accounts</h1>
      <p>This will delete karthik_02_ and assign your email to karthik</p>
      <button
        onClick={handleMerge}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Processing...' : 'Merge Accounts'}
      </button>
      <p style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>{status}</p>
    </div>
  )
}
