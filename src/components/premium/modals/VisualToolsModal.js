// src/components/premium/modals/VisualToolsModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
};

export default function VisualToolsModal({ isOpen, onClose, projectId, userId, onImageSaved }) {
  const [activeTool, setActiveTool] = useState('diagram'); // 'diagram' or 'image'
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type, data }
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/premium/visual-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTool,
          prompt: prompt,
          projectId,
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Generation failed');

      if (activeTool === 'diagram') {
        // Convert mermaid code to mermaid.ink URL
        const encodedCode = btoa(data.code);
        const imageUrl = `https://mermaid.ink/img/${encodedCode}`;
        setResult({ type: 'diagram', imageUrl, code: data.code });
      } else {
        setResult({ type: 'image', imageUrl: data.imageUrl });
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!result?.imageUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/premium/save-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: result.imageUrl,
          projectId,
          userId,
          name: `${activeTool === 'diagram' ? 'Diagram' : 'Illustration'}: ${prompt.substring(0, 20)}...`,
          type: activeTool
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      
      alert('Visual added to your project assets!');
      onImageSaved();
      onClose();

    } catch (err) {
      alert('Failed to save image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="modal-container"
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, #ffffff, #f8fafc)'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Visual Generation Studio
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              Create technical diagrams or conceptual illustrations in seconds.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '12px',
            padding: '8px',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s'
          }}>
            <Icons.X />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel: Controls */}
          <div style={{
            width: '350px',
            padding: '32px',
            borderRight: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: '#f8fafc'
          }}>
            {/* Tool Selector */}
            <div style={{
              display: 'flex',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '14px',
              gap: '4px'
            }}>
              <button 
                onClick={() => setActiveTool('diagram')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  backgroundColor: activeTool === 'diagram' ? 'white' : 'transparent',
                  color: activeTool === 'diagram' ? '#0f172a' : '#64748b',
                  boxShadow: activeTool === 'diagram' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icons.Activity /> Diagrams
              </button>
              <button 
                onClick={() => setActiveTool('image')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  backgroundColor: activeTool === 'image' ? 'white' : 'transparent',
                  color: activeTool === 'image' ? '#0f172a' : '#64748b',
                  boxShadow: activeTool === 'image' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icons.Image /> Concept Art
              </button>
            </div>

            {/* Prompt Input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Describe what you need
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTool === 'diagram' 
                  ? "e.g., A flowchart showing the process of a water treatment plant from intake to distribution..."
                  : "e.g., A 3D isometric render of a sustainable smart home with solar panels and green roof..."}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                background: '#0f172a',
                color: 'white',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                opacity: (loading || !prompt.trim()) ? 0.6 : 1
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              ) : (
                <>
                  <Icons.Zap /> Generate Visual
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Preview */}
          <div style={{
            flex: 1,
            padding: '32px',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflowY: 'auto'
          }}>
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', color: '#94a3b8' }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
                  <p style={{ fontWeight: '600' }}>Your preview will appear here</p>
                  <p style={{ fontSize: '13px' }}>Try to be specific with your descriptions for better results.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ width: '60px', height: '60px', border: '4px solid #f1f5f9', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
                  <p style={{ fontWeight: '700', color: '#0f172a' }}>
                    {activeTool === 'diagram' ? 'Architecting your diagram...' : 'Painting your vision...'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>This usually takes 5-10 seconds.</p>
                </motion.div>
              )}

              {error && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   style={{ textAlign: 'center', color: '#ef4444', padding: '24px' }}
                >
                   <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
                   <p style={{ fontWeight: '700' }}>Generation Failed</p>
                   <p style={{ fontSize: '13px' }}>{error}</p>
                   <button onClick={handleGenerate} style={{ marginTop: '16px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                     Try Again
                   </button>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
                >
                  <div style={{
                    flex: 1,
                    background: '#f8fafc',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={result.imageUrl} 
                      alt="Generated Visual" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={handleSaveToProject}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
                      }}
                    >
                      <Icons.Share /> Add to Project Assets
                    </button>
                    <a 
                      href={result.imageUrl} 
                      download={`${activeTool}.png`}
                      style={{
                        background: 'white',
                        color: '#475569',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none'
                      }}
                    >
                      <Icons.Download /> Download
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
