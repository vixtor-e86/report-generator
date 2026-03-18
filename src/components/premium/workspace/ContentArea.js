// src/components/premium/workspace/ContentArea.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import EditTemplateModal from '../modals/EditTemplateModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Full SVG Icons Set
const Icons = {
  Edit3: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>,
  Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  PieChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  Code: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Layers: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
};

export default function ContentArea({ 
  activeView, 
  projectData, 
  chapters, 
  onUpdateChapter,
  onUpdateTemplate,
  onVisualToolsClick,
  onLogoClick,
  images = [],
  workspaceMode = 'editor',
  setWorkspaceMode,
  userProfile,
  showNotification
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [localContent, setLocalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [allProjectHistory, setAllHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 }); 
  const [copied, setCopied] = useState(false);  
  const [codeCopied, setCodeCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [pendingPayout, setPendingPayout] = useState(false);
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', bankName: '', accountName: '' });
  const textareaRef = useRef(null);

  const [commissions, setCommissions] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);

  useEffect(() => {
    if (activeView === 'referral' && projectData?.user_id) {
      async function fetchReferralData() {
        const { data: comms } = await supabase
          .from('referral_commissions')
          .select('*')
          .eq('referrer_id', projectData.user_id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (comms) setCommissions(comms);

        const { data: payouts } = await supabase
          .from('referral_payouts')
          .select('*')
          .eq('user_id', projectData.user_id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (payouts) setPayoutHistory(payouts);

        const { data: pending } = await supabase
          .from('referral_payouts')
          .select('id')
          .eq('user_id', projectData.user_id)
          .eq('status', 'pending')
          .limit(1);
        setPendingPayout(pending && pending.length > 0);

        if (userProfile) {
          setBankDetails({
            accountNumber: userProfile.bank_account_number || '',
            bankName: userProfile.bank_name || '',
            accountName: userProfile.bank_account_name || ''
          });
        }
      }
      fetchReferralData();
    }
  }, [activeView, projectData?.user_id, userProfile]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setIsSubmittingPayout(true);
    try {
      await supabase.from('user_profiles').update({
        bank_account_number: bankDetails.accountNumber,
        bank_name: bankDetails.bankName,
        bank_account_name: bankDetails.accountName
      }).eq('id', projectData.user_id);

      const { error: payoutError } = await supabase.rpc('request_referral_payout', {
        p_user_id: projectData.user_id
      });
      if (payoutError) throw payoutError;

      showNotification('Payout Requested', 'Your withdrawal request has been submitted for Monday payout.', 'success');
      setShowBankModal(false);
      setPendingPayout(true);
    } catch (err) {
      showNotification('Request Failed', err.message || 'Failed to submit payout request.', 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${userProfile?.referral_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userProfile?.referral_code || '');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const activeChapter = activeView.startsWith('chapter-') 
    ? chapters.find(ch => `chapter-${ch.id}` === activeView || `chapter-${ch.number}` === activeView)
    : null;

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      setCursorPosition({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
    }
  };

  useEffect(() => {
    if (activeChapter) {
      setLocalContent(activeChapter.content || '');
    }
  }, [activeChapter?.id, activeChapter?.number, activeChapter?.content]);

  useEffect(() => {
    if (activeView === 'history') {
      async function fetchAllHistory() {
        setLoadingHistory(true);
        const { data } = await supabase
          .from('premium_chapter_history')
          .select('*, premium_chapters(title, chapter_number)')
          .order('created_at', { ascending: false })
          .limit(20);
        
        const chapterIds = chapters.map(c => c.id);
        const projectHistory = data?.filter(h => chapterIds.includes(h.chapter_id)) || [];
        
        setAllHistory(projectHistory);
        setLoadingHistory(false);
      }
      fetchAllHistory();
    }
  }, [activeView, chapters]);

  const handleSaveEdit = async () => {
    if (!activeChapter) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapter.id,
          content: localContent,
          projectId: projectData.id,
          userId: projectData.user_id
        })
      });
      if (response.ok) {
        onUpdateChapter(activeChapter.id, localContent);
        showNotification('Saved', 'Your changes have been saved successfully.', 'success');
      }
    } catch (err) { 
        console.error(err);
        showNotification('Error', 'Failed to save your changes. Please try again.', 'error');
    }
    finally { setIsSaving(false); }
  };

  const handleRestoreVersion = async (item) => {
    showNotification(
      'Restore Version',
      'Are you sure you want to restore this previous version? Any unsaved changes in the current editor will be lost.',
      'confirm',
      async () => {
        onUpdateChapter(item.chapter_id, item.content);
        try {
          await fetch('/api/premium/save-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId: item.chapter_id, content: item.content, projectId: projectData.id, userId: projectData.user_id, isAiAction: false })
          });
          showNotification('Version Restored', 'The selected version has been restored to your editor.', 'success');
        } catch (err) { console.error(err); }
      }
    );
  };

  const insertImageTag = (img) => {
    const tag = `\n![${img.caption || img.original_name}](${img.file_url})\n`;
    const { start, end } = cursorPosition;
    const before = localContent.substring(0, start);
    const after = localContent.substring(end, localContent.length);
    const newText = before + tag + after;
    setLocalContent(newText);
    setShowImageSelector(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + tag.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }
    }, 10);
  };

  const handleSaveChapterTemplate = (updatedChapter) => {
    const currentStructure = projectData.template?.structure || { chapters: [] };
    const newChapters = currentStructure.chapters.map(ch => 
      (ch.chapter || ch.number) === (updatedChapter.chapter || updatedChapter.number) ? updatedChapter : ch
    );
    onUpdateTemplate({ ...currentStructure, chapters: newChapters });
  };

  if (activeView === 'referral') {
    const weeklyEarnings = userProfile?.referral_weekly_earnings || 0;
    const isVip = userProfile?.role === 'vip';
    const redeemThreshold = 10000;
    const canRedeem = weeklyEarnings >= redeemThreshold && !pendingPayout;

    return (
      <div className="content-area">
        <div className="content-layout-wrapper" style={{ alignItems: 'flex-start', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#111827', margin: '0 0 12px 0', letterSpacing: '-1px' }}>Affiliate Dashboard</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
               <span style={{ padding: '4px 12px', borderRadius: '100px', background: isVip ? '#f3e8ff' : '#f1f5f9', color: isVip ? '#7e22ce' : '#475569', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
                 {isVip ? 'VIP Partner' : 'Standard Partner'}
               </span>
               <span style={{ padding: '4px 12px', borderRadius: '100px', background: '#ecfdf5', color: '#059669', fontSize: '12px', fontWeight: '800' }}>
                 {isVip ? '15% Commission' : '10% Commission'}
               </span>
               <span style={{ padding: '4px 12px', borderRadius: '100px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: '800' }}>
                 Total Referrals: {userProfile?.referral_count || 0}
               </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #e5e7eb', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>Invite Friends</h3>
                <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
                  Share your link or code. When they upgrade, you earn. Simple as that.
                </p>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Referral Link</label>
                  <div style={{ display: 'flex', gap: '12px', background: '#f9fafb', padding: '8px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                    <input type="text" readOnly value={referralLink} style={{ flex: 1, background: 'none', border: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#4b5563', outline: 'none' }} />
                    <button onClick={handleCopy} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: copied ? '#ecfdf5' : '#111827', color: copied ? '#059669' : 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Referral Code</label>
                  <div style={{ display: 'flex', gap: '12px', background: '#f9fafb', padding: '8px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                    <input type="text" readOnly value={userProfile?.referral_code} style={{ flex: 1, background: 'none', border: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '800', color: '#6366f1', outline: 'none', letterSpacing: '2px' }} />
                    <button onClick={handleCopyCode} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: codeCopied ? '#eef2ff' : 'white', color: codeCopied ? '#4338ca' : '#111827', border: '1px solid #e5e7eb', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                      {codeCopied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #e5e7eb', padding: '40px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>History</h3>
                
                {payoutHistory.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Redeemed Rewards</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {payoutHistory.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '14px' }}>₦{p.amount.toLocaleString()}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#059669', fontWeight: '600' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '8px', background: p.status === 'paid' ? '#059669' : '#d97706', color: 'white' }}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Recent Commissions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {commissions.length > 0 ? commissions.map(comm => (
                    <div key={comm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '16px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '800', color: '#111827' }}>₦{comm.amount.toLocaleString()}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{new Date(comm.created_at).toLocaleDateString()}</p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: comm.status === 'paid' ? '#059669' : '#d97706' }}>{comm.status}</span>
                    </div>
                  )) : <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No commissions yet this week.</p>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ background: '#111827', borderRadius: '32px', padding: '40px', color: 'white' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Weekly Earnings</p>
                <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '0 0 24px 0' }}>₦{weeklyEarnings.toLocaleString()}</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                    <span>Redeem Goal</span>
                    <span>₦{weeklyEarnings.toLocaleString()}/₦{redeemThreshold.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (weeklyEarnings/redeemThreshold)*100)}%`, background: '#10b981' }} />
                  </div>
                </div>

                <button 
                  onClick={() => setShowBankModal(true)}
                  disabled={!canRedeem} 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: canRedeem ? '#10b981' : 'rgba(255,255,255,0.05)', color: canRedeem ? 'white' : '#4b5563', fontWeight: '800', cursor: canRedeem ? 'pointer' : 'not-allowed' }}>
                  {pendingPayout ? 'Payout Pending' : canRedeem ? 'Redeem Payout' : 'Redeem Locked'}
                </button>
              </div>

              <div style={{ padding: '32px', background: '#fffbeb', borderRadius: '32px', border: '1px solid #fef3c7' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#92400e' }}>Weekly Rules</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ fontSize: '13px', color: '#b45309', display: 'flex', gap: '8px' }}><span>•</span> Reset every Friday 23:59</li>
                  <li style={{ fontSize: '13px', color: '#b45309', display: 'flex', gap: '8px' }}><span>•</span> Min. ₦10,000 to redeem</li>
                  <li style={{ fontSize: '13px', color: '#b45309', display: 'flex', gap: '8px' }}><span>•</span> Payouts every Monday</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* BANK MODAL FOR PREMIUM */}
        {showBankModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '32px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Withdraw Funds 🏦</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>Enter where we should send your <strong>₦{weeklyEarnings.toLocaleString()}</strong>.</p>
              
              <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Bank Name</label>
                  <input required type="text" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="e.g. Zenith, Kuda, GTBank" style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Account Number</label>
                  <input required type="text" maxLength="10" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value.replace(/\D/g, '')})} placeholder="10-digit number" style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Account Holder Name</label>
                  <input required type="text" value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} placeholder="Full legal name" style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button disabled={isSubmittingPayout} type="submit" style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                    {isSubmittingPayout ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                  <button type="button" onClick={() => setShowBankModal(false)} style={{ width: '100%', padding: '14px', marginTop: '8px', border: 'none', background: 'none', color: '#9ca3af', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'edit-template') {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper" style={{ alignItems: 'flex-start' }}>
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Project Template</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Define the structure and sections for each chapter.</p>
          </div>
          
          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e5e7eb', width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#111827', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Icons.Layers /></div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Report Outline</h3>
              </div>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {projectData.template?.structure?.chapters.map((ch) => (
                  <div key={ch.chapter || ch.number} style={{ background: '#f9fafb', borderRadius: '20px', border: '1px solid #e5e7eb', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chapter {ch.chapter || ch.number}</span>
                        <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>{ch.title}</h4>
                      </div>
                      <button onClick={() => setEditingTemplate(ch)} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Edit Structure</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ch.sections?.map((s, idx) => (
                        <span key={idx} style={{ background: 'white', border: '1px solid #f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {editingTemplate && (
          <EditTemplateModal 
            isOpen={!!editingTemplate} 
            onClose={() => setEditingTemplate(null)} 
            chapter={editingTemplate} 
            onSave={handleSaveChapterTemplate} 
          />
        )}
      </div>
    );
  }

  if (activeView === 'history') {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper" style={{ alignItems: 'flex-start' }}>
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Project History</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>View and restore previous AI-generated versions.</p>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent AI Generations</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Chapter</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Instructions</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allProjectHistory.length > 0 ? allProjectHistory.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: index < allProjectHistory.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '600', color: '#111827' }}>
                        Ch. {item.premium_chapters?.chapter_number}: {item.premium_chapters?.title}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#4b5563' }}>
                        <span style={{ fontSize: '12px', fontStyle: 'italic' }}>{item.prompt_used || 'Standard generation'}</span>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#6b7280' }}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleRestoreVersion(item)}
                          style={{ background: '#6366f1', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>{loadingHistory ? 'Loading history...' : 'No AI history found.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeImage = activeView.startsWith('image-') ? images.find(img => `image-${img.id}` === activeView) : null;
  if (activeImage) {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper" style={{ alignItems: 'flex-start' }}>
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>{activeImage.original_name || 'Project Image'}</h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Visual Asset in {projectData.title}</p>
          </div>
          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e5e7eb', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '500px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <img src={activeImage.src} alt={activeImage.original_name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
            {activeImage.caption && (
              <p style={{ marginTop: '24px', fontSize: '14px', color: '#4b5563', fontStyle: 'italic', fontWeight: '600', background: '#f9fafb', padding: '12px 24px', borderRadius: '100px' }}>
                Figure: {activeImage.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeChapter) {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper" style={{ alignItems: 'flex-start' }}>
          <div style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>{activeChapter.title}</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '8px', display: 'inline-flex' }}>
                  <button onClick={() => setWorkspaceMode('editor')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: workspaceMode === 'editor' ? 'white' : 'transparent', color: workspaceMode === 'editor' ? '#111827' : '#6b7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}><Icons.Edit3 /> Editor</button>
                  <button onClick={() => setWorkspaceMode('preview')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: workspaceMode === 'preview' ? 'white' : 'transparent', color: workspaceMode === 'preview' ? '#111827' : '#6b7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}><Icons.Eye /> Preview</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button id="step-insert-image" onClick={() => setShowImageSelector(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}><Icons.Image /> Insert Image</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#111827', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : <><Icons.Save /> Save Changes</>}</button>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%', minHeight: '700px', display: 'flex', flexDirection: 'column' }}>
            {workspaceMode === 'editor' ? (
              <>
                <div style={{ padding: '12px 40px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Markdown Guide:</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#4b5563' }}>
                    <span><strong>#</strong> Header 1</span>
                    <span><strong>##</strong> Header 2</span>
                    <span><strong>**text**</strong> Bold</span>
                    <span><strong>*text*</strong> Italic</span>
                    <span><strong>-</strong> List</span>
                    <span><strong>1.</strong> Numbered</span>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  className="chapter-editor"
                  value={localContent}
                  onChange={(e) => { setLocalContent(e.target.value); updateCursorPosition(); }}
                  onSelect={updateCursorPosition} onClick={updateCursorPosition} onKeyUp={updateCursorPosition}
                  placeholder={`Write your ${activeChapter.title} here...`}
                  style={{ width: '100%', minHeight: '700px', border: 'none', outline: 'none', fontSize: '16px', lineHeight: '1.8', color: '#111827', padding: '40px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', flex: 1 }}
                />
              </>
            ) : (
              <div className="markdown-preview premium-print-area" style={{ padding: '60px', minHeight: '700px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <style>{`
                  .markdown-preview { color: #1f2937; line-height: 1.8; font-family: 'Inter', system-ui, sans-serif; width: 100%; }
                  .markdown-preview h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem; }
                  .markdown-preview h2 { font-size: 1.8rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.2rem; color: #111827; }
                  .markdown-preview h3 { font-size: 1.4rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #374151; }
                  .markdown-preview p { margin-bottom: 1.5rem; text-align: justify; }
                  .markdown-preview ol { margin-bottom: 1.5rem; padding-left: 2rem; }
                  .markdown-preview ul { margin-bottom: 1.5rem; padding-left: 2rem; }
                  .markdown-preview li { margin-bottom: 0.5rem; }
                  .markdown-preview img { display: block; max-width: 100%; height: auto; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
                  .markdown-preview table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; table-layout: auto; }
                  .markdown-preview th, .markdown-preview td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; word-break: break-word; }
                  .markdown-preview th { background: #f9fafb; font-weight: 600; }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{localContent || '*No content yet.*'}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        {showImageSelector && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3 style={{ margin: 0 }}>Select Image to Insert</h3><button onClick={() => setShowImageSelector(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Icons.X /></button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', maxHeight: '500px', overflowY: 'auto', padding: '4px' }}>
                {images.length > 0 ? images.map(img => (
                  <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '100px' }}><img src={img.src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    <div style={{ padding: '8px', flex: 1 }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.caption || img.original_name}</p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => insertImageTag(img)} style={{ flex: 1, padding: '6px', fontSize: '10px', fontWeight: '700', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Use</button>
                      </div>
                    </div>
                  </div>
                )) : <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af' }}>No project assets found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="content-area">
      <div className="content-layout-wrapper" style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <img 
              src="/premium_icon/favicon.ico" 
              alt="Logo" 
              onClick={onLogoClick}
              style={{ width: 80, height: 80, display: 'block', margin: '0 auto 24px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', cursor: 'pointer' }} 
            />
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', color: '#111827', margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>Welcome to W3 Writelab</h1>
            <p style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>Your High-End AI Academic Research Workspace</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '40px' }}>
              <ActionCard icon={<Icons.Search />} title="Scholar Search" desc="Academic sources" />
              <ActionCard icon={<Icons.Edit3 />} title="Grammar Fix" desc="Native proofreading" />
              <ActionCard icon={<Icons.PieChart />} title="Data Analysis" desc="Test evaluation" />
              <ActionCard icon={<Icons.Shield />} title="AI Humanizer" desc="Bypass detectors" />
              <ActionCard icon={<Icons.Code />} title="Translators" desc="Multi-language" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '0 12px' }}>
            <div style={{ width: '48px', height: '48px', background: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Icons.Zap />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0 }}>Premium Execution Guide</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <GuideCard number="01" title="Technical Content" icon={<Icons.FileText />} description="Choose a chapter and use the AI Architect to generate up to 4,000 words of technical report." 
              bullets={["Specify project context", "IEEE & APA citations", "Mathematical formulas"]} />
            <GuideCard number="02" title="Technical Diagrams" icon={<Icons.Image />} description="Found in the tools bar. Generate technical illustrations or Mermaid flowcharts instantly."
              bullets={["Describe systems", "Professional styling", "One-click insertion"]} />
            <GuideCard number="03" title="Experimental Data" icon={<Icons.Upload />} description="Found in the Files Tab. Upload experimental readings (DOCX/TXT) for AI analysis."
              bullets={["Upload raw data", "Automatic extraction", "Technical evaluation"]} />
            <GuideCard number="04" title="Bypass Detection" icon={<Icons.Shield />} description="Use the Humanizer to ensure your project sounds professional and bypasses AI detection tools."
              bullets={["Removes AI patterns", "Natural sentence flow", "Preserves citations"]} />
            <GuideCard number="05" title="Final Assembly" icon={<Icons.ArrowRight />} description="Assemble into high-quality PDF or editable Word files with automatic TOC and page numbering."
              bullets={["Custom file order", "AI Abstract generation", "References page"]} />
          </div>

          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', borderRadius: '32px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.1 }}><Icons.Activity /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#6366f1' }}>★</span> Pro Tip: Research Data Analysis
                </h3>
                <p style={{ color: '#9ca3af', lineHeight: '1.8', fontSize: '16px', maxWidth: '800px' }}>
                  Building <strong>Chapter 4</strong>? Upload your experimental readings (DOCX/TXT) to the <strong>Files Tab</strong>. 
                  In the Generator, select those files under "Materials." Our System Architect will read your real data and perform a customized technical evaluation for your project.
                </p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '32px', padding: '40px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.05 }}><Icons.Zap /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#111827' }}>
                  <span style={{ color: '#10b981' }}>★</span> Pro Tip: Earn while you Research
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.8', fontSize: '16px', maxWidth: '800px' }}>
                  Did you know you can fund your research by referring others? Use the <strong>Affiliate Dashboard</strong> to copy your unique referral link. 
                  You earn <strong>10% commission</strong> (Standard) on every successful upgrade. 
                  Balances reset every Friday, and payouts are processed directly to your bank every Monday once you reach ₦10,000.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ number, title, icon, description, bullets }) {
  return (
    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px', fontWeight: '900', color: '#f8fafc', zIndex: 0 }}>{number}</div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', marginBottom: '20px' }}>{icon}</div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '20px' }}>{description}</p>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {bullets.map((b, i) => <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '500' }}><span style={{ color: '#111827' }}>•</span> {b}</li>)}
        </ul>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
      <div style={{ width: '32px', height: '32px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', margin: '0 auto 12px' }}>{icon}</div>
      <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#111827' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{desc}</p>
    </div>
  );
}
