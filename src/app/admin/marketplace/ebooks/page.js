"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/marketplace/ui/badge';
import { Button } from '@/components/marketplace/ui/button';
import { 
  Check, X, Eye, FileText, 
  Download, Plus, Book, Image as ImageIcon
} from 'lucide-react';

export default function EbookApprovalAdmin() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, ebookId: null, reason: '' });
  const [processing, setProcessing] = useState(false);

  const fetchEbooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketplace/ebooks?status=${filter}`);
      const data = await response.json();
      setEbooks(data || []);
    } catch (error) {
      toast.error('Failed to load ebooks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEbooks();
  }, [fetchEbooks]);

  const handleUpdateStatus = async (id, status, reason = '') => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/marketplace/ebooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reason })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Ebook ${status} successfully`);
      setEbooks(prev => prev.filter(e => e.id !== id));
      setSelectedEbook(null);
      setRejectModal({ open: false, ebookId: null, reason: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEbook = async (id) => {
    if (!confirm('PERMANENT DELETION: Are you absolutely sure? This cannot be undone.')) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/marketplace/ebooks?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Ebook deleted permanently');
      setEbooks(prev => prev.filter(e => e.id !== id));
      setSelectedEbook(null);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ebook Marketplace</h1>
          <p className="text-slate-500 font-medium">Review and authorize digital book listings</p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/marketplace/ebooks/upload"
            className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload New Ebook
          </Link>
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-sm">
          {['pending', 'active', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === s ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
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
      ) : ebooks.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
          <Book className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase text-sm tracking-widest">No {filter} ebooks found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ebook / Author</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ebooks.map((ebook) => (
                <tr key={ebook.id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedEbook(ebook)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                         <img src={ebook.cover_image} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="min-w-0">
                         <div className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{ebook.title}</div>
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest truncate">{ebook.user_id.slice(0,8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="font-black text-slate-900 text-sm">₦{ebook.price?.toLocaleString()}</div>
                    {ebook.original_price && <div className="text-[10px] text-slate-400 line-through">₦{ebook.original_price.toLocaleString()}</div>}
                  </td>
                  <td className="px-6 py-5">
                    <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{ebook.category}</Badge>
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedEbook(ebook); }}
                      className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-zinc-900 hover:text-white transition shadow-sm"
                    >
                      <Icons.Eye className="w-5 h-5" />
                    </button>
                    {ebook.status !== 'pending' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEbook(ebook.id); }}
                        className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEbook && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setSelectedEbook(null)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                        <Book className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{selectedEbook.title}</h2>
                        <div className="flex gap-2 mt-1">
                           <Badge className="bg-slate-100 text-slate-500 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">ID: {selectedEbook.id.slice(0,8)}</Badge>
                           <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">{selectedEbook.status}</Badge>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedEbook(null)} className="p-3 bg-white rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                    <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> AI Structured Preview
                            </h3>
                            <div className="bg-slate-50 rounded-3xl p-8 text-sm text-slate-600 leading-relaxed font-medium h-[600px] overflow-y-auto custom-scrollbar border border-slate-100 shadow-inner prose prose-zinc max-w-none">
                                <ReactMarkdown>{selectedEbook.preview_content}</ReactMarkdown>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-zinc-900 rounded-[32px] p-6 text-white shadow-xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Product Assets</p>
                            
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 mb-6">
                                <img src={selectedEbook.cover_image} className="w-full h-full object-cover" />
                            </div>

                            <a 
                                href={selectedEbook.file_url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg"
                            >
                                <Download className="w-4 h-4" /> Download Manuscript
                            </a>
                        </div>
                    </div>
                </div>
             </div>

             {selectedEbook.status === 'pending' && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={() => setRejectModal({ open: true, ebookId: selectedEbook.id, reason: '' })}
                        className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                        Reject Ebook
                    </button>
                    <button 
                        disabled={processing}
                        onClick={() => handleUpdateStatus(selectedEbook.id, 'active')}
                        className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        {processing ? 'Processing...' : 'Authorize Listing'}
                    </button>
                </div>
             )}
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setRejectModal({ open: false, ebookId: null, reason: '' })} />
            <div className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase tracking-tighter">Rejection Reason</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Explain to the seller why this ebook was rejected.</p>
                
                <textarea 
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
                    placeholder="e.g. Preview content is too short or formatting is poor..."
                    className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-red-500 font-black text-slate-900 text-sm leading-relaxed mb-6 placeholder:text-slate-400"
                />

                <div className="flex gap-4">
                    <button onClick={() => setRejectModal({ open: false, ebookId: null, reason: '' })} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                        disabled={!rejectModal.reason || processing}
                        onClick={() => handleUpdateStatus(rejectModal.ebookId, 'rejected', rejectModal.reason)}
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
