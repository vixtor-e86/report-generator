// src/app/premium/workspace/page.js
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useFileUpload } from '@/hooks/useFileUpload';

import Sidebar from '@/components/premium/workspace/Sidebar';
import TopToolbar from '@/components/premium/workspace/TopToolbar';
import RightSidebar from '@/components/premium/workspace/RightSidebar';
import ContentArea from '@/components/premium/workspace/ContentArea';

import FilePreviewModal from '@/components/premium/modals/FilePreviewModal';
import GenerationModal from '@/components/premium/modals/GenerationModal';
import ResearchSearchModal from '@/components/premium/modals/ResearchSearchModal';
import VisualToolsModal from '@/components/premium/modals/VisualToolsModal';
import ModifyModal from '@/components/premium/modals/ModifyModal';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import PresentationModal from '@/components/premium/modals/PresentationModal';
import HumanizerModal from '@/components/premium/modals/HumanizerModal';
import ExportModal from '@/components/premium/modals/ExportModal';
import CustomModal from '@/components/premium/modals/CustomModal';
import StructureConfirmationModal from '@/components/premium/modals/StructureConfirmationModal';
import TourGuide from '@/components/premium/workspace/TourGuide';

import '@/styles/workspace.css';

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');

  const [activeView, setActiveView] = useState('dashboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  
  // Data State
  const [projectData, setProjectData] = useState({
    id: projectId,
    title: 'Loading Project...',
    isPremium: true,
    template: { structure: { chapters: [] } }
  });

  const [humanizerLimit, setHumanizerLimit] = useState(0); // NEW: Derived from .env
  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [projectDocs, setProjectDocs] = useState([]);
  const [researchPapers, setResearchPapers] = useState([]);
  const [projectStorageUsed, setProjectStorageUsed] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal States
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isVisualToolsModalOpen, setIsVisualToolsModalOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [isHumanizerModalOpen, setIsHumanizerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [pendingGenData, setPendingGenData] = useState(null);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const handleFinalGenerate = async () => {
    if (!activeChapter || !pendingGenData) return;
    setIsStructureModalOpen(false);
    setIsGenerationModalOpen(false);
    
    try {
      setGlobalLoadingText(`System Architect is designing Chapter ${activeChapter.number || activeChapter.id}...`);
      setIsGlobalLoading(true);

      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId, 
          userId: currentUser?.id, 
          chapterNumber: activeChapter.number || activeChapter.id, 
          chapterTitle: activeChapter?.title,
          ...pendingGenData,
          referenceStyle: stickyGenSettings.referenceStyle,
          maxReferences: stickyGenSettings.maxReferences,
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }
      
      loadWorkspaceData();
      showNotification('Success', `Chapter ${activeChapter.number || activeChapter.id} generated successfully!`, 'success');
    } catch (error) { 
      showNotification('Generation Error', error.message, 'error');
    } finally { 
      setIsGlobalLoading(false); 
      setPendingGenData(null);
    }
  };

  const showNotification = (title, message, type = 'info', onConfirm = null) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

  const handleExportClick = (type) => {
    setExportType(type);
    setIsExportModalOpen(true);
  };
  const [globalLoadingText, setGlobalLoadingText] = useState('Processing...');
  const [workspaceMode, setWorkspaceMode] = useState('editor');
  const [previewFile, setPreviewFile] = useState(null);

  const [stickyGenSettings, setStickyGenSettings] = useState({
    projectTitle: '', projectDescription: '', componentsUsed: '', researchBooks: '', userPrompt: '',
    selectedImages: [], selectedPapers: [], selectedContextFiles: [], referenceStyle: 'APA', maxReferences: 10, skipReferences: false, targetWordCount: 2000 
  });

  const { uploadFile, uploading, deleteFile, deleting } = useFileUpload(projectId);

  const loadWorkspaceData = async () => {
    if (!projectId) return;
    
    // Fetch App Config (Limit from .env)
    try {
      const configRes = await fetch('/api/premium/config');
      const config = await configRes.json();
      if (config.humanizerLimit) setHumanizerLimit(config.humanizerLimit);
    } catch (err) { console.error('Config fetch failed'); }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    const { data: project, error: pError } = await supabase
      .from('premium_projects')
      .select('*, custom_templates(*)')
      .eq('id', projectId)
      .single();
    
    if (pError || !project) return;

    setProjectData({ ...project, template: project.custom_templates });
    
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (profile) setUserProfile(profile);
    setProjectStorageUsed(project.storage_used || 0);

    const { data: chapterContent } = await supabase.from('premium_chapters').select('*').eq('project_id', projectId);

    if (project.custom_templates?.structure?.chapters) {
      setChapters(project.custom_templates.structure.chapters.map(ch => {
        const chNum = ch.number || ch.chapter;
        const existing = chapterContent?.find(cc => cc.chapter_number === chNum);
        return { id: existing?.id || chNum, number: chNum, title: ch.title, content: existing?.content || '' };
      }));
    }

    const { data: assets } = await supabase.from('premium_assets').select('*').eq('user_id', user.id).eq('project_id', projectId).order('created_at', { ascending: false });

    if (assets) {
      const process = (items) => items.map(a => ({ ...a, src: a.file_url, name: a.original_name }));
      setImages(process(assets.filter(a => a.file_type.startsWith('image/'))));
      setProjectDocs(process(assets.filter(a => a.purpose === 'project_component')));
      setFiles(process(assets.filter(a => !a.file_type.startsWith('image/') && a.purpose !== 'project_component')));
    }

    const { data: papers } = await supabase.from('premium_research_papers').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (papers) setResearchPapers(papers);
  };

  useEffect(() => {
    loadWorkspaceData();
    if (window.innerWidth >= 1024) setIsRightSidebarOpen(true);

    const channel = supabase.channel(`premium-updates-${projectId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'premium_projects', filter: `id=eq.${projectId}` }, (p) => {
      setProjectData(prev => ({ ...prev, ...p.new }));
      setProjectStorageUsed(p.new.storage_used || 0);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const activeChapter = activeView.startsWith('chapter-') 
    ? chapters.find(ch => `chapter-${ch.id}` === activeView || `chapter-${ch.number}` === activeView)
    : null;

  const handleUpload = async (file, purpose, folder, caption) => {
    const asset = await uploadFile(file, purpose, folder, caption);
    if (asset) loadWorkspaceData();
  };

  const handleDelete = async (file) => {
    showNotification('Confirm Deletion', `Delete "${file.original_name || file.name}"?`, 'confirm', async () => {
      if (await deleteFile(file.file_key, file.id)) loadWorkspaceData();
    });
  };

  return (
    <div className="workspace">
      <Sidebar
        projectData={projectData} chapters={chapters} images={images} projectDocs={projectDocs} userProfile={userProfile}
        activeView={activeView} onViewChange={setActiveView} onUpload={handleUpload} uploading={uploading}
        onDelete={handleDelete} deleting={deleting} onFileClick={setPreviewFile} 
        onError={(m) => showNotification('Upload Error', m, 'error')}
        storageUsed={projectStorageUsed} isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
        humanizerLimit={humanizerLimit}
      />

      <div className="main-workspace">
        <TopToolbar
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)} isRightSidebarOpen={isRightSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} onGenerate={() => activeChapter?.content ? setIsModifyModalOpen(true) : setIsGenerationModalOpen(true)}
          onPrint={() => { setWorkspaceMode('preview'); setTimeout(() => window.print(), 500); }} activeChapter={activeChapter}
          onExportClick={handleExportClick}
        />

        <div className="workspace-content">
          <ContentArea
            activeView={activeView} projectData={projectData} chapters={chapters} images={images} workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode}
            userProfile={userProfile} onUpdateChapter={(id, content) => setChapters(chapters.map(ch => ch.id === id ? { ...ch, content } : ch))}
            onUpdateTemplate={async (ns) => {
              const { error } = await supabase.from('custom_templates').update({ structure: ns }).eq('id', projectData.template?.id);
              if (!error) loadWorkspaceData();
            }}
            onVisualToolsClick={() => setIsVisualToolsModalOpen(true)} showNotification={showNotification}
          />

          <AnimatePresence>
            {isRightSidebarOpen && (
              <RightSidebar 
                onClose={() => setIsRightSidebarOpen(false)} files={files} onUpload={(f) => handleUpload(f, 'sidebar')}
                uploading={uploading} onDelete={handleDelete} deleting={deleting} onFileClick={setPreviewFile}
                onSearchClick={() => setIsSearchModalOpen(true)} onVisualToolsClick={() => setIsVisualToolsModalOpen(true)}
                onPresentationClick={() => setIsPresentationModalOpen(true)} onHumanizerClick={() => setIsHumanizerModalOpen(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
      <ResearchSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} projectId={projectId} onPaperSaved={loadWorkspaceData} showNotification={showNotification} />
      <VisualToolsModal isOpen={isVisualToolsModalOpen} onClose={() => setIsVisualToolsModalOpen(false)} projectId={projectId} userId={currentUser?.id} onImageSaved={loadWorkspaceData} showNotification={showNotification} />
      <PresentationModal 
        isOpen={isPresentationModalOpen} 
        onClose={() => setIsPresentationModalOpen(false)} 
        chapters={chapters} 
        projectId={projectId} 
        userId={currentUser?.id} 
        setIsGlobalLoading={setIsGlobalLoading} 
        setGlobalLoadingText={setGlobalLoadingText} 
        showNotification={showNotification}
        images={images}
      />
      
      <HumanizerModal 
        isOpen={isHumanizerModalOpen} 
        onClose={() => setIsHumanizerModalOpen(false)} 
        chapters={chapters} projectId={projectId} userId={currentUser?.id} projectData={projectData}
        setIsGlobalLoading={setIsGlobalLoading} setGlobalLoadingText={setGlobalLoadingText} 
        onSaved={loadWorkspaceData} showNotification={showNotification}
        humanizerLimit={humanizerLimit}
        onUpdateProjectData={(updates) => setProjectData(prev => ({ ...prev, ...updates }))}
      />

      <ExportModal
        isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} type={exportType} projectDocs={projectDocs}
        chapters={chapters} projectId={projectId} userId={currentUser?.id} setIsGlobalLoading={setIsGlobalLoading} 
        setGlobalLoadingText={setGlobalLoadingText} onSaved={loadWorkspaceData} showNotification={showNotification}
      />
      <ModifyModal isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} activeChapter={activeChapter} projectId={projectId} userId={currentUser?.id} onGenerateSuccess={loadWorkspaceData} setIsGlobalLoading={setIsGlobalLoading} setGlobalLoadingText={setGlobalLoadingText} showNotification={showNotification} />
      <GenerationModal 
        isOpen={isGenerationModalOpen} onClose={() => setIsGenerationModalOpen(false)} 
        uploadedImages={images} researchPapers={researchPapers} dataFiles={files} 
        activeChapter={activeChapter} projectId={projectId} userId={currentUser?.id} 
        projectData={projectData} onGenerateSuccess={loadWorkspaceData} setIsGlobalLoading={setIsGlobalLoading} 
        setGlobalLoadingText={setGlobalLoadingText} formData={stickyGenSettings} setFormData={setStickyGenSettings} showNotification={showNotification}
        onGenerateClick={(data) => {
          setPendingGenData(data);
          setIsStructureModalOpen(true);
        }}
      />
      <StructureConfirmationModal 
        isOpen={isStructureModalOpen} 
        onClose={() => setIsStructureModalOpen(false)} 
        projectData={projectData} 
        activeChapter={activeChapter} 
        onConfirm={handleFinalGenerate} 
        onEditTemplate={() => {
          setIsStructureModalOpen(false);
          setIsGenerationModalOpen(false);
          setActiveView('edit-template');
        }}
      />
      <LoadingModal isOpen={isGlobalLoading} loadingText={globalLoadingText} />
      <CustomModal 
        isOpen={notification.isOpen} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title} message={notification.message} type={notification.type} onConfirm={notification.onConfirm}
      />
      <TourGuide projectId={projectId} onComplete={() => setShowTutorial(true)} />

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 relative border border-slate-100">
            <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.197-3L10 9v6z"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Technical Walkthrough</h3>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium">
              Ready to generate an elite project? Watch this quick guide to see how to use the System Architect effectively.
            </p>

            <a 
              href="https://youtube.com/shorts/k1OWL9BlB74" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative block aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl border-4 border-slate-50 transition-all hover:ring-4 hover:ring-red-100 mb-8 group"
            >
              <img 
                src="https://img.youtube.com/vi/k1OWL9BlB74/maxresdefault.jpg" 
                alt="Tutorial Preview" 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 shadow-red-200">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </a>
            
            <button 
              onClick={() => setShowTutorial(false)}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
            >
              Start Generating!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Workspace() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
