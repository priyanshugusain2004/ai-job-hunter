import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Profile } from './Profile';
import { SystemStatus } from './SystemStatus';
import { Resumes } from './Resumes';
import { Jobs } from './Jobs';
import { TailorResume } from './TailorResume';
import { 
  LayoutDashboard, User as UserIcon, Activity, LogOut, 
  MapPin, Briefcase, ChevronRight, TrendingUp, FileText, Sparkles
} from 'lucide-react';
import { Github } from './icons';



export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'resumes' | 'jobs' | 'tailoring' | 'profile' | 'system'>('overview');


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                AI Job Hunter
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                v1.0.0
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-4.5 w-4.5" />
                <span>Overview</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>

            <button
              onClick={() => setActiveTab('resumes')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'resumes'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4.5 w-4.5" />
                <span>My Resumes</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'resumes' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-4.5 w-4.5" />
                <span>Target Jobs</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'jobs' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>

            <button
              onClick={() => setActiveTab('tailoring')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'tailoring'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4.5 w-4.5" />
                <span>AI Resume Tailor</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'tailoring' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>

            <button

              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className="h-4.5 w-4.5" />
                <span>Profile Settings</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'profile' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="h-4.5 w-4.5" />
                <span>System Status</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'system' ? 'translate-x-0.5' : 'opacity-0'}`} />
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-slate-100 text-sm shadow-md shadow-indigo-500/20">
              {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'JH'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name || 'Job Hunter'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 bg-slate-900/50 hover:bg-rose-500/5 transition cursor-pointer text-xs font-bold"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/60 backdrop-blur px-6 md:px-8 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'resumes' && 'My Resumes'}
            {activeTab === 'jobs' && 'Target Jobs'}
            {activeTab === 'tailoring' && 'AI Resume Tailor'}
            {activeTab === 'profile' && 'My Profile'}
            {activeTab === 'system' && 'Infrastructure Check'}

          </h2>
          
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-500 font-medium font-mono">Session Active</span>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Greeting Card */}
              <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl"></div>
                
                <div className="relative max-w-xl">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Hunter'}!
                  </h3>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    Ready to land your next role? AI Job Hunter is set up and ready to parse your resumes, analyze skill gaps, customize cover letters, and help you coach for interviews.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-100 font-semibold shadow-md shadow-violet-900/20 transition text-xs cursor-pointer"
                    >
                      Complete Your Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('system')}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 font-semibold transition text-xs cursor-pointer"
                    >
                      Infrastructure Check
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Statistics / Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Target Role Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Role</div>
                    <p className="text-slate-200 font-semibold mt-1 text-sm truncate">
                      {user?.target_role || 'Not Set'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Used for tailoring AI prompts</p>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Location Preference</div>
                    <p className="text-slate-200 font-semibold mt-1 text-sm truncate">
                      {user?.location || 'Not Set'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Filter for remote/local jobs</p>
                  </div>
                </div>

                {/* GitHub Username Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">GitHub Sync</div>
                    <p className="text-slate-200 font-semibold mt-1 text-sm truncate">
                      {user?.github_username ? `@${user.github_username}` : 'Not Linked'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">For project analysis in Phase 5</p>
                  </div>
                </div>
              </div>

              {/* Progress Summary (Phase representation for WOW effect) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h4 className="text-sm font-bold text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                  System Deployment Roadmap
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span className="text-xs font-semibold text-slate-300">Phase 1: Foundation Services</span>
                    <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-bold uppercase">Complete</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span className="text-xs font-semibold text-slate-300">Phase 2: Authentication & Profile</span>
                    <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-bold uppercase">Complete</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span className="text-xs font-semibold text-slate-300">Phase 3: Resume Management</span>
                    <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-bold uppercase">Complete</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span className="text-xs font-semibold text-slate-200">Phase 4: AI Layer & Resume Tailoring</span>
                    <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold uppercase animate-pulse">Active</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'resumes' && <Resumes />}

          {activeTab === 'jobs' && <Jobs />}

          {activeTab === 'tailoring' && <TailorResume />}

          {activeTab === 'profile' && <Profile />}

          {activeTab === 'system' && <SystemStatus />}
        </div>
      </main>
    </div>
  );
};
