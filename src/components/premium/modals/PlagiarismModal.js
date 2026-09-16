// src/components/premium/modals/PlagiarismModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  RefreshCw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ExternalLink: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

export default function PlagiarismModal({ 
  isOpen, 
  onClose, 
  chapters = [], 
  projectData, 
  showNotification 
}) {
  const [selectedSource, setSelectedSource] = useState('chapter'); // 'chapter' | 'custom'
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id || null);
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const MAX_WORDS = 2500;

  // Handle chapter selection
  const handleSelectChapter = (chId) => {
    setSelectedChapterId(chId);
    const found = chapters.find(c => String(c.id) === String(chId) || String(c.number) === String(chId));
    if (found?.content) {
      const words = found.content.trim().split(/\s+/);
      if (words.length > MAX_WORDS) {
        setInputText(words.slice(0, MAX_WORDS).join(' '));
        if (showNotification) {
          showNotification('Content Truncated', `Selected chapter is ${words.length} words. First ${MAX_WORDS} words loaded for scan.`, 'info');
        }
      } else {
        setInputText(found.content);
      }
    } else {
      setInputText('');
    }
    setScanResult(null);
  };

  const extractPdfText = async (arrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n";
      }
      return fullText;
    } catch (err) {
      throw new Error("Failed to extract text from PDF");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.docx', '.pdf', '.txt', '.doc'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      if (showNotification) showNotification('Unsupported Format', 'Please upload a PDF, DOCX, or TXT file.', 'error');
      return;
    }

    setIsExtracting(true);
    setFileName(file.name);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const arrayBuffer = ev.target.result;
        let text = "";
        if (ext === '.docx' || ext === '.doc') {
          const res = await mammoth.extractRawText({ arrayBuffer });
          text = res.value;
        } else if (ext === '.pdf') {
          text = await extractPdfText(arrayBuffer);
        } else if (ext === '.txt') {
          text = new TextDecoder().decode(arrayBuffer);
        }

        if (!text.trim()) {
          throw new Error('No readable text found in document.');
        }

        const words = text.trim().split(/\s+/);
        if (words.length > MAX_WORDS) {
          text = words.slice(0, MAX_WORDS).join(' ');
        }

        setInputText(text);
        setIsExtracting(false);
        setScanResult(null);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setIsExtracting(false);
      setFileName('');
      if (showNotification) showNotification('Extraction Failed', err.message, 'error');
    }
  };

  const handleRunScan = async () => {
    const textToScan = inputText.trim();
    if (!textToScan || textToScan.length < 50) {
      if (showNotification) showNotification('Content Too Short', 'Please provide at least 50 characters for an accurate scan.', 'warning');
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch('/api/marketplace/tools/plagiarism-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToScan })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setScanResult(data.data);
      const score = data.data?.score || 0;
      if (showNotification) {
        if (score === 0) {
          showNotification('Originality Verified', 'Scan complete: 100% original work (0% match).', 'success');
        } else {
          showNotification('Scan Complete', `Originality scan finished: ${score}% similarity detected.`, 'info');
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

  const currentWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

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
        className="relative bg-white rounded-none md:rounded-[40px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-full max-h-[900px] border border-slate-200"
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
                Deep Global Index & Manuscript Similarity Analysis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <Icons.X />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6">
          
          {/* Source Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSource('chapter');
                  if (chapters.length > 0) handleSelectChapter(chapters[0].id || chapters[0].number);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedSource === 'chapter' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Scan Project Chapter
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('custom')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedSource === 'custom' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Paste Custom Text or Upload
              </button>
            </div>

            <div className="flex items-center gap-3 px-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {currentWordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} Words
              </span>
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          {selectedSource === 'chapter' && (
            <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Select Chapter to Audit:
              </label>
              <select
                value={selectedChapterId || ''}
                onChange={(e) => handleSelectChapter(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {chapters.map(ch => (
                  <option key={ch.id || ch.number} value={ch.id || ch.number}>
                    Chapter {ch.number || ch.chapter}: {ch.title} ({ch.content ? `${ch.content.trim().split(/\s+/).length} words` : 'Empty'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload and Clear for Custom Source */}
          {selectedSource === 'custom' && (
            <div className="flex items-center justify-between gap-4">
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  accept=".docx,.pdf,.doc,.txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  {isExtracting ? <Icons.RefreshCw /> : <Icons.Upload />}
                  <span>{fileName ? `Loaded: ${fileName}` : 'Upload File (PDF / DOCX)'}</span>
                </div>
              </label>
              <button
                type="button"
                onClick={() => { setInputText(''); setFileName(''); setScanResult(null); }}
                className="px-4 py-2 text-xs font-black text-slate-500 uppercase tracking-wider hover:text-red-600 transition-colors"
              >
                Clear Text
              </button>
            </div>
          )}

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                const words = val.trim().split(/\s+/);
                if (words.length > MAX_WORDS) {
                  setInputText(words.slice(0, MAX_WORDS).join(' '));
                } else {
                  setInputText(val);
                }
              }}
              disabled={isScanning}
              placeholder="Paste or review manuscript content to audit for originality..."
              className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 custom-scrollbar"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleRunScan}
              disabled={isScanning || !inputText.trim() || currentWordCount < 20}
              className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-40"
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
                        ? '100% Original Work — Zero Matches Detected' 
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
                    <p className="text-xs text-slate-400 mt-1">This text shows 100% originality across global indexes.</p>
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
