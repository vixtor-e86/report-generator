'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import EditTemplateModal from '../modals/EditTemplateModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
};

export default function ContentArea({ 
  activeView, 
  projectData, 
  chapters, 
  onUpdateChapter,
  onUpdateTemplate,
  onVisualToolsClick,
  images = []
}) {
  // 1. ALL HOOKS AT TOP LEVEL
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [localContent, setLocalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState('editor');
  const [allProjectHistory, setAllHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 }); // Added missing state
  
  const textareaRef = useRef(null);

  // Sync local content when chapter changes
  const activeChapter = activeView.startsWith('chapter-') 
    ? chapters.find(ch => `chapter-${ch.id}` === activeView || `chapter-${ch.number}` === activeView)
    : null;

  // Track cursor position whenever it changes
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      setCursorPosition({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
    }
  };

  useEffect(() => {
    if (activeChapter) {
      setLocalContent(activeChapter.content || '');
    }
  }, [activeChapter?.id, activeChapter?.number]);

  // Fetch full project history for the History View
  useEffect(() => {
    if (activeView === 'history') {
      async function fetchAllHistory() {
        setLoadingHistory(true);
        const { data } = await supabase
          .from('premium_chapter_history')
          .select('*, premium_chapters(title, chapter_number)')
          .order('created_at', { ascending: false })
          .limit(20);
        
        const chapterIds = chapters.map(c => c.id);
        const projectHistory = data?.filter(h => chapterIds.includes(h.chapter_id)) || [];
        
        setAllHistory(projectHistory);
        setLoadingHistory(false);
      }
      fetchAllHistory();
    }
  }, [activeView, chapters]);

  // 2. LOGIC HANDLERS
  const handleSaveEdit = async () => {
    if (!activeChapter) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/premium/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapter.id,
          content: localContent,
          projectId: projectData.id,
          userId: projectData.user_id
        })
      });
      if (response.ok) {
        onUpdateChapter(activeChapter.id, localContent);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const insertImageTag = (img) => {
    const tag = `\n![${img.caption || img.original_name}](${img.file_url})\n`;
    const { start, end } = cursorPosition;
    
    // Insert at tracked cursor position
    const before = localContent.substring(0, start);
    const after = localContent.substring(end, localContent.length);
    const newText = before + tag + after;
    
    setLocalContent(newText);
    setShowImageSelector(false);
    
    // Maintain focus and set new cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + tag.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }
    }, 10);
  };

  const copyImageTag = (img) => {
    const tag = `![${img.caption || img.original_name}](${img.file_url})`;
    navigator.clipboard.writeText(tag);
    alert('Markdown tag copied!');
  };

  const handleSaveChapterTemplate = (updatedChapter) => {
    const currentStructure = projectData.template?.structure || { chapters: [] };
    const newChapters = currentStructure.chapters.map(ch => 
      (ch.chapter || ch.number) === (updatedChapter.chapter || updatedChapter.number) ? updatedChapter : ch
    );
    onUpdateTemplate({ ...currentStructure, chapters: newChapters });
  };

  // 3. VIEW RENDERING (NO HOOKS BELOW THIS)
  
  // History View
  if (activeView === 'history') {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Project History</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>View and restore previous AI-generated versions.</p>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent AI Generations</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Chapter</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Instructions</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allProjectHistory.length > 0 ? allProjectHistory.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: index < allProjectHistory.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '600', color: '#111827' }}>
                        Ch. {item.premium_chapters?.chapter_number}: {item.premium_chapters?.title}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#4b5563' }}>
                        <span style={{ fontSize: '12px', fontStyle: 'italic' }}>{item.prompt_used || 'Standard generation'}</span>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#6b7280' }}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => {
                            if (confirm(`Restore this version to ${item.premium_chapters?.title}?`)) {
                              onUpdateChapter(item.chapter_id, item.content);
                              alert('Version restored!');
                            }
                          }}
                          style={{ background: '#6366f1', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        {loadingHistory ? 'Loading history...' : 'No AI history found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Image Detail View
  const activeImage = activeView.startsWith('image-') ? images.find(img => `image-${img.id}` === activeView) : null;
  if (activeImage) {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          <div style={{ marginBottom: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>{activeImage.original_name}</h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Asset in {projectData.title}</p>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <img src={activeImage.file_url} alt={activeImage.original_name} style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Chapter Workspace View
  if (activeChapter) {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          <div style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>{activeChapter.title}</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '8px', display: 'inline-flex' }}>
                  <button onClick={() => setWorkspaceMode('editor')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: workspaceMode === 'editor' ? 'white' : 'transparent', color: workspaceMode === 'editor' ? '#111827' : '#6b7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}><Icons.Edit3 /> Editor</button>
                  <button onClick={() => setWorkspaceMode('preview')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: workspaceMode === 'preview' ? 'white' : 'transparent', color: workspaceMode === 'preview' ? '#111827' : '#6b7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}><Icons.Eye /> Preview</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => setShowImageSelector(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}><Icons.Image /> Insert Image</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#111827', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : <><Icons.Save /> Save Changes</>}</button>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', width: '100%', minHeight: '700px' }}>
            {workspaceMode === 'editor' ? (
              <textarea
                ref={textareaRef}
                className="chapter-editor"
                value={localContent}
                onChange={(e) => {
                  setLocalContent(e.target.value);
                  updateCursorPosition();
                }}
                onSelect={updateCursorPosition}
                onClick={updateCursorPosition}
                onKeyUp={updateCursorPosition}
                placeholder={`Write your ${activeChapter.title} here...`}
                style={{
                  width: '100%',
                  minHeight: '700px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#111827',
                  padding: '40px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            ) : (
              <div className="markdown-preview" style={{ padding: '60px', minHeight: '700px' }}>
                <style>{`
                  .markdown-preview { color: #1f2937; line-height: 1.8; font-family: 'Inter', system-ui, sans-serif; }
                  .markdown-preview h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem; }
                  .markdown-preview h2 { font-size: 1.8rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.2rem; color: #111827; }
                  .markdown-preview h3 { font-size: 1.4rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #374151; }
                  .markdown-preview p { margin-bottom: 1.5rem; text-align: justify; }
                  .markdown-preview img { display: block; max-width: 600px; height: auto; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
                  .markdown-preview table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
                  .markdown-preview th, .markdown-preview td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                  .markdown-preview th { background: #f9fafb; font-weight: 600; }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{localContent || '*No content yet.*'}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        {showImageSelector && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3 style={{ margin: 0 }}>Select Image to Insert</h3><button onClick={() => setShowImageSelector(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Icons.X /></button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', maxHeight: '500px', overflowY: 'auto', padding: '4px' }}>
                {images.length > 0 ? images.map(img => (
                  <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '100px' }}>
                      <img src={img.src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '8px', flex: 1 }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.caption || img.original_name}>
                        {img.caption || img.original_name}
                      </p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => insertImageTag(img)}
                          style={{ flex: 1, padding: '6px', fontSize: '10px', fontWeight: '700', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Use
                        </button>
                        <button 
                          onClick={() => copyImageTag(img)}
                          style={{ padding: '6px', fontSize: '10px', fontWeight: '700', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                          title="Copy Markdown Tag"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )) : <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af' }}>No project assets found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Template View
  if (activeView === 'edit-template') {
    return (
      <div className="content-area">
        <div className="content-layout-wrapper">
          <div style={{ marginBottom: '40px', width: '100%' }}><h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>Template Editor</h1><p style={{ fontSize: '16px', color: '#6b7280' }}>Modify the structure of your project.</p></div>
          <div style={{ maxWidth: '800px', width: '100%' }}>
            {projectData.template?.structure?.chapters?.map((chapter) => (
              <div key={chapter.chapter || chapter.number} style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div><h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Chapter {chapter.chapter || chapter.number}: {chapter.title}</h3></div>
                  <button onClick={() => setEditingTemplate(chapter)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chapter.sections.map((section, idx) => (<div key={idx} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', borderLeft: '3px solid #e5e7eb' }}>{section}</div>))}
                </div>
              </div>
            ))}
          </div>
          <EditTemplateModal chapter={editingTemplate} isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} onSave={handleSaveChapterTemplate} />
        </div>
      </div>
    );
  }

  // Dashboard View (Default)
  return (
    <div className="content-area">
      <div className="content-layout-wrapper">
        <div className="welcome-container">
          <img src="/premium_icon/favicon.ico" alt="Logo" style={{ width: 80, height: 80, display: 'block', margin: '0 auto 24px' }} />
          <h1 className="welcome-title">Welcome to W3 Writelab</h1>
          <p className="welcome-subtitle">Your AI-Powered Academic Writing Assistant</p>
          <div className="quick-actions-grid">
            <ActionCard icon={<Icons.Search />} title="Citation & References" desc="Find relevant papers via Semantic Scholar." />
            <ActionCard icon={<Icons.Edit3 />} title="Grammar Check" desc="Advanced proofreading with LanguageTool." />
            <ActionCard icon={<Icons.FileText />} title="Format Document" desc="Convert to PDF/LaTeX using Pandoc." />
            <ActionCard icon={<Icons.PieChart />} title="Data Analysis" desc="Compute insights with Wolfram Alpha." />
            <ActionCard icon={<Icons.Shield />} title="Plagiarism Check" desc="Verify originality with Copyscape." />
            <ActionCard icon={<Icons.Code />} title="Translate" desc="Multi-language support via DeepL." />
          </div>

          <div className="how-it-works-section" style={{ marginTop: '48px', textAlign: 'left', maxWidth: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>How W3 Writelab Empowers Your Research</h2>
            <div className="feature-explanation" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎨 AI-Powered Technical Visuals</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Visualize complex systems and concepts instantly. Our <strong>Diagram Studio</strong> uses AI to architect Mermaid.js flowcharts, while our <strong>Flux.1</strong> integration generates high-fidelity conceptual illustrations.</p>
            </div>
            <div className="feature-explanation" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>📚 Smart Citation Management</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Never worry about formatting citations again. Our integration with <strong>Semantic Scholar</strong> allows you to search for academic papers directly within the workspace and automatically generate citations.</p>
            </div>
            <div className="feature-explanation" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>✍️ Intelligent Writing Assistant</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Analyze your writing style, tone, and clarity with <strong>LanguageTool</strong>. It provides real-time suggestions to improve sentence structure and academic vocabulary.</p>
            </div>
            <div className="feature-explanation" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Data-Driven Insights</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Perform complex calculations or find statistical data with <strong>Wolfram Alpha</strong>. Generate charts, solve equations, and access curated knowledge effortlessly.</p>
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
      <div className="action-icon-wrapper">{icon}</div>
      <span className="action-title">{title}</span>
      <span className="action-desc">{desc}</span>
    </div>
  );
}
