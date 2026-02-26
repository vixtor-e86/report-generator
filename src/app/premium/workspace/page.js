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

import ErrorModal from '@/components/premium/modals/ErrorModal';
import FilePreviewModal from '@/components/premium/modals/FilePreviewModal';
import GenerationModal from '@/components/premium/modals/GenerationModal';
import ResearchSearchModal from '@/components/premium/modals/ResearchSearchModal';
import VisualToolsModal from '@/components/premium/modals/VisualToolsModal';
import ModifyModal from '@/components/premium/modals/ModifyModal';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import PresentationModal from '@/components/premium/modals/PresentationModal';
import HumanizerModal from '@/components/premium/modals/HumanizerModal';
import ExportModal from '@/components/premium/modals/ExportModal';

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

  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [projectDocs, setProjectDocs] = useState([]);
  const [researchPapers, setResearchPapers] = useState([]);
  const [projectStorageUsed, setProjectStorageUsed] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal States
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isVisualToolsModalOpen, setIsVisualToolsModalOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [isHumanizerModalOpen, setIsHumanizerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const handleExportClick = (type) => {
    setExportType(type);
    setIsExportModalOpen(true);
  };
  const [globalLoadingText, setGlobalLoadingText] = useState('Processing...');
  const [workspaceMode, setWorkspaceMode] = useState('editor');
  const [previewFile, setPreviewFile] = useState(null);

  const { uploadFile, uploading, deleteFile, deleting } = useFileUpload(projectId);

  const loadWorkspaceData = async () => {
    if (!projectId) return;
    
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
    if (!confirm('Delete this file?')) return;
    if (await deleteFile(file.file_key, file.id)) loadWorkspaceData();
  };

  return (
    <div className="workspace">
      <Sidebar
        projectData={projectData} chapters={chapters} images={images} projectDocs={projectDocs} userProfile={userProfile}
        activeView={activeView} onViewChange={setActiveView} onUpload={handleUpload} uploading={uploading}
        onDelete={handleDelete} deleting={deleting} onFileClick={setPreviewFile} onError={(m) => { setErrorMessage(m); setIsErrorModalOpen(true); }}
        storageUsed={projectStorageUsed} isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)}
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
            onUpdateChapter={(id, content) => setChapters(chapters.map(ch => ch.id === id ? { ...ch, content } : ch))}
            onUpdateTemplate={async (ns) => {
              const { error } = await supabase.from('custom_templates').update({ structure: ns }).eq('id', projectData.template?.id);
              if (!error) loadWorkspaceData();
            }}
            onVisualToolsClick={() => setIsVisualToolsModalOpen(true)}
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

      <ErrorModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} message={errorMessage} />
      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
      <ResearchSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} projectId={projectId} onPaperSaved={loadWorkspaceData} />
      <VisualToolsModal isOpen={isVisualToolsModalOpen} onClose={() => setIsVisualToolsModalOpen(false)} projectId={projectId} userId={currentUser?.id} onImageSaved={loadWorkspaceData} />
      <PresentationModal isOpen={isPresentationModalOpen} onClose={() => setIsPresentationModalOpen(false)} chapters={chapters} projectId={projectId} userId={currentUser?.id} setIsGlobalLoading={setIsGlobalLoading} setGlobalLoadingText={setGlobalLoadingText} />
      <HumanizerModal 
        isOpen={isHumanizerModalOpen} 
        onClose={() => setIsHumanizerModalOpen(false)} 
        chapters={chapters} 
        projectId={projectId}
        userId={currentUser?.id} 
        setIsGlobalLoading={setIsGlobalLoading} 
        setGlobalLoadingText={setGlobalLoadingText} 
        onSaved={loadWorkspaceData} 
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type={exportType}
        projectDocs={projectDocs}
        chapters={chapters}
        projectId={projectId}
        userId={currentUser?.id}
        setIsGlobalLoading={setIsGlobalLoading}
        setGlobalLoadingText={setGlobalLoadingText}
        onSaved={loadWorkspaceData}
      />
      <ModifyModal isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} activeChapter={activeChapter} projectId={projectId} userId={currentUser?.id} onGenerateSuccess={loadWorkspaceData} setIsGlobalLoading={setIsGlobalLoading} setGlobalLoadingText={setGlobalLoadingText} />
      <GenerationModal isOpen={isGenerationModalOpen} onClose={() => setIsGenerationModalOpen(false)} uploadedImages={images} researchPapers={[...files, ...researchPapers]} activeChapter={activeChapter} projectId={projectId} userId={currentUser?.id} projectData={projectData} onGenerateSuccess={loadWorkspaceData} setIsGlobalLoading={setIsGlobalLoading} setGlobalLoadingText={setGlobalLoadingText} />
      <LoadingModal isOpen={isGlobalLoading} loadingText={globalLoadingText} />
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
