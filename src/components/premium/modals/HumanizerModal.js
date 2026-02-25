// src/components/premium/modals/HumanizerModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Sparkles: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function HumanizerModal({ isOpen, onClose, chapters, userId, setIsGlobalLoading, setGlobalLoadingText, onSaved }) {
  const [step, setStep] = useState('select'); // select | compare
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [results, setResults] = useState({ original: '', humanized: '' });
  const [isProcessing, setIsGenerating] = useState(false);

  const handleHumanize = async () => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;

    setIsGenerating(true);
    setGlobalLoadingText('Undetectable AI is rewriting your chapter for academic flow...');
    setIsGlobalLoading(true);

    try {
      const response = await fetch('/api/premium/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          content: chapter.content,
          userId: userId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Humanization failed');

      setResults({ original: data.original, humanized: data.humanized });
      setStep('compare');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
      setIsGlobalLoading(false);
    }
  };

  const handleSave = async () => {
    if (setIsGlobalLoading) {
      setGlobalLoadingText('Updating chapter and creating version history...');
      setIsGlobalLoading(true);
    }

    try {
      const response = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: selectedChapterId,
          content: results.humanized,
          userId: userId,
          isAiAction: true 
        })
      });

      if (!response.ok) throw new Error('Failed to save humanized version');

      if (onSaved) onSaved();
      onClose();
      alert('Humanized version saved successfully to history.');
    } catch (err) {
      alert(err.message);
    } finally {
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[90vh] md:h-[800px]">
        
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Icons.User />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Humanizer Tool</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Undetectable AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'select' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 overflow-hidden">
              <div className="w-full max-w-md flex flex-col h-full max-h-[600px] space-y-6">
                <div className="text-center shrink-0">
                  <h3 className="text-2xl font-black text-slate-900">Select a Chapter</h3>
                  <p className="text-sm text-slate-500 mt-1">Bypass AI detectors and improve academic readability.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid gap-3 py-2">
                    {chapters.map(ch => {
                      const hasContent = ch.content && ch.content.length > 100;
                      const isSelected = selectedChapterId === ch.id;
                      return (
                        <button key={ch.id} disabled={!hasContent} onClick={() => setSelectedChapterId(ch.id)}
                          className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left shrink-0 ${
                            isSelected ? 'border-slate-900 bg-white shadow-xl ring-8 ring-slate-100' : 'border-slate-100 bg-white hover:border-slate-200'
                          } ${!hasContent ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div>
                            <span className="font-black text-slate-900">Chapter {ch.number}</span>
                            <p className="text-xs text-slate-400 font-bold truncate max-w-[250px]">{ch.title}</p>
                          </div>
                          {isSelected && <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg"><Icons.Check /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button onClick={handleHumanize} disabled={!selectedChapterId || isProcessing}
                  className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0">
                  <Icons.Sparkles /> HUMANIZZE CONTENT
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 gap-px">
                {/* Original */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Draft</span>
                    <span className="text-[10px] font-bold text-slate-400">{results.original.split(' ').length} Words</span>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto text-sm text-slate-400 leading-relaxed font-medium markdown-view opacity-60">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.original}</ReactMarkdown>
                  </div>
                </div>

                {/* Humanized */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Humanized Version</span>
                    <span className="text-[10px] font-bold text-slate-900">{results.humanized.split(' ').length} Words</span>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto text-sm text-slate-900 leading-relaxed font-bold bg-slate-50/30 markdown-view">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.humanized}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                <button onClick={() => setStep('select')} className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">← Back / Re-Humanize</button>
                <div className="flex gap-4">
                  <button onClick={handleSave} className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center gap-3">
                    <Icons.Save /> SAVE TO HISTORY
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx global>{`
          .markdown-view h1, .markdown-view h2, .markdown-view h3 { margin-top: 1rem; margin-bottom: 0.5rem; color: #0f172a; font-weight: 800; }
          .markdown-view p { margin-bottom: 1rem; }
          .markdown-view ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 10px; }
        `}</style>
      </motion.div>
    </div>
  );
}
