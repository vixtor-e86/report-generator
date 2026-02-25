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
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

export default function RightSidebar({ 
  onClose, 
  files = [], 
  onUpload, 
  uploading, 
  onDelete, 
  deleting, 
  onFileClick, 
  onError, 
  onSearchClick,
  onVisualToolsClick,
  onPresentationClick,
  onHumanizerClick // ✅ Added new prop
}) {
  const [activeTab, setActiveTab] = useState('tools');

  const handleQuickUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
    ];
    
    // Check if type is valid OR if extension matches (sometimes MIME types vary)
    const validExtensions = ['.pdf', '.docx', '.txt', '.xlsx'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      onError('Only PDF, DOCX, XLSX, and TXT files are allowed.');
      return;
    }

    onUpload(file);
  };

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
            
            {/* Available Tools */}
            <div className="tool-section">
              <h4 className="tool-group-title" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#059669', borderRadius: '50%' }}></span>
                Available Tools
              </h4>
              <ToolItem 
                icon={<Icons.Image style={{ color: '#6366f1' }} />} 
                title="Diagram & Image Studio" 
                desc="Create diagrams and illustrations with AI."
                action="Use"
                onClick={onVisualToolsClick}
              />
              <ToolItem 
                icon={<Icons.Search />} 
                title="Semantic Scholar" 
                desc="Find relevant papers and metadata."
                action="Use"
                onClick={onSearchClick}
              />
              <ToolItem 
                icon={<Icons.User style={{ color: '#4f46e5' }} />} 
                title="Humanizer Tool" 
                desc="Bypass detectors and improve flow."
                action="Use"
                onClick={onHumanizerClick}
              />
              <ToolItem 
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>} 
                title="Presentation Builder" 
                desc="Generate PowerPoint slides from chapters."
                action="Use"
                onClick={onPresentationClick}
              />
            </div>

            {/* Coming Soon */}
            <div className="tool-section" style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '16px' }}>
              <h4 className="tool-group-title" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%' }}></span>
                Coming Soon
              </h4>
              <ToolItem 
                icon={<Icons.BarChart2 />} 
                title="Wolfram Alpha" 
                desc="Computational knowledge and data analysis."
                disabled
              />
              <ToolItem 
                icon={<Icons.Shield />} 
                title="Copyscape" 
                desc="Check content originality."
                disabled
              />
              <ToolItem 
                icon={<Icons.Languages />} 
                title="Translation" 
                desc="DeepL multi-language support."
                disabled
              />
            </div>

          </div>
        ) : (
          <div className="files-panel p-4">
            <div className="mb-4">
              <label className={`flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleQuickUpload}
                  disabled={uploading}
                  accept=".pdf,.docx,.txt,.xlsx"
                />
                <div className="text-center">
                  <div className="text-indigo-600 mb-1">
                    {uploading ? 'Uploading...' : <Icons.Upload />}
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {uploading ? 'Please wait' : 'Click to Upload Document'}
                  </span>
                </div>
              </label>
            </div>

            <div className="files-list space-y-3">
              {files.length > 0 ? (
                files.map((file) => (
                  <div 
                    key={file.id} 
                    className="file-item flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition cursor-pointer"
                    onClick={() => onFileClick(file)}
                  >
                    <span className="text-xl">
                      {file.file_type?.includes('image') ? '🖼️' : '📄'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.original_name}>
                        {file.original_name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-500">{(file.size_bytes / 1024).toFixed(1)} KB</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-indigo-600 hover:underline font-medium">View</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                            disabled={deleting}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Delete File"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tool-placeholder text-center py-8">
                  <span className="placeholder-icon text-4xl block mb-2">📂</span>
                  <p className="text-sm text-gray-500">No files uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ToolItem({ icon, title, desc, action, onClick, disabled }) {
  return (
    <div className={`tool-item ${disabled ? 'opacity-50' : ''}`}>
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
      <button 
        onClick={disabled ? null : onClick}
        disabled={disabled}
        className="tool-action-btn" style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '500',
        color: disabled ? '#94a3b8' : '#111827',
        background: disabled ? '#f9fafb' : '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s'
      }}>
        {disabled ? 'Soon' : action}
      </button>
    </div>
  );
}
