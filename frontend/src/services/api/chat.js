import api from '../apiClient';

export const chatApi = {
  // Legacy simple APIs (kept for backward compat)
  getRooms: () => api.get('/api/chatrooms/'),
  createRoom: (data) => api.post('/api/chatrooms/', data),
  getChatMessages: (peerId) => api.get('/api/chat-messages/', { params: { peer_id: peerId } }),
  sendChatMessage: (data) => api.post('/api/chat-messages/', data),
  getGroupMessages: (roomId) => api.get('/api/group-messages/', { params: { room_id: roomId } }),
  sendGroupMessage: (data) => api.post('/api/group-messages/', data),
  getCalls: () => api.get('/api/calls/'),
  initiateCall: (data) => api.post('/api/calls/', data),
  callAction: (id, action) => api.post(`/api/calls/${id}/action/`, { action }),

  // ── Unified Chat APIs ──
  getAllUsers: () => api.get('/api/users/'),
  getAllChatRooms: () => api.get('/api/all-chatrooms/'),

  getChatHistory: (params) => api.get('/api/chat-history/', { params }),
  // params: { user_id } or { room_id } + optional { last_id }

  sendMessage: (formData) => api.post('/api/send-message/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  toggleReaction: (data) => api.post('/api/toggle-reaction/', data),
  // data: { message_id, is_group, emoji }

  editMessage: (data) => api.post('/api/edit-message/', data),
  // data: { message_id, is_group, text }

  deleteMessage: (data) => api.post('/api/delete-message/', data),
  // data: { message_id, is_group, mode }  mode: 'everyone' | 'me'

  updatePresence: (data) => api.post('/api/presence/', data),
  // data: { status }

  getPresence: (userIds) => api.get('/api/presence/', { params: { user_ids: userIds.join(',') } }),

  createTeam: (data) => api.post('/api/create-team/', data),
  // data: { name, description, users: [id,...] }

  forwardMessage: (data) => api.post('/api/forward-message/', data),
  // data: { msg_ids: [...], receiver_ids: [...] }
};

export default chatApi;
