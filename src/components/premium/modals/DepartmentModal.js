'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function DepartmentModal({ isOpen, onClose, onSelect }) {
  const departments = [
    { id: 1, name: 'Science', description: 'Natural and physical sciences research', icon: '🔬' },
    { id: 2, name: 'Engineering', description: 'Technical and applied research', icon: '⚙️' },
    { id: 3, name: 'Arts', description: 'Humanities and creative research', icon: '🎨' },
  ];

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
            className="modal-container"
          >
            <div className="modal-header">
              <h2>Select Department</h2>
              <p>Choose the department for your thesis</p>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>
            <div className="department-grid">
              {departments.map((dept, index) => (
                <motion.button
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelect(dept)}
                  className="department-card"
                >
                  <span className="department-icon">{dept.icon}</span>
                  <h3>{dept.name}</h3>
                  <p>{dept.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}