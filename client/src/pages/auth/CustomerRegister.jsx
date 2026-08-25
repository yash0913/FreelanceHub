import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authService from '../../services/authService'
import { useToast } from '../../hooks/useToast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { UserPlus } from 'lucide-react'

function CustomerRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Form client side validations
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.')
      showToast('Please fill in all fields.', 'warning')
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address format.')
      showToast('Please enter a valid email address.', 'warning')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      showToast('Password is too short.', 'warning')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      showToast('Passwords must match.', 'warning')
      setLoading(false)
      return
    }

    try {
      const res = await authService.registerCustomer({
        name,
        email,
        password,
        confirmPassword
      })

      if (res.success) {
        showToast('Customer account registered successfully!', 'success')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        setError(res.message || 'Registration failed.')
        showToast(res.message || 'Registration failed.', 'error')
        setLoading(false)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred during registration.'
      setError(msg)
      showToast(msg, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4F46E5] text-white font-black text-xl shadow-md mb-3 select-none">
            FH
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">FreelanceHub</h1>
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mt-1">
            Client Profile Registration
          </p>
        </div>

        <Card className="border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#4F46E5]" />
              <span>Customer Register</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">Post job requirements and manage contracts</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#DC2626] p-3 rounded-md text-xs font-semibold mb-5 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              disabled={loading}
              required
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. johndoe@example.com"
              disabled={loading}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              disabled={loading}
              required
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
            >
              Create Customer Account
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-5 text-xs font-semibold text-[#64748B]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4F46E5] hover:text-[#4338CA] hover:underline font-bold">
              Sign In here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CustomerRegister
