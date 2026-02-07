'use client';

import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  AlertCircle: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function ErrorModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            <Icons.X />
          </button>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '50%' }}>
              <Icons.AlertCircle />
            </div>
          </div>

          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#111827', 
            marginBottom: '8px',
            margin: '0 0 8px 0' 
          }}>
            Upload Failed
          </h3>
          
          <p style={{ 
            fontSize: '15px', 
            color: '#6b7280', 
            lineHeight: '1.5', 
            marginBottom: '24px' 
          }}>
            {message || 'The file format you selected is not supported.'}
          </p>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
          >
            Okay, got it
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
