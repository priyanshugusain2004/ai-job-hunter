import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, 
  Award, ListChecks, History, ShieldAlert, Check
} from 'lucide-react';

interface Resume {
  id: string;
  kind: string;
  file_path: string | null;
  version: number;
}

interface Job {
  id: string;
  title: string | null;
  company: string | null;
}

interface MatchReport {
  id: string;
  report_type: string;
  related_job_id: string | null;
  score: number | null;
  result_json: {
    score: number;
    missing_skills: string[];
    suggestions: string[];
  };
  created_at: string;
}

export const JobMatcher: React.FC = () => {
  const { token } = useAuth();
  
  // Lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<MatchReport[]>([]);
  
  // Selections
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Active Report
  const [report, setReport] = useState<MatchReport | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resumesRes, jobsRes, historyRes] = await Promise.all([
        fetch('/api/v1/resumes/', { headers }),
        fetch('/api/v1/jobs/', { headers }),
        fetch('/api/v1/match/history', { headers })
      ]);
      
      if (!resumesRes.ok || !jobsRes.ok || !historyRes.ok) {
        throw new Error('Failed to load matching records');
      }
      
      const resumesData = await resumesRes.json();
      const jobsData = await jobsRes.json();
      const historyData = await historyRes.json();
      
      setResumes(resumesData.filter((r: Resume) => r.kind === 'master'));
      setJobs(jobsData);
      setHistory(historyData);
      
      if (resumesData.length > 0) setSelectedResumeId(resumesData[0].id);
      if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs/resumes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobId) return;
    
    setMatching(true);
    setError(null);
    setSuccess(null);
    setReport(null);
    
    try {
      const res = await fetch('/api/v1/match/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_id: selectedJobId
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Match scoring failed');
      }
      
      const newReport = await res.json();
      setReport(newReport);
      setHistory(prev => [newReport, ...prev]);
      setSuccess('Match scoring calculated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to calculate match score');
    } finally {
      setMatching(false);
    }
  };

  // Helper colors for matching scores
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/5 shadow-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5 shadow-rose-500/10';
  };

  if (loading && resumes.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Settings Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-6">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            Job Fit Matcher
          </h3>

          <form onSubmit={handleMatch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Resume Profile
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.file_path ? r.file_path.split('/').pop() : 'Resume'} (v{r.version})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Select Target Job
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title || 'Untitled'} &bull; {j.company || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={matching || !selectedResumeId || !selectedJobId}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/35 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {matching ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Calculating Score...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Match Resume & Job
                </>
              )}
            </button>
          </form>
        </div>

        {/* Match History Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
            <History className="h-4.5 w-4.5 text-indigo-400" />
            Past Match Scores
          </h3>
          
          {history.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">No matching history saved yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map(hist => {
                const targetJob = jobs.find(j => j.id === hist.related_job_id);
                return (
                  <button
                    key={hist.id}
                    onClick={() => {
                      setReport(hist);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      report?.id === hist.id
                        ? 'bg-slate-800/50 border-violet-500/30'
                        : 'bg-slate-950/20 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-350 truncate">
                        {targetJob?.title || 'Job Match Report'}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {targetJob?.company || 'Company'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ml-3 shrink-0 ${
                      hist.score ? getScoreColorClass(hist.score) : 'text-slate-500 border-slate-800'
                    }`}>
                      {hist.score ?? 0}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Result Display */}
      <div className="lg:col-span-2 space-y-4">
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

        {report ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800/60 pb-6">
              {/* Score circle layout */}
              <div className={`h-24 w-24 rounded-full border-2 flex flex-col items-center justify-center shrink-0 shadow-lg ${getScoreColorClass(report.result_json.score)}`}>
                <span className="text-2xl font-bold font-mono tracking-tight leading-none">
                  {report.result_json.score}%
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider mt-1 opacity-80">Match</span>
              </div>

              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  ATS Compatibility Score
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  The match percentage represents candidate compatibility against specified technical keywords, language proficiencies, and general requirements list.
                </p>
              </div>
            </div>

            {/* Missing Skills list */}
            <div className="p-4.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                Missing Key Requirements
              </h5>
              
              {report.result_json.missing_skills.length === 0 ? (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-4.5 w-4.5" /> Core skills matched completely!
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.result_json.missing_skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Optimization Checklist */}
            <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-4">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <ListChecks className="h-4.5 w-4.5 text-indigo-400" />
                Optimization Recommendations Checklist
              </h5>
              
              <ul className="space-y-3">
                {report.result_json.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950 bg-slate-900"
                    />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div className="h-full border border-slate-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center bg-slate-900/20 text-slate-500 min-h-[400px]">
            <Award className="h-12 w-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No Fit Score Calculated</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Select your master resume, select target job posting, and click match button to verify ATS compatibilities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
