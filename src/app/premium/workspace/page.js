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
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingText, setGlobalLoadingText] = useState('Processing...');
  const [workspaceMode, setWorkspaceMode] = useState('editor');
  const [previewFile, setPreviewFile] = useState(null);

  const { uploadFile, uploading, deleteFile, deleting } = useFileUpload(projectId);

  const handleGenerateClick = () => {
    if (activeChapter?.content) {
      setIsModifyModalOpen(true);
    } else {
      setIsGenerationModalOpen(true);
    }
  };

  const handlePrint = () => {
    if (!activeChapter?.content) return;
    setWorkspaceMode('preview');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Fetch Project & Assets on Load
  const loadWorkspaceData = async () => {
    if (!projectId) {
      console.warn('No project ID found in URL');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    const { data: project, error: pError } = await supabase
      .from('premium_projects')
      .select('*, custom_templates(*)')
      .eq('id', projectId)
      .single();
    
    if (pError || !project) {
      console.error('Project fetch error:', pError);
      return;
    }

    setProjectData({
      ...project,
      template: project.custom_templates
    });
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) setUserProfile(profile);
    setProjectStorageUsed(project.storage_used || 0);

    const { data: chapterContent } = await supabase
      .from('premium_chapters')
      .select('*')
      .eq('project_id', projectId);

    if (project.custom_templates?.structure?.chapters) {
      setChapters(project.custom_templates.structure.chapters.map(ch => {
        const chNum = ch.number || ch.chapter;
        const existing = chapterContent?.find(cc => cc.chapter_number === chNum);
        return {
          id: existing?.id || chNum,
          number: chNum,
          title: ch.title,
          content: existing?.content || '' 
        };
      }));
    }

    const { data: assets } = await supabase
      .from('premium_assets')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (assets) {
      const loadedImages = assets.filter(a => a.file_type.startsWith('image/'));
      const loadedProjectDocs = assets.filter(a => a.purpose === 'project_component');
      const loadedResearchFiles = assets.filter(a => !a.file_type.startsWith('image/') && a.purpose !== 'project_component');
      
      const process = (items) => items.map(a => ({ ...a, src: a.file_url, name: a.original_name }));

      setImages(process(loadedImages));
      setProjectDocs(process(loadedProjectDocs));
      setFiles(process(loadedResearchFiles));
    }

    const { data: papers } = await supabase
      .from('premium_research_papers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (papers) setResearchPapers(papers);
  };

  useEffect(() => {
    loadWorkspaceData();
    if (window.innerWidth >= 1024) setIsRightSidebarOpen(true);

    const channel = supabase
      .channel(`premium-project-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'premium_projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          setProjectData(prev => ({
            ...prev,
            ...payload.new
          }));
          setProjectStorageUsed(payload.new.storage_used || 0);
        }
      )
      .subscribe();

    const chaptersChannel = supabase
      .channel(`premium-chapters-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_chapters',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          setChapters(prev => prev.map(ch => {
            if (ch.number === payload.new.chapter_number) {
              return {
                ...ch,
                id: payload.new.id,
                content: payload.new.content,
                status: payload.new.status
              };
            }
            return ch;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(chaptersChannel);
    };
  }, [projectId]);

  const handleUpload = async (file, purpose = 'general', folder = null, caption = null) => {
    const asset = await uploadFile(file, purpose, folder, caption);
    if (asset) {
      setProjectStorageUsed(prev => prev + (asset.size_bytes || 0));
      const processedAsset = { ...asset, src: asset.file_url, name: asset.original_name };
      if (asset.file_type.startsWith('image/')) {
        setImages(prev => [processedAsset, ...prev]);
      } else if (purpose === 'project_component') {
        setProjectDocs(prev => [processedAsset, ...prev]);
      } else {
        setFiles(prev => [processedAsset, ...prev]);
      }
    }
  };

  const handleDelete = async (file) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    const success = await deleteFile(file.file_key, file.id);
    if (success) {
      setProjectStorageUsed(prev => Math.max(0, prev - (file.size_bytes || 0)));
      if (file.file_type.startsWith('image/')) {
        setImages(prev => prev.filter(img => img.id !== file.id));
      } else if (file.purpose === 'project_component') {
        setProjectDocs(prev => prev.filter(f => f.id !== file.id));
      } else {
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }
    }
  };

  const handleUpdateTemplate = async (newStructure) => {
    try {
      const templateId = projectData.template?.id;
      if (!templateId) throw new Error('No template linked to this project');
      const { error } = await supabase
        .from('custom_templates')
        .update({ structure: newStructure, updated_at: new Date().toISOString() })
        .eq('id', templateId);
      if (error) throw error;
      setProjectData(prev => ({
        ...prev,
        template: { ...prev.template, structure: newStructure }
      }));
      if (newStructure.chapters) {
        setChapters(prevChapters => newStructure.chapters.map(ch => {
          const chNum = ch.number || ch.chapter;
          const existing = prevChapters.find(p => p.number === chNum);
          return {
            id: existing?.id || chNum,
            number: chNum,
            title: ch.title,
            content: existing?.content || ''
          };
        }));
      }
      alert('Template updated successfully!');
    } catch (err) {
      console.error('Error updating template:', err);
      alert('Failed to update template: ' + err.message);
    }
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const activeChapter = activeView.startsWith('chapter-') 
    ? chapters.find(ch => `chapter-${ch.id}` === activeView || `chapter-${ch.number}` === activeView)
    : null;

  return (
    <div className="workspace">
      <Sidebar
        projectData={projectData}
        chapters={chapters}
        images={images}
        projectDocs={projectDocs}
        userProfile={userProfile}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setIsLeftSidebarOpen(false);
        }}
        onUpload={handleUpload}
        uploading={uploading}
        onDelete={handleDelete}
        deleting={deleting}
        onFileClick={setPreviewFile}
        onError={handleError}
        storageUsed={projectStorageUsed}
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

      <div className="main-workspace">
        <TopToolbar
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onGenerate={handleGenerateClick}
          onPrint={handlePrint}
          activeChapter={activeChapter}
        />

        <div className="workspace-content">
          <ContentArea
            activeView={activeView}
            projectData={projectData}
            chapters={chapters}
            onUpdateChapter={(chapterId, content) => {
              setChapters(chapters.map(ch => 
                ch.id === chapterId ? { ...ch, content } : ch
              ));
            }}
            onUpdateTemplate={handleUpdateTemplate}
            onVisualToolsClick={() => setIsVisualToolsModalOpen(true)}
            images={images}
            workspaceMode={workspaceMode}
            setWorkspaceMode={setWorkspaceMode}
          />

          <AnimatePresence>
            {isRightSidebarOpen && (
              <>
                <motion.div 
                  className="sidebar-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsRightSidebarOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 40,
                    display: 'none'
                  }}
                />
                <RightSidebar 
                  onClose={() => setIsRightSidebarOpen(false)} 
                  files={files}
                  onUpload={(file) => handleUpload(file, 'sidebar_upload')}
                  uploading={uploading}
                  onDelete={handleDelete}
                  deleting={deleting}
                  onFileClick={setPreviewFile}
                  onError={handleError}
                  onSearchClick={() => setIsSearchModalOpen(true)}
                  onVisualToolsClick={() => setIsVisualToolsModalOpen(true)}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        message={errorMessage} 
      />
      
      <FilePreviewModal 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
        file={previewFile} 
      />

      <ResearchSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        projectId={projectId}
        onPaperSaved={loadWorkspaceData}
      />

      <VisualToolsModal
        isOpen={isVisualToolsModalOpen}
        onClose={() => setIsVisualToolsModalOpen(false)}
        projectId={projectId}
        userId={currentUser?.id || userProfile?.id}
        onImageSaved={loadWorkspaceData}
      />

      <ModifyModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        activeChapter={activeChapter}
        projectId={projectId}
        userId={currentUser?.id || userProfile?.id}
        onGenerateSuccess={loadWorkspaceData}
        setIsGlobalLoading={setIsGlobalLoading}
        setGlobalLoadingText={setGlobalLoadingText}
      />

      <GenerationModal 
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        uploadedImages={images}
        researchPapers={[...files, ...researchPapers]}
        activeChapter={activeChapter}
        projectId={projectId}
        userId={currentUser?.id || userProfile?.id}
        projectData={projectData}
        onGenerateSuccess={() => {
          loadWorkspaceData(); // Refresh chapters/history
          setIsGenerationModalOpen(false);
        }}
        setIsGlobalLoading={setIsGlobalLoading}
        setGlobalLoadingText={setGlobalLoadingText}
      />

      <LoadingModal 
        isOpen={isGlobalLoading} 
        loadingText={globalLoadingText} 
      />

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          /* Reset for multi-page support */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide UI elements */
          body * {
            visibility: hidden;
          }

          /* Show the specific print area */
          .premium-print-area, .premium-print-area * {
            visibility: visible;
          }

          /* Ensure parents don't clip content */
          .workspace, 
          .main-workspace, 
          .workspace-content, 
          .content-area, 
          .content-layout-wrapper {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            width: 100% !important;
          }

          /* Reset positioning for the content specifically */
          .premium-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }

          /* Professional typography for print */
          .premium-print-area p {
            orphans: 3;
            widows: 3;
          }

          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 20px auto !important;
            page-break-inside: avoid;
          }

          h1, h2, h3 { 
            page-break-after: avoid; 
            color: black !important;
          }
          
          p, li { 
            page-break-inside: auto; 
          }
        }
      `}</style>
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
