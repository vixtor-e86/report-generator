// src/components/premium/modals/HumanizerModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
};

export default function HumanizerModal({ isOpen, onClose, chapters, projectId, projectData, onSaved, showNotification, onUpdateProjectData }) {
  const [step, setStep] = useState('select'); 
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState(['all']);
  const [results, setResults] = useState({ original: '', humanized: '', fullHumanized: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Tracking
  const [localUsage, setLocalUsage] = useState(0);
  const [localLimit, setLocalLimit] = useState(0);

  useEffect(() => {
    if (projectData?.humanizer_words_used !== undefined) setLocalUsage(projectData.humanizer_words_used);
  }, [projectData?.humanizer_words_used]);

  const percentage = localLimit > 0 ? Math.min((localUsage / localLimit) * 100, 100) : 0;

  const parseSections = useCallback((content) => {
    if (!content) return [];
    const normalized = content.replace(/\r\n/g, '\n');
    const headingRegex = /^#+ (.*)/gm;
    const parsed = [];
    let match;
    let lastIndex = 0;
    while ((match = headingRegex.exec(normalized)) !== null) {
      if (parsed.length === 0 && match.index > 0) parsed.push({ id: "intro", title: "Intro", content: normalized.substring(0, match.index).trim() });
      if (parsed.length > 0) {
        const prev = parsed[parsed.length - 1];
        if (prev.content === "") prev.content = normalized.substring(lastIndex, match.index).trim();
      }
      parsed.push({ id: `sec-${parsed.length}`, title: match[1].trim(), content: "" });
      lastIndex = match.index;
    }
    if (parsed.length > 0) parsed[parsed.length - 1].content = normalized.substring(lastIndex).trim();
    else parsed.push({ id: "whole", title: "Full Chapter", content: normalized });
    return parsed.filter(s => s.content.length > 0);
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (chapter) setSections(parseSections(chapter.content));
    }
  }, [selectedChapterId, chapters, parseSections]);

  const handleHumanize = async () => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;

    let targetText = selectedSectionIds.includes('all') ? chapter.content : sections.filter(s => selectedSectionIds.includes(s.id)).map(s => s.content).join("\n\n");

    setIsProcessing(true);
    setStep('processing');

    try {
      const res = await fetch('/api/premium/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, content: targetText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalUsage(data.newUsed);
      setLocalLimit(data.limit);
      if (onUpdateProjectData) onUpdateProjectData({ humanizer_words_used: data.newUsed });

      // Merge
      let finalContent = data.humanized;
      if (!selectedSectionIds.includes('all')) {
        finalContent = sections.map(sec => {
          if (selectedSectionIds.includes(sec.id)) {
            const firstId = sections.find(s => selectedSectionIds.includes(s.id))?.id;
            return sec.id === firstId ? data.humanized : "";
          }
          return sec.content;
        }).filter(c => c !== "").join("\n\n");
      }

      setResults({ original: targetText, humanized: data.humanized, fullHumanized: finalContent });
      setStep('compare');
    } catch (err) {
      setStep('sections');
      showNotification('Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: selectedChapterId, content: results.fullHumanized, isAiAction: true })
      });
      if (!res.ok) throw new Error('Save failed');
      if (onSaved) await onSaved();
      showNotification('Success', 'Rewrite saved.', 'success');
      setStep('sections');
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Icons.User /></div>
            <h2 className="text-xl font-black text-slate-900">Academic Humanizer</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">✕</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-8 bg-slate-50">
          {step === 'select' && (
            <div className="w-full max-w-md mx-auto space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase">Usage</span><span className="text-xs font-black">{localUsage.toLocaleString()} / {localLimit.toLocaleString()}</span></div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{ width: `${percentage}%` }} /></div>
              </div>
              <div className="grid gap-3">{chapters.map(ch => (
                <button key={ch.id} onClick={() => setSelectedChapterId(ch.id)} className={`p-5 rounded-3xl border-2 text-left transition-all ${selectedChapterId === ch.id ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-100 bg-white'}`}>
                  <span className="font-black">Chapter {ch.number}</span>
                  <p className="text-xs text-slate-400 truncate">{ch.title}</p>
                </button>
              ))}</div>
              <button onClick={() => setStep('sections')} disabled={!selectedChapterId} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl">NEXT</button>
            </div>
          )}

          {step === 'sections' && (
            <div className="w-full max-w-md mx-auto space-y-6">
              <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                <div className="grid gap-3">
                  <button onClick={() => setSelectedSectionIds(['all'])} className={`p-5 rounded-3xl border-2 text-left ${selectedSectionIds.includes('all') ? 'border-slate-900 bg-white shadow-md' : 'border-slate-100 bg-white'}`}>Full Chapter</button>
                  {sections.map(s => (
                    <button key={s.id} onClick={() => {
                      if (selectedSectionIds.includes('all')) setSelectedSectionIds([s.id]);
                      else setSelectedSectionIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]);
                    }} className={`p-5 rounded-3xl border-2 text-left ${selectedSectionIds.includes(s.id) ? 'border-slate-900 bg-white shadow-md' : 'border-slate-100 bg-white'}`}>
                      <span className="text-xs font-black">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3"><button onClick={() => setStep('select')} className="flex-1 py-5 bg-white border border-slate-200 rounded-3xl font-black">BACK</button><button onClick={handleHumanize} className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl">HUMANIZE</button></div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-900 border-t-transparent" />
              <h3 className="text-2xl font-black">System is Humanizing...</h3>
            </div>
          )}

          {step === 'compare' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="flex-1 bg-white rounded-3xl p-6 overflow-y-auto border border-slate-200 opacity-50"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.original}</ReactMarkdown></div>
                <div className="flex-1 bg-white rounded-3xl p-6 overflow-y-auto border border-slate-900 shadow-xl"><ReactMarkdown remarkPlugins={[remarkGfm]}>{results.humanized}</ReactMarkdown></div>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <button onClick={() => setStep('sections')} className="font-black text-slate-400">← BACK</button>
                <button onClick={handleSave} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">SAVE TO CHAPTER</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
