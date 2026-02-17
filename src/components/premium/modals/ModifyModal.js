// src/components/premium/modals/ModifyModal.js
'use client';

import { useState } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
};

export default function ModifyModal({ isOpen, onClose, activeChapter, projectId, userId, onGenerateSuccess }) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  const handleModify = async () => {
    if (!instruction.trim()) {
      alert('Please enter modification instructions.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          chapterNumber: activeChapter.number || activeChapter.id,
          chapterTitle: activeChapter.title,
          userPrompt: `MODIFICATION REQUEST: ${instruction}`,
          // Note: We don't send projectTitle/Description here so it uses existing context in DB
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Modification failed');

      alert('Chapter updated successfully!');
      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxWidth: '500px', width: 'calc(100% - 32px)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Modify {activeChapter?.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icons.X /></button>
        </div>
        
        <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
          Tell the AI exactly what you want to change or improve in this chapter.
        </p>

        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Make the introduction more engaging. Add a section about renewable energy. Fix the grammar in the second paragraph."
          style={{ width: '100%', minHeight: '120px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
          autoFocus
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
          <button 
            onClick={handleModify} 
            disabled={loading}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'AI is working...' : <><Icons.Zap style={{ color: '#6366f1' }} /> Apply Changes</>}
          </button>
        </div>
      </div>
    </>
  );
}
