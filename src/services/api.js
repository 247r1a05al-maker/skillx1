import axios from 'axios'
import { useAuthStore } from '../store'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

API.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default API
