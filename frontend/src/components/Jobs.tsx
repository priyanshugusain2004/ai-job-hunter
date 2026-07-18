import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, Plus, Send, RefreshCw, AlertCircle, 
  CheckCircle2, Sparkles, MapPin, Globe, Award, ListChecks 
} from 'lucide-react';

interface Job {
  id: string;
  user_id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  description_raw: string;
  description_parsed: any;
  source: string;
  external_url: string | null;
  posted_at: string | null;
  created_at: string;
}

export const Jobs: React.FC = () => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New job form state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [descriptionRaw, setDescriptionRaw] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Selected job for detail view
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/jobs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionRaw) return;
    
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || null,
          company: company || null,
          location: location || null,
          description_raw: descriptionRaw,
          external_url: externalUrl || null
        })
      });
      
      if (!res.ok) throw new Error('Failed to save job');
      
      const newJob = await res.json();
      setJobs(prev => [newJob, ...prev]);
      setSelectedJob(newJob);
      setSuccessMsg('Job saved successfully!');
      
      // Reset form
      setTitle('');
      setCompany('');
      setLocation('');
      setDescriptionRaw('');
      setExternalUrl('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyzeJob = async (jobId: string) => {
    setAnalyzingJobId(jobId);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        // Catch AI not configured error
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Failed to analyze job description.');
      }
      
      const updatedJob = await res.json();
      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
      setSelectedJob(updatedJob);
      setSuccessMsg('Job analysis complete! Extracted required skills and requirements.');
    } catch (err: any) {
      setError(err.message || 'Job analysis failed.');
    } finally {
      setAnalyzingJobId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel: jobs list and adding jobs */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
              Target Jobs
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-slate-100 transition flex items-center justify-center cursor-pointer shadow-md shadow-violet-900/30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 mb-4 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 mb-4 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* New job form overlay/expand */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Add New Job</h4>
              
              <div>
                <input
                  type="text"
                  placeholder="Job Title (e.g. Frontend Dev)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Location (e.g. Remote, NY)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <input
                  type="url"
                  placeholder="External URL / Link"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <textarea
                  required
                  placeholder="Paste raw job description here... (Required)"
                  value={descriptionRaw}
                  onChange={(e) => setDescriptionRaw(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-lg font-semibold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <div className="h-3.5 w-3.5 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Save Job
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Saved Jobs list */}
          {loading && jobs.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No target jobs saved yet. Click the "+" button to add one.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setSuccessMsg(null);
                    setError(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedJob?.id === job.id
                      ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-violet-500/30 text-slate-100'
                      : 'bg-slate-950/20 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold truncate text-slate-200">
                    {job.title || 'Untitled Job'}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                    {job.company || 'Unknown Company'} &bull; {job.location || 'Unknown Location'}
                  </p>
                  {job.description_parsed && (
                    <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold mt-2 uppercase tracking-wide">
                      <Sparkles className="h-2 w-2" /> Analyzed
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panels (col-span-2): detailed job representation and AI analysis */}
      <div className="lg:col-span-2">
        {selectedJob ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            
            {/* Job Title and Meta details */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/60 pb-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight truncate">
                  {selectedJob.title || 'Untitled Job'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-400 font-semibold">
                  <span className="text-slate-300">{selectedJob.company || 'Unknown Company'}</span>
                  {selectedJob.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {selectedJob.location}
                    </span>
                  )}
                  {selectedJob.external_url && (
                    <a
                      href={selectedJob.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-violet-400 hover:text-violet-300 underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      View Original
                    </a>
                  )}
                </div>
              </div>
              
              {!selectedJob.description_parsed && (
                <button
                  onClick={() => handleAnalyzeJob(selectedJob.id)}
                  disabled={analyzingJobId === selectedJob.id}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/30 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  {analyzingJobId === selectedJob.id ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Parse Job
                    </>
                  )}
                </button>
              )}
            </div>

            {/* AI parsed results view */}
            {selectedJob.description_parsed ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Requirements Analysis</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    <Award className="h-3.5 w-3.5" /> {selectedJob.description_parsed.seniority || 'Mid/Senior'} Level
                  </span>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Required Skills */}
                  <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Required Skills
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.description_parsed.required_skills?.map((skill: any, idx: number) => (
                        <span 
                          key={idx}
                          className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono"
                        >
                          {skill.name}
                        </span>
                      )) || <p className="text-xs text-slate-600">None extracted</p>}
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                      Preferred Skills
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.description_parsed.preferred_skills?.map((skill: any, idx: number) => (
                        <span 
                          key={idx}
                          className="text-[10px] px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium font-mono"
                        >
                          {skill.name}
                        </span>
                      )) || <p className="text-xs text-slate-600">None extracted</p>}
                    </div>
                  </div>
                </div>

                {/* Requirements checklist */}
                <div className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <ListChecks className="h-4.5 w-4.5 text-indigo-400" />
                    Core Requirements Checklist
                  </h5>
                  <ul className="space-y-3">
                    {selectedJob.description_parsed.requirements_summary?.map((req: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-slate-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950 bg-slate-900"
                        />
                        <span>{req}</span>
                      </li>
                    )) || <li className="text-xs text-slate-600">None extracted</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/10 space-y-3">
                <Sparkles className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-slate-300 font-bold text-sm">Analyze Requirements</h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  Run AI requirement extraction to extract core skills, seniority, and checklist requirements to help tailor your resume.
                </p>
                <button
                  onClick={() => handleAnalyzeJob(selectedJob.id)}
                  disabled={analyzingJobId === selectedJob.id}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-slate-100 rounded-xl border border-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  {analyzingJobId === selectedJob.id ? 'Running Extraction...' : 'Extract with AI'}
                </button>
              </div>
            )}

            {/* Raw Description Section */}
            <div className="border-t border-slate-800/60 pt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Raw Description</h4>
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 max-h-60 overflow-y-auto">
                <pre className="text-xs text-slate-400 font-sans whitespace-pre-wrap leading-relaxed">
                  {selectedJob.description_raw}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full border border-slate-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center bg-slate-900/20 text-slate-500 min-h-[300px]">
            <Briefcase className="h-12 w-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No Target Job Selected</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Select a saved target job from the left panel, or click the "+" button to add a new job description.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
