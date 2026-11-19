// src/components/premium/modals/VisualToolsModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Share: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
};

export default function VisualToolsModal({ isOpen, onClose, projectId, userId, onImageSaved, showNotification }) {
  const [activeTool, setActiveTool] = useState('diagram');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [imageCaption, setImageCaption] = useState('');
  const [savingToAnalysis, setSavingToAnalysis] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setZoomLevel(1);
    try {
      const response = await fetch('/api/premium/visual-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTool, prompt: prompt, projectId, userId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      if (activeTool === 'diagram') {
        const encodedCode = btoa(unescape(encodeURIComponent(data.code)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const imageUrl = `https://mermaid.ink/img/${encodedCode}?type=png&bgColor=!white&width=1600`;
        setResult({ type: 'diagram', imageUrl, code: data.code });
      } else {
        setResult({ type: 'image', imageUrl: data.imageUrl });
      }
      // Pre-fill caption with a simplified version of the prompt
      setImageCaption(prompt.substring(0, 50));
    } catch (err) { 
      setError(err.message); 
      if (showNotification) showNotification('Generation Failed', err.message, 'error');
    }
    finally { setLoading(false); }
  };

  const handleSaveToProject = async () => {
    if (!result?.imageUrl || !imageCaption.trim()) return;
    setLoading(true);
    try {
      const cleanSlug = prompt.trim().replace(/[^a-zA-Z0-9]+/g, '_').substring(0, 28).toLowerCase() || 'visual';
      const response = await fetch('/api/premium/save-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: result.imageUrl, 
          projectId, 
          userId, 
          name: `${activeTool}_${cleanSlug}.png`, 
          type: activeTool,
          purpose: 'project_image',
          caption: imageCaption.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      if (showNotification) showNotification('Success', 'Visual added to your Left Sidebar Report Assets (with placeholder)!', 'success');
      setShowCaptionModal(false);
      onImageSaved();
      onClose();
    } catch (err) { 
      if (showNotification) showNotification('Save Error', err.message, 'error');
    }
    finally { setLoading(false); }
  };

  const handleSaveToFileAnalysis = async () => {
    if (!result?.imageUrl) return;
    setSavingToAnalysis(true);
    try {
      const cleanSlug = prompt.trim().replace(/[^a-zA-Z0-9]+/g, '_').substring(0, 28).toLowerCase() || 'visual';
      const fileName = `${activeTool}_${cleanSlug}.png`;
      const response = await fetch('/api/premium/save-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: result.imageUrl,
          projectId,
          userId,
          name: fileName,
          type: activeTool,
          purpose: 'sidebar',
          caption: prompt.substring(0, 80)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add to AI File Analysis');
      if (showNotification) {
        showNotification(
          'Added to AI File Analysis',
          `"${fileName}" has been added to your Right Sidebar AI File Analysis section! You can now select or @tag it when generating chapters.`,
          'success'
        );
      }
      if (onImageSaved) onImageSaved();
      onClose();
    } catch (err) {
      if (showNotification) showNotification('Save Error', err.message, 'error');
    } finally {
      setSavingToAnalysis(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white md:rounded-[32px] w-full max-w-5xl h-full md:h-[90vh] md:max-h-[750px] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">Visual Studio</h2>
            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">AI Technical Design</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><Icons.X /></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls */}
          <div className="w-full md:w-80 lg:w-96 p-5 md:p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-6 shrink-0 overflow-y-auto">
            <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
              <button onClick={() => setActiveTool('diagram')} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTool === 'diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Icons.Activity /> DIAGRAMS</button>
              <button onClick={() => setActiveTool('image')} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTool === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Icons.Image /> CONCEPTS</button>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Describe your vision</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTool === 'diagram' ? "e.g. A flowchart of a solar irrigation system..." : "e.g. A realistic 3D render of a robotic arm..."}
                className="flex-1 min-h-[120px] p-4 rounded-2xl border-2 border-slate-200 focus:border-slate-900 outline-none text-sm font-medium leading-relaxed resize-none transition-all"
              />
            </div>

            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Icons.Zap /> GENERATE VISUAL</>}
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 p-5 md:p-10 bg-white flex flex-col items-center justify-center relative overflow-y-auto">
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="text-6xl mb-6 grayscale opacity-20">🎨</div>
                  <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Studio Preview</p>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Processing...</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col gap-4">
                  {/* Zoom Toolbar */}
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-2xl shrink-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Preview Zoom ({Math.round(zoomLevel * 100)}%)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomLevel(z => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Large Scrollable High-Resolution Canvas */}
                  <div className="flex-1 bg-slate-50 rounded-3xl border-2 border-slate-100 overflow-auto p-4 md:p-6 flex items-center justify-center min-h-[320px]">
                    <img
                      src={result.imageUrl}
                      alt="Result"
                      onClick={() => setZoomLevel(z => (z < 1.5 ? 1.5 : 1))}
                      title="Click to toggle zoom"
                      style={{
                        width: zoomLevel === 1 ? '100%' : `${Math.round(zoomLevel * 100)}%`,
                        maxWidth: zoomLevel === 1 ? '100%' : 'none',
                        height: 'auto'
                      }}
                      className="object-contain rounded-xl shadow-md bg-white p-2 cursor-zoom-in transition-all"
                    />
                  </div>

                  {/* Action Buttons: Add to Report Assets (Left Sidebar) OR Add to AI File Analysis (Right Sidebar) */}
                  <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCaptionModal(true)}
                      disabled={savingToAnalysis}
                      className="flex-1 py-3.5 px-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-black active:scale-95"
                    >
                      <Icons.Share /> ADD TO REPORT ASSETS (PLACEHOLDER)
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveToFileAnalysis}
                      disabled={savingToAnalysis}
                      className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Icons.Activity /> {savingToAnalysis ? 'ADDING...' : 'ADD TO AI FILE ANALYSIS'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Caption Modal Overlay */}
        <AnimatePresence>
          {showCaptionModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Add Image Caption</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">This caption will be used in the final report.</p>
                  </div>
                  <button onClick={() => setShowCaptionModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><Icons.X /></button>
                </div>
                
                <div className="mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Caption Text</label>
                  <textarea 
                    value={imageCaption} 
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="e.g. Figure 4.1: Block diagram of the system architecture..."
                    className="w-full min-h-[100px] p-4 rounded-2xl border-2 border-slate-200 focus:border-slate-900 outline-none text-sm font-medium leading-relaxed resize-none transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowCaptionModal(false)} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs transition-all hover:bg-slate-200">CANCEL</button>
                  <button onClick={handleSaveToProject} disabled={loading || !imageCaption.trim()}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg transition-all hover:bg-black disabled:opacity-50">
                    {loading ? "SAVING..." : "CONFIRM & SAVE"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
