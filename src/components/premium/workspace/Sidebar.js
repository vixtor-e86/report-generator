'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFileUpload } from '@/hooks/useFileUpload';

// Simple SVG Icons
const Icons = {
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Layers: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  MessageSquare: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Cpu: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>,
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Trash: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  HardDrive: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
};

export default function Sidebar({ 
  projectData, 
  chapters, 
  images, 
  projectDocs = [],
  userProfile, // Added prop
  activeView, 
  onViewChange,
  onUpload, 
  uploading,
  onDelete,
  deleting,
  onFileClick,
  onError,
  isOpen,
  onClose,
  storageUsed = 0,
  storageLimit = 300 * 1024 * 1024 // Default 300MB
}) {
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(true);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: PNG, JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      onError('Only PNG and JPEG images are allowed.');
      return;
    }

    onUpload(file, 'project_image');
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: PDF, DOCX
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validExtensions = ['.pdf', '.docx'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      onError('Only PDF and DOCX files are allowed for project documents.');
      return;
    }

    onUpload(file, 'project_component');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose}
        />
      )}
      
      <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Workspace Selector */}
        <div className="sidebar-header-new">
          <div className="workspace-selector" style={{ cursor: 'default' }}>
            <img src="/favicon2.ico" alt="Logo" style={{ width: 24, height: 24 }} />
            <div className="workspace-info">
              <span className="workspace-name">W3 Writelab</span>
              <span className="premium-label">Premium</span>
            </div>
            {/* Mobile Close Button */}
            <button className="mobile-close-btn" onClick={onClose}>
              <Icons.ChevronDown style={{ transform: 'rotate(90deg)' }}/>
            </button>
          </div>
        </div>

      {/* Main Navigation */}
      <div className="sidebar-nav-new">
        <button 
          className={`nav-item-new ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <Icons.Home />
          <span>Dashboard</span>
        </button>

        <div className="nav-group">
          <button 
            className="nav-item-new" 
            onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
          >
            <Icons.FileText />
            <span>Documents</span>
            <span className={`dropdown-chevron ${isDocumentsOpen ? 'open' : ''}`}>
              <Icons.ChevronDown />
            </span>
          </button>
          
          {/* Nested Document Items (Chapters & Assets) */}
          {isDocumentsOpen && (
             <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sub-nav-list"
            >
              <div className="sub-nav-header">Project Docs</div>
              
              {/* List Uploaded Project Components */}
              {projectDocs.map((doc) => (
                <div key={doc.id} className="sub-nav-item" style={{ paddingRight: '8px' }}>
                  <button
                    onClick={() => onFileClick(doc)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '14px' }}>📄</span>
                    <span className="truncate" style={{ maxWidth: '100px' }}>{doc.name}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                    disabled={deleting}
                    className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))}

              <label htmlFor="doc-upload" className={`sub-nav-item upload-item ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ marginBottom: '12px' }}>
                <input
                  id="doc-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleDocUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <Icons.Plus /> Add Component
              </label>

              <div className="sub-nav-header">Current Project</div>
              {(projectData.template?.structure?.chapters || chapters).map((chapter) => (
                <button
                  key={chapter.id || chapter.number}
                  className={`sub-nav-item ${activeView === `chapter-${chapter.id || chapter.number}` ? 'active' : ''}`}
                  onClick={() => onViewChange(`chapter-${chapter.id || chapter.number}`)}
                >
                  Chapter {chapter.id || chapter.number}
                </button>
              ))}
              
              <div className="sub-nav-header">Assets</div>
              
              {/* List Uploaded Images */}
              {images.map((img) => (
                <div key={img.id} className={`sub-nav-item ${activeView === `image-${img.id}` ? 'active' : ''}`} style={{ paddingRight: '8px' }}>
                  <button
                    onClick={() => onViewChange(`image-${img.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '14px' }}>🖼️</span>
                    <span className="truncate" style={{ maxWidth: '100px' }}>{img.original_name || 'Image'}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(img); }}
                    disabled={deleting}
                    className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                    title="Delete Image"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))}

               <label htmlFor="image-upload" className={`sub-nav-item upload-item ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <Icons.Image /> {uploading ? 'Uploading...' : 'Add Image'}
              </label>
            </motion.div>
          )}
        </div>

        <button 
          className={`nav-item-new ${activeView === 'edit-template' ? 'active' : ''}`}
          onClick={() => onViewChange('edit-template')}
        >
          <Icons.Layers />
          <span>Templates</span>
        </button>

        <button 
          className={`nav-item-new ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => onViewChange('history')}
        >
          <Icons.Clock />
          <span>History</span>
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="sidebar-footer-new">
        
        {/* Token Usage Card */}
        <div className="upgrade-card token-card">
          <div className="upgrade-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Cpu />
              <span className="upgrade-title">AI Tokens</span>
            </div>
            <span className="token-count">
              {((projectData?.tokens_used || 0) / 1000).toFixed(0)}k / {((projectData?.tokens_limit || 500000) / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="upgrade-bar">
             <div 
               className="upgrade-progress" 
               style={{ 
                 width: `${Math.min(((projectData?.tokens_used || 0) / (projectData?.tokens_limit || 500000)) * 100, 100)}%` 
               }}
             ></div>
          </div>
        </div>

        {/* Storage Usage Card */}
        <div className="upgrade-card token-card" style={{ marginTop: '8px' }}>
          <div className="upgrade-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.HardDrive />
              <span className="upgrade-title">Storage</span>
            </div>
            <span className="token-count">
              {(storageUsed / (1024 * 1024)).toFixed(1)} / {(storageLimit / (1024 * 1024)).toFixed(0)} MB
            </span>
          </div>
          <div className="upgrade-bar">
             <div 
               className="upgrade-progress" 
               style={{ 
                 width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%`,
                 background: storageUsed > storageLimit * 0.9 ? '#ef4444' : undefined // Red if > 90%
               }}
             ></div>
          </div>
        </div>

        <div className="footer-menu">
          <Link href={`/premium/feedback?projectId=${projectData?.id}`} className="footer-item" style={{ textDecoration: 'none' }}>
            <Icons.MessageSquare />
            <span>Feedback</span>
          </Link>
          <button className="footer-item">
            <Icons.Users />
            <span>Invite People</span>
          </button>
        </div>

        <div className="user-profile-new">
          <img 
            src={`https://ui-avatars.com/api/?name=${userProfile?.username || 'User'}&background=random`} 
            alt="User" 
            className="user-avatar-img" 
          />
          <div className="user-info-new">
            <span className="user-name-new">{userProfile?.username || 'Loading...'}</span>
            <span className="user-email-new" style={{ fontSize: '10px' }}>{userProfile?.id ? 'Premium Account' : 'Loading...'}</span>
          </div>
          <Link href="/dashboard" className="logout-btn" title="Back to Dashboard" style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#6366f1',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}>
            <Icons.ArrowLeft />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
