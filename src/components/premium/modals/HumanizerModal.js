// src/components/premium/modals/HumanizerModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Sparkles: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
};

export default function HumanizerModal({ isOpen, onClose, chapters, projectId, userId, projectData, setIsGlobalLoading, setGlobalLoadingText, onSaved, showNotification, onUpdateProjectData, humanizerLimit }) {
  const [step, setStep] = useState('select'); // select | sections | processing | compare
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('all'); // SINGLE SELECT ONLY
  const [results, setResults] = useState({ original: '', humanized: '', fullHumanized: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [localUsage, setLocalUsage] = useState(projectData?.humanizer_words_used || 0);
  const limit = humanizerLimit || 10000;

  useEffect(() => {
    if (projectData?.humanizer_words_used !== undefined) setLocalUsage(projectData.humanizer_words_used);
  }, [projectData?.humanizer_words_used]);

  const percentage = Math.min((localUsage / limit) * 100, 100);

  const parseChapterIntoSections = useCallback((content) => {
    if (!content) return [];
    const normalized = content.replace(/\r\n/g, '\n');
    const headingRegex = /^#+ (.*)/gm;
    const parsedSections = [];
    let match;
    let lastIndex = 0;
    while ((match = headingRegex.exec(normalized)) !== null) {
      if (parsedSections.length === 0 && match.index > 0) {
        parsedSections.push({ id: "intro", title: "Introduction", content: normalized.substring(0, match.index).trim() });
      }
      if (parsedSections.length > 0) {
        const prev = parsedSections[parsedSections.length - 1];
        if (prev.content === "") prev.content = normalized.substring(lastIndex, match.index).trim();
      }
      parsedSections.push({ id: `sec-${parsedSections.length}`, title: match[1].trim(), content: "" });
      lastIndex = match.index;
    }
    if (parsedSections.length > 0) {
      parsedSections[parsedSections.length - 1].content = normalized.substring(lastIndex).trim();
    } else {
      parsedSections.push({ id: "whole", title: "Full Content", content: normalized });
    }
    return parsedSections.filter(s => s.content.length > 0);
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (chapter?.content) setSections(parseChapterIntoSections(chapter.content));
    }
  }, [selectedChapterId, chapters, parseChapterIntoSections]);

  const handleHumanize = async () => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;

    let contentToHumanize = "";
    if (selectedSectionId === 'all') {
      contentToHumanize = chapter.content;
    } else {
      contentToHumanize = sections.find(s => s.id === selectedSectionId)?.content || "";
    }

    if (!contentToHumanize) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const response = await fetch('/api/premium/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, content: contentToHumanize })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connection failed');
      
      if (data.newUsed !== undefined) {
        setLocalUsage(data.newUsed);
        if (onUpdateProjectData) onUpdateProjectData({ humanizer_words_used: data.newUsed });
      }

      // ROBUST SINGLE MERGE
      let finalChapterOutput = data.humanized;
      if (selectedSectionId !== 'all') {
        finalChapterOutput = sections.map(sec => {
          if (sec.id === selectedSectionId) return data.humanized;
          return sec.content;
        }).join("\n\n");
      }

      setResults({ original: contentToHumanize, humanized: data.humanized, fullHumanized: finalChapterOutput });
      setStep('compare');
    } catch (err) { 
      setStep('sections');
      if (showNotification) showNotification('Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (setIsGlobalLoading) {
      setGlobalLoadingText('Saving Technical Rewrite...');
      setIsGlobalLoading(true);
    }
    try {
      const response = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: selectedChapterId, content: results.fullHumanized, userId: userId, isAiAction: true })
      });
      if (!response.ok) throw new Error('Failed to save');
      if (onSaved) await onSaved(); 
      showNotification('Success', 'Content saved. You can optimize another section.', 'success');
      setResults({ original: '', humanized: '', fullHumanized: '' });
      setStep('sections');
    } catch (err) { 
      if (showNotification) showNotification('Error', 'Save failed.', 'error');
    } finally { if (setIsGlobalLoading) setIsGlobalLoading(false); }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedChapterId(null);
    setResults({ original: '', humanized: '', fullHumanized: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl" onClick={handleClose} />
      
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white rounded-none md:rounded-[48px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-full max-h-[900px]">
        
        {/* Header */}
        <div className="p-6 md:p-10 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl"><Icons.User /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Academic Humanizer</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">W3 WriteLab Technical Core</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
              {step === 'select' && (
                <div className="w-full max-w-xl space-y-8 my-auto">
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select Chapter</h3>
                    <p className="text-slate-500 font-medium mt-2">Choose the chapter basis for humanization.</p>
                  </div>
                  <div className="grid gap-4">
                    {chapters.map(ch => (
                      <button key={ch.id} onClick={() => setSelectedChapterId(ch.id)}
                        className={`flex items-center justify-between p-6 rounded-[32px] border-2 transition-all text-left ${selectedChapterId === ch.id ? 'border-slate-900 bg-white shadow-2xl ring-8 ring-slate-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                        <div className="flex-1 pr-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${selectedChapterId === ch.id ? 'text-indigo-600' : 'text-slate-400'}`}>Chapter {ch.number}</span>
                          <h4 className={`text-base font-black truncate mt-1 ${selectedChapterId === ch.id ? 'text-slate-900' : 'text-slate-700'}`}>{ch.title}</h4>
                        </div>
                        <Icons.ChevronRight />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep('sections')} disabled={!selectedChapterId}
                    className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl transition-all active:scale-95">
                    NEXT: DEFINE SCOPE
                  </button>
                </div>
              )}

              {step === 'sections' && (
                <div className="w-full max-w-xl space-y-8 my-auto">
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Technical Scope</h3>
                    <p className="text-slate-500 font-medium mt-2">Select either the full chapter or a specific section.</p>
                  </div>
                  <div className="grid gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    <button onClick={() => setSelectedSectionId('all')} 
                      className={`flex items-center justify-between p-6 rounded-[28px] border-2 transition-all text-left ${selectedSectionId === 'all' ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-100 bg-white'}`}>
                      <span className="font-black text-slate-900 uppercase text-sm">Full Chapter</span>
                      {selectedSectionId === 'all' && <Icons.Check />}
                    </button>
                    <div className="h-px bg-slate-200 my-2" />
                    {sections.map(s => (
                      <button key={s.id} onClick={() => setSelectedSectionId(s.id)}
                        className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all text-left ${selectedSectionId === s.id ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-100 bg-white'}`}>
                        <span className="text-xs font-black text-slate-700">{s.title}</span>
                        {selectedSectionId === s.id && <Icons.Check />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep('select')} className="flex-1 py-6 bg-white border-2 border-slate-100 rounded-[24px] font-black text-slate-400 uppercase text-xs">Back</button>
                    <button onClick={handleHumanize}
                      className="flex-[2] py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl transition-all active:scale-95">
                      START AI REWRITE
                    </button>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <motion.div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    <div className="absolute inset-0 flex items-center justify-center text-slate-900"><Icons.Activity /></div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">System is Humanizing...</h3>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analysis Engine Active</div>
                </div>
              )}

              {step === 'compare' && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50 border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">Original Selection</div>
                      <div className="flex-1 p-8 overflow-y-auto opacity-40"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.original}</ReactMarkdown></div>
                    </div>
                    <div className="flex-1 flex flex-col bg-white rounded-[40px] border-2 border-slate-900 overflow-hidden shadow-2xl">
                      <div className="p-4 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white">Technical Rewrite</div>
                      <div className="flex-1 p-8 overflow-y-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.humanized}</ReactMarkdown></div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between items-center bg-white p-2 rounded-full shrink-0 shadow-sm border border-slate-100">
                    <button onClick={() => setStep('sections')} className="px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">← Back</button>
                    <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white rounded-full font-black text-sm shadow-xl transition-all active:scale-95 flex items-center gap-3"><Icons.Save /> SAVE TO REPORT</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Status */}
          <div className="w-96 bg-white border-l border-slate-100 flex flex-col shrink-0 p-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">System Metrics</h4>
            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usage Meter</span>
                  <span className="text-sm font-black text-slate-900">{localUsage.toLocaleString()} / {limit.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full ${percentage > 90 ? 'bg-red-500' : 'bg-slate-900'}`} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">Structural Guard: Active</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">Academic Tone: Supernova</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
