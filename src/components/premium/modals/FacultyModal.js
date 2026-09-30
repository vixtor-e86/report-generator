'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyModal({ isOpen, onClose, onSelect }) {
  const faculties = [
    { id: 1, name: 'Engineering', description: 'Technical and applied sciences', icon: '⚙️' },
    { id: 2, name: 'Sciences', description: 'Natural and physical sciences', icon: '🔬' },
    { id: 3, name: 'Arts & Humanities', description: 'Humanities and liberal arts', icon: '🎨' },
    { id: 4, name: 'Social Sciences', description: 'Society and human behavior', icon: '📊' },
    { id: 5, name: 'Basic Medical Sciences', description: 'Health and medical sciences', icon: '⚕️' },
    { id: 6, name: 'Law', description: 'Legal studies and jurisprudence', icon: '⚖️' },
    { id: 7, name: 'Education', description: 'Teaching and pedagogy', icon: '📚' },
    { id: 8, name: 'Management Sciences', description: 'Commerce and management', icon: '💼' },
    { id: 9, name: 'Agricultural Sciences', description: 'Farming and food sciences', icon: '🌾' },
    { id: 10, name: 'Environmental Science', description: 'Ecology and sustainability', icon: '🌍' },
    { id: 11, name: 'Pharmacy', description: 'Pharmaceutical and clinical sciences', icon: '💊' },
    { id: 12, name: 'Medicine & Surgery', description: 'Clinical medicine and surgical research', icon: '🩺' },
    { id: 13, name: 'Veterinary Medicine', description: 'Animal health, surgery and pathology', icon: '🐾' },
    { id: 14, name: 'Public Health', description: 'Epidemiology and community health', icon: '🏥' },
    { id: 15, name: 'Computing & Information Technology', description: 'Computer science, software and cybersecurity', icon: '💻' },
    { id: 16, name: 'Renewable Natural Resources', description: 'Forestry, wildlife and fisheries management', icon: '🌲' },
    { id: 17, name: 'Islamic & Arabic Studies', description: 'Shariah, Islamic thought and Arabic linguistics', icon: '🕌' },
    { id: 18, name: 'Dentistry', description: 'Oral health, periodontics and dental biomaterials', icon: '🦷' },
    { id: 19, name: 'Vocational & Technical Education', description: 'Technical skills, TVET and industrial pedagogy', icon: '🛠️' },
    { id: 20, name: 'Petroleum Engineering & Energy Studies', description: 'Reservoir, drilling and energy transition engineering', icon: '🛢️' },
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