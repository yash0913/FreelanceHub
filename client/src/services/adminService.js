import api from './api'

export const adminService = {
  getUsers: async (filters = {}) => {
    const params = {}
    if (filters.role) params.role = filters.role
    if (filters.status) params.status = filters.status

    const res = await api.get('/admin/users', { params })
    return res.data
  },

  blockUser: async (id) => {
    const res = await api.patch(`/admin/users/${id}/block`)
    return res.data
  },

  unblockUser: async (id) => {
    const res = await api.patch(`/admin/users/${id}/unblock`)
    return res.data
  }
}

export default adminService
