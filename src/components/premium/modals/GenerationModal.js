'use client';

import { useState, useEffect } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function GenerationModal({ 
  isOpen, 
  onClose, 
  uploadedImages = [], 
  researchPapers = [], 
  activeChapter, 
  projectId, 
  userId,
  onGenerateSuccess 
}) {
  const [formData, setFormData] = useState({
    userPrompt: '',
    selectedImages: [],
    selectedPapers: []
  });

  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt', 'files'
  const [generating, setGenerating] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userPrompt: '',
        selectedImages: [],
        selectedPapers: []
      });
      setGenerating(false);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleImageSelection = (imageId) => {
    setFormData(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.includes(imageId)
        ? prev.selectedImages.filter(id => id !== imageId)
        : [...prev.selectedImages, imageId]
    }));
  };

  const togglePaperSelection = (paperId) => {
    setFormData(prev => ({
      ...prev,
      selectedPapers: prev.selectedPapers.includes(paperId)
        ? prev.selectedPapers.filter(id => id !== paperId)
        : [...prev.selectedPapers, paperId]
    }));
  };

  const handleGenerate = async () => {
    if (!projectId || !userId) {
      alert('Missing project or user information');
      return;
    }

    if (!activeChapter) {
      alert('Please open a chapter to generate content for it.');
      onClose();
      return;
    }

    setGenerating(true);

    try {
      // Collect selected files metadata
      const selectedFiles = [
        ...uploadedImages.filter(img => formData.selectedImages.includes(img.id)),
        ...researchPapers.filter(p => formData.selectedPapers.includes(p.id))
      ];

      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          chapterNumber: activeChapter.id || activeChapter.number,
          chapterTitle: activeChapter.title,
          files: selectedFiles,
          userPrompt: formData.userPrompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      alert('Chapter generated successfully!');
      if (onGenerateSuccess) onGenerateSuccess();
      onClose();

    } catch (error) {
      console.error('Generation error:', error);
      alert(error.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 1000,
          maxWidth: '700px',
          width: 'calc(100% - 32px)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {activeChapter ? `Generate ${activeChapter.title}` : 'Select a Chapter'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {activeChapter ? 'Customize generation settings and context.' : 'Please open a chapter to start generating.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
          >
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        {activeChapter ? (
          <>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '0 24px',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}
            >
              <button
                onClick={() => setActiveTab('prompt')}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'prompt' ? '#111827' : '#6b7280',
                  borderBottom: activeTab === 'prompt' ? '2px solid #111827' : '2px solid transparent'
                }}
              >
                Instructions
              </button>
              <button
                onClick={() => setActiveTab('files')}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'files' ? '#111827' : '#6b7280',
                  borderBottom: activeTab === 'files' ? '2px solid #111827' : '2px solid transparent'
                }}
              >
                Reference Materials ({formData.selectedImages.length + formData.selectedPapers.length})
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {activeTab === 'prompt' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    placeholder="e.g., Focus on the impact of X on Y. Include a case study about Z. Keep it concise."
                    value={formData.userPrompt}
                    onChange={(e) => handleInputChange('userPrompt', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      minHeight: '150px',
                      resize: 'vertical'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    The AI will combine your instructions with the project context and selected files.
                  </p>
                </div>
              )}

              {activeTab === 'files' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Research Papers</h4>
                    {researchPapers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {researchPapers.map(paper => (
                          <div 
                            key={paper.id}
                            onClick={() => togglePaperSelection(paper.id)}
                            style={{
                              padding: '10px',
                              border: `1px solid ${formData.selectedPapers.includes(paper.id) ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: formData.selectedPapers.includes(paper.id) ? '#eff6ff' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              background: formData.selectedPapers.includes(paper.id) ? '#3b82f6' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {formData.selectedPapers.includes(paper.id) && <Icons.Check />}
                            </div>
                            <span style={{ fontSize: '13px', color: '#374151' }}>{paper.title || paper.original_name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>No papers available.</p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Project Images</h4>
                    {uploadedImages.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                        {uploadedImages.map(img => (
                          <div 
                            key={img.id}
                            onClick={() => toggleImageSelection(img.id)}
                            style={{
                              position: 'relative',
                              height: '80px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: formData.selectedImages.includes(img.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                            }}
                          >
                            <img src={img.src} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {formData.selectedImages.includes(img.id) && (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', color: 'white' }}>
                                  <Icons.Check />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>No images available.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f9fafb' }}>
              <button
                onClick={onClose}
                disabled={generating}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#111827',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  opacity: generating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {generating ? 'Generating...' : 'Start Generation'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>Please select a chapter from the sidebar to begin generation.</p>
            <button 
              onClick={onClose}
              style={{ marginTop: '16px', padding: '8px 16px', background: '#111827', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
