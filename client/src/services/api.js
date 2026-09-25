import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://freelancehub-39zq.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

let blockedAccountDetected = false

export const isBlockedAccountResponse = (error) =>
  error?.response?.status === 403 &&
  String(error.response?.data?.message || '').toLowerCase().includes('blocked')

export const hasBlockedAccountBeenDetected = () => blockedAccountDetected
export const resetBlockedAccountDetection = () => { blockedAccountDetected = false }

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = String(error.response?.data?.message || '').toLowerCase()
    const isLoginRequest = String(error.config?.url || '').includes('/auth/login')

    if (isBlockedAccountResponse(error) && !isLoginRequest) {
      if (localStorage.getItem('token') && !blockedAccountDetected) {
        blockedAccountDetected = true
        window.dispatchEvent(new Event('freelancehub:account-blocked'))
      }
      return Promise.reject(error)
    }

    if ((status === 401 || status === 403) && (message.includes('token') || message.includes('session') || message.includes('blocked') || message.includes('authentication'))) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!['/login', '/register/customer', '/register/freelancer'].includes(window.location.pathname)) window.location.assign('/login?error=Session%20expired')
    }
    return Promise.reject(error)
  }
)

export default api
