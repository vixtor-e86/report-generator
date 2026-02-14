'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ManualBuilder from './ManualBuilder';

export default function CustomModal({ isOpen, onClose, onProceed }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="modal-container custom-modal"
          >
            <div className="modal-header">
              <h2>Create Custom Template</h2>
              <p>Build your project structure chapter by chapter</p>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
              <ManualBuilder onBack={onClose} onProceed={onProceed} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
