import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Automatically inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Automatically clean state and redirect on auth failure or account blocks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      const msg = error.response.data?.message || ''

      // 401 Unauthorized or 403 Forbidden checks for token issues or blocks
      if (status === 401 || status === 403) {
        const isAuthError = msg.toLowerCase().includes('token') || 
                            msg.toLowerCase().includes('session') || 
                            msg.toLowerCase().includes('blocked') ||
                            msg.toLowerCase().includes('auth')

        if (isAuthError) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')

          // Redirect to login if path doesn't point to authorization pages already
          const path = window.location.pathname
          if (path !== '/login' && path !== '/register/customer' && path !== '/register/freelancer') {
            window.location.href = '/login?error=' + encodeURIComponent(msg)
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
