// src/components/premium/modals/PlagiarismModal.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  RefreshCw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ExternalLink: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
};

// Strips out references / bibliography from markdown content
function stripReferences(content) {
  if (!content) return '';
  return content.split(/\n#{1,4}\s*(?:References|Bibliography|Works Cited|Sources|Literature Cited)\b/i)[0].trim();
}

export default function PlagiarismModal({ 
  isOpen, 
  onClose, 
  chapters = [], 
  projectData, 
  showNotification,
  onUpdateProjectData
}) {
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id || chapters[0]?.number || null);
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const PROJECT_AUDIT_LIMIT = 10000;
  const storageKey = projectData?.id ? `w3_plagiarism_used_${projectData.id}` : null;

  // Initialize words used from projectData or localStorage
  const [wordsUsed, setWordsUsed] = useState(() => {
    if (projectData?.plagiarism_words_used !== undefined) return projectData.plagiarism_words_used;
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) return parseInt(stored, 10) || 0;
    }
    return 0;
  });

  useEffect(() => {
    if (projectData?.plagiarism_words_used !== undefined) {
      setWordsUsed(projectData.plagiarism_words_used);
    } else if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) setWordsUsed(parseInt(stored, 10) || 0);
    }
  }, [projectData?.plagiarism_words_used, storageKey]);

  // Load chapter content without references when modal opens or chapter changes
  useEffect(() => {
    if (isOpen) {
      const initialId = selectedChapterId || chapters[0]?.id || chapters[0]?.number;
      if (initialId) {
        handleSelectChapter(initialId);
      }
    }
  }, [isOpen, chapters]);

  const handleSelectChapter = (chId) => {
    setSelectedChapterId(chId);
    const found = chapters.find(c => String(c.id) === String(chId) || String(c.number) === String(chId));
    if (found?.content) {
      const cleaned = stripReferences(found.content);
      setInputText(cleaned);
    } else {
      setInputText('');
    }
    setScanResult(null);
  };

  const currentWordCount = useMemo(() => {
    if (!inputText.trim()) return 0;
    return inputText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [inputText]);

  const remainingQuota = Math.max(0, PROJECT_AUDIT_LIMIT - wordsUsed);
  const isOverQuota = currentWordCount > remainingQuota;
  const usagePercentage = Math.min(100, Math.round((wordsUsed / PROJECT_AUDIT_LIMIT) * 100));

  const handleRunScan = async () => {
    const textToScan = inputText.trim();
    if (!textToScan || textToScan.length < 50) {
      if (showNotification) showNotification('Content Too Short', 'Please select a chapter with at least 50 characters to audit.', 'warning');
      return;
    }

    if (isOverQuota) {
      if (showNotification) {
        showNotification(
          'Quota Exceeded', 
          `Project limit reached. You have ${remainingQuota.toLocaleString()} words remaining out of the ${PROJECT_AUDIT_LIMIT.toLocaleString()} words project quota.`, 
          'error'
        );
      }
      return;
    }

    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/premium/plagiarism', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          projectId: projectData?.id, 
          text: textToScan 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Audit scan failed');
      }

      setScanResult(data.data);
      
      const newUsed = data.newUsed !== undefined ? data.newUsed : (wordsUsed + currentWordCount);
      setWordsUsed(newUsed);
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(newUsed));
      }
      if (onUpdateProjectData) {
        onUpdateProjectData({ plagiarism_words_used: newUsed });
      }

      const score = data.data?.score || 0;
      if (showNotification) {
        if (score === 0) {
          showNotification('Originality Verified', 'Scan complete: 100% original work (0% external match).', 'success');
        } else {
          showNotification('Scan Complete', `Audit finished: ${score}% similarity detected.`, 'info');
        }
      }
    } catch (err) {
      if (showNotification) {
        showNotification('Scan Unavailable', err.message || 'Originality engine is currently updating. Please try again shortly.', 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" 
        onClick={onClose} 
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative bg-white rounded-none md:rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full max-h-[900px] border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Icons.Shield />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Academic Originality Audit
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full tracking-widest">
                  Integrated Tool
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Manuscript Similarity & Global Index Audit (References Automatically Excluded)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <Icons.X />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6">
          
          {/* Project Quota Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
              <span className="text-slate-700 flex items-center gap-2">
                <Icons.FileText />
                Project Audit Quota (10,000 Words Limit)
              </span>
              <span className={remainingQuota > 0 ? "text-emerald-700" : "text-red-600"}>
                {wordsUsed.toLocaleString()} / {PROJECT_AUDIT_LIMIT.toLocaleString()} Words Used ({remainingQuota.toLocaleString()} Left)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">
              Select Chapter to Audit:
            </label>
            <select
              value={selectedChapterId || ''}
              onChange={(e) => handleSelectChapter(e.target.value)}
              className="flex-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {chapters.map(ch => {
                const clean = stripReferences(ch.content || '');
                const words = clean ? clean.trim().split(/\s+/).filter(Boolean).length : 0;
                return (
                  <option key={ch.id || ch.number} value={ch.id || ch.number}>
                    Chapter {ch.number || ch.chapter}: {ch.title} ({words > 0 ? `${words.toLocaleString()} words (excl. references)` : 'Empty'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* References Stripped Notice */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2.5">
            <span className="text-blue-600 shrink-0"><Icons.Info /></span>
            <span>
              <strong>Clean Scan:</strong> References and bibliographies are automatically excluded from the audit to prevent false similarity flags and preserve your quota.
            </span>
          </div>

          {/* Text Area (Chapter Content Preview) */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Audited Content Preview:
              </span>
              <span className="text-xs font-black text-slate-500">
                {currentWordCount.toLocaleString()} Words Selected
              </span>
            </div>
            <textarea
              value={inputText}
              readOnly
              disabled={isScanning}
              placeholder="Select a chapter above to preview and scan..."
              className="w-full h-60 p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 custom-scrollbar opacity-95"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {isOverQuota && (
              <span className="text-xs font-bold text-red-600">
                ⚠️ Chapter ({currentWordCount.toLocaleString()} words) exceeds remaining quota ({remainingQuota.toLocaleString()} words).
              </span>
            )}
            {!isOverQuota && <div />}
            
            <button
              onClick={handleRunScan}
              disabled={isScanning || !inputText.trim() || currentWordCount < 20 || isOverQuota}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-40"
            >
              {isScanning ? <Icons.RefreshCw /> : <Icons.Zap />}
              {isScanning ? 'Conducting Deep Linguistic Audit...' : 'Execute Originality Audit'}
            </button>
          </div>

          {/* Audit Results View */}
          {scanResult && (
            <div className="bg-slate-900 rounded-[32px] p-6 md:p-8 text-white space-y-8 animate-in fade-in duration-500 shadow-2xl border border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-black ${
                    scanResult.score > 20 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <span className="text-3xl font-black">{scanResult.score}%</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-80">Similarity</span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
                      {scanResult.score === 0 
                        ? '100% Original Work — Zero External Matches' 
                        : `${scanResult.score}% External Index Match`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Audited {scanResult.total_words?.toLocaleString() || currentWordCount} words across indexed global research publications.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    scanResult.score < 10 
                      ? 'bg-emerald-500 text-white' 
                      : scanResult.score < 25 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {scanResult.score < 10 ? 'High Originality' : scanResult.score < 25 ? 'Moderate Similarity' : 'High Similarity'}
                  </span>
                </div>
              </div>

              {/* Matched Sources */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                  Matched Reference Sources ({scanResult.sources?.length || 0})
                </h4>

                {scanResult.sources && scanResult.sources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scanResult.sources.map((source, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/10 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase">
                              {source.score}% Match
                            </span>
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                <Icons.ExternalLink />
                              </a>
                            )}
                          </div>
                          <h5 className="font-black text-sm text-white line-clamp-1 mb-2">
                            {source.title || 'Academic Web Document'}
                          </h5>
                          <p className="text-xs text-slate-400 italic line-clamp-3 leading-relaxed">
                            &ldquo;{source.snippet}&rdquo;
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Icons.Search />
                          <span className="truncate">{source.url ? new URL(source.url).hostname : 'Global Research Match'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icons.Check />
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-wider">No Similarities Found</p>
                    <p className="text-xs text-slate-400 mt-1">This chapter shows 100% originality across global indexes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
