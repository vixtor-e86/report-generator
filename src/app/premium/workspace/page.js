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
  const [projectStorageUsed, setProjectStorageUsed] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  // Modal States
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const { uploadFile, uploading, deleteFile, deleting } = useFileUpload(projectId);

  // Fetch Project & Assets on Load
  useEffect(() => {
    async function loadWorkspaceData() {
      if (!projectId) {
        console.warn('No project ID found in URL');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Project Details (including Template)
      const { data: project, error: pError } = await supabase
        .from('premium_projects')
        .select('*, custom_templates(*)')
        .eq('id', projectId)
        .single();
      
      if (pError || !project) {
        console.error('Project fetch error:', pError);
        // router.push('/dashboard');
        return;
      }

      setProjectData({
        ...project,
        template: project.custom_templates // Map the joined template data
      });
      
      // Fetch User Profile for Storage Usage & Info
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserProfile(profile);
      setProjectStorageUsed(project.storage_used || 0);

      // Initialize chapters from template structure
      if (project.custom_templates?.structure?.chapters) {
        setChapters(project.custom_templates.structure.chapters.map(ch => ({
          id: ch.number,
          title: ch.title,
          content: '' 
        })));
      }

      // 2. Fetch Project Assets
      const { data: assets, error: aError } = await supabase
        .from('premium_assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!aError && assets) {
        const loadedImages = assets.filter(a => a.file_type.startsWith('image/'));
        const loadedProjectDocs = assets.filter(a => a.purpose === 'project_component');
        const loadedResearchFiles = assets.filter(a => !a.file_type.startsWith('image/') && a.purpose !== 'project_component');
        
        const process = (items) => items.map(a => ({ ...a, src: a.file_url, name: a.original_name }));

        setImages(process(loadedImages));
        setProjectDocs(process(loadedProjectDocs));
        setFiles(process(loadedResearchFiles));
      }
    }

    loadWorkspaceData();
    
    // Open tools panel by default on desktop
    if (window.innerWidth >= 1024) {
      setIsRightSidebarOpen(true);
    }
  }, [projectId]); // Depend on projectId

  const handleUpload = async (file, purpose = 'general') => {
    const asset = await uploadFile(file, purpose);
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
        .update({ 
          structure: newStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;

      // Update local state
      setProjectData(prev => ({
        ...prev,
        template: {
          ...prev.template,
          structure: newStructure
        }
      }));

      // Refresh chapters list in sidebar
      if (newStructure.chapters) {
        setChapters(newStructure.chapters.map(ch => ({
          id: ch.number || ch.chapter,
          title: ch.title,
          content: chapters.find(existing => (existing.id === (ch.number || ch.chapter)))?.content || ''
        })));
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
        onUpload={(file, purpose) => handleUpload(file, purpose || 'project_image')}
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
          onGenerate={() => setIsGenerationModalOpen(true)}
        />

        <div className="workspace-content">
          <ContentArea
            activeView={activeView}
            projectData={projectData}
            chapters={chapters}
            images={images}
            onUpdateChapter={(chapterId, content) => {
              setChapters(chapters.map(ch => 
                ch.id === chapterId ? { ...ch, content } : ch
              ));
            }}
            onUpdateTemplate={handleUpdateTemplate}
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

      <GenerationModal 
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        uploadedImages={images}
        researchPapers={files} 
      />
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