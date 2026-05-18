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
  Search: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Eye: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c3.55 0 6.733 1.835 8.542 4.646.458.705.458 1.584 0 2.29C18.733 16.165 15.55 18 12 18c-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
};

export default function SellerAccreditationAdmin() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewPassport, setPreviewPassport] = useState(null);
  const [closingAccount, setClosingAccount] = useState(null); // Seller to close

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
      if (filter !== 'all') {
        setApplicants(prev => prev.filter(a => a.id !== id));
      } else {
        setApplicants(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplicants = applicants.filter(a => 
    a.email_updates.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Seller Accreditation</h1>
        <p className="text-slate-500 font-medium">Verify and manage academic project sellers</p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 text-sm"
          />
        </div>

        <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === s ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* LIST VIEW TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div></td></tr>
              ) : filteredApplicants.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No applicants found</td></tr>
              ) : filteredApplicants.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div 
                         onClick={() => setPreviewPassport(applicant.passport_url)}
                         className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
                       >
                         <img src={applicant.passport_url} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <div className="font-black text-slate-900 text-sm">{applicant.first_name} {applicant.last_name}</div>
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{applicant.user_id.slice(0,8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{applicant.universities?.name || applicant.custom_institution}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{applicant.department}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{applicant.email_updates}</div>
                    <div className="text-[10px] font-black text-slate-400 mt-1">{applicant.phone_number}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      applicant.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      applicant.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setPreviewPassport(applicant.passport_url)}
                         className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                         title="View Identity"
                       >
                         <Icons.Eye className="w-5 h-5" />
                       </button>
                       {applicant.status === 'approved' && (
                         <button 
                           onClick={() => setClosingAccount(applicant)}
                           className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                           title="Close Seller Account"
                         >
                           <Icons.Trash className="w-5 h-5" />
                         </button>
                       )}
                       {applicant.status === 'pending' && (
                         <>
                           <button 
                             disabled={processing}
                             onClick={() => handleUpdateStatus(applicant.id, 'rejected')}
                             className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition"
                           >
                             Reject
                           </button>
                           <button 
                             disabled={processing}
                             onClick={() => handleUpdateStatus(applicant.id, 'approved')}
                             className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                           >
                             Approve
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passport Preview Modal */}
      {previewPassport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" onClick={() => setPreviewPassport(null)} />
          <div className="relative max-w-xl w-full flex flex-col items-center">
            <button 
              onClick={() => setPreviewPassport(null)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest"
            >
              Close <Icons.X className="w-5 h-5" />
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

      {/* Close Account Confirmation Modal */}
      {closingAccount && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-10 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                    <Icons.Trash className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Close Account?</h2>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">
                    Are you sure you want to close the seller account for <b>{closingAccount.first_name} {closingAccount.last_name}</b>? This will revoke their selling privileges immediately.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => setClosingAccount(null)} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-black">Cancel</button>
                    <button 
                        onClick={() => {
                            handleUpdateStatus(closingAccount.id, 'rejected', 'Account closed by administrator');
                            setClosingAccount(null);
                        }}
                        className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-200"
                    >
                        Confirm Closure
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
