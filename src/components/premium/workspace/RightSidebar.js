'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// Simple SVG Icons
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Edit3: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  BarChart2: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Languages: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function RightSidebar({ onClose }) {
  const [activeTab, setActiveTab] = useState('tools');

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="right-sidebar"
    >
      <div className="rs-tabs">
        <button 
          className={`rs-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Tools
        </button>
        <button 
          className={`rs-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
      </div>

      <div className="right-sidebar-content" style={{ padding: 0, overflowY: 'auto' }}>
        {activeTab === 'tools' ? (
          <div className="tools-list">
            
            {/* Research & Citation */}
            <div className="tool-section">
              <h4 className="tool-group-title">Research & Citation</h4>
              <ToolItem 
                icon={<Icons.Search />} 
                title="Semantic Scholar" 
                desc="Find relevant papers and metadata."
                action="Use"
              />
            </div>

            {/* Writing & Grammar */}
            <div className="tool-section">
              <h4 className="tool-group-title">Writing & Grammar</h4>
              <ToolItem 
                icon={<Icons.Edit3 />} 
                title="LanguageTool" 
                desc="Grammar, spelling, and style checking."
                action="Use"
              />
            </div>

            {/* Formatting */}
            <div className="tool-section">
              <h4 className="tool-group-title">Formatting</h4>
              <ToolItem 
                icon={<Icons.FileText />} 
                title="Pandoc" 
                desc="Convert between .docx, PDF, LaTeX, HTML."
                action="Use"
              />
            </div>

            {/* Data & Statistics */}
            <div className="tool-section">
              <h4 className="tool-group-title">Data & Statistics</h4>
              <ToolItem 
                icon={<Icons.BarChart2 />} 
                title="Wolfram Alpha" 
                desc="Computational knowledge and data analysis."
                action="Use"
              />
            </div>

            {/* Plagiarism & Quality */}
            <div className="tool-section">
              <h4 className="tool-group-title">Plagiarism & Quality</h4>
              <ToolItem 
                icon={<Icons.Shield />} 
                title="Copyscape" 
                desc="Check content originality."
                action="Use"
              />
            </div>

            {/* Utility Tools */}
            <div className="tool-section">
              <h4 className="tool-group-title">Utility Tools</h4>
              <ToolItem 
                icon={<Icons.Image />} 
                title="Image Generation" 
                desc="Generate diagrams and illustrations."
                action="Use"
              />
              <ToolItem 
                icon={<Icons.Languages />} 
                title="Translation" 
                desc="DeepL multi-language support."
                action="Use"
              />
            </div>

          </div>
        ) : (
          <div className="tool-placeholder">
            <span className="placeholder-icon">📂</span>
            <p>No files uploaded yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ToolItem({ icon, title, desc, action }) {
  return (
    <div className="tool-item">
      <div className="tool-icon-wrapper" style={{ 
        color: '#111827',
        marginTop: '2px' 
      }}>
        {icon}
      </div>
      <div className="tool-info">
        <span className="tool-name">{title}</span>
        <span className="tool-desc">{desc}</span>
      </div>
      <button className="tool-action-btn" style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#111827',
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}>
        {action}
      </button>
    </div>
  );
}