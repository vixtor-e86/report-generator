"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/marketplace/ui/badge';

const Icons = {
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Download: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" />
    </svg>
  ),
  FileText: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Code: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  Eye: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c3.55 0 6.733 1.835 8.542 4.646.458.705.458 1.584 0 2.29C18.733 16.165 15.55 18 12 18c-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
    </svg>
  )
};

export default function ProjectApprovalAdmin() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedProject, setSelectedProject] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, projectId: null, reason: '' });
  const [processing, setProcessing] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketplace/projects?status=${filter}`);
      const data = await response.json();
      setProjects(data || []);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpdateStatus = async (id, status, reason = '') => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/marketplace/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reason })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Project ${status} successfully`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProject(null);
      setRejectModal({ open: false, projectId: null, reason: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Technical Blueprints</h1>
          <p className="text-slate-500 font-medium">Review and approve high-tier technical listings</p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/marketplace/projects/upload"
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Icons.Plus className="w-4 h-4" />
            Upload New Project
          </Link>
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-sm">
          {['pending', 'active', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === s ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>

    {loading ? (
        <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div></div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
          <Icons.FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase text-sm tracking-widest">No {filter} projects found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Seller</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedProject(project)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                         <img src={project.preview_images?.[0]} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="min-w-0">
                         <div className="font-black text-slate-900 text-sm truncate">{project.title}</div>
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest truncate">{project.user_id.slice(0,8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="font-black text-slate-900 text-sm">₦{project.price?.toLocaleString()}</div>
                    {project.original_price && <div className="text-[10px] text-slate-400 line-through">₦{project.original_price.toLocaleString()}</div>}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{project.department}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.faculty}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-zinc-900 hover:text-white transition shadow-sm">
                      <Icons.Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setSelectedProject(null)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             {/* Modal Header */}
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                        <Icons.FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{selectedProject.title}</h2>
                        <div className="flex gap-2 mt-1">
                           <Badge className="bg-slate-100 text-slate-500 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Ref: {selectedProject.id.slice(0,8)}</Badge>
                           <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">{selectedProject.status}</Badge>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-3 bg-white rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                    <Icons.X className="w-6 h-6" />
                </button>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Abstract
                            </h3>
                            <div className="bg-slate-50 rounded-3xl p-6 text-sm text-slate-600 leading-relaxed font-medium h-[400px] overflow-y-auto custom-scrollbar border border-slate-100 shadow-inner prose prose-zinc max-w-none">
                                <ReactMarkdown>{selectedProject.abstract}</ReactMarkdown>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> Chapter 1 Preview
                            </h3>
                            <div className="bg-slate-50 rounded-3xl p-6 text-sm text-slate-600 leading-relaxed font-medium h-[500px] overflow-y-auto custom-scrollbar border border-slate-100 shadow-inner prose prose-zinc max-w-none">
                                <ReactMarkdown>{selectedProject.chapter_1_preview}</ReactMarkdown>
                            </div>
                        </section>

                        {selectedProject.code_snippet && (
                            <section>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Technical Code Snippet
                                </h3>
                                <div className="h-[400px] overflow-y-auto custom-scrollbar">
                                    <pre className="bg-zinc-900 rounded-3xl p-6 text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto shadow-2xl">
                                        <code>{selectedProject.code_snippet}</code>
                                    </pre>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-zinc-900 rounded-[32px] p-6 text-white shadow-xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Metadata Analysis</p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase">Architecture</p>
                                    <p className="text-xs font-bold text-white capitalize">{selectedProject.project_type?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase">Technologies</p>
                                    <p className="text-xs font-bold text-white">{selectedProject.technologies || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase">Academic Level</p>
                                    <p className="text-xs font-bold text-white">{selectedProject.level} Level</p>
                                </div>
                            </div>

                            <a 
                                href={selectedProject.file_url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg"
                            >
                                <Icons.Download className="w-4 h-4" /> Download Package
                            </a>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {selectedProject.preview_images?.map((img, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-200">
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>

             {/* Modal Footer */}
             {selectedProject.status === 'pending' && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={() => setRejectModal({ open: true, projectId: selectedProject.id, reason: '' })}
                        className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                        Reject Blueprint
                    </button>
                    <button 
                        disabled={processing}
                        onClick={() => handleUpdateStatus(selectedProject.id, 'active')}
                        className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        {processing ? 'Processing...' : 'Verify & Authorize Inject'}
                    </button>
                </div>
             )}
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setRejectModal({ open: false, projectId: null, reason: '' })} />
            <div className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase tracking-tighter">Rejection Reason</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Explain to the seller why this blueprint was rejected.</p>
                
                <textarea 
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
                    placeholder="e.g. Documentation is incomplete or abstract is too short..."
                    className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-red-500 font-black text-slate-900 text-sm leading-relaxed mb-6 placeholder:text-slate-400"
                />

                <div className="flex gap-4">
                    <button onClick={() => setRejectModal({ open: false, projectId: null, reason: '' })} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                        disabled={!rejectModal.reason || processing}
                        onClick={() => handleUpdateStatus(rejectModal.projectId, 'rejected', rejectModal.reason)}
                        className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 disabled:opacity-50"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
