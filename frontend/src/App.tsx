import { useState, useEffect } from 'react'

interface HealthResponse {
  status: string;
  database: string;
  redis: string;
  ai_provider: {
    gemini: string;
  };
}

function App() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              AI Job Hunter
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
              v1.0.0
            </span>
          </div>
          <div>
            <button 
              onClick={fetchHealth}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition font-medium border border-slate-700 flex items-center gap-2 animate-none"
            >
              <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              Refresh Status
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Foundations Ready
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Phase 1 is successfully scaffolded. The backend, frontend, database, and cache services are connected.
          </p>
        </div>

        {/* Status Dashboard */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"></div>
          
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-200">
            System Integration Status
          </h2>

          {loading && (
            <div className="flex flex-col items-center py-6">
              <div className="h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 mt-4">Checking system health...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg p-4 mb-4 text-sm flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                Backend Connection Error
              </div>
              <p className="font-mono text-xs">{error}</p>
            </div>
          )}

          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Database</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${health.database === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className="font-medium text-sm capitalize">{health.database}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Redis Cache</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${health.redis === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className="font-medium text-sm capitalize">{health.redis}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gemini AI Provider</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${health.ai_provider.gemini === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <span className="font-medium text-sm capitalize">
                    {health.ai_provider.gemini === 'configured' ? 'Configured' : 'Not Configured (Stub mode)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              Endpoints checked: <code className="bg-slate-950 px-2 py-1 rounded text-violet-400 font-mono">/health</code> and <code className="bg-slate-950 px-2 py-1 rounded text-violet-400 font-mono">/api/v1/health</code>
            </div>
            <div>
              Waiting for approval to proceed to Phase 2.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        AI Job Hunter &bull; Built with React, Vite, Tailwind, FastAPI, Postgres, and Redis.
      </footer>
    </div>
  );
}

export default App;
