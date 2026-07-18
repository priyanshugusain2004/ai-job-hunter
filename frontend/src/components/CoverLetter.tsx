import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, RefreshCw, AlertCircle, 
  CheckCircle2, Copy, Download, MessageSquare, Send
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

export const CoverLetter: React.FC = () => {
  const { token } = useAuth();
  
  // Lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Selections
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [tone, setTone] = useState('professional');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Result
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resumesRes, jobsRes] = await Promise.all([
        fetch('/api/v1/resumes/', { headers }),
        fetch('/api/v1/jobs/', { headers })
      ]);
      
      if (!resumesRes.ok || !jobsRes.ok) throw new Error('Failed to load data');
      
      const resumesData = await resumesRes.json();
      const jobsData = await jobsRes.json();
      
      setResumes(resumesData.filter((r: Resume) => r.kind === 'master'));
      setJobs(jobsData);
      
      if (resumesData.length > 0) setSelectedResumeId(resumesData[0].id);
      if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resumes/jobs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobId) return;
    
    setGenerating(true);
    setError(null);
    setSuccess(null);
    setCoverLetterText(null);
    
    try {
      const res = await fetch('/api/v1/cover-letters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_id: selectedJobId,
          tone
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Cover letter generation failed');
      }
      
      const data = await res.json();
      setCoverLetterText(data.cover_letter_text);
      setSuccess('Cover letter generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setSuccess('Cover letter copied to clipboard!');
  };

  const handleDownload = () => {
    if (!coverLetterText) return;
    const element = document.createElement("a");
    const file = new Blob([coverLetterText], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    const activeJob = jobs.find(j => j.id === selectedJobId);
    element.download = `cover_letter_${activeJob?.company || 'job'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
            Generator Options
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
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

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Choose Tone & Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['professional', 'enthusiastic', 'concise', 'creative'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2 text-center rounded-xl text-xs font-semibold uppercase tracking-wider border transition cursor-pointer ${
                      tone === t
                        ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-violet-500/30 text-violet-400'
                        : 'bg-slate-950/20 border-slate-855 text-slate-500 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !selectedResumeId || !selectedJobId}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/35 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating Letter...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Generate Cover Letter
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Result Panel */}
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

        {coverLetterText ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-6">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-400" />
                Cover Letter Output ({tone})
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer font-bold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save MD
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 flex-1 max-h-[480px] overflow-y-auto leading-relaxed">
              <div className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed whitespace-pre-line">
                {coverLetterText}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full border border-slate-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center bg-slate-900/20 text-slate-500 min-h-[400px]">
            <MessageSquare className="h-12 w-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No Cover Letter Generated</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Select your master resume, select the target job posting, configure your desired tone, and hit generate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
