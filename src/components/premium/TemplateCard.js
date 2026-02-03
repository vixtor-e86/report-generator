'use client';

import { motion } from 'framer-motion';

export default function TemplateCard({ template, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring' }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={template.action}
      className={`template-card ${template.color}`}
    >
      <div className="card-glow" />
      <div className="template-icon">{template.icon}</div>
      <h3>{template.title}</h3>
      <p>{template.description}</p>
      <div className="card-arrow">→</div>
    </motion.button>
  );
}