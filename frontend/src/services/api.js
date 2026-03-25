import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Attach saved token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crewdo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ─── Clans ─────────────────────────────────────────────────────
export const clanAPI = {
  getMyClans: () => api.get('/clans/my'),
  getClan: (id) => api.get(`/clans/${id}`),
  createClan: (data) => api.post('/clans', data),
  joinClan: (inviteCode) => api.post('/clans/join', { inviteCode }),
  leaveClan: () => api.delete('/clans/leave'),
  getLeaderboard: () => api.get('/clans/leaderboard'),
  getStreakHistory: (id) => api.get(`/clans/${id}/streak-history`),
  updateTask: (id, data) => api.patch(`/clans/${id}/task`, data),
}

// ─── Proof ─────────────────────────────────────────────────────
export const proofAPI = {
  submit: (formData) => api.post('/proof/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myProofs: () => api.get('/proof/my'),
  todayFeed: () => api.get('/proof/today'),
  pending: () => api.get('/proof/pending'),
  clanProofs: (clanId) => api.get(`/proof/clan/${clanId}`),
  approve: (id) => api.post(`/proof/${id}/approve`),
  reject: (id) => api.post(`/proof/${id}/reject`),
  delete: (id) => api.delete(`/proof/${id}`),
}

export default api