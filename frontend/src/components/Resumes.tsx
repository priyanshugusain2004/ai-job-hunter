import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, CloudUpload, Trash2, Eye, X, 
  AlertCircle, CheckCircle2, FolderOpen, FileCheck 
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

export const Resumes: React.FC = () => {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Modal state for viewing resume text
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/resumes/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch resumes');
      }
      const data = await res.json();
      setResumes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchResumes();
    }
  }, [token, fetchResumes]);


  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // Upload file API call
  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      setError('Only PDF and DOCX files are supported.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/resumes/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to upload resume');
      }

      const newResume = await res.json();
      setResumes(prev => [newResume, ...prev]);
      setUploadSuccess(`Successfully uploaded and parsed "${file.name}"!`);
      
      // Clear inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Delete resume
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume? The uploaded file and all text extractions will be permanently removed.')) {
      return;
    }
    
    setError(null);
    setUploadSuccess(null);
    try {
      const res = await fetch(`/api/v1/resumes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete resume');
      }

      setResumes(prev => prev.filter(r => r.id !== id));
      setUploadSuccess('Resume deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Resume Upload Drag/Drop Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
        
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
          <CloudUpload className="h-5 w-5 text-indigo-400" />
          Upload Resume
        </h3>
        <p className="text-slate-400 text-xs mb-6">Upload your master resume (PDF or DOCX) to extract work history, skills, and prepare for AI tailoring.</p>

        {error && (
          <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-xl p-4 mb-4 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Error</span>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 mb-4 text-sm flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Success</span>
              <p className="text-xs text-emerald-300/80 mt-0.5">{uploadSuccess}</p>
            </div>
          </div>
        )}

        <div
          ref={dragRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
            isDragOver 
              ? 'border-violet-500 bg-violet-500/5' 
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc"
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-300">Extracting text & storing resume...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-400 inline-block shadow-md">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">
                  Drag and drop your file here, or <span className="text-violet-400 hover:text-violet-300 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PDF, DOCX up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumes List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>

        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
          <FolderOpen className="h-5 w-5 text-indigo-400" />
          My Resumes
        </h3>

        {loading && resumes.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-4">Loading resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 border border-slate-800/60 rounded-xl bg-slate-950/20">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-slate-300 font-bold text-sm">No Resumes Found</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">
              Upload your first master resume to begin. This will serve as the core file for all AI tailor options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resumes.map(resume => (
              <div 
                key={resume.id}
                className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      resume.kind === 'master'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    }`}>
                      {resume.kind}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">v{resume.version}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 truncate mb-2">
                    <FileCheck className="h-4.5 w-4.5 text-violet-400" />
                    {resume.file_path ? resume.file_path.split('/').pop() : 'Resume'}
                  </h4>

                  <p className="text-[10px] text-slate-500">
                    Uploaded: {formatDate(resume.created_at)}
                  </p>
                  
                  {/* Text snippet preview */}
                  <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-900 max-h-20 overflow-hidden text-ellipsis">
                    <p className="text-[11px] text-slate-400 font-mono line-clamp-3 leading-relaxed">
                      {resume.raw_text || 'No text extracted.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end gap-2">
                  <button
                    onClick={() => setViewingResume(resume)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200 transition text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Text
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900 bg-slate-900/50 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Text Viewer Modal */}
      {viewingResume && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Extracted Resume Text
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  File: <code className="bg-slate-950 px-1 py-0.5 rounded text-violet-400">{viewingResume.file_path?.split('/').pop()}</code>
                </p>
              </div>
              <button
                onClick={() => setViewingResume(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-950/80">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {viewingResume.raw_text || 'No text extracted.'}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/40">
              <button
                onClick={() => setViewingResume(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
