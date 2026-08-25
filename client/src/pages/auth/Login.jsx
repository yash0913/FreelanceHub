import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { KeyRound } from 'lucide-react'

function Login({ isAdminHint = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated, currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Intercept blocked status alerts or token expirations from search parameters
  useEffect(() => {
    const errorMsg = searchParams.get('error')
    if (errorMsg) {
      setError(errorMsg)
      showToast(errorMsg, 'error')
    }
  }, [searchParams, showToast])

  // Automatic redirect if token is active
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'ADMIN') navigate('/admin/dashboard')
      else if (currentUser.role === 'CUSTOMER') navigate('/customer/dashboard')
      else if (currentUser.role === 'FREELANCER') navigate('/freelancer/dashboard')
    }
  }, [isAuthenticated, currentUser, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please provide email and password details.')
      showToast('Please fill in all credentials.', 'warning')
      setLoading(false)
      return
    }

    const res = await login(email, password)
    if (res.success) {
      showToast(`Welcome back, ${res.user.name}!`, 'success')
    } else {
      setError(res.message)
      showToast(res.message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4">
      <div className="w-full max-w-md">
        {/* Hub header logos */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4F46E5] text-white font-black text-xl shadow-md mb-3 select-none">
            FH
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">FreelanceHub</h1>
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mt-1">
            {isAdminHint ? 'Admin Moderation Gate' : 'Freelancer Marketplace'}
          </p>
        </div>

        <Card className="border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#4F46E5]" />
              <span>Authentication Session</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">Please provide your login credentials</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#DC2626] p-3 rounded-md text-xs font-semibold mb-5 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jdoe@domain.com"
              disabled={loading}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant={isAdminHint ? 'danger' : 'primary'}
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          {!isAdminHint ? (
            <div className="mt-6 text-center border-t border-slate-100 pt-5 space-y-3">
              <p className="text-xs text-[#64748B] font-bold">Don't have a marketplace profile yet?</p>
              <div className="flex justify-center items-center gap-4 text-xs font-bold text-[#4F46E5]">
                <Link to="/register/customer" className="hover:text-[#4338CA] hover:underline">Customer Signup</Link>
                <span className="text-slate-200">|</span>
                <Link to="/register/freelancer" className="hover:text-[#4338CA] hover:underline">Freelancer Signup</Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 text-center border-t border-slate-100 pt-4">
              <Link to="/login" className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] hover:underline">
                Return to Member Login
              </Link>
            </div>
          )}

          {!isAdminHint && (
            <div className="mt-5 text-center">
              <Link to="/admin/login" className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider">
                System Administrator Console
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Login
