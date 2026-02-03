'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingModal({ isOpen, loadingText = 'Processing...' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="loading-modal"
          >
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h3 className="loading-text">{loadingText}</h3>
            <p className="loading-subtext">This will only take a moment</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}