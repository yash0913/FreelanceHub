import React, { createContext, useState, useEffect, useContext } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Validate existing local token session
  const verifySession = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setCurrentUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await authService.getMe()
      if (res.success && res.data) {
        setCurrentUser(res.data)
      } else {
        throw new Error('Failed to resolve profile')
      }
    } catch (error) {
      console.error('Session verify failed:', error.message)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifySession()
  }, [])

  // Action methods
  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login(email, password)
      if (res.success && res.data) {
        const { token, user } = res.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setCurrentUser(user)
        return { success: true, user }
      }
      return { success: false, message: res.message || 'Login failed' }
    } catch (error) {
      const msg = error.response?.data?.message || 'Server error. Authentication failed.'
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    try {
      const res = await authService.getMe()
      if (res.success && res.data) {
        setCurrentUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      }
    } catch (error) {
      console.error('Session refresh failed:', error.message)
    }
  }

  const value = {
    currentUser,
    user: currentUser, // backward-compatible alias for pages using { user } = useAuth()
    loading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be defined inside an AuthProvider wrapper')
  }
  return context
}
