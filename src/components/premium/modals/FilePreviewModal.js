'use client';

import { useState } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  ExternalLink: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
};

export default function FilePreviewModal({ isOpen, onClose, file }) {
  if (!isOpen || !file) return null;

  const isImage = file.file_type?.startsWith('image/');
  const isPDF = file.file_type === 'application/pdf';
  const isDoc = file.file_type?.includes('word') || file.file_type?.includes('document') || file.file_type?.includes('sheet') || file.file_type?.includes('excel');
  
  // Use Google Docs Viewer for Office files
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div 
        style={{
          width: '100%',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{file.original_name}</h3>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>{(file.size_bytes / 1024).toFixed(1)} KB</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a 
            href={file.file_url} 
            download 
            title="Download"
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
          >
            <Icons.Download />
          </a>
          <a 
            href={file.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            title="Open in New Tab"
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
          >
            <Icons.ExternalLink />
          </a>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
          >
            <Icons.X />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        style={{
          width: '90%',
          height: '85%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          <img 
            src={file.file_url} 
            alt={file.original_name} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} 
          />
        ) : isPDF ? (
          <iframe 
            src={file.file_url} 
            style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '8px' }} 
            title="PDF Viewer"
          />
        ) : isDoc ? (
          <iframe 
            src={googleDocsUrl} 
            style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '8px' }} 
            title="Document Viewer"
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <p>Preview not available for this file type.</p>
            <a 
              href={file.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
            >
              Click to download/view
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
