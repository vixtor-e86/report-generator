// src/components/premium/modals/StructureConfirmationModal.js
'use client';

import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
};

export default function StructureConfirmationModal({ 
  isOpen, onClose, projectData, activeChapter, onConfirm, onEditTemplate 
}) {
  if (!isOpen) return null;

  const currentChapterNumber = activeChapter?.number || activeChapter?.id || 0;
  const chapterStructure = projectData?.template?.structure?.chapters?.find(
    ch => (ch.chapter || ch.number) === currentChapterNumber
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: 'white', borderRadius: '32px', width: '100%', maxWidth: '550px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      >
        <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', background: '#eef2ff', borderRadius: '16px', color: '#6366f1', marginBottom: '20px' }}><Icons.FileText /></div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icons.X /></button>
          </div>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111827', letterSpacing: '-0.5px' }}>Review Chapter Structure</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>
            The AI System Architect will generate <strong>Chapter {currentChapterNumber}</strong> using the following planned sections.
          </p>
        </div>

        <div style={{ padding: '32px', maxHeight: '400px', overflowY: 'auto', background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chapterStructure?.sections?.length > 0 ? chapterStructure.sections.map((section, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#6366f1', background: '#f5f3ff', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>{idx + 1}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>{section}</span>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>No specific sections defined for this chapter template.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '32px', display: 'flex', gap: '16px', background: 'white' }}>
          <button 
            onClick={onEditTemplate}
            style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '2px solid #f1f5f9', background: 'white', color: '#475569', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <Icons.Target /> Edit Structure
          </button>
          <button 
            onClick={onConfirm}
            style={{ flex: 1.5, padding: '18px', borderRadius: '18px', border: 'none', background: '#111827', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Proceed with Generation <Icons.Check />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
