import axios from 'axios'


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Auth API (kept for future use but not used now)
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
}

// Meetings
export const meetingApi = {
  create: (data) => api.post('/meeting', data),
  list: () => api.get('/meeting'),
}

// AI
export const aiApi = {
  transcribe: (audio) => {
    const form = new FormData()
    form.append('audio', audio)
    return api.post('/ai/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  summary: (transcript) => api.post('/ai/summary', { transcript }),
}
