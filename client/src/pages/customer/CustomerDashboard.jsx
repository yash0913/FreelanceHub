import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Briefcase, FileText, LogOut, Landmark } from 'lucide-react'

function CustomerDashboard() {
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

      {/* Content Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]">Welcome, {currentUser?.name}!</h1>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Manage your posted opportunities, review proposals, and coordinate project contracts.</p>
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

        {/* Action placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-8 min-h-[220px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">Find Freelancers</h3>
              <p className="text-xs text-slate-400 max-w-[200px] font-medium leading-relaxed">Search profiles directory, review experience details, and inspect skills.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-8 min-h-[220px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">Post a Job</h3>
              <p className="text-xs text-slate-400 max-w-[200px] font-medium leading-relaxed">Publish new project parameters, define budgets, and specify requirements.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between items-center text-center p-8 min-h-[220px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">My Projects</h3>
              <p className="text-xs text-slate-400 max-w-[200px] font-medium leading-relaxed">Coordinate active contracts, inspect progress reports, and verify payments.</p>
            </div>
            <Badge variant="default" className="text-[9px] py-1 px-3">Coming Soon</Badge>
          </Card>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold select-none">
        &copy; {new Date().getFullYear()} FreelanceHub DBMS Mini-Project. All rights reserved.
      </footer>
    </div>
  )
}

export default CustomerDashboard
