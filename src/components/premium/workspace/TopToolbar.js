'use client';

import { useState, useRef, useEffect } from 'react';

const Icons = {
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  Printer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Sidebar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  Pdf: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <path d="M9 15h3a2 2 0 0 0 0-4h-3v4z"></path>
    </svg>
  )
};

export default function TopToolbar({
  onToggleRightSidebar,
  isRightSidebarOpen,
  onToggleLeftSidebar,
  onGenerate,
  onPrint,
  activeChapter,
  onExportClick
}) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const hasContent = !!activeChapter?.content;
  const canPrint = !!activeChapter && hasContent;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="top-toolbar">
      <button className="mobile-menu-btn" onClick={onToggleLeftSidebar}>
        <Icons.Menu />
      </button>
      
      <div className="toolbar-left">
        <h1>Academic Research Workspace</h1>
        <p>Draft, analyze, and refine your project with AI assistance.</p>
      </div>

      <div className="toolbar-actions">
        <button 
          className={hasContent ? "btn-white" : "btn-black"}
          onClick={onGenerate}
          style={hasContent ? { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 20px', 
            borderRadius: '10px', 
            border: '1px solid #e5e7eb', 
            background: 'white', 
            color: '#111827', 
            fontSize: '14px', 
            fontWeight: '600', 
            cursor: 'pointer' 
          } : {}}
        >
          <Icons.Zap style={{ color: hasContent ? '#6366f1' : 'white' }} />
          <span>{hasContent ? 'Modify' : 'Generate'}</span>
        </button>
        
        <button 
          className="btn-icon-only" 
          title="Print Chapter"
          onClick={onPrint}
          disabled={!canPrint}
          style={{ opacity: canPrint ? 1 : 0.4, cursor: canPrint ? 'pointer' : 'not-allowed' }}
        >
          <Icons.Printer />
        </button>
        
        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="btn-icon-only" 
            title="Export Project"
            onClick={() => setShowExportDropdown(!showExportDropdown)}
          >
            <Icons.Download />
          </button>

          {showExportDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
              <button 
                onClick={() => { setShowExportDropdown(false); onExportClick('pdf'); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <Icons.Pdf />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">Export as PDF</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">High Quality</p>
                </div>
              </button>
              <button 
                onClick={() => { setShowExportDropdown(false); onExportClick('docx'); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icons.FileText />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">Export as DOCX</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Microsoft Word</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <button 
          className="btn-icon-only"
          onClick={onToggleRightSidebar}
          title="Toggle Tools Panel"
          style={{ 
            backgroundColor: isRightSidebarOpen ? '#f3f4f6' : 'white',
            borderColor: isRightSidebarOpen ? '#d1d5db' : '#e5e7eb'
          }}
        >
          <Icons.Sidebar />
        </button>
      </div>
    </div>
  );
}
