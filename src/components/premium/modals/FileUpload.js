'use client';

import { useState } from 'react';

export default function FileUpload({ onBack, onProceed }) {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div className="upload-section">
      <div
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
        />
        {!uploadedFile ? (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">Drag and drop your document here</p>
            <p className="upload-subtext">or</p>
            <label htmlFor="file-upload" className="upload-btn">
              Browse Files
            </label>
            <p className="upload-hint">Supports PDF, DOC, DOCX</p>
          </>
        ) : (
          <div className="file-preview">
            <span className="file-icon">📄</span>
            <div className="file-info">
              <p className="file-name">{uploadedFile.name}</p>
              <p className="file-size">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <button onClick={() => setUploadedFile(null)} className="remove-file">✕</button>
          </div>
        )}
      </div>
      <div className="modal-actions">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button 
          onClick={() => onProceed({ type: 'upload', file: uploadedFile })}
          disabled={!uploadedFile}
          className="btn-primary"
        >
          Process & Continue
        </button>
      </div>
    </div>
  );
}