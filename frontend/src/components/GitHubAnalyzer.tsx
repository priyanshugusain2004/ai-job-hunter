import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, 
  GitBranch, ShieldCheck, Flame, BarChart3, FileWarning 
} from 'lucide-react';
import { Github } from './icons';


interface GitHubAnalysisResult {
  repos_summary: string;
  languages: Record<string, number>;
  activity: string;
  strengths: string[];
  weaknesses: string[];
}

export const GitHubAnalyzer: React.FC = () => {
  const { token } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Results
  const [analysis, setAnalysis] = useState<GitHubAnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAnalysis(null);
    
    try {
      const res = await fetch('/api/v1/github/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim()
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'GitHub profile analysis failed');
      }
      
      const report = await res.json();
      setAnalysis(report.result_json);
      setSuccess(`Analysis of GitHub profile '${username}' complete!`);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze GitHub profile');
    } finally {
      setLoading(false);
    }
  };

  // Helper colors for common languages
  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      python: 'bg-emerald-500',
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-600',
      html: 'bg-rose-500',
      css: 'bg-indigo-500',
      java: 'bg-amber-600',
      c: 'bg-slate-500',
      'c++': 'bg-pink-500'
    };
    return colors[lang.toLowerCase()] || 'bg-slate-700';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Input Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-6">
            <Github className="h-4.5 w-4.5 text-indigo-400" />
            GitHub Analyzer
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                GitHub Username
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
                <Github className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/35 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Analyzing repositories...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze Profile
                </>
              )}
            </button>
          </form>
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

        {analysis ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            
            {/* Header section with activity level badge */}
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
                Technical Profile Evaluation
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <Flame className="h-3.5 w-3.5" /> {analysis.activity} Activity
              </span>
            </div>

            {/* Repos summary */}
            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch className="h-4 w-4 text-indigo-400" />
                Open Source Footprint
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {analysis.repos_summary}
              </p>
            </div>

            {/* Language distribution flex bar */}
            <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
                Primary Language Proficiency
              </h4>
              
              <div className="space-y-3">
                {/* Horizontal layered progress bar */}
                <div className="h-3 w-full rounded-full bg-slate-900 flex overflow-hidden">
                  {Object.entries(analysis.languages).map(([lang, percentage]) => (
                    <div
                      key={lang}
                      style={{ width: `${percentage}%` }}
                      className={`${getLanguageColor(lang)} transition-all duration-300`}
                      title={`${lang}: ${percentage}%`}
                    />
                  ))}
                </div>

                {/* Key badges with percentages */}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {Object.entries(analysis.languages).map(([lang, percentage]) => (
                    <div key={lang} className="flex items-center gap-2 text-xs font-semibold">
                      <span className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(lang)}`} />
                      <span className="text-slate-300">{lang}</span>
                      <span className="text-slate-500">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="p-4.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Identified Strengths
                </h5>
                <ul className="space-y-2">
                  {analysis.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Development Areas
                </h5>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
                      <FileWarning className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full border border-slate-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center bg-slate-900/20 text-slate-500 min-h-[400px]">
            <Github className="h-12 w-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No profile analysis loaded</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Input a public GitHub username in the left panel to fetch repository details and generate AI analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
