// src/components/premium/modals/ExtractionTestModal.js
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
};

export default function ExtractionTestModal({ isOpen, onClose, files }) {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testExtraction = async (file) => {
    setLoading(true);
    setTestResult(null);
    try {
      // We simulate the generation call but only for extraction verification
      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test', 
          userId: 'test',
          chapterNumber: 4,
          selectedContextFiles: [file],
          testOnly: true // We'll add a flag to just return the extracted text
        })
      });
      
      const data = await response.json();
      setTestResult(data.debugExtractions || "No text extracted. Check file compatibility.");
    } catch (err) {
      alert("Extraction failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-black">Chapter 4 Analyzer Test</h2>
          <button onClick={onClose}><Icons.X /></button>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <p className="text-sm text-slate-500 mb-6">Select an uploaded PDF/DOCX to see what the AI "sees" during analysis.</p>
          
          <div className="grid gap-3 mb-8">
            {files.map(f => (
              <button key={f.id} onClick={() => testExtraction(f)} className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-900 transition-all text-left">
                <Icons.File />
                <span className="font-bold text-sm truncate">{f.name || f.original_name}</span>
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-10 animate-pulse font-black text-slate-400">READING FILE DATA...</div>}

          {testResult && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Extracted AI Context:</h4>
              <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
