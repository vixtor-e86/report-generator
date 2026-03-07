'use client';

import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  Success: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  Error: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Warning: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  Info: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

const typeConfigs = {
  success: {
    icon: <Icons.Success />,
    color: '#10b981',
    bgColor: '#f0fdf4',
    buttonColor: '#10b981',
    hoverColor: '#059669'
  },
  error: {
    icon: <Icons.Error />,
    color: '#ef4444',
    bgColor: '#fef2f2',
    buttonColor: '#ef4444',
    hoverColor: '#dc2626'
  },
  warning: {
    icon: <Icons.Warning />,
    color: '#f59e0b',
    bgColor: '#fffbe6',
    buttonColor: '#f59e0b',
    hoverColor: '#d97706'
  },
  info: {
    icon: <Icons.Info />,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    buttonColor: '#3b82f6',
    hoverColor: '#2563eb'
  },
  confirm: {
    icon: <Icons.Warning />,
    color: '#6366f1',
    bgColor: '#f5f3ff',
    buttonColor: '#6366f1',
    hoverColor: '#4f46e5'
  }
};

export default function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm, 
  confirmText = 'Continue', 
  cancelText = 'Cancel' 
}) {
  if (!isOpen) return null;

  const config = typeConfigs[type] || typeConfigs.info;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={type === 'confirm' ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            position: 'relative',
            border: '1px solid #f1f5f9'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {type !== 'confirm' && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '8px',
                borderRadius: '50%',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <Icons.X />
            </button>
          )}

          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '16px', background: config.bgColor, borderRadius: '20px' }}>
              {config.icon}
            </div>
          </div>

          <h3 style={{ 
            fontSize: '22px', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            {title}
          </h3>
          
          <p style={{ 
            fontSize: '15px', 
            color: '#64748b', 
            lineHeight: '1.6', 
            marginBottom: '32px',
            fontWeight: '500'
          }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {type === 'confirm' && (
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: config.buttonColor,
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 10px 15px -3px ${config.color}33`
              }}
              onMouseEnter={(e) => e.target.style.background = config.hoverColor}
              onMouseLeave={(e) => e.target.style.background = config.buttonColor}
            >
              {type === 'confirm' ? confirmText : 'Okay, Understood'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
