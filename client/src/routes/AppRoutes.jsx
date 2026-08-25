import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/auth/Login'
import CustomerRegister from '../pages/auth/CustomerRegister'
import FreelancerRegister from '../pages/auth/FreelancerRegister'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import FreelancerDashboard from '../pages/freelancer/FreelancerDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'

/**
 * Route protection wrapper component checks login states and role limits
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-semibold">
        Verifying Session credentials...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect user to their own role dashboard if they hit an unauthorized route
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (currentUser.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />
    if (currentUser.role === 'FREELANCER') return <Navigate to="/freelancer/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

export const AppRoutes = () => {
  const { currentUser, isAuthenticated } = useAuth()

  const getRootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (currentUser.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />
    if (currentUser.role === 'FREELANCER') return <Navigate to="/freelancer/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      {/* Root redirect gate */}
      <Route path="/" element={getRootRedirect()} />

      {/* Public Guest Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login isAdminHint={true} />} />
      <Route path="/register/customer" element={<CustomerRegister />} />
      <Route path="/register/freelancer" element={<FreelancerRegister />} />

      {/* Protected Customer Pages */}
      <Route 
        path="/customer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected Freelancer Pages */}
      <Route 
        path="/freelancer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['FREELANCER']}>
            <FreelancerDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected Admin Pages */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
