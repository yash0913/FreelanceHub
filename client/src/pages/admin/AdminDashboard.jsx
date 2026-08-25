import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import adminService from '../../services/adminService'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  Users, UserCheck, Briefcase, ShieldOff,
  LogOut, RefreshCw, Shield
} from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────
const roleBadgeVariant = (role) => {
  if (role === 'ADMIN') return 'danger'
  if (role === 'CUSTOMER') return 'info'
  if (role === 'FREELANCER') return 'warning'
  return 'default'
}

const statusBadgeVariant = (status) =>
  status === 'ACTIVE' ? 'success' : 'danger'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

// ── Skeleton row ───────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-slate-100">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
      </td>
    ))}
  </tr>
)

// ── Stat card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, colorClass = 'text-slate-700', loading }) => (
  <Card className="flex items-center gap-4 p-5">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 flex-shrink-0 ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {loading
        ? <div className="h-6 w-10 bg-slate-100 rounded animate-pulse mt-1" />
        : <p className={`text-2xl font-black mt-0.5 ${colorClass}`}>{value}</p>
      }
    </div>
  </Card>
)

// ── Main component ─────────────────────────────────────────────────────────
function AdminDashboard() {
  const { currentUser, logout } = useAuth()
  const { showToast } = useToast()

  const [allUsers, setAllUsers] = useState([])         // always all users (for stats)
  const [filtered, setFiltered] = useState([])          // what is shown in table
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Confirm dialog
  const [dialog, setDialog] = useState({ open: false, user: null, action: null })

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.getUsers({})
      if (res.success) setAllUsers(res.data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Apply local filters ────────────────────────────────────────────────
  useEffect(() => {
    let result = [...allUsers]
    if (filterRole)   result = result.filter((u) => u.role === filterRole)
    if (filterStatus) result = result.filter((u) => u.status === filterStatus)
    setFiltered(result)
  }, [allUsers, filterRole, filterStatus])

  // ── Stats derived from ALL users (unfiltered) ─────────────────────────
  const stats = {
    total:      allUsers.length,
    customers:  allUsers.filter((u) => u.role === 'CUSTOMER').length,
    freelancers:allUsers.filter((u) => u.role === 'FREELANCER').length,
    active:     allUsers.filter((u) => u.status === 'ACTIVE').length,
    blocked:    allUsers.filter((u) => u.status === 'BLOCKED').length,
  }

  // ── Open / close dialog ────────────────────────────────────────────────
  const openDialog = (user, action) =>
    setDialog({ open: true, user, action })

  const closeDialog = () =>
    setDialog({ open: false, user: null, action: null })

  // ── Confirm: block / unblock ──────────────────────────────────────────
  const handleConfirm = async () => {
    const { user, action } = dialog
    if (!user || !action) return

    setActionLoading(true)
    try {
      let res
      if (action === 'block') {
        res = await adminService.blockUser(user.id)
        if (res.success) showToast(`"${user.name}" has been blocked.`, 'success')
      } else {
        res = await adminService.unblockUser(user.id)
        if (res.success) showToast(`"${user.name}" has been unblocked.`, 'success')
      }

      // Optimistic update — mutate allUsers locally, avoid full refetch
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: action === 'block' ? 'BLOCKED' : 'ACTIVE' }
            : u
        )
      )
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error')
    } finally {
      setActionLoading(false)
      closeDialog()
    }
  }

  const handleLogout = () => {
    showToast('Signed out of admin console.', 'info')
    logout()
  }

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#DC2626]" />
              <span className="text-base font-black text-[#0F172A] select-none">FreelanceHub</span>
            </div>
            <Badge variant="danger" className="text-[8px] px-2 py-0.5 tracking-widest">ADMIN</Badge>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer disabled:opacity-40"
              aria-label="Refresh user list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-150 flex items-center justify-center text-[#DC2626] font-black text-xs select-none">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-700">
                {currentUser?.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Moderation Console</h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Manage registered users, account statuses, and role assignments.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users}     label="Total Users"   value={stats.total}       colorClass="text-slate-700" loading={loading} />
          <StatCard icon={UserCheck} label="Customers"     value={stats.customers}   colorClass="text-indigo-600" loading={loading} />
          <StatCard icon={Briefcase} label="Freelancers"   value={stats.freelancers} colorClass="text-amber-600" loading={loading} />
          <StatCard icon={Shield}    label="Active"        value={stats.active}      colorClass="text-green-600" loading={loading} />
          <StatCard icon={ShieldOff} label="Blocked"       value={stats.blocked}     colorClass="text-red-600"   loading={loading} />
        </div>

        {/* ── User table card ── */}
        <Card className="p-0 overflow-hidden">
          {/* Table header / filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              User Directory
              {!loading && (
                <span className="ml-2 font-black text-[#0F172A] normal-case tracking-normal text-sm">
                  ({filtered.length})
                </span>
              )}
            </h2>

            <div className="flex flex-wrap gap-2">
              <Select
                id="filterRole"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'CUSTOMER', label: 'Customer' },
                  { value: 'FREELANCER', label: 'Freelancer' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
                className="w-36 text-xs"
              />
              <Select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'BLOCKED', label: 'Blocked' },
                ]}
                className="w-36 text-xs"
              />
            </div>
          </div>

          {/* Scrollable table wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-semibold text-xs">
                          No users match the selected filters.
                        </td>
                      </tr>
                    )
                    : filtered.map((u) => {
                      const isSelf = u.id === currentUser?.id
                      const isAdmin = u.role === 'ADMIN'

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-400">#{u.id}</td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            {u.professionalTitle && (
                              <div className="text-[10px] text-slate-400 font-medium mt-0.5 italic">
                                {u.professionalTitle}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-600 font-medium break-all">{u.email}</td>
                          <td className="px-5 py-3">
                            <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={statusBadgeVariant(u.status)}>{u.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-slate-500 font-medium whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {isSelf ? (
                              <span className="text-[10px] text-slate-400 italic font-semibold">Current Session</span>
                            ) : isAdmin ? (
                              <span className="text-[10px] text-slate-400 italic font-semibold">Protected</span>
                            ) : u.status === 'BLOCKED' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openDialog(u, 'unblock')}
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => openDialog(u, 'block')}
                              >
                                Block
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                }
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold select-none">
        &copy; {new Date().getFullYear()} FreelanceHub DBMS Mini-Project — Admin Console
      </footer>

      {/* ── Confirm Block Dialog ── */}
      <ConfirmDialog
        isOpen={dialog.open && dialog.action === 'block'}
        title="Block User Account"
        message={
          dialog.user
            ? `Are you sure you want to block "${dialog.user.name}" (${dialog.user.email})? They will immediately lose access to the platform.`
            : ''
        }
        confirmLabel="Block User"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
        isLoading={actionLoading}
      />

      {/* ── Confirm Unblock Dialog ── */}
      <ConfirmDialog
        isOpen={dialog.open && dialog.action === 'unblock'}
        title="Unblock User Account"
        message={
          dialog.user
            ? `Restore platform access for "${dialog.user.name}" (${dialog.user.email})?`
            : ''
        }
        confirmLabel="Unblock User"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
        isLoading={actionLoading}
      />
    </div>
  )
}

export default AdminDashboard
