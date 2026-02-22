import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { Card, Button } from '../components/UI'

const FollowRequests = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuthStore()
  const [followRequests, setFollowRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState(new Set())
  const [requestsWithUsers, setRequestsWithUsers] = useState([])

  // Subscribe to follow requests
  useEffect(() => {
    if (!authUser?.uid && !authUser?.id) return

    const userId = authUser.uid || authUser.id
    
    // Subscribe to users list
    const unsubscribeUsers = firebaseRealtime.subscribeToUsers((users) => {
      // Deduplicate users by ID
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values())
      
      // Subscribe to follow requests for this user
      const unsubscribeRequests = firebaseRealtime.subscribeToFollowRequests(userId, (requests) => {
        // Deduplicate requests by ID
        const uniqueRequests = Array.from(new Map(requests.map(r => [r.id, r])).values())
        
        // Match requests with user details
        const enrichedRequests = uniqueRequests.map((req) => {
          const requestingUser = uniqueUsers.find((u) => u.id === req.fromUserId)
          return {
            ...req,
            user: requestingUser || { 
              id: req.fromUserId, 
              name: 'Unknown User',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.fromUserId}`,
            },
          }
        })
        setRequestsWithUsers(enrichedRequests)
        setFollowRequests(uniqueRequests)
        setIsLoading(false)
      })

      return () => unsubscribeRequests?.()
    })

    return () => unsubscribeUsers?.()
  }, [authUser])

  const handleAccept = async (request) => {
    setProcessingIds((prev) => new Set(prev).add(request.id))
    
    try {
      const success = await firebaseRealtime.acceptFollowRequest(
        request.fromUserId,
        request.toUserId
      )
      
      if (success) {
        // Request will be removed from the list automatically due to subscription
        alert(`You are now following ${request.user?.name}! 🎉`)
      } else {
        alert('Failed to accept request')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Error: ' + error.message)
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(request.id)
        return newSet
      })
    }
  }

  const handleDecline = async (request) => {
    setProcessingIds((prev) => new Set(prev).add(request.id))
    
    try {
      const success = await firebaseRealtime.declineFollowRequest(
        request.fromUserId,
        request.toUserId
      )
      
      if (success) {
        alert('Follow request declined')
      } else {
        alert('Failed to decline request')
      }
    } catch (error) {
      console.error('Error declining request:', error)
      alert('Error: ' + error.message)
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(request.id)
        return newSet
      })
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Go back"
        >
          <FiArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow Requests</h1>
          <p className="text-gray-600 mt-1">
            {followRequests.length} pending request{followRequests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading follow requests...</p>
        </Card>
      )}

      {/* Follow Requests List */}
      {!isLoading && (
        <>
          {requestsWithUsers.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {requestsWithUsers.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* User Avatar */}
                      <img
                        src={
                          request.user?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUserId}`
                        }
                        alt={request.user?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      {/* User Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{request.user?.name}</p>
                        <p className="text-xs text-gray-500">
                          {request.user?.bio || 'No bio yet'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request)}
                        disabled={processingIds.has(request.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Accept"
                      >
                        <FiCheck size={20} />
                      </button>
                      <button
                        onClick={() => handleDecline(request)}
                        disabled={processingIds.has(request.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Decline"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="py-12 text-center">
              <p className="text-gray-600 text-lg font-semibold">No pending follow requests</p>
              <p className="text-gray-500 text-sm mt-2">
                When someone follows you, their request will appear here
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default FollowRequests
