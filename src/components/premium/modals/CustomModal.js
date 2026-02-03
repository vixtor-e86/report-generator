'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './FileUpload';
import ManualBuilder from './ManualBuilder';

export default function CustomModal({ isOpen, onClose, onProceed }) {
  const [customType, setCustomType] = useState(null);

  const handleReset = () => {
    setCustomType(null);
  };

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
              <p>Upload a document or build from scratch</p>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>

            {!customType ? (
              <div className="custom-options">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCustomType('upload')}
                  className="custom-option-card"
                >
                  <div className="option-icon">📄</div>
                  <h3>Upload Document</h3>
                  <p>Extract template from your existing document</p>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCustomType('manual')}
                  className="custom-option-card"
                >
                  <div className="option-icon">✏️</div>
                  <h3>Build Manually</h3>
                  <p>Create your structure chapter by chapter</p>
                </motion.button>
              </div>
            ) : customType === 'upload' ? (
              <FileUpload onBack={handleReset} onProceed={onProceed} />
            ) : (
              <ManualBuilder onBack={handleReset} onProceed={onProceed} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}