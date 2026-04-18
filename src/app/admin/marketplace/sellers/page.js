"use client";
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Building: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H9a2 2 0 00-2 2v16m12 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
};

export default function SellerAccreditationAdmin() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [processing, setProcessing] = useState(false);
  const [previewPassport, setPreviewPassport] = useState(null);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketplace/sellers?status=${filter}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setApplicants(data || []);
    } catch (error) {
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const handleUpdateStatus = async (id, status, notes = '') => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/marketplace/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Applicant ${status} successfully`);
      setApplicants(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Seller Accreditation</h1>
        <p className="text-slate-500 font-medium">Verify and approve academic project sellers</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === s ? 'bg-zinc-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid of Applicants */}
      {loading ? (
        <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div></div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
          <Icons.User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase text-sm tracking-widest">No {filter} applications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applicants.map((applicant) => (
            <div key={applicant.id} className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm hover:border-blue-500 transition-all group relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 p-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    applicant.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    applicant.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {applicant.status}
                  </span>
               </div>

               <div className="flex items-center gap-4 mb-8">
                  <div 
                    onClick={() => setPreviewPassport(applicant.passport_url)}
                    className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group/img"
                  >
                    <img src={applicant.passport_url} alt="Passport" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 truncate">{applicant.first_name} {applicant.last_name}</h3>
                    <p className="text-xs text-slate-500 font-bold truncate">{applicant.email_updates}</p>
                  </div>
               </div>

               <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-start gap-3">
                    <Icons.Building className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</p>
                      <p className="text-xs font-bold text-slate-700">{applicant.universities?.name || applicant.custom_institution}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icons.Check className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                      <p className="text-xs font-bold text-slate-700">{applicant.department} ({applicant.faculty})</p>
                    </div>
                  </div>
               </div>

               {applicant.status === 'pending' && (
                 <div className="flex gap-3">
                    <button 
                      disabled={processing}
                      onClick={() => handleUpdateStatus(applicant.id, 'rejected')}
                      className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      disabled={processing}
                      onClick={() => handleUpdateStatus(applicant.id, 'approved')}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50"
                    >
                      {processing ? '...' : 'Approve'}
                    </button>
                 </div>
               )}
            </div>
          ))}
        </div>
      )}

      {/* Passport Preview Modal */}
      {previewPassport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" onClick={() => setPreviewPassport(null)} />
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button 
              onClick={() => setPreviewPassport(null)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest"
            >
              Close Identity <Icons.X className="w-5 h-5" />
            </button>
            <div className="bg-white p-2 rounded-[40px] shadow-2xl overflow-hidden ring-4 ring-white/10">
              <img 
                src={previewPassport} 
                className="max-h-[75vh] w-auto rounded-[32px] object-contain" 
                alt="Enlarged Identity" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
