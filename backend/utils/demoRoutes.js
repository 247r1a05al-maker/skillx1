// Demo routes for quick testing

export const demoRoutes = {
  auth: {
    register: 'POST /api/auth/register - Register new user',
    login: 'POST /api/auth/login - Login user',
    logout: 'POST /api/auth/logout - Logout user',
    me: 'GET /api/auth/me - Get current user',
  },
  users: {
    getProfile: 'GET /api/users/:userId - Get user profile',
    updateProfile: 'PUT /api/users/:userId - Update user profile',
    search: 'GET /api/users/search?q=query - Search users',
    online: 'GET /api/users/online - Get online users',
  },
  skills: {
    mySkills: 'GET /api/skills/my-skills - Get my skills',
    addSkill: 'POST /api/skills - Add new skill',
    updateSkill: 'PUT /api/skills/:skillId - Update skill',
    deleteSkill: 'DELETE /api/skills/:skillId - Delete skill',
  },
  messages: {
    conversations: 'GET /api/messages/conversations - Get conversations',
    getMessages: 'GET /api/messages/conversations/:conversationId - Get messages',
    sendMessage: 'POST /api/messages/conversations/:conversationId - Send message',
    updateMessage: 'PUT /api/messages/:messageId - Edit message',
    deleteMessage: 'DELETE /api/messages/:messageId - Delete message',
  },
  exchanges: {
    sendRequest: 'POST /api/exchanges/request - Send exchange request',
    getRequests: 'GET /api/exchanges/requests - Get exchange requests',
    acceptRequest: 'PUT /api/exchanges/requests/:requestId/accept - Accept request',
    rejectRequest: 'PUT /api/exchanges/requests/:requestId/reject - Reject request',
    getMatches: 'GET /api/exchanges/matches - Get matched users',
    scheduleSession: 'POST /api/exchanges/schedule - Schedule session',
    completeSession: 'PUT /api/exchanges/sessions/:sessionId/complete - Complete session',
  },
  groups: {
    getGroups: 'GET /api/groups - Get all groups',
    createGroup: 'POST /api/groups - Create group',
    getGroupDetails: 'GET /api/groups/:groupId - Get group details',
    joinGroup: 'POST /api/groups/:groupId/join - Join group',
    leaveGroup: 'POST /api/groups/:groupId/leave - Leave group',
    postInGroup: 'POST /api/groups/:groupId/posts - Post in group',
  },
  posts: {
    getPosts: 'GET /api/posts - Get all posts',
    createPost: 'POST /api/posts - Create post',
    likePost: 'POST /api/posts/:postId/like - Like post',
    commentPost: 'POST /api/posts/:postId/comments - Comment on post',
  },
  coins: {
    getBalance: 'GET /api/coins/balance - Get coin balance',
    getHistory: 'GET /api/coins/history - Get coin history',
  },
  certificates: {
    getCertificates: 'GET /api/certificates - Get certificates',
    generateCertificate: 'POST /api/certificates - Generate certificate',
    downloadCertificate: 'GET /api/certificates/:certificateId/download - Download certificate',
  },
  notifications: {
    getNotifications: 'GET /api/notifications - Get notifications',
    markAsRead: 'PUT /api/notifications/:notificationId/read - Mark as read',
  },
}
