import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiUsers, FiInbox } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useNavigate } from 'react-router-dom'

const GroupInvitations = () => {
  const { user: authUser } = useAuthStore()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  // Load invitations and groups
  useEffect(() => {
    if (!authUser) return

    setIsLoading(true)
    try {
      const userId = authUser.uid || authUser.id

      // Subscribe to invitations
      const unsubscribeInvitations = firebaseRealtime.subscribeToGroupInvitations(
        userId,
        (invites) => {
          setInvitations(invites)
          setIsLoading(false)
        }
      )

      // Subscribe to groups to get names
      const unsubscribeGroups = firebaseRealtime.subscribeToGroups((grps) => {
        setGroups(grps)
      })

      return () => {
        unsubscribeInvitations()
        unsubscribeGroups()
      }
    } catch (error) {
      console.error('Error loading invitations:', error)
      setIsLoading(false)
    }
  }, [authUser])

  // Accept invitation
  const handleAcceptInvitation = async (groupId) => {
    setProcessingId(groupId)
    try {
      const userId = authUser.uid || authUser.id
      const result = await firebaseRealtime.acceptGroupInvitation(groupId, userId)

      if (result.success) {
        alert('Joined group successfully!')
        // Navigate to group chat
        setTimeout(() => navigate(`/group-chat/${groupId}`), 500)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      alert('Error accepting invitation')
    } finally {
      setProcessingId(null)
    }
  }

  // Decline invitation
  const handleDeclineInvitation = async (groupId) => {
    if (window.confirm('Are you sure you want to decline this invitation?')) {
      setProcessingId(groupId)
      try {
        const userId = authUser.uid || authUser.id
        const result = await firebaseRealtime.declineGroupInvitation(groupId, userId)

        if (result.success) {
          alert('Invitation declined')
        } else {
          alert('Error: ' + result.error)
        }
      } catch (error) {
        console.error('Error declining invitation:', error)
        alert('Error declining invitation')
      } finally {
        setProcessingId(null)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Group Invitations</h1>
          <p className="text-gray-600">You have {invitations.length} group invitation{invitations.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Invitations List */}
        {invitations.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {invitations.map((invitation) => {
                const group = groups.find((g) => g.id === invitation.groupId)
                return (
                  <motion.div
                    key={invitation.groupId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FiUsers size={24} className="text-indigo-600" />
                            <h3 className="text-xl font-bold text-gray-900">{group?.name || 'Group'}</h3>
                          </div>
                          <p className="text-gray-600 mb-4">{group?.description}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                              {group?.skillCategory || 'General'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiUsers size={16} />
                              {group?.memberCount || 0} members
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 ml-4">
                          <Button
                            variant="primary"
                            onClick={() => handleAcceptInvitation(invitation.groupId)}
                            disabled={processingId === invitation.groupId}
                            className="flex items-center gap-2"
                          >
                            <FiCheck size={18} />
                            {processingId === invitation.groupId ? 'Joining...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeclineInvitation(invitation.groupId)}
                            disabled={processingId === invitation.groupId}
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <FiX size={18} />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="text-center py-12">
            <FiInbox size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No pending invitations</p>
            <p className="text-sm text-gray-500 mb-6">Join groups from the Groups page to start collaborating</p>
            <Button
              variant="primary"
              onClick={() => navigate('/groups')}
              className="inline-flex items-center gap-2"
            >
              <FiUsers size={18} /> Explore Groups
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GroupInvitations
