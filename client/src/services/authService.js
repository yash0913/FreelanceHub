import api from './api'

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  registerCustomer: async (data) => {
    const res = await api.post('/auth/register/customer', data)
    return res.data
  },

  registerFreelancer: async (data) => {
    const res = await api.post('/auth/register/freelancer', data)
    return res.data
  },

  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data
  }
}

export default authService
