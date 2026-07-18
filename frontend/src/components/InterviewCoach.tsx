import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, 
  HelpCircle, MessageSquare, ChevronDown, ChevronUp 
} from 'lucide-react';

interface Job {
  title: string | null;
  company: string | null;
}

interface Application {
  id: string;
  status: string;
  job: Job | null;
}

interface Question {
  question: string;
  suggested_answer: string;
}

export const InterviewCoach: React.FC = () => {
  const { token } = useAuth();
  
  // Data lists
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Result questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/applications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApps(data);
      if (data.length > 0) setSelectedAppId(data[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracked jobs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchApps();
    }
  }, [token, fetchApps]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    
    setGenerating(true);
    setError(null);
    setSuccess(null);
    setQuestions([]);
    setExpandedIndex(null);
    
    try {
      const res = await fetch(`/api/v1/applications/${selectedAppId}/interview-questions`, {
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
        throw new Error(errData.detail || 'Failed to generate questions');
      }
      
      const data = await res.json();
      setQuestions(data.questions || []);
      setSuccess('Challenging interview questions generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate interview questions');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => prev === idx ? null : idx);
  };

  if (loading && apps.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Selection panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-6">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
            Interview Preparation
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Job Application
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {apps.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.job?.title || 'Job'} &bull; {app.job?.company || 'Company'} ({app.status})
                  </option>
                ))}
              </select>
              {apps.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-2">
                  Please track a job application in the "Application Tracker" tab first.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={generating || !selectedAppId}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/35 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating Prep...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Questions
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Questions list */}
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

        {questions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
              Tailored Behavioral & Technical Questions
            </h3>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition shadow-md"
                  >
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full flex justify-between items-center text-left cursor-pointer focus:outline-none"
                    >
                      <div className="flex gap-3">
                        <span className="text-xs font-mono font-bold text-violet-400 mt-0.5">Q{idx + 1}.</span>
                        <p className="text-xs font-bold text-slate-200 leading-relaxed">{q.question}</p>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="h-4.5 w-4.5 text-slate-500 shrink-0 ml-3" />
                      ) : (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-500 shrink-0 ml-3" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 pl-8 space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Suggested STAR Guidance</h5>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans leading-relaxed font-light whitespace-pre-wrap">
                          {q.suggested_answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full border border-slate-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center bg-slate-900/20 text-slate-500 min-h-[400px]">
            <HelpCircle className="h-12 w-12 text-slate-700 mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No Interview Questions Generated</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Select your application from the left panel, and click generate. AI will prepare 5 custom behavioral/technical questions tailored to the job description and your resume!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
