import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, AlertCircle, CheckCircle2, 
  Calendar, StickyNote, Trash2, Bookmark
} from 'lucide-react';

interface Job {
  id: string;
  title: string | null;
  company: string | null;
}

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  status: string;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  job: Job | null;
}

export const Applications: React.FC = () => {
  const { token } = useAuth();
  
  // Data lists
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Selections
  const [selectedJobId, setSelectedJobId] = useState('');
  const [statusVal, setStatusVal] = useState('wishlist');
  const [notes, setNotes] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [appsRes, jobsRes] = await Promise.all([
        fetch('/api/v1/applications/', { headers }),
        fetch('/api/v1/jobs/', { headers })
      ]);
      
      if (!appsRes.ok || !jobsRes.ok) throw new Error('Failed to fetch application data');
      
      const appsData = await appsRes.json();
      const jobsData = await jobsRes.json();
      
      setApps(appsData);
      setJobs(jobsData);
      
      // Filter out jobs that already have applications
      const unappliedJobs = jobsData.filter(
        (j: Job) => !appsData.some((a: Application) => a.job_id === j.id)
      );
      if (unappliedJobs.length > 0) setSelectedJobId(unappliedJobs[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/v1/applications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: selectedJobId,
          status: statusVal,
          notes: notes || null,
          applied_at: appliedAt ? new Date(appliedAt).toISOString() : null
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to track application');
      }
      
      const newApp = await res.json();
      // Match the local job details onto the returned app object
      const fullJob = jobs.find(j => j.id === selectedJobId) || null;
      newApp.job = fullJob;
      
      setApps(prev => [...prev, newApp]);
      setSuccess('Application tracked successfully!');
      
      // Reset form
      setNotes('');
      setAppliedAt('');
      setShowAddForm(false);
      
      // Select next unapplied job if any
      const unappliedJobs = jobs.filter(
        (j: Job) => ![newApp, ...apps].some((a: Application) => a.job_id === j.id)
      );
      if (unappliedJobs.length > 0) {
        setSelectedJobId(unappliedJobs[0].id);
      } else {
        setSelectedJobId('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          applied_at: newStatus === 'applied' ? new Date().toISOString() : null
        })
      });
      
      if (!res.ok) throw new Error('Failed to update stage');
      
      const updated = await res.json();
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: updated.status, applied_at: updated.applied_at } : a));
      setSuccess('Status stage updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (appId: string) => {
    setError(null);
    setSuccess(null);
    if (!window.confirm("Are you sure you want to stop tracking this application?")) return;
    
    try {
      const res = await fetch(`/api/v1/applications/${appId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete application');
      
      setApps(prev => prev.filter(a => a.id !== appId));
      setSuccess('Application tracking removed successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to remove application');
    }
  };

  // Filter jobs that don't have applications yet
  const unappliedJobs = jobs.filter(
    (j: Job) => !apps.some((a: Application) => a.job_id === j.id)
  );

  const stages = [
    { key: 'wishlist', label: 'Wishlist', color: 'border-slate-800 text-slate-400 bg-slate-900/10' },
    { key: 'applied', label: 'Applied', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
    { key: 'interviewing', label: 'Interviewing', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5 animate-pulse' },
    { key: 'offer', label: 'Offer Received', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
    { key: 'rejected', label: 'Rejected', color: 'border-rose-500/20 text-rose-400 bg-rose-500/5' }
  ];

  if (loading && apps.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Add trigger */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
        <div>
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="h-4.5 w-4.5 text-indigo-400" />
            Application Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">Track and manage your target job application stages.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-violet-900/30 transition flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Track Job Application
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Add application form expansion */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Start Tracking Application</h4>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Saved Job</label>
              <select
                required
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="">-- Choose Job --</option>
                {unappliedJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title || 'Untitled'} &bull; {j.company || 'Unknown'}
                  </option>
                ))}
              </select>
              {unappliedJobs.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-2">All saved target jobs are already being tracked.</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stage Status</label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Applied Date (Optional)</label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Notes & Context</label>
              <textarea
                placeholder="Interview schedule, interviewer names, or reminders..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting || !selectedJobId}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Adding...' : 'Add Application'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map(stage => {
          const stageApps = apps.filter(a => a.status === stage.key);
          return (
            <div key={stage.key} className="flex flex-col bg-slate-900/60 border border-slate-850 rounded-2xl p-4 min-h-[450px]">
              {/* Column title */}
              <div className={`flex justify-between items-center border-b pb-3 mb-4 ${stage.color.split(' ')[0]}`}>
                <h4 className="text-xs font-bold text-slate-250 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
                  {stage.label}
                </h4>
                <span className="text-[10px] font-mono font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards stack */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-0.5">
                {stageApps.map(app => (
                  <div 
                    key={app.id}
                    className="p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl hover:border-slate-700 transition shadow-md relative overflow-hidden group space-y-3"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-indigo-600"></div>
                    
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{app.job?.title || 'Job Title'}</p>
                      <p className="text-[10px] font-semibold text-slate-500 truncate mt-1">{app.job?.company || 'Company'}</p>
                    </div>

                    {app.applied_at && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    {app.notes && (
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-900 text-[10px] text-slate-450 italic font-sans flex items-start gap-1">
                        <StickyNote className="h-3 w-3 mt-0.5 text-slate-500 shrink-0" />
                        <span className="truncate">{app.notes}</span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-900">
                      {/* Status Dropdown Trigger */}
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className="text-[9px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-450 font-bold uppercase cursor-pointer"
                      >
                        <option value="wishlist">Wishlist</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {stageApps.length === 0 && (
                  <div className="text-center py-8 text-[10px] text-slate-600 font-sans">
                    Empty Column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
