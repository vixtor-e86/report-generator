'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingModal({ isOpen, loadingText = 'Processing...' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Strict Non-closable Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: 'white',
                padding: '40px',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Animated Spinner */}
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 32px' }}>
                <div style={{
                  position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderRadius: '50%'
                }} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{
                    position: 'absolute', inset: 0, border: '4px solid #6366f1',
                    borderTopColor: 'transparent', borderRadius: '50%'
                  }}
                />
                <div style={{
                  position: 'absolute', inset: '20px', background: '#6366f1', opacity: 0.1, borderRadius: '50%'
                }} />
              </div>

              <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                {loadingText}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Please do not close this window or refresh the page. AI is architecting your academic content.
              </p>

              {/* Progress Pulse */}
              <div style={{ marginTop: '32px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%' }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
