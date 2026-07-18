import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, RefreshCw, AlertCircle, TrendingUp, 
  Award, Briefcase 
} from 'lucide-react';

interface AnalyticsData {
  total_applications: number;
  status_counts: {
    wishlist: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
  };
  conversion_rates: {
    interview_rate: number;
    offer_rate: number;
  };
}

export const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/applications/analytics', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load application analytics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics metrics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find max count to scale bar charts
  const counts = data?.status_counts || { wishlist: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 };
  const maxVal = Math.max(...Object.values(counts), 1);

  const chartStages = [
    { key: 'wishlist', label: 'Wishlist', color: 'bg-slate-700' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'interviewing', label: 'Interviewing', color: 'bg-amber-500' },
    { key: 'offer', label: 'Offers', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-rose-500' }
  ];

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Main Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500"></div>
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center rounded-xl shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Applications</p>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">{data.total_applications}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500"></div>
              <div className="h-10 w-10 bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center rounded-xl shrink-0">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interviewing Stage</p>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">{data.status_counts.interviewing}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500"></div>
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center rounded-xl shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offers Received</p>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">{data.status_counts.offer}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-violet-500"></div>
              <div className="h-10 w-10 bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center rounded-xl shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interview Rate</p>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">{data.conversion_rates.interview_rate}%</p>
              </div>
            </div>
          </div>

          {/* Charts & Funnel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Bar Charts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/60 pb-4">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
                Pipeline Distribution
              </h3>

              <div className="space-y-4 pt-2">
                {chartStages.map(stage => {
                  const count = counts[stage.key as keyof typeof counts] || 0;
                  const pct = Math.max(Math.round((count / maxVal) * 100), 2);
                  return (
                    <div key={stage.key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">{stage.label}</span>
                        <span className="text-slate-250 font-mono">{count} jobs</span>
                      </div>
                      
                      <div className="h-3.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${stage.color} rounded-r transition-all duration-500`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Funnel conversion statistics */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>

              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800/60 pb-4">
                <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
                Funnel Conversion Rates
              </h3>

              <div className="space-y-8 pt-4">
                {/* Interviewing Funnel card */}
                <div className="flex items-center gap-6 p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div className="h-16 w-16 rounded-full border border-violet-500/30 bg-violet-500/5 flex items-center justify-center text-xl font-bold font-mono text-violet-400 shrink-0">
                    {data.conversion_rates.interview_rate}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Applied &rarr; Interview Conversion</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Percentage of applied positions that progressed to the interviewing stage.
                    </p>
                  </div>
                </div>

                {/* Offer Funnel card */}
                <div className="flex items-center gap-6 p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div className="h-16 w-16 rounded-full border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center text-xl font-bold font-mono text-emerald-400 shrink-0">
                    {data.conversion_rates.offer_rate}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Applied &rarr; Offer Success Rate</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Percentage of applied positions that resulted in a final job offer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
