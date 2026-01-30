import API from './api'

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getCurrentUser: () => API.get('/auth/me'),
}

export const userService = {
  getProfile: (userId) => API.get(`/users/${userId}`),
  updateProfile: (userId, data) => API.put(`/users/${userId}`, data),
  searchUsers: (query) => API.get(`/users/search?q=${query}`),
  getOnlineUsers: () => API.get('/users/online'),
}

export const skillService = {
  getMySkills: () => API.get('/skills/my-skills'),
  addSkill: (data) => API.post('/skills', data),
  updateSkill: (skillId, data) => API.put(`/skills/${skillId}`, data),
  deleteSkill: (skillId) => API.delete(`/skills/${skillId}`),
}

export const exchangeService = {
  sendRequest: (data) => API.post('/exchanges/request', data),
  getRequests: () => API.get('/exchanges/requests'),
  acceptRequest: (requestId) => API.put(`/exchanges/requests/${requestId}/accept`, {}),
  rejectRequest: (requestId) => API.put(`/exchanges/requests/${requestId}/reject`, {}),
  getMatches: () => API.get('/exchanges/matches'),
  scheduleSession: (data) => API.post('/exchanges/schedule', data),
  completeSession: (sessionId) => API.put(`/exchanges/sessions/${sessionId}/complete`, {}),
}

export const messageService = {
  getConversations: () => API.get('/messages/conversations'),
  getMessages: (conversationId) => API.get(`/messages/conversations/${conversationId}`),
  sendMessage: (conversationId, data) => API.post(`/messages/conversations/${conversationId}`, data),
  updateMessage: (messageId, data) => API.put(`/messages/${messageId}`, data),
  deleteMessage: (messageId) => API.delete(`/messages/${messageId}`),
}

export const groupService = {
  getGroups: () => API.get('/groups'),
  createGroup: (data) => API.post('/groups', data),
  getGroupDetails: (groupId) => API.get(`/groups/${groupId}`),
  joinGroup: (groupId) => API.post(`/groups/${groupId}/join`, {}),
  leaveGroup: (groupId) => API.post(`/groups/${groupId}/leave`, {}),
  postInGroup: (groupId, data) => API.post(`/groups/${groupId}/posts`, data),
}

export const postService = {
  getPosts: () => API.get('/posts'),
  createPost: (data) => API.post('/posts', data),
  likePost: (postId) => API.post(`/posts/${postId}/like`, {}),
  commentPost: (postId, data) => API.post(`/posts/${postId}/comments`, data),
}

export const coinService = {
  getBalance: () => API.get('/coins/balance'),
  getHistory: () => API.get('/coins/history'),
}

export const certificateService = {
  getCertificates: () => API.get('/certificates'),
  generateCertificate: (data) => API.post('/certificates', data),
  downloadCertificate: (certificateId) => API.get(`/certificates/${certificateId}/download`, { responseType: 'blob' }),
}

export const notificationService = {
  getNotifications: () => API.get('/notifications'),
  markAsRead: (notificationId) => API.put(`/notifications/${notificationId}/read`, {}),
}
