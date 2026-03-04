"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReferralFAB({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'earnings'
  
  const [stats, setStats] = useState({
    referralCode: '',
    weeklyEarnings: 0,
    weeklyPurchases: 0,
    role: 'user',
    referralCount: 0
  });

  const [commissions, setCommissions] = useState([]);

  useEffect(() => {
    async function loadReferralData() {
      if (!userId) return;
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('referral_code, referral_weekly_earnings, referral_weekly_purchases, role, referral_count')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setStats({
          referralCode: profile.referral_code,
          weeklyEarnings: profile.referral_weekly_earnings || 0,
          weeklyPurchases: profile.referral_weekly_purchases || 0,
          role: profile.role || 'user',
          referralCount: profile.referral_count || 0
        });
      }

      const { data: comms } = await supabase
        .from('referral_commissions')
        .select('*, referred:auth.users(email)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (comms) setCommissions(comms);
      
      setLoading(false);
    }

    if (isOpen) loadReferralData();
    else if (userId) {
       // Just load basic code for the link
       supabase.from('user_profiles').select('referral_code').eq('id', userId).single()
       .then(({data}) => {
         if (data) setStats(prev => ({...prev, referralCode: data.referral_code}));
         setLoading(false);
       });
    }
  }, [userId, isOpen]);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${stats.referralCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redeemThreshold = 5;
  const canRedeem = stats.weeklyPurchases >= redeemThreshold;

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
            
            {/* Header */}
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

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('invite')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'invite' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Invite & Link
              </button>
              <button 
                onClick={() => setActiveTab('earnings')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'earnings' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Referral Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={referralLink}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none"
                      />
                      <button 
                        onClick={handleCopy}
                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                          copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 text-xs mb-1">Important Payout Rules:</h4>
                    <ul className="text-[11px] text-amber-800 space-y-1 list-disc ml-3">
                      <li>Withdrawals are processed every <span className="font-bold">Friday</span>.</li>
                      <li>You need at least <span className="font-bold">5 purchases</span> from referrals in a week to redeem.</li>
                      <li>Unredeemed bonuses reset every Friday at 11:59 PM.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Weekly Earnings</p>
                      <p className="text-2xl font-black text-slate-900">₦{stats.weeklyEarnings.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Purchases</p>
                      <p className="text-2xl font-black text-slate-900">{stats.weeklyPurchases}<span className="text-sm text-slate-400 font-bold">/{redeemThreshold}</span></p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-slate-600">Redemption Progress</span>
                       <span className="text-xs font-bold text-emerald-600">{Math.min(100, (stats.weeklyPurchases/redeemThreshold)*100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-500 ${canRedeem ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                         style={{ width: `${Math.min(100, (stats.weeklyPurchases/redeemThreshold)*100)}%` }}
                       />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      {canRedeem ? '✅ Threshold reached! Ready for Friday payout.' : `${redeemThreshold - stats.weeklyPurchases} more purchases needed this week to unlock redemption.`}
                    </p>
                  </div>

                  {/* Redeem Button */}
                  <button 
                    disabled={!canRedeem}
                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all ${
                      canRedeem 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canRedeem ? 'Redeem Payout (Friday)' : 'Redeem Locked'}
                  </button>

                  {/* Recent Commissions */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recent Activity</h4>
                    {commissions.length > 0 ? commissions.map(comm => (
                      <div key={comm.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold">
                             {comm.commission_percentage}%
                           </div>
                           <div>
                             <p className="font-bold text-slate-900">₦{comm.amount.toLocaleString()}</p>
                             <p className="text-[10px] text-slate-400">{new Date(comm.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          comm.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {comm.status}
                        </span>
                      </div>
                    )) : (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[11px] text-slate-400">No earnings recorded this week.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
               <p className="text-[10px] text-slate-400 text-center">
                 Accumulated bonuses reset every Friday at 11:59 PM.
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
