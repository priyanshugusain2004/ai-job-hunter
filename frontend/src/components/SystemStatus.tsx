import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Cpu, Sparkles, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';

interface HealthResponse {
  status: string;
  database: string;
  redis: string;
  ai_provider: {
    gemini: string;
  };
}

export const SystemStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/health');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch API health status.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            System Integration Status
          </h3>
          <p className="text-slate-400 text-xs mt-1">Live health checks of primary dependencies</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition border border-slate-700 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 mb-4 text-xs font-mono">
          <div className="font-semibold text-sm flex items-center gap-2 text-rose-400 mb-1">
            <ShieldAlert className="h-4 w-4" />
            Connection Error
          </div>
          {error}
        </div>
      )}

      {loading && !health && (
        <div className="flex flex-col items-center py-8">
          <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 mt-4">Querying microservices...</p>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database */}
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${health.database === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Database</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${health.database === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="font-medium text-sm text-slate-200 capitalize">{health.database}</span>
              </div>
            </div>
          </div>

          {/* Redis */}
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${health.redis === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Redis Cache</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${health.redis === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="font-medium text-sm text-slate-200 capitalize">{health.redis}</span>
              </div>
            </div>
          </div>

          {/* Gemini API */}
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${health.ai_provider.gemini === 'configured' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Gemini AI</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${health.ai_provider.gemini === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="font-medium text-sm text-slate-200 capitalize">
                  {health.ai_provider.gemini === 'configured' ? 'Configured' : 'Not Configured'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {health && (
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Overall system status: <strong>{health.status}</strong></span>
        </div>
      )}
    </div>
  );
};
