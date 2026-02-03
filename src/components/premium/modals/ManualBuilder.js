'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ManualBuilder({ onBack, onProceed }) {
  const [chapters, setChapters] = useState([{ id: 1, title: '', sections: [''] }]);

  const addChapter = () => {
    setChapters([...chapters, { id: chapters.length + 1, title: '', sections: [''] }]);
  };

  const removeChapter = (id) => {
    setChapters(chapters.filter(ch => ch.id !== id));
  };

  const addSection = (chapterId) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId ? { ...ch, sections: [...ch.sections, ''] } : ch
    ));
  };

  const removeSection = (chapterId, sectionIndex) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, sections: ch.sections.filter((_, i) => i !== sectionIndex) }
        : ch
    ));
  };

  const updateChapterTitle = (id, title) => {
    setChapters(chapters.map(ch => ch.id === id ? { ...ch, title } : ch));
  };

  const updateSection = (chapterId, sectionIndex, value) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId
        ? { ...ch, sections: ch.sections.map((s, i) => i === sectionIndex ? value : s) }
        : ch
    ));
  };

  return (
    <div className="manual-builder">
      <div className="chapters-container">
        {chapters.map((chapter, chIndex) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="chapter-builder"
          >
            <div className="chapter-header">
              <input
                type="text"
                placeholder={`Chapter ${chIndex + 1} Title`}
                value={chapter.title}
                onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                className="chapter-input"
              />
              {chapters.length > 1 && (
                <button
                  onClick={() => removeChapter(chapter.id)}
                  className="remove-chapter"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="sections-list">
              {chapter.sections.map((section, secIndex) => (
                <div key={secIndex} className="section-item">
                  <span className="section-number">{chIndex + 1}.{secIndex + 1}</span>
                  <input
                    type="text"
                    placeholder="Section title"
                    value={section}
                    onChange={(e) => updateSection(chapter.id, secIndex, e.target.value)}
                    className="section-input"
                  />
                  {chapter.sections.length > 1 && (
                    <button
                      onClick={() => removeSection(chapter.id, secIndex)}
                      className="remove-section"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addSection(chapter.id)}
                className="add-section-btn"
              >
                + Add Section
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      <button onClick={addChapter} className="add-chapter-btn">
        + Add Chapter
      </button>
      <div className="modal-actions">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={() => onProceed({ type: 'manual', chapters })}
          className="btn-primary"
        >
          Create Template
        </button>
      </div>
    </div>
  );
}