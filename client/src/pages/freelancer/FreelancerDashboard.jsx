import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Search, FileText, Landmark, User2, LogOut } from 'lucide-react'

function FreelancerDashboard() {
  const { currentUser, logout } = useAuth()
  const { showToast } = useToast()

  const handleLogout = () => {
    showToast('Logged out successfully', 'info')
    logout()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <span className="text-lg font-black text-[#4F46E5] select-none">FreelanceHub</span>
            <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-[#64748B]">
              <span className="text-[#4F46E5] border-b-2 border-[#4F46E5] py-5 px-1">Dashboard</span>
              <span className="hover:text-[#0F172A] cursor-pointer py-5 px-1 flex items-center gap-1.5 opacity-60">
                Profile <Badge variant="default" className="normal-case tracking-normal px-1 py-0 text-[8px]">Soon</Badge>
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] font-black text-xs select-none">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-xs font-bold text-slate-700">{currentUser?.name}</span>
                {currentUser?.professionalTitle && (
                  <span className="text-[10px] text-slate-400 font-medium">{currentUser?.professionalTitle}</span>
                )}
              </div>
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

      {/* Content Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]">Welcome, {currentUser?.name}!</h1>
            {currentUser?.professionalTitle && (
              <p className="text-sm text-[#4F46E5] font-bold mt-0.5">{currentUser?.professionalTitle}</p>
            )}
            <p className="text-xs text-[#64748B] mt-1 font-medium">Browse open jobs, manage proposals, and work on client projects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" className="text-[9px] py-1 px-2.5">
              Role: {currentUser?.role}
            </Badge>
            <Badge variant="success" className="text-[9px] py-1 px-2.5">
              Status: {currentUser?.status}
            </Badge>
          </div>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-6 min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">Find Jobs</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Browse open job listings and filter by skills.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-6 min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">My Proposals</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Track submitted proposals and response status.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-6 min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">My Projects</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Manage active contracts and deliver milestones.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-6 min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">Edit Profile</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Update skills, bio, hourly rate, and visibility.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>
        </div>

        {/* Account info card */}
        <Card>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</span>
              <span className="font-semibold text-slate-700 break-all">{currentUser?.email}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Professional Title</span>
              <span className="font-semibold text-slate-700">{currentUser?.professionalTitle || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Account Status</span>
              <Badge variant="success">{currentUser?.status}</Badge>
            </div>
          </div>
        </Card>
      </main>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold select-none">
        &copy; {new Date().getFullYear()} FreelanceHub DBMS Mini-Project. All rights reserved.
      </footer>
    </div>
  )
}

export default FreelancerDashboard
