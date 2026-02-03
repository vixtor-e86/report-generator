'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/premium/workspace/Sidebar';
import TopToolbar from '@/components/premium/workspace/TopToolbar';
import RightSidebar from '@/components/premium/workspace/RightSidebar';
import ContentArea from '@/components/premium/workspace/ContentArea';
import '@/styles/workspace.css';

export default function Workspace() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [chapters, setChapters] = useState([
    { id: 1, title: 'Chapter 1', content: '' },
    { id: 2, title: 'Chapter 2', content: '' },
    { id: 3, title: 'Chapter 3', content: '' },
    { id: 4, title: 'Chapter 4', content: '' },
    { id: 5, title: 'Chapter 5', content: '' },
  ]);
  const [images, setImages] = useState([]);

  // Open tools panel by default only on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsRightSidebarOpen(true);
    }
  }, []);
  
  // Mock project data (replace with real data from previous pages)
  const projectData = {
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

  const handleGenerate = () => {
    console.log('Generate content for:', activeView);
    // TODO: API call to generate content
  };

  const handleRegenerate = () => {
    console.log('Regenerate content for:', activeView);
    // TODO: API call to regenerate content
  };

  const handleEdit = () => {
    console.log('Toggle edit mode');
    // TODO: Toggle edit mode
  };

  const handleAddImage = (imageFile) => {
    const newImage = {
      id: Date.now(),
      name: imageFile.name,
      url: URL.createObjectURL(imageFile),
      addedAt: new Date().toISOString()
    };
    setImages([...images, newImage]);
  };

  const handleRemoveImage = (imageId) => {
    setImages(images.filter(img => img.id !== imageId));
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
          setIsLeftSidebarOpen(false); // Close sidebar on mobile when nav item clicked
        }}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

      <div className="main-workspace">
        <TopToolbar
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
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
                <RightSidebar onClose={() => setIsRightSidebarOpen(false)} />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}