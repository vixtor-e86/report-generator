'use client';

import { useState, useEffect } from 'react';
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

export default function Workspace() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  
  // Data State
  const [chapters, setChapters] = useState([
    { id: 1, title: 'Chapter 1', content: '' },
    { id: 2, title: 'Chapter 2', content: '' },
    { id: 3, title: 'Chapter 3', content: '' },
    { id: 4, title: 'Chapter 4', content: '' },
    { id: 5, title: 'Chapter 5', content: '' },
  ]);
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);

  // Modal States
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Mock project data (replace with real data later)
  const projectData = {
    id: 'mock-project-123',
    title: 'AI-Powered Academic Writing Assistant',
    isPremium: true,
    faculty: 'Engineering',
    department: 'Computer Science',
    template: {
      type: '5-chapter',
      structure: [
        { chapter: 1, title: 'Introduction', sections: ['1.1 Background', '1.2 Problem Statement', '1.3 Objectives'] },
        { chapter: 2, title: 'Literature Review', sections: ['2.1 Overview', '2.2 Related Work'] },
        { chapter: 3, title: 'Methodology', sections: ['3.1 Research Design', '3.2 Data Collection'] },
        { chapter: 4, title: 'Results', sections: ['4.1 Findings', '4.2 Analysis'] },
        { chapter: 5, title: 'Conclusion', sections: ['5.1 Summary', '5.2 Recommendations'] },
      ]
    }
  };

  const { uploadFile, uploading } = useFileUpload(projectData.id);

  // Fetch Assets on Load
  useEffect(() => {
    async function fetchAssets() {
      if (!projectData.id) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('premium_assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectData.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Split into images and files
        const loadedImages = data.filter(asset => asset.file_type.startsWith('image/'));
        const loadedFiles = data.filter(asset => !asset.file_type.startsWith('image/'));
        
        // Map to format expected by components if needed (currently looks compatible)
        // Ensure 'src' property exists for images if used by legacy components, 
        // though we updated Sidebar to use asset properties directly.
        // Let's add 'src' alias to file_url just in case.
        const processAssets = (assets) => assets.map(a => ({ ...a, src: a.file_url, name: a.original_name }));

        setImages(processAssets(loadedImages));
        setFiles(processAssets(loadedFiles));
      }
    }

    fetchAssets();
    
    // Open tools panel by default on desktop
    if (window.innerWidth >= 1024) {
      setIsRightSidebarOpen(true);
    }
  }, []); // Run once on mount

  const handleUpload = async (file, purpose = 'general') => {
    const asset = await uploadFile(file, purpose);
    if (asset) {
      const processedAsset = { ...asset, src: asset.file_url, name: asset.original_name };
      if (asset.file_type.startsWith('image/')) {
        setImages(prev => [processedAsset, ...prev]);
      } else {
        setFiles(prev => [processedAsset, ...prev]);
      }
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
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setIsLeftSidebarOpen(false);
        }}
        onUpload={(file) => handleUpload(file, 'project_image')}
        uploading={uploading}
        onError={handleError}
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
        researchPapers={files} // Passing uploaded files as research context
      />
    </div>
  );
}
