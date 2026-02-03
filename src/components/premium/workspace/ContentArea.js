'use client';

import { useState } from 'react';
import EditTemplateModal from '../modals/EditTemplateModal';

// Simple SVG Icons
const Icons = {
  Edit3: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>,
  Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  PieChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  Code: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  Paperclip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>,
  Mic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function ContentArea({ 
  activeView, 
  projectData, 
  chapters, 
  onUpdateChapter 
}) {
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Determine if we are viewing a specific chapter
  const activeChapter = activeView.startsWith('chapter-') 
    ? chapters.find(ch => `chapter-${ch.id}` === activeView)
    : null;

  if (activeChapter) {
    const isEditing = editingChapterId === activeChapter.id;

    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          {/* Header */}
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              {activeChapter.title}
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Generated content for {projectData.title}
            </p>
          </div>

          {/* Content Display/Editor */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%' }}>
            {/* Content Area */}
            {isEditing ? (
              <textarea
                className="chapter-editor"
                value={activeChapter.content}
                onChange={(e) => onUpdateChapter(activeChapter.id, e.target.value)}
                placeholder={`Start writing ${activeChapter.title}...`}
                style={{
                  width: '100%',
                  minHeight: '500px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#111827',
                  padding: '24px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            ) : (
              <div style={{
                padding: '24px',
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#111827',
                minHeight: '500px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {activeChapter.content || (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                    No content yet. Click the edit button to start writing.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Template View
  if (activeView === 'edit-template') {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          {/* Header */}
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Template Editor
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Modify the structure of your current project.
            </p>
          </div>

          {/* Template Chapters */}
          <div style={{ maxWidth: '800px', width: '100%' }}>
          {projectData.template.structure.map((chapter) => (
            <div key={chapter.chapter} style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '12px', 
              marginBottom: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Chapter {chapter.chapter}: {chapter.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingTemplate(chapter)}
                  style={{ 
                    color: '#3b82f6', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  Edit
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chapter.sections.map((section, idx) => (
                  <div key={idx} style={{ 
                    padding: '10px 12px', 
                    background: '#f9fafb', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#4b5563',
                    borderLeft: '3px solid #e5e7eb'
                  }}>
                    {section}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button style={{
            background: '#111827',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '16px',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#1f2937';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#111827';
            e.target.style.transform = 'translateY(0)';
          }}
          >Save Changes</button>
        </div>

          <EditTemplateModal
            chapter={editingTemplate}
            isOpen={!!editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSave={() => {
              // Handle save logic here
              console.log('Template changes saved');
            }}
          />
        </div>
      </div>
    );
  }

  // History View
  if (activeView === 'history') {
    const historyData = [
      { id: 1, chapter: 'Introduction to AI', tool: 'Full Generation', date: '2023-10-25 14:30', tokens: 15000, status: 'Completed' },
      { id: 2, chapter: 'Machine Learning Basics', tool: 'Content Edit', date: '2023-10-24 09:15', tokens: 500, status: 'Completed' },
      { id: 3, chapter: 'Data Processing', tool: 'Literature Search', date: '2023-10-23 16:45', tokens: 1200, status: 'Completed' },
      { id: 4, chapter: 'Model Training', tool: 'Grammar Check', date: '2023-10-22 11:20', tokens: 300, status: 'Completed' },
      { id: 5, chapter: 'Evaluation Metrics', tool: 'Citation Manager', date: '2023-10-20 10:00', tokens: 5000, status: 'Completed' },
    ];

    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Project History</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Track your chapter generation and token usage.</p>
          </div>

          {/* Usage Overview - Responsive Grid */}
          <div className="history-stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Chapters Generated</span>
              <span className="stat-value">24</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Images Added</span>
              <span className="stat-value">18</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tokens Spent</span>
              <span className="stat-value">22,000</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tokens Remaining</span>
              <span className="stat-value">478k</span>
            </div>
          </div>

          {/* Activity Log */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent Chapter Activities</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Chapter</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Last Action</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Tokens Used</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: index < historyData.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '500', color: '#111827' }}>{item.chapter}</td>
                      <td style={{ padding: '16px 24px', color: '#4b5563' }}>{item.tool}</td>
                      <td style={{ padding: '16px 24px', color: '#6b7280' }}>{item.date}</td>
                      <td style={{ padding: '16px 24px', color: '#6b7280' }}>{item.tokens.toLocaleString()}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          background: '#def7ec', 
                          color: '#03543f', 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          fontSize: '12px', 
                          fontWeight: '600' 
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Default)
  return (
    <div className="content-area">
      <div className="content-layout-wrapper">
        <div className="welcome-container">
          <img 
            src="/favicon.ico" 
            alt="W3 Writelab Logo" 
            className="welcome-logo" 
            style={{ width: 80, height: 80, marginBottom: 24, display: 'block', margin: '0 auto 24px' }} 
          />
          <h1 className="welcome-title">Welcome to W3 Writelab</h1>
          <p className="welcome-subtitle">Your AI-Powered Academic Writing Assistant</p>
          
          <div className="quick-actions-grid">
          <ActionCard 
            icon={<Icons.Search />} 
            title="Citation & References" 
            desc="Find relevant papers via Semantic Scholar." 
          />
          <ActionCard 
            icon={<Icons.Edit3 />} 
            title="Grammar Check" 
            desc="Advanced proofreading with LanguageTool." 
          />
          <ActionCard 
            icon={<Icons.FileText />} 
            title="Format Document" 
            desc="Convert to PDF/LaTeX using Pandoc." 
          />
          <ActionCard 
            icon={<Icons.PieChart />} 
            title="Data Analysis" 
            desc="Compute insights with Wolfram Alpha." 
          />
          <ActionCard 
            icon={<Icons.Shield />} 
            title="Plagiarism Check" 
            desc="Verify originality with Copyscape." 
          />
          <ActionCard 
            icon={<Icons.Code />} 
            title="Translate" 
            desc="Multi-language support via DeepL." 
          />
        </div>

        <div className="how-it-works-section" style={{ marginTop: '48px', textAlign: 'left', maxWidth: '100%' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>How W3 Writelab Empowers Your Research</h2>
          
          <div className="feature-explanation" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📚 Smart Citation Management
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              Never worry about formatting citations again. Our integration with <strong>Semantic Scholar</strong> allows you to search for academic papers directly within the workspace. We automatically generate citations in APA, MLA, Chicago, and IEEE formats, ensuring your bibliography is always perfect.
            </p>
          </div>

          <div className="feature-explanation" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✍️ Intelligent Writing Assistant
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              Beyond basic spell-check, <strong>LanguageTool</strong> analyzes your writing style, tone, and clarity. It provides real-time suggestions to improve sentence structure and academic vocabulary, making your arguments more persuasive and professional.
            </p>
          </div>

          <div className="feature-explanation" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Data-Driven Insights
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              Need to perform complex calculations or find statistical data? <strong>Wolfram Alpha</strong> is built right in. Generate charts, solve equations, and access curated knowledge without leaving your document.
            </p>
          </div>

          <div className="feature-explanation" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔄 Seamless Formatting & Export
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              With <strong>Pandoc</strong>, you can export your project to any format required by your institution. Whether you need a standard Word document, a clean PDF, or LaTeX for scientific publication, W3 Writelab handles the conversion flawlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function ActionCard({ icon, title, desc }) {
  return (
    <div className="action-card">
      <div className="action-icon-wrapper">
        {icon}
      </div>
      <span className="action-title">{title}</span>
      <span className="action-desc">{desc}</span>
    </div>
  );
}