// src/components/premium/modals/HumanizerModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Sparkles: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
};

export default function HumanizerModal({ isOpen, onClose, chapters, projectId, userId, projectData, setIsGlobalLoading, setGlobalLoadingText, onSaved, showNotification, onUpdateProjectData }) {
  const [step, setStep] = useState('select'); 
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState(['all']);
  const [results, setResults] = useState({ original: '', humanized: '', fullHumanized: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local state for immediate usage updates
  const [localUsage, setLocalUsage] = useState(projectData?.humanizer_words_used || 0);
  const [localLimit, setLocalLimit] = useState(projectData?.humanizer_words_limit || 10000);

  useEffect(() => {
    if (projectData?.humanizer_words_used !== undefined) setLocalUsage(projectData.humanizer_words_used);
    if (projectData?.humanizer_words_limit !== undefined) setLocalLimit(projectData.humanizer_words_limit);
  }, [projectData?.humanizer_words_used, projectData?.humanizer_words_limit]);

  const percentage = Math.min((localUsage / localLimit) * 100, 100);

  // Parsing logic
  const parseChapterIntoSections = useCallback((content) => {
    if (!content) return [];
    const normalized = content.replace(/\r\n/g, '\n');
    const headingRegex = /^#+ (.*)/gm;
    const parsedSections = [];
    let match;
    let lastIndex = 0;
    
    while ((match = headingRegex.exec(normalized)) !== null) {
      if (parsedSections.length === 0 && match.index > 0) {
        const introContent = normalized.substring(0, match.index).trim();
        if (introContent) parsedSections.push({ id: "intro", title: "Introduction", content: introContent });
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
      parsedSections.push({ id: "whole", title: "Full Chapter Content", content: normalized });
    }
    
    return parsedSections.filter(s => s.content.length > 0);
  }, []);

  // Update sections whenever chapter content changes
  useEffect(() => {
    if (selectedChapterId) {
      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (chapter?.content) {
        setSections(parseChapterIntoSections(chapter.content));
      }
    }
  }, [selectedChapterId, chapters, parseChapterIntoSections]);

  const toggleSection = (id) => {
    if (id === 'all') {
      setSelectedSectionIds(['all']);
      return;
    }
    setSelectedSectionIds(prev => {
      const filtered = prev.filter(i => i !== 'all');
      if (filtered.includes(id)) {
        const next = filtered.filter(i => i !== id);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...filtered, id];
      }
    });
  };

  const handleHumanize = async () => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;

    let contentToHumanize = "";
    if (selectedSectionIds.includes('all')) {
      contentToHumanize = chapter.content;
    } else {
      contentToHumanize = sections
        .filter(s => selectedSectionIds.includes(s.id))
        .map(s => s.content)
        .join("\n\n");
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const response = await fetch('/api/premium/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, content: contentToHumanize })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Humanizer Connection failed');
      
      // Update UI bar immediately
      if (data.newUsed !== undefined) {
        setLocalUsage(data.newUsed);
        if (data.newLimit) setLocalLimit(data.newLimit);
        if (onUpdateProjectData) onUpdateProjectData({ 
          humanizer_words_used: data.newUsed,
          humanizer_words_limit: data.newLimit || localLimit
        });
      }

      // THE NEW ROBUST RECONSTRUCTION LOGIC
      let finalChapterOutput = data.humanized;
      if (!selectedSectionIds.includes('all')) {
        // Rebuild chapter by mapping sections
        finalChapterOutput = sections.map(sec => {
          if (selectedSectionIds.includes(sec.id)) {
            // Find if this is the first selected section
            const firstId = sections.find(s => selectedSectionIds.includes(s.id))?.id;
            if (sec.id === firstId) return data.humanized;
            return ""; // Hide other selected sections as they are merged into the first one
          }
          return sec.content;
        }).filter(c => c !== "").join("\n\n");
      }

      setResults({ 
        original: contentToHumanize, 
        humanized: data.humanized, 
        fullHumanized: finalChapterOutput 
      });
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
      setGlobalLoadingText('Updating chapter structure...');
      setIsGlobalLoading(true);
    }
    try {
      const response = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chapterId: selectedChapterId, 
          content: results.fullHumanized, 
          userId: userId, 
          isAiAction: true 
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      // Reload Workspace triggers section re-parse
      if (onSaved) await onSaved(); 
      
      showNotification('Success', 'Rewrite saved. You can now select another section.', 'success');
      
      // Reset for next selection
      setResults({ original: '', humanized: '', fullHumanized: '' });
      setStep('sections');
      
    } catch (err) { 
      if (showNotification) showNotification('Error', 'Save failed. Check connection.', 'error');
    }
    finally { if (setIsGlobalLoading) setIsGlobalLoading(false); }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedChapterId(null);
    setResults({ original: '', humanized: '', fullHumanized: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={handleClose} />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white md:rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-full md:h-[85vh] md:max-h-[750px]">
        <div className="p-5 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl"><Icons.User /></div>
            <div><h2 className="text-base md:text-xl font-black text-slate-900 leading-tight">Academic Humanizer</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">W3 WriteLab Technical Core</p></div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'select' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 overflow-hidden">
              <div className="w-full max-w-md flex flex-col h-full max-h-[600px] space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Meter</p><p className="text-sm font-black text-slate-900">{localUsage.toLocaleString()} / {localLimit.toLocaleString()} words</p></div>
                    <span className={`text-xs font-black ${percentage > 90 ? 'text-red-500' : 'text-slate-900'}`}>{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' : 'bg-slate-900'}`} style={{ width: `${percentage}%` }} /></div>
                </div>
                <div className="text-center shrink-0"><h3 className="text-xl md:text-2xl font-black text-slate-900">Choose Chapter</h3><p className="text-sm text-slate-500 mt-1">Select the chapter you want to optimize for academic flow.</p></div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><div className="grid gap-3 py-2">{chapters.map(ch => { const hasContent = ch.content && ch.content.length > 100; return (<button key={ch.id} disabled={!hasContent} onClick={() => setSelectedChapterId(ch.id)} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 transition-all text-left shrink-0 ${selectedChapterId === ch.id ? 'border-slate-900 bg-white shadow-xl ring-4 md:ring-8 ring-slate-100' : 'border-slate-100 bg-white hover:border-slate-200'} ${!hasContent ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}><div className="flex-1 min-w-0 pr-4"><span className="font-black text-slate-900">Chapter {ch.number}</span><p className="text-xs text-slate-400 font-bold truncate">{ch.title}</p></div><Icons.ChevronRight /></button>); })}</div></div>
                <button onClick={() => setStep('sections')} disabled={!selectedChapterId} className="w-full py-4 md:py-5 bg-slate-900 hover:bg-black text-white rounded-2xl md:rounded-3xl font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0">REFINE SELECTION <Icons.ChevronRight /></button>
              </div>
            </div>
          )}
          {step === 'sections' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 overflow-hidden">
              <div className="w-full max-w-md flex flex-col h-full max-h-[600px] space-y-6">
                <div className="text-center shrink-0"><h3 className="text-xl md:text-2xl font-black text-slate-900">Select Sections</h3><p className="text-sm text-slate-500 mt-1">Humanize specific parts or the whole chapter.</p></div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><div className="grid gap-3 py-2"><button onClick={() => toggleSection('all')} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 transition-all text-left ${selectedSectionIds.includes('all') ? 'border-slate-900 bg-white shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}><span className="font-black text-slate-900">Whole Chapter</span>{selectedSectionIds.includes('all') && <Icons.Check />}</button><div className="h-px bg-slate-200 my-2" />{sections.map(section => (<button key={section.id} onClick={() => toggleSection(section.id)} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 transition-all text-left ${selectedSectionIds.includes(section.id) ? 'border-slate-900 bg-white shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}><div className="flex-1 min-w-0 pr-4"><p className="text-xs font-black text-slate-900 truncate">{section.title}</p><p className="text-[10px] text-slate-400 font-bold">{section.content.split(' ').length} words</p></div>{selectedSectionIds.includes(section.id) && <Icons.Check />}</button>))}</div></div>
                <div className="flex gap-3 shrink-0"><button onClick={() => setStep('select')} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-sm">BACK</button><button onClick={handleHumanize} disabled={isProcessing} className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"><Icons.Sparkles /> START AI REWRITE</button></div>
              </div>
            </div>
          )}
          {step === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50"><div className="w-full max-w-md text-center space-y-8"><div className="relative w-32 h-32 mx-auto"><div className="absolute inset-0 border-4 border-slate-100 rounded-full" /><motion.div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /><div className="absolute inset-0 flex items-center justify-center text-slate-900"><Icons.Activity /></div></div><div><h3 className="text-2xl font-black text-slate-900">System is Humanizing...</h3><p className="text-sm text-slate-500 mt-2">Our technical core is rewriting your content for academic flow. Please wait a moment.</p></div><div className="bg-white p-4 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">System Status: Academic Analysis Active</div></div></div>
          )}
          {step === 'compare' && (
            <div className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 gap-px"><div className="flex-1 h-1/2 md:h-full flex flex-col bg-white overflow-hidden border-b md:border-b-0"><div className="p-3 md:p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Selection</span><span className="text-[10px] font-bold text-slate-400">{results.original.split(' ').length} Words</span></div><div className="flex-1 p-5 md:p-8 overflow-y-auto text-sm text-slate-400 leading-relaxed font-medium markdown-view opacity-60"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.original}</ReactMarkdown></div></div><div className="flex-1 h-1/2 md:h-full flex flex-col bg-white overflow-hidden border-l border-slate-100"><div className="p-3 md:p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0"><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Technical Rewrite</span><span className="text-[10px] font-bold text-slate-900">{results.humanized.split(' ').length} Words</span></div><div className="flex-1 p-5 md:p-8 overflow-y-auto text-sm text-slate-900 leading-relaxed font-bold bg-slate-50/30 markdown-view"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.humanized}</ReactMarkdown></div></div></div><div className="p-5 md:p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0"><button onClick={() => setStep('sections')} className="text-[9px] md:text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">← Back to Selection</button><button onClick={handleSave} className="px-6 md:px-10 py-3 md:py-4 bg-slate-900 hover:bg-black text-white rounded-xl md:rounded-2xl font-black text-[11px] md:text-sm shadow-xl transition-all active:scale-95 flex items-center gap-3"><Icons.Save /> SAVE CHANGES</button></div></div>
          )}
        </div>
        <style jsx global>{` .markdown-view h1, .markdown-view h2, .markdown-view h3 { margin-top: 1.5rem; margin-bottom: 1rem; color: #0f172a; font-weight: 800; } .markdown-view p { margin-bottom: 1.2rem; line-height: 1.8; text-align: justify; } .markdown-view ul, .markdown-view ol { margin-bottom: 1.2rem; padding-left: 2rem; } .markdown-view li { margin-bottom: 0.5rem; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } `}</style>
      </motion.div>
    </div>
  );
}
