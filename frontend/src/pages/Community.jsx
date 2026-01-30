import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiSend, FiTrash2, FiX, FiImage } from 'react-icons/fi'
import { Card, Button } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'

const Community = () => {
  const { user: authUser } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState({})
  const [newPostContent, setNewPostContent] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('') // 'image' or 'video'
  const [showMediaInput, setShowMediaInput] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [postComments, setPostComments] = useState({})
  const [postLikes, setPostLikes] = useState({})
  const [isLoadingLikes, setIsLoadingLikes] = useState({})
  const [postError, setPostError] = useState('')

  // Load users first
  useEffect(() => {
    if (!authUser) return

    const unsubscribeUsers = firebaseRealtime.subscribeToUsers((loadedUsers) => {
      const usersMap = {}
      loadedUsers.forEach(user => {
        usersMap[user.id] = user
      })
      setUsers(usersMap)
    })

    return () => unsubscribeUsers()
  }, [authUser])

  // Load posts and their like statuses
  useEffect(() => {
    if (!authUser) return

    const unsubscribePosts = firebaseRealtime.subscribeToPosts(async (loadedPosts) => {
      // Remove duplicates by ID
      const uniquePosts = Array.from(new Map(loadedPosts.map(post => [post.id, post])).values())
      setPosts(uniquePosts)
      
      // Check like status for each post
      const currentUserId = authUser.uid || authUser.id
      const likeStatuses = {}
      
      for (const post of uniquePosts) {
        try {
          const liked = await firebaseRealtime.checkIfLiked(post.id, currentUserId)
          likeStatuses[post.id] = liked
        } catch (error) {
          console.error('Error checking like status:', error)
          likeStatuses[post.id] = false
        }
      }
      
      setPostLikes(likeStatuses)
    })

    return () => unsubscribePosts()
  }, [authUser])

  // Handle create post
  const handleCreatePost = async () => {
    setPostError('')
    
    // Validation
    if (!authUser) {
      setPostError('You must be logged in to create a post')
      return
    }

    if (!newPostContent || !newPostContent.trim()) {
      setPostError('Post content cannot be empty')
      return
    }

    if (newPostContent.trim().length < 3) {
      setPostError('Post must be at least 3 characters long')
      return
    }

    // Validate media if media type is selected
    if (mediaType) {
      if (!mediaUrl) {
        setPostError(`Please provide a URL for the ${mediaType}`)
        return
      }
      
      if (!isValidUrl(mediaUrl)) {
        setPostError('Please provide a valid URL')
        return
      }
    }

    setIsCreating(true)
    try {
      const postData = {
        authorId: authUser.uid || authUser.id,
        content: newPostContent.trim(),
        tags: [],
      }

      if (mediaType === 'image' && mediaUrl) {
        postData.image = mediaUrl
      } else if (mediaType === 'video' && mediaUrl) {
        postData.video = mediaUrl
      }

      console.log('Creating post with data:', postData)
      const result = await firebaseRealtime.createPost(postData)

      if (result.success) {
        console.log('Post created successfully:', result.postId)
        setNewPostContent('')
        setMediaUrl('')
        setMediaType('')
        setShowMediaInput(false)
        setShowPostForm(false)
        setPostError('')
      } else {
        setPostError(result.error || 'Failed to create post')
        console.error('Post creation failed:', result.error)
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred while creating the post'
      setPostError(errorMessage)
      console.error('Error creating post:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Handle like toggle with optimistic update
  const handleToggleLike = useCallback(async (postId, e) => {
    e?.stopPropagation()
    if (!authUser || isLoadingLikes[postId]) return

    const currentUserId = authUser.uid || authUser.id
    const wasLiked = postLikes[postId]
    const post = posts.find(p => p.id === postId)

    // Optimistic update
    setPostLikes(prev => ({ ...prev, [postId]: !wasLiked }))
    setIsLoadingLikes(prev => ({ ...prev, [postId]: true }))

    try {
      const result = await firebaseRealtime.toggleLike(postId, currentUserId)
      
      if (result.success) {
        // Update with actual result
        setPostLikes(prev => ({ ...prev, [postId]: result.liked }))
        
        // Send notification if liked (not unliked) and not own post
        if (result.liked && post && post.authorId !== currentUserId) {
          await firebaseRealtime.sendNotification(post.authorId, {
            type: 'like',
            message: 'liked your post',
            fromUserId: currentUserId,
            fromUserName: authUser.name || authUser.displayName || 'Someone',
            link: `/community`,
            createdAt: new Date().toISOString(),
          })
        }
      } else {
        // Revert on error
        setPostLikes(prev => ({ ...prev, [postId]: wasLiked }))
        console.error('Error toggling like:', result.error)
      }
    } catch (error) {
      // Revert on error
      setPostLikes(prev => ({ ...prev, [postId]: wasLiked }))
      console.error('Error toggling like:', error)
    } finally {
      setIsLoadingLikes(prev => ({ ...prev, [postId]: false }))
    }
  }, [authUser, postLikes, isLoadingLikes, posts])

  // Handle add comment
  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !authUser) return

    const currentUserId = authUser.uid || authUser.id
    const post = posts.find(p => p.id === postId)
    
    try {
      const result = await firebaseRealtime.addComment(postId, currentUserId, commentText)
      if (result.success) {
        setCommentText('')
        
        // Send notification to post author (if not commenting on own post)
        if (post && post.authorId !== currentUserId) {
          await firebaseRealtime.sendNotification(post.authorId, {
            type: 'comment',
            message: 'commented on your post',
            fromUserId: currentUserId,
            fromUserName: authUser.name || authUser.displayName || 'Someone',
            link: `/community`,
            createdAt: new Date().toISOString(),
          })
        }
      } else {
        alert('Error adding comment: ' + result.error)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Error adding comment')
    }
  }

  // Handle delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return

    const currentUserId = authUser.uid || authUser.id
    
    try {
      const result = await firebaseRealtime.deletePost(postId, currentUserId)
      if (result.success) {
        setSelectedPost(null)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    }
  }

  // Subscribe to comments when post is selected
  useEffect(() => {
    if (!selectedPost) return

    const unsubscribe = firebaseRealtime.subscribeToComments(selectedPost.id, (comments) => {
      setPostComments(prev => ({ ...prev, [selectedPost.id]: comments }))
    })

    return () => unsubscribe()
  }, [selectedPost?.id])

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getAuthorData = (authorId) => {
    const user = users[authorId]
    if (!user) return { name: 'Unknown User', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}` }
    return {
      name: user.name || user.displayName || 'User',
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}`
    }
  }


  // Suggested topics to inspire posts
  const suggestedTopics = [
    { emoji: '💡', text: 'Share a learning tip', color: 'bg-yellow-100 text-yellow-800' },
    { emoji: '🎯', text: 'What are you learning?', color: 'bg-blue-100 text-blue-800' },
    { emoji: '🚀', text: 'Share your progress', color: 'bg-green-100 text-green-800' },
    { emoji: '❓', text: 'Ask for help', color: 'bg-purple-100 text-purple-800' },
    { emoji: '🏆', text: 'Celebrate a win', color: 'bg-orange-100 text-orange-800' },
  ]

  const trendingHashtags = ['#WebDev', '#Python', '#DataScience', '#Design', '#AI', '#JavaScript']

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Community</h1>
              <p className="text-gray-600">Share your knowledge and connect with others</p>
            </motion.div>

            {/* Suggested Topics */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {suggestedTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShowPostForm(true)
                    setNewPostContent(`${topic.emoji} `)
                  }}
                  className={`${topic.color} px-3 py-1.5 rounded-full text-sm font-medium hover:shadow-md transition-all transform hover:scale-105`}
                >
                  {topic.emoji} {topic.text}
                </button>
              ))}
            </motion.div>

            {/* Create Post Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
            {!showPostForm ? (
              <button
                onClick={() => setShowPostForm(true)}
                className="w-full text-left px-4 py-3 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition"
              >
                What's on your mind?
              </button>
            ) : (
              <div className="space-y-4">
                {/* Error Message */}
                {postError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{postError}</p>
                  </div>
                )}

                <textarea
                  value={newPostContent}
                  onChange={(e) => {
                    setNewPostContent(e.target.value)
                    if (postError) setPostError('')
                  }}
                  placeholder="Share something with the community..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
                />
                
                {/* Media Input */}
                {showMediaInput && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMediaType('image')
                          if (postError) setPostError('')
                        }}
                        className={`px-4 py-2 rounded-lg transition ${mediaType === 'image' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                      >
                        Image
                      </button>
                      <button
                        onClick={() => {
                          setMediaType('video')
                          if (postError) setPostError('')
                        }}
                        className={`px-4 py-2 rounded-lg transition ${mediaType === 'video' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                      >
                        Video
                      </button>
                    </div>
                    {mediaType && (
                      <input
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => {
                          setMediaUrl(e.target.value)
                          if (postError) setPostError('')
                        }}
                        placeholder={`Enter ${mediaType} URL (e.g., https://example.com/${mediaType}.jpg)`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                    {mediaUrl && mediaType === 'image' && (
                      <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    {mediaUrl && mediaType === 'video' && (
                      <video src={mediaUrl} controls className="w-full h-48 rounded-lg" onError={(e) => e.target.style.display = 'none'} />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowMediaInput(!showMediaInput)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <FiImage size={20} />
                    {showMediaInput ? 'Hide Media' : 'Add Media'}
                  </button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPostForm(false)
                        setNewPostContent('')
                        setMediaUrl('')
                        setMediaType('')
                        setShowMediaInput(false)
                        setPostError('')
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreatePost}
                      disabled={isCreating || !newPostContent.trim()}
                      className="flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Posts Feed */}
        <AnimatePresence mode="popLayout">
          {posts.map((post) => {
            const author = getAuthorData(post.authorId)
            const isOwnPost = post.authorId === (authUser?.uid || authUser?.id)
            const liked = postLikes[post.id] === true
            const likesCount = post.likesCount || 0
            const commentsCount = post.commentsCount || 0

            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{author.name}</h3>
                        <p className="text-sm text-gray-500">{formatTimestamp(post.createdAt)}</p>
                      </div>
                    </div>
                    {isOwnPost && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete post"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Media Display */}
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post media"
                      className="w-full rounded-lg mb-4 max-h-96 object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(post.image, '_blank')}
                    />
                  )}
                  {post.video && (
                    <video
                      src={post.video}
                      controls
                      className="w-full rounded-lg mb-4 max-h-96"
                    />
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => handleToggleLike(post.id, e)}
                      disabled={isLoadingLikes[post.id]}
                      className={`flex items-center gap-2 transition ${
                        liked 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      } ${isLoadingLikes[post.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiHeart 
                        size={20} 
                        fill={liked ? 'currentColor' : 'none'} 
                        className={isLoadingLikes[post.id] ? 'animate-pulse' : ''}
                      />
                      <span className="font-medium">{likesCount}</span>
                    </button>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition"
                    >
                      <FiMessageCircle size={20} />
                      <span className="font-medium">{commentsCount}</span>
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {posts.length === 0 && (
          <Card className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Start the Conversation!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Be the first to share your knowledge, ask questions, or inspire others in the community.
              </p>
              <Button
                onClick={() => setShowPostForm(true)}
                variant="primary"
                className="inline-flex items-center gap-2 mb-8"
              >
                <FiSend /> Create Your First Post
              </Button>
              
              <div className="mt-8">
                <p className="text-sm text-gray-500 mb-4 font-semibold">Get started with these ideas:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('💡 ') }}
                    className="bg-yellow-100 text-yellow-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">💡</div>
                    <p className="text-sm font-medium">Share a tip</p>
                  </button>
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('🎯 ') }}
                    className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-sm font-medium">Learning goal</p>
                  </button>
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('🚀 ') }}
                    className="bg-green-100 text-green-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <p className="text-sm font-medium">Your progress</p>
                  </button>
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('❓ ') }}
                    className="bg-purple-100 text-purple-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">❓</div>
                    <p className="text-sm font-medium">Ask for help</p>
                  </button>
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('🏆 ') }}
                    className="bg-orange-100 text-orange-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm font-medium">Celebrate win</p>
                  </button>
                  <button 
                    onClick={() => { setShowPostForm(true); setNewPostContent('📚 ') }}
                    className="bg-pink-100 text-pink-800 p-4 rounded-lg hover:shadow-md transition transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">📚</div>
                    <p className="text-sm font-medium">Resource share</p>
                  </button>
                </div>
              </div>
            </motion.div>
          </Card>
        )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Trending Hashtags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔥 Trending Topics
                </h3>
                <div className="space-y-2">
                  {trendingHashtags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowPostForm(true)
                        setNewPostContent(`${tag} `)
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-600 font-medium transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-bold text-indigo-600">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Members</span>
                    <span className="font-bold text-green-600">{Object.keys(users).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Engagement</span>
                    <span className="font-bold text-purple-600">
                      {posts.reduce((sum, p) => sum + (p.likesCount || 0) + (p.commentsCount || 0), 0)}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Engagement Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Engagement Tips</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Share your learning journey</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Ask thoughtful questions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Comment on others' posts</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Use relevant hashtags</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Share helpful resources</span>
                  </li>
                </ul>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <h3 className="text-lg font-bold mb-3">✨ Get Noticed</h3>
                <p className="text-sm text-indigo-100 mb-4">
                  Quality posts get more engagement. Share valuable insights!
                </p>
                <Button
                  onClick={() => setShowPostForm(true)}
                  className="w-full bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  Create Post
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Comments</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(postComments[selectedPost.id] || []).map((comment) => {
                  const commentAuthor = getAuthorData(comment.userId)
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={commentAuthor.avatar}
                        alt={commentAuthor.name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <p className="font-semibold text-sm text-gray-900">{commentAuthor.name}</p>
                          <p className="text-gray-800">{comment.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                          {formatTimestamp(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {(!postComments[selectedPost.id] || postComments[selectedPost.id].length === 0) && (
                  <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment(selectedPost.id)
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleAddComment(selectedPost.id)}
                    disabled={!commentText.trim()}
                    className="flex items-center gap-2"
                  >
                    <FiSend size={18} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Community
