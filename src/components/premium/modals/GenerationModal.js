'use client';

import { useState } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function GenerationModal({ isOpen, onClose, uploadedImages, researchPapers }) {
  const [formData, setFormData] = useState({
    projectTopic: '',
    projectDescription: '',
    componentsUsed: '',
    researchBooks: '',
    selectedImages: [],
    selectedPapers: [],
    referenceFormat: 'APA'
  });

  const [activeTab, setActiveTab] = useState('details'); // 'details', 'images', 'papers'

  const referenceFormats = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard'];

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

  const handleGenerate = () => {
    if (!formData.projectTopic.trim()) {
      alert('Please enter a project topic/name');
      return;
    }
    if (!formData.projectDescription.trim()) {
      alert('Please enter a project description');
      return;
    }
    
    console.log('Generation Data:', formData);
    onClose();
    // Here you would dispatch the actual generation request
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
          flexDirection: 'column',
          '@media (max-width: 768px)': {
            width: 'calc(100% - 16px)',
            maxHeight: '95vh',
            borderRadius: '12px'
          }
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
              Generate Project
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Provide project details and select your research materials
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
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#6b7280';
            }}
          >
            <Icons.X />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '0 24px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            overflowX: 'auto'
          }}
        >
          {['details', 'images', 'papers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab ? '#111827' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #111827' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                '@media (max-width: 480px)': {
                  fontSize: '12px',
                  padding: '10px 12px'
                }
              }}
            >
              {tab === 'details' && 'Project Details'}
              {tab === 'images' && `Images (${formData.selectedImages.length})`}
              {tab === 'papers' && `Research Papers (${formData.selectedPapers.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Project Topic */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Project Topic / Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., AI in Healthcare: Diagnostic Applications"
                  value={formData.projectTopic}
                  onChange={(e) => handleInputChange('projectTopic', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Project Description */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Project Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  placeholder="Provide a detailed description of your project, objectives, and scope..."
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Components Used */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Components / Tools Used <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                </label>
                <textarea
                  placeholder="e.g., Machine Learning, Data Analysis, Case Studies, Literature Review"
                  value={formData.componentsUsed}
                  onChange={(e) => handleInputChange('componentsUsed', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Research Books/Journals */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Key Research Books / Journals <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                </label>
                <textarea
                  placeholder="e.g., Nature, Science, Journal of Medical AI, Research papers you've gathered"
                  value={formData.researchBooks}
                  onChange={(e) => handleInputChange('researchBooks', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Reference Format */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Reference Format
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.referenceFormat}
                    onChange={(e) => handleInputChange('referenceFormat', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      appearance: 'none',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      paddingRight: '36px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {referenceFormats.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6b7280'
                  }}>
                    <Icons.ChevronDown />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Select images from your uploads to include in the project
              </p>
              {uploadedImages && uploadedImages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => toggleImageSelection(image.id)}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: formData.selectedImages.includes(image.id)
                          ? '2px solid #3b82f6'
                          : '2px solid #e5e7eb',
                        transition: 'all 0.2s',
                        background: '#f9fafb'
                      }}
                    >
                      <img
                        src={image.src}
                        alt={image.name}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          opacity: formData.selectedImages.includes(image.id) ? 0.7 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      />
                      {formData.selectedImages.includes(image.id) && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.2)'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: '#3b82f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Icons.Check />
                          </div>
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        fontSize: '11px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Icons.Image style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#9ca3af' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No images uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Papers Tab */}
          {activeTab === 'papers' && (
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Select research papers you've gathered using Semantic Scholar or other tools
              </p>
              {researchPapers && researchPapers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {researchPapers.map((paper) => (
                    <div
                      key={paper.id}
                      onClick={() => togglePaperSelection(paper.id)}
                      style={{
                        padding: '12px',
                        border: formData.selectedPapers.includes(paper.id)
                          ? '2px solid #3b82f6'
                          : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: formData.selectedPapers.includes(paper.id) ? '#f0f9ff' : '#f9fafb',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: formData.selectedPapers.includes(paper.id)
                          ? '2px solid #3b82f6'
                          : '1px solid #d1d5db',
                        borderRadius: '4px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        background: formData.selectedPapers.includes(paper.id) ? '#3b82f6' : 'white',
                        color: 'white'
                      }}>
                        {formData.selectedPapers.includes(paper.id) && <Icons.Check />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {paper.title}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>
                          {paper.author}
                        </p>
                        {paper.year && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                            {paper.year} • {paper.journal}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Icons.FileText style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#9ca3af' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    No research papers saved yet
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
                    Use the Semantic Scholar tool to gather and save papers
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#f9fafb',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              color: '#111827',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#111827',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 'fit-content',
              '@media (max-width: 480px)': {
                flex: 1,
                justifyContent: 'center'
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1f2937';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#111827';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Generate Project
          </button>
        </div>
      </div>
    </>
  );
}
