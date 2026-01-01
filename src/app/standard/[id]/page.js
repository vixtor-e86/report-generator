"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/standard/Sidebar';
import TopBar from '@/components/standard/TopBar';
import ChapterView from '@/components/standard/ChapterView';
import ChapterEdit from '@/components/standard/ChapterEdit';
import ModifyModal from '@/components/standard/ModifyModal';
import PreviewModal from '@/components/standard/PreviewModal'; // ✅ NEW
import SuggestionsModal from '@/components/standard/SuggestionsModal';
import FeedbackWidget from '@/components/FeedbackWidget';// ✅ NEW

export default function StandardWorkspace({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // ✅ NEW
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false); // ✅ NEW
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load workspace data
  useEffect(() => {
    async function loadWorkspace() {
      try {
        // Check authentication
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          router.push('/');
          return;
        }

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('standard_projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError || !projectData) {
          console.error('Project error:', projectError);
          alert('Project not found');
          router.push('/dashboard');
          return;
        }

        // Verify ownership
        if (projectData.user_id !== currentUser.id) {
          alert('You do not have access to this project');
          router.push('/dashboard');
          return;
        }

        // Check access expiration
        const expiresAt = new Date(projectData.access_expires_at);
        const now = new Date();
        if (now > expiresAt) {
          alert('Your 30-day access to this project has expired');
          router.push('/dashboard');
          return;
        }

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('standard_chapters')
          .select('*')
          .eq('project_id', projectId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) {
          console.error('Chapters error:', chaptersError);
        }

        // Fetch images
        const { data: imagesData, error: imagesError } = await supabase
          .from('standard_images')
          .select('*')
          .eq('project_id', projectId)
          .order('order_number', { ascending: true });

        if (imagesError) {
          console.error('Images error:', imagesError);
        }

        setUser(currentUser);
        setProject(projectData);
        setChapters(chaptersData || []);
        setImages(imagesData || []);
        setLoading(false);

      } catch (error) {
        console.error('Error loading workspace:', error);
        alert('Failed to load workspace');
        router.push('/dashboard');
      }
    }

    if (projectId) {
      loadWorkspace();
    }
  }, [projectId, router]);

  // Refresh chapters from database
  const refreshChapters = async () => {
    const { data: chaptersData } = await supabase
      .from('standard_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('chapter_number', { ascending: true });

    if (chaptersData) {
      setChapters(chaptersData);
    }
  };

  // Refresh images from database
  const refreshImages = async () => {
    const { data: imagesData } = await supabase
      .from('standard_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    if (imagesData) {
      setImages(imagesData);
    }
  };

  // Refresh project (for token updates)
  const refreshProject = async () => {
    const { data: projectData } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectData) {
      setProject(projectData);
    }
  };

  // ✅ NEW: Handle print current chapter
  const handlePrintCurrentChapter = () => {
    // Hide sidebar temporarily
    const wasOpen = sidebarOpen;
    setSidebarOpen(false);
    
    // Small delay to let UI update
    setTimeout(() => {
      window.print();
      // Restore sidebar state
      setSidebarOpen(wasOpen);
    }, 100);
  };

  // ✅ NEW: Handle preview before generate
  const handlePreviewBeforeGenerate = () => {
    setShowPreviewModal(true);
  };

  // ✅ NEW: Handle suggest improvements
  const handleSuggestImprovements = () => {
    setShowSuggestionsModal(true);
  };

  // ✅ NEW: Proceed with generation after preview
  const handleProceedWithGeneration = async () => {
    setShowPreviewModal(false);
    await handleGenerate();
  };

  // Handle chapter generation
  const handleGenerate = async () => {
    const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
    if (!currentChapter) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/standard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          chapterNumber: selectedChapter,
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Refresh data
      await refreshChapters();
      await refreshProject();

      alert('Chapter generated successfully!');

    } catch (error) {
      console.error('Generation error:', error);
      alert(error.message || 'Failed to generate chapter');
    } finally {
      setGenerating(false);
    }
  };

  // Handle chapter regeneration
  const handleRegenerate = async (customInstruction = null) => {
    const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
    if (!currentChapter) return;

    setGenerating(true);
    setShowModifyModal(false);

    try {
      const response = await fetch('/api/standard/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          chapterNumber: selectedChapter,
          customInstruction,
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed');
      }

      // Refresh data
      await refreshChapters();
      await refreshProject();

      alert('Chapter regenerated successfully!');

    } catch (error) {
      console.error('Regeneration error:', error);
      alert(error.message || 'Failed to regenerate chapter');
    } finally {
      setGenerating(false);
    }
  };

  // Handle save edits
  const handleSaveEdit = async (newContent) => {
    const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
    if (!currentChapter) return;

    try {
      const response = await fetch('/api/standard/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentChapter.id,
          content: newContent,
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Save failed');
      }

      // Refresh chapters
      await refreshChapters();

      setIsEditing(false);
      alert('Changes saved successfully!');

    } catch (error) {
      console.error('Save error:', error);
      alert(error.message || 'Failed to save changes');
    }
  };

  // Handle discard edits
  const handleDiscardEdit = () => {
    if (confirm('Discard your changes?')) {
      setIsEditing(false);
    }
  };

  // Loading state
  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar
        project={project}
        chapters={chapters}
        images={images}
        selectedChapter={selectedChapter}
        onChapterSelect={setSelectedChapter}
        onImageUploadComplete={refreshImages}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar
          chapter={currentChapter}
          isEditing={isEditing}
          generating={generating}
          project={project}
          onEdit={() => setIsEditing(true)}
          onSave={() => {}} // Not used, save is in ChapterEdit
          onGenerate={handleGenerate}
          onRegenerate={() => handleRegenerate()}
          onModifyRegenerate={() => setShowModifyModal(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onPrintCurrentChapter={handlePrintCurrentChapter} // ✅ NEW
          onPreviewBeforeGenerate={handlePreviewBeforeGenerate} // ✅ NEW
          onSuggestImprovements={handleSuggestImprovements} // ✅ NEW
        />

        {/* Chapter Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {!currentChapter ? (
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 text-center rounded-xl border-2 border-dashed border-gray-300">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Chapter not found</h3>
              <p className="text-gray-600">Please select a valid chapter from the sidebar.</p>
            </div>
          ) : isEditing ? (
            <ChapterEdit
              chapter={currentChapter}
              onSave={handleSaveEdit}
              onCancel={handleDiscardEdit}
            />
          ) : (
            <ChapterView
              chapter={currentChapter}
              images={images}
              generating={generating}
            />
          )}
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <ModifyModal
          isOpen={showModifyModal}
          onClose={() => setShowModifyModal(false)}
          onSubmit={handleRegenerate}
          chapter={currentChapter}
        />
      )}

      {/* ✅ NEW: Preview Modal */}
      {showPreviewModal && currentChapter && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onProceed={handleProceedWithGeneration}
          chapter={{
            ...currentChapter,
            project_id: project.id,
            user_id: user.id
          }}
          loading={generating}
        />
      )}

      {/* ✅ NEW: Suggestions Modal */}
      {showSuggestionsModal && currentChapter && (
        <SuggestionsModal
          isOpen={showSuggestionsModal}
          onClose={() => setShowSuggestionsModal(false)}
          onApplyAndRegenerate={handleRegenerate}
          chapter={currentChapter}
          projectId={project.id}
          userId={user.id}
        />
      )}
      {/* Feedback Widget */}
      <FeedbackWidget projectId={project.id} userId={user.id} />
    </div>
  );
}