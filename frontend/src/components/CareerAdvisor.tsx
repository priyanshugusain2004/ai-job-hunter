import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Send, RefreshCw, AlertCircle, 
  User, Bot, ClipboardSignature 
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const CareerAdvisor: React.FC = () => {
  const { token } = useAuth();
  
  // Message history
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I am your AI Career Advisor. Ask me anything about job hunting, negotiating salary, updating your resume, or strategizing interviews. How can I help you accelerate your career today?"
    }
  ]);
  
  // Input
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scroller ref
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setError(null);
    setLoading(true);
    
    // Add user message to history locally
    const newHistory = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newHistory);
    
    try {
      const res = await fetch('/api/v1/career-advice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          // Exclude the initial welcome message from AI API payload to keep context cleaner
          history: newHistory.slice(1).map(h => ({
            role: h.role,
            content: h.content
          }))
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 503 && errData.detail?.error?.code === 'ai_not_configured') {
          throw new Error('Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.');
        }
        throw new Error(errData.detail || 'Career advisor failed to reply.');
      }
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (err: any) {
      setError(err.message || 'Advisor request failed');
      // Remove last user message on failure to let them retry
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl h-[600px] flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
      
      {/* Advisor Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center">
            <ClipboardSignature className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Career Strategy Consultant</h3>
            <p className="text-[10px] text-slate-500 font-medium">Interactive Career Strategist</p>
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <RefreshCw className="h-3 w-3 animate-spin text-violet-400" />
            Strategizing...
          </div>
        )}
      </div>

      {/* Messages Pane */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx}
              className={`flex items-start gap-3.5 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                isUser 
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-slate-100'
                  : 'bg-slate-950 border border-slate-850 text-indigo-400'
              }`}>
                {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                isUser 
                  ? 'bg-violet-650 text-slate-100 rounded-tr-none'
                  : 'bg-slate-950 border border-slate-850 text-slate-350 rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {error && (
          <div className="bg-rose-950/30 border border-rose-500/20 text-rose-350 rounded-xl p-3.5 text-xs flex items-center gap-2 max-w-[80%] ml-auto">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form footer */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3 items-center shrink-0">
        <input
          required
          type="text"
          disabled={loading}
          placeholder="Ask about salary negotiation, resume optimizations, or career growth..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 disabled:opacity-60 leading-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-slate-100 rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center shadow-lg shadow-violet-900/30"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
