'use client';

import { useState } from 'react';

// Simple SVG Icons
const Icons = {
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Edit: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Printer: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>,
    Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
    Sidebar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
  };
  
  export default function TopToolbar({
    onToggleRightSidebar,
    isRightSidebarOpen,
    onToggleLeftSidebar,
    onGenerate
  }) {
    return (
      <>
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
              className="btn-black"
              onClick={onGenerate}
            >
              <Icons.Zap />
              <span>Generate</span>
            </button>
            
            <button className="btn-icon-only" title="Edit Mode">
              <Icons.Edit />
            </button>
            
            <button className="btn-icon-only" title="Print">
              <Icons.Printer />
            </button>
            
            <button className="btn-icon-only" title="Export Project">
              <Icons.Download />
            </button>
    
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
      </>
    );
  }