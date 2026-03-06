"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReferralFAB({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'earnings'
  
  // Bank Form State
  const [showBankModal, setShowBankModal] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  const [stats, setStats] = useState({
    referralCode: '',
    weeklyEarnings: 0,
    role: 'user',
    referralCount: 0,
    hasBankDetails: false,
    pendingPayout: false
  });

  const [commissions, setCommissions] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);

  async function loadReferralData() {
    if (!userId) return;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('referral_code, referral_weekly_earnings, role, referral_count, bank_account_number, bank_name, bank_account_name')
      .eq('id', userId)
      .single();
    
    if (profile) {
      const hasBank = !!profile.bank_account_number && !!profile.bank_name;
      setStats({
        referralCode: profile.referral_code,
        weeklyEarnings: profile.referral_weekly_earnings || 0,
        role: profile.role || 'user',
        referralCount: profile.referral_count || 0,
        hasBankDetails: hasBank
      });

      if (hasBank) {
        setBankDetails({
          accountNumber: profile.bank_account_number || '',
          bankName: profile.bank_name || '',
          accountName: profile.bank_account_name || ''
        });
      }
    }

    // Check for pending payouts
    const { data: pending } = await supabase
      .from('referral_payouts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1);
    
    setStats(prev => ({ ...prev, pendingPayout: pending && pending.length > 0 }));

    const { data: comms } = await supabase
      .from('referral_commissions')
      .select('*, referred:user_profiles(username)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (comms) setCommissions(comms);

    // Fetch payout history
    const { data: payouts } = await supabase
      .from('referral_payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (payouts) setPayoutHistory(payouts);

    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) loadReferralData();
    else if (userId) {
       supabase.from('user_profiles').select('referral_code').eq('id', userId).single()
       .then(({data}) => {
         if (data) setStats(prev => ({...prev, referralCode: data.referral_code}));
         setLoading(false);
       });
    }
  }, [userId, isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${stats.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats.referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRedeemClick = () => {
    setShowBankModal(true);
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setIsSubmittingPayout(true);

    try {
      // 1. Update bank details if not already set or if changed
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          bank_account_number: bankDetails.accountNumber,
          bank_name: bankDetails.bankName,
          bank_account_name: bankDetails.accountName
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 2. Call the RPC function to create payout and reset balance
      const { error: payoutError } = await supabase.rpc('request_referral_payout', {
        p_user_id: userId
      });

      if (payoutError) throw payoutError;

      alert('Payout request submitted successfully! Your balance has been reset.');
      setShowBankModal(false);
      loadReferralData(); // Refresh stats

    } catch (err) {
      alert(err.message || 'Failed to submit payout request');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const redeemThresholdAmount = 0;
  const canRedeem = stats.weeklyEarnings >= redeemThresholdAmount && !stats.pendingPayout;

  if (loading && !stats.referralCode) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 z-40 flex items-center gap-2 group"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        <span className="hidden group-hover:inline-block text-sm font-semibold whitespace-nowrap">
          Affiliate Program
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Affiliate Center</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                     stats.role === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'
                   }`}>
                     {stats.role === 'vip' ? 'VIP Affiliate' : 'Standard Affiliate'}
                   </span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     {stats.role === 'vip' ? '15% Commission' : '10% Commission'}
                   </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex border-b border-slate-100">
              <button onClick={() => setActiveTab('invite')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'invite' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Invite & Link
              </button>
              <button onClick={() => setActiveTab('earnings')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'earnings' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Weekly Earnings
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'invite' ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Share your link and earn <span className="font-bold text-slate-900">{stats.role === 'vip' ? '15%' : '10%'}</span> of every purchase your friends make.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Referrals:</span>
                       <span className="text-sm font-black text-emerald-600">{stats.referralCount}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Referral Link</label>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={`${window.location.origin}?ref=${stats.referralCode}`} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none" />
                        <button onClick={handleCopyLink} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}>
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Referral Code</label>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={stats.referralCode} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest text-indigo-600 outline-none" />
                        <button onClick={handleCopyCode} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${codeCopied ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200'}`}>
                          {codeCopied ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 text-xs mb-1">Important Payout Rules:</h4>
                    <ul className="text-[11px] text-amber-800 space-y-1 list-disc ml-3">
                      <li>Accumulated bonuses reset every <span className="font-bold">Friday</span> at 11:59 PM.</li>
                      <li>You must accumulate at least <span className="font-bold">₦10,000</span> to redeem.</li>
                      <li>Payouts for redeemed bonuses happen every <span className="font-bold">Monday</span>.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Weekly Earnings</p>
                      <p className="text-3xl font-black text-slate-900">₦{stats.weeklyEarnings.toLocaleString()}<span className="text-sm text-slate-400 font-bold">/₦{redeemThresholdAmount.toLocaleString()}</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-slate-600">Redemption Progress</span>
                       <span className="text-xs font-bold text-emerald-600">{Math.min(100, (stats.weeklyEarnings/redeemThresholdAmount)*100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (stats.weeklyEarnings/redeemThresholdAmount)*100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      {stats.pendingPayout ? '⏳ Payout request pending approval.' : canRedeem ? '✅ Threshold reached! Redeem for Monday payout.' : `₦{(redeemThresholdAmount - stats.weeklyEarnings).toLocaleString()} more needed to unlock redemption.`}
                    </p>
                  </div>

                  <button 
                    onClick={handleRedeemClick}
                    disabled={!canRedeem}
                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all ${
                      canRedeem ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {stats.pendingPayout ? 'Payout Request Pending' : canRedeem ? 'Redeem Bonus (Paid Monday)' : 'Redeem Locked'}
                  </button>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recent Activity</h4>
                    {commissions.length > 0 ? commissions.map(comm => (
                      <div key={comm.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold">{comm.commission_percentage}%</div>
                           <div>
                             <p className="font-bold text-slate-900">₦{comm.amount.toLocaleString()}</p>
                             <p className="text-[10px] text-slate-400">{new Date(comm.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${comm.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{comm.status}</span>
                      </div>
                    )) : <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200"><p className="text-[11px] text-slate-400">No earnings recorded this week.</p></div>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
               <p className="text-[10px] text-slate-400 text-center">Unredeemed bonuses reset every Friday at 11:59 PM.</p>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Redeem Earnings 🏦</h3>
            <p className="text-slate-500 text-sm mb-6">Enter your bank details to receive your <strong>₦{stats.weeklyEarnings.toLocaleString()}</strong> payout on Monday.</p>
            
            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bank Name</label>
                <input required type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="e.g. GTBank, Kuda, Zenith" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Number</label>
                <input required type="text" maxLength="10" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value.replace(/\D/g, '')})} placeholder="10-digit number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Holder Name</label>
                <input required type="text" value={bankDetails.accountName} onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})} placeholder="Full legal name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-bold" />
              </div>

              <div className="pt-4">
                <button disabled={isSubmittingPayout} type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50">
                  {isSubmittingPayout ? 'Processing Request...' : 'Confirm & Request Payout'}
                </button>
                <button type="button" onClick={() => setShowBankModal(false)} className="w-full mt-2 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
