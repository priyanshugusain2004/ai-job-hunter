import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, FileText, RefreshCw, AlertCircle, 
  CheckCircle2, Info, ListChecks, Download, Check, Eye
} from 'lucide-react';


interface Resume {
  id: string;
  user_id: string;
  kind: string;
  source_job_id: string | null;
  file_path: string | null;
  raw_text: string | null;
  structured_json: any;
  version: number;
  created_at: string;
  updated_at: string;
}

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
}

export const TailorResume: React.FC = () => {
  const { token } = useAuth();
  
  // Data lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Selection states
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [tailoringResume, setTailoringResume] = useState(false);
  
  // Tailoring result
  const [tailoredResult, setTailoredResult] = useState<Resume | null>(null);
  const [resultTab, setResultTab] = useState<'text' | 'changes' | 'skills'>('text');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resumesRes, jobsRes] = await Promise.all([
        fetch('/api/v1/resumes', { headers }),
        fetch('/api/v1/jobs', { headers })
      ]);
      
      if (!resumesRes.ok || !jobsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const resumesData = await resumesRes.json();
      const jobsData = await jobsRes.json();
      
      setResumes(resumesData);
      setJobs(jobsData);
      
      // Auto select first master resume if any
      const masterResume = resumesData.find((r: Resume) => r.kind === 'master');
      if (masterResume) setSelectedResumeId(masterResume.id);
      
      // Auto select first job if any
      if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes/jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const activeResume = resumes.find(r => r.id === selectedResumeId);
  const activeJob = jobs.find(j => j.id === selectedJobId);

  // Resume Analyzer trigger
  const handleAnalyzeResume = async () => {
    if (!selectedResumeId) return;
    setAnalyzingResume(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const res = await fetch(`/api/v1/resumes/${selectedResumeId}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Failed to analyze resume');
      }
      
      const updatedResume = await res.json();
      setResumes(prev => prev.map(r => r.id === selectedResumeId ? updatedResume : r));
      setSuccessMsg('Resume skills and details parsed successfully!');
    } catch (err: any) {
      setError(err.message || 'Resume analysis failed.');
    } finally {
      setAnalyzingResume(false);
    }
  };

  // Resume Tailoring trigger
  const handleTailorResume = async () => {
    if (!selectedResumeId || !selectedJobId) return;
    setTailoringResume(true);
    setError(null);
    setSuccessMsg(null);
    setTailoredResult(null);
    
    try {
      const res = await fetch(`/api/v1/resumes/${selectedResumeId}/tailor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: selectedJobId
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Failed to tailor resume');
      }
      
      const newTailoredResume = await res.json();
      setResumes(prev => [newTailoredResume, ...prev]);
      setTailoredResult(newTailoredResume);
      setResultTab('text');
      setSuccessMsg('AI tailoring complete! Generated matching resume profile.');
    } catch (err: any) {
      setError(err.message || 'AI tailoring failed.');
    } finally {
      setTailoringResume(false);
    }
  };

  // Helpers to categorize skills
  const getSkillsByCategory = (skillsList: any[]) => {
    if (!skillsList) return {};
    const categories: Record<string, string[]> = {};
    skillsList.forEach(s => {
      const cat = s.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s.name);
    });
    return categories;
  };

  const handleDownload = () => {
    if (!tailoredResult || !tailoredResult.raw_text) return;
    const element = document.createElement("a");
    const file = new Blob([tailoredResult.raw_text], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `tailored_resume_${activeJob?.company || 'job'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading && resumes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-4">Loading resumes and jobs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Selector Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"></div>
        
        {/* Step 1: Select Resume */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="h-5 w-5 bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center rounded-lg text-[10px]">1</span>
            Select Base Resume
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => {
              setSelectedResumeId(e.target.value);
              setTailoredResult(null);
            }}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition cursor-pointer"
          >
            <option value="">-- Choose Resume --</option>
            {resumes.filter(r => r.kind === 'master').map(resume => (
              <option key={resume.id} value={resume.id}>
                {resume.file_path ? resume.file_path.split('/').pop() : 'Resume'} (v{resume.version})
              </option>
            ))}
          </select>
          {resumes.filter(r => r.kind === 'master').length === 0 && (
            <p className="text-[10px] text-amber-400">Please upload a master resume in the "My Resumes" tab first.</p>
          )}
        </div>

        {/* Step 2: Select Job */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="h-5 w-5 bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center rounded-lg text-[10px]">2</span>
            Select Target Job
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setTailoredResult(null);
            }}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition cursor-pointer"
          >
            <option value="">-- Choose Job --</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title || 'Untitled Job'} &bull; {job.company || 'Unknown Company'}
              </option>
            ))}
          </select>
          {jobs.length === 0 && (
            <p className="text-[10px] text-amber-400">Please paste a target job description in the "Target Jobs" tab first.</p>
          )}
        </div>

        {/* E2E Buttons */}
        <div className="md:col-span-2 pt-4 border-t border-slate-800/60 flex flex-wrap gap-4 items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Analyze base profile before tailoring, then run tailoring to map matching highlights.
          </div>
          
          <div className="flex gap-3">
            {activeResume && !activeResume.structured_json && (
              <button
                onClick={handleAnalyzeResume}
                disabled={analyzingResume || !selectedResumeId}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {analyzingResume ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Analyzing base...
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-indigo-400" />
                    AI Analyze Resume
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleTailorResume}
              disabled={tailoringResume || !selectedResumeId || !selectedJobId}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/30 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              {tailoringResume ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Tailor Resume with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Main Analysis Display Grid (Base Resume vs Tailored Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Base Resume Analyzer Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500"></div>
          
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/60 pb-4">
            <FileText className="h-4.5 w-4.5 text-indigo-400" />
            Base Resume Profile
          </h3>

          {activeResume ? (
            activeResume.structured_json ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-400" />
                    Career Summary
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {activeResume.structured_json.summary}
                  </p>
                </div>

                {/* Skills categorizations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extracted Skills Registry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(getSkillsByCategory(activeResume.structured_json.skills)).map(([category, skillNames]) => (
                      <div key={category} className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                          {category}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {skillNames.map((s, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Accordion */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Experience History</h4>
                  <div className="space-y-3">
                    {activeResume.structured_json.experience?.map((exp: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-200">{exp.role}</p>
                            <p className="text-[10px] font-semibold text-slate-500">{exp.company}</p>
                          </div>
                          <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                            {exp.start_date} – {exp.end_date}
                          </span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1.5 mt-2">
                          {exp.highlights?.map((hl: string, hIdx: number) => (
                            <li key={hIdx} className="text-[11px] text-slate-400 leading-relaxed">{hl}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Education</h4>
                  <div className="space-y-3">
                    {activeResume.structured_json.education?.map((edu: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{edu.degree}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{edu.institution}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{edu.grad_year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl bg-slate-950/10 space-y-3">
                <Sparkles className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-slate-300 font-bold text-sm">Analyze Resume Skills</h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  Run AI resume analysis to extract summary sections, categorized skills, work histories, and education details.
                </p>
                <button
                  onClick={handleAnalyzeResume}
                  disabled={analyzingResume}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-slate-100 rounded-xl border border-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  {analyzingResume ? 'Analyzing Profile...' : 'AI Analyze Base'}
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a base resume from Step 1 above.
            </div>
          )}
        </div>

        {/* Right: Tailored Resume Generator Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          
          <div>
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-6">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-400" />
                Tailored Resume Result
              </h3>
              
              {tailoredResult && (
                <button
                  onClick={handleDownload}
                  className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save MD
                </button>
              )}
            </div>

            {tailoringResume ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                <h4 className="text-slate-300 font-bold text-sm">Aligning Profile Achievements</h4>
                <p className="text-slate-500 text-xs max-w-xs text-center leading-relaxed">
                  Tailoring career summary, customizing experience bullet points to match requirements, and injecting target skills...
                </p>
              </div>
            ) : tailoredResult ? (
              <div className="space-y-6">
                {/* Result Tabs */}
                <div className="flex border-b border-slate-850 p-0.5 bg-slate-950 rounded-xl">
                  <button
                    onClick={() => setResultTab('text')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold cursor-pointer transition ${
                      resultTab === 'text'
                        ? 'bg-slate-800 text-slate-100 shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Tailored Resume (MD)
                  </button>
                  <button
                    onClick={() => setResultTab('changes')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold cursor-pointer transition ${
                      resultTab === 'changes'
                        ? 'bg-slate-800 text-slate-100 shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Changes Made
                  </button>
                  <button
                    onClick={() => setResultTab('skills')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold cursor-pointer transition ${
                      resultTab === 'skills'
                        ? 'bg-slate-800 text-slate-100 shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Skills Integrated
                  </button>
                </div>

                {/* Tab content 1: Markdown */}
                {resultTab === 'text' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 max-h-[500px] overflow-y-auto">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {tailoredResult.raw_text}
                    </pre>
                  </div>
                )}

                {/* Tab content 2: Changes list */}
                {resultTab === 'changes' && (
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <ListChecks className="h-4.5 w-4.5 text-violet-400" />
                      List of Resume Modifications
                    </h4>
                    <ul className="space-y-3">
                      {tailoredResult.structured_json?.changes_made?.map((change: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      )) || <p className="text-xs text-slate-600">No modifications logged</p>}
                    </ul>
                  </div>
                )}

                {/* Tab content 3: Skills Added */}
                {resultTab === 'skills' && (
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Keywords & Skills Injected
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      These target requirements were matched and naturally integrated into the experience highlights:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tailoredResult.structured_json?.skills_added?.map((skill: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-xs px-3 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold font-mono"
                        >
                          {skill}
                        </span>
                      )) || <p className="text-xs text-slate-600 font-sans">No new skills added (already complete!)</p>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Select your base resume, select your target job, and click <strong>"Tailor Resume with AI"</strong> at the top to generate a custom resume version.
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-slate-600 mt-6 pt-4 border-t border-slate-850">
            * Note: Tailored resumes are stored as version histories and can be downloaded as Markdown (.md) documents.
          </div>
        </div>

      </div>
    </div>
  );
};
