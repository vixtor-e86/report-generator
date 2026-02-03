'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyModal({ isOpen, onClose, onSelect }) {
  const faculties = [
    { id: 1, name: 'Engineering', description: 'Technical and applied sciences', icon: '⚙️' },
    { id: 2, name: 'Sciences', description: 'Natural and physical sciences', icon: '🔬' },
    { id: 3, name: 'Arts', description: 'Humanities and liberal arts', icon: '🎨' },
    { id: 4, name: 'Social Sciences', description: 'Society and human behavior', icon: '📊' },
    { id: 5, name: 'Medicine', description: 'Health and medical sciences', icon: '⚕️' },
    { id: 6, name: 'Law', description: 'Legal studies and jurisprudence', icon: '⚖️' },
    { id: 7, name: 'Education', description: 'Teaching and pedagogy', icon: '📚' },
    { id: 8, name: 'Business', description: 'Commerce and management', icon: '💼' },
    { id: 9, name: 'Agriculture', description: 'Farming and food sciences', icon: '🌾' },
    { id: 10, name: 'Environmental', description: 'Ecology and sustainability', icon: '🌍' },
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
              <h2>Select Your Faculty</h2>
              <p>Choose the faculty that matches your project</p>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>
            <div className="faculty-grid">
              {faculties.map((faculty, index) => (
                <motion.button
                  key={faculty.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(faculty)}
                  className="faculty-card"
                >
                  <span className="faculty-icon">{faculty.icon}</span>
                  <h3>{faculty.name}</h3>
                  <p>{faculty.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}