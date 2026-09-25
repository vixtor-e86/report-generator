"use client";
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/standard/Sidebar';
import TopBar from '@/components/standard/TopBar';
import ChapterView from '@/components/standard/ChapterView';
import ChapterEdit from '@/components/standard/ChapterEdit';
import ModifyModal from '@/components/standard/ModifyModal';
import PreviewModal from '@/components/standard/PreviewModal'; // ✅ NEW
import SuggestionsModal from '@/components/standard/SuggestionsModal';
import RefillTokenModal from '@/components/standard/RefillTokenModal'; // ✅ NEW
import LoadingModal from '@/components/premium/modals/LoadingModal'; // Reusing premium loading modal
import FeedbackWidget from '@/components/FeedbackWidget';// ✅ NEW
import ReferralFAB from '@/components/ReferralFAB';
import CustomModal from '@/components/premium/modals/CustomModal';
import CustomProjectSetupModal from '@/components/workspace/CustomProjectSetupModal';

export default function StandardWorkspace({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [showRefillModal, setShowRefillModal] = useState(false); // ✅ Token refill modal
  const [showCustomSetupModal, setShowCustomSetupModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingText, setGlobalLoadingText] = useState('AI is writing your chapter...');

  // Notification Modal State
  const [notification, setNotification] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info',
    onConfirm: null 
  });

  const showNotification = (title, message, type = 'info', onConfirm = null) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

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
          showNotification('Error', 'Project not found', 'error');
          router.push('/dashboard');
          return;
        }

        // Verify ownership
        if (projectData.user_id !== currentUser.id) {
          showNotification('Access Denied', 'You do not have access to this project', 'error');
          router.push('/dashboard');
          return;
        }

        // Check access expiration (Only for FREE tier)
        if (projectData.tier === 'free') {
          const expiresAt = new Date(projectData.access_expires_at);
          const now = new Date();
          if (now > expiresAt) {
            showNotification('Access Expired', 'Your 30-day access to this project has expired', 'warning');
            router.push('/dashboard');
            return;
          }
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
        showNotification('Error', 'Failed to load workspace', 'error');
        router.push('/dashboard');
      }
    }

    if (projectId) {
      loadWorkspace();
    }
  }, [projectId, router]);

  // Handle token top-up payment verification callback
  useEffect(() => {
    const verifiedRefill = searchParams?.get('verified_token_refill');
    if (verifiedRefill && projectId) {
      async function verifyTokenRefill() {
        try {
          setIsGlobalLoading(true);
          setGlobalLoadingText('Verifying token top-up payment...');
          const res = await fetch(`/api/squad/verify?transaction_ref=${verifiedRefill}`);
          const data = await res.json();
          if (res.ok && data.verified) {
            showNotification('Success', 'Token top-up confirmed! Your tokens have been refilled.', 'success');
            await refreshProject();
          } else {
            showNotification('Payment Error', data.error || 'Failed to verify token top-up.', 'error');
          }
        } catch (err) {
          console.error('Token refill check error:', err);
          showNotification('Payment Error', 'Token top-up verification failed.', 'error');
        } finally {
          setIsGlobalLoading(false);
          router.replace(`/standard/${projectId}`);
        }
      }
      verifyTokenRefill();
    }
  }, [searchParams, projectId, router]);

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

  // ✅ NEW: Handle Project Details Update
  const handleUpdateProjectDetails = async (updates) => {
    try {
      const { error } = await supabase
        .from('standard_projects')
        .update({
          title: updates.title,
          description: updates.description,
          reference_style: updates.reference_style
        })
        .eq('id', project.id);

      if (error) throw error;
      
      await refreshProject();
      showNotification(
        'Details Updated',
        'Project configuration saved! If you changed the citation style or title, click "Regen" or "Modify" on your chapter(s) to apply the changes to the text.',
        'success'
      );
    } catch (error) {
      console.error('Update error:', error);
      showNotification('Error', 'Failed to update project details', 'error');
    }
  };

  const [isPrintingFull, setIsPrintingFull] = useState(false);

  // ✅ Handle print current chapter
  const handlePrintCurrentChapter = () => {
    const wasOpen = sidebarOpen;
    setSidebarOpen(false);
    setTimeout(() => {
      window.print();
      setSidebarOpen(wasOpen);
    }, 100);
  };

  // ✅ Handle print FULL report (Export PDF)
  const handlePrintFullReport = () => {
    const wasOpen = sidebarOpen;
    setSidebarOpen(false);
    setIsPrintingFull(true);
    setTimeout(() => {
      window.print();
      setIsPrintingFull(false);
      setSidebarOpen(wasOpen);
    }, 500); // Wait for all chapters to render
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

  // Handle saving pasted chapter for custom continuation projects
  const handleSavePastedChapter = async (chapterNum, text) => {
    try {
      // 1. Update standard_chapters
      const { error: chError } = await supabase
        .from('standard_chapters')
        .update({
          content: text,
          status: 'completed'
        })
        .eq('project_id', project.id)
        .eq('chapter_number', chapterNum);

      if (chError) throw chError;

      // 2. Update standard_projects uploaded_chapters
      const updatedUploaded = {
        ...(project.uploaded_chapters || {}),
        [`chapter_${chapterNum}`]: text
      };

      const { error: projError } = await supabase
        .from('standard_projects')
        .update({
          uploaded_chapters: updatedUploaded
        })
        .eq('id', project.id);

      if (projError) throw projError;

      // 3. Update local state
      setChapters(prev => prev.map(ch => 
        ch.chapter_number === chapterNum 
          ? { ...ch, content: text, status: 'completed' } 
          : ch
      ));
      setProject(prev => ({
        ...prev,
        uploaded_chapters: updatedUploaded
      }));

      showNotification('Success', `Chapter ${chapterNum} content saved successfully!`, 'success');
    } catch (err) {
      console.error('Error saving pasted chapter:', err);
      showNotification('Error', 'Failed to save chapter content.', 'error');
    }
  };

  // Handle chapter generation
  const handleGenerate = async () => {
    const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
    if (!currentChapter) return;

    // Check if custom continuation project is missing baseline chapters
    if (project?.is_custom) {
      const selectedChs = project.selected_chapters || [1, 2, 3, 4, 5];
      const unselected = [1, 2, 3, 4, 5].filter(c => !selectedChs.includes(c));
      const uploaded = project.uploaded_chapters || {};
      const missingChs = unselected.filter(c => {
        const chInState = chapters.find(ch => ch.chapter_number === c);
        const textFromUpload = typeof uploaded[`chapter_${c}`] === 'string'
          ? uploaded[`chapter_${c}`]
          : uploaded[`chapter_${c}`]?.content || '';
        const textFromChapter = chInState?.content || '';
        const combined = (textFromUpload || textFromChapter).trim();
        return !combined || combined.split(/\s+/).length < 20;
      });

      if (missingChs.length > 0) {
        showNotification(
          'Baseline Chapter Content Required',
          `Please paste your content for ${missingChs.map(c => `Chapter ${c}`).join(', ')} before generating new chapters.`,
          'warning'
        );
        setShowCustomSetupModal(true);
        return;
      }
    }

    setGenerating(true);
    setGlobalLoadingText(`AI is generating Chapter ${selectedChapter}...`);
    setIsGlobalLoading(true);

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

      // Immediately update local state so the UI reflects the new chapter content without delay
      if (data.content) {
        setChapters(prev => prev.map(ch => 
          ch.chapter_number === selectedChapter 
            ? { 
                ...ch, 
                content: data.content, 
                status: 'draft', 
                ai_model_used: data.model || ch.ai_model_used,
                version: (ch.version || 0) + 1
              } 
            : ch
        ));
      }

      // Refresh data from database
      await refreshChapters();
      await refreshProject();

      showNotification('Success', 'Chapter generated successfully!', 'success');

    } catch (error) {
      console.error('Generation error:', error);
      showNotification('Generation Error', error.message || 'Failed to generate chapter', 'error');
    } finally {
      setGenerating(false);
      setIsGlobalLoading(false);
    }
  };

  // Handle chapter regeneration
  const handleRegenerate = async (customInstruction = null) => {
    const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
    if (!currentChapter) return;

    setGenerating(true);
    setShowModifyModal(false);
    setGlobalLoadingText(`AI is modifying Chapter ${selectedChapter}...`);
    setIsGlobalLoading(true);

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

      // Immediately update local state so the UI reflects the regenerated content without delay
      if (data.content) {
        setChapters(prev => prev.map(ch => 
          ch.chapter_number === selectedChapter 
            ? { 
                ...ch, 
                content: data.content, 
                status: 'draft', 
                ai_model_used: data.model || ch.ai_model_used,
                version: data.version || (ch.version || 1) + 1
              } 
            : ch
        ));
      }

      // Refresh data from database
      await refreshChapters();
      await refreshProject();

      showNotification('Success', 'Chapter regenerated successfully!', 'success');

    } catch (error) {
      console.error('Regeneration error:', error);
      showNotification('Regeneration Error', error.message || 'Failed to regenerate chapter', 'error');
    } finally {
      setGenerating(false);
      setIsGlobalLoading(false);
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

      // Immediately update local state
      setChapters(prev => prev.map(ch => 
        ch.id === currentChapter.id
          ? { ...ch, content: newContent, status: 'edited' }
          : ch
      ));

      // Refresh chapters
      await refreshChapters();

      setIsEditing(false);
      showNotification('Saved', 'Changes saved successfully!', 'success');

    } catch (error) {
      console.error('Save error:', error);
      showNotification('Save Error', error.message || 'Failed to save changes', 'error');
    }
  };

  // Handle discard edits
  const handleDiscardEdit = () => {
    showNotification(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      'confirm',
      () => setIsEditing(false)
    );
  };

  // Loading state
  if (loading || !project) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Initialising Workspace...</p>
        </div>
      </div>
    );
  }

  const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col lg:flex-row font-sans selection:bg-slate-900 selection:text-white print:block print:h-auto print:min-h-0 print:bg-white">
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
        onOpenRefillModal={() => setShowRefillModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible print:block print:min-h-0">
        {/* Top Bar */}
        <TopBar
          chapter={currentChapter}
          isEditing={isEditing}
          generating={generating}
          project={project}
          chapters={chapters}
          onEdit={() => setIsEditing(true)}
          onSave={() => {}} // Not used, save is in ChapterEdit
          onGenerate={handleGenerate}
          onRegenerate={() => handleRegenerate()}
          onModifyRegenerate={() => setShowModifyModal(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onPrintCurrentChapter={handlePrintCurrentChapter}
          onPrintFullReport={handlePrintFullReport}
          onPreviewBeforeGenerate={handlePreviewBeforeGenerate}
          onSuggestImprovements={handleSuggestImprovements}
          showNotification={showNotification}
          onUpdateProjectDetails={handleUpdateProjectDetails} // ✅ NEW
        />

        {/* Chapter Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-10 lg:p-12 custom-scrollbar print:p-0 print:overflow-visible print:h-auto print:block print:min-h-0">
          {isPrintingFull ? (
            <div className="space-y-12 print:space-y-0 print:block">
              <div className="text-center py-12 print:py-16 print:block" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4 font-serif print:text-[22pt]">{project.title}</h1>
                <p className="text-lg text-slate-600 font-serif mb-2 print:text-[14pt]">{project.department}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono print:text-[10pt] print:text-black">
                  {project.reference_style ? `${project.reference_style.toUpperCase()} Reference Standard` : 'Academic Technical Report'}
                </p>
              </div>
              {chapters
                .filter(ch => ch.content && ch.content.trim())
                .map((ch, idx) => (
                  <div key={ch.id} className="print:block" style={{ pageBreakBefore: idx > 0 ? 'always' : 'auto', breakBefore: idx > 0 ? 'page' : 'auto' }}>
                    <ChapterView
                      chapter={ch}
                      images={images}
                      project={project}
                      generating={false}
                      onPrint={handlePrintCurrentChapter}
                      onSavePastedChapter={handleSavePastedChapter}
                    />
                  </div>
                ))}
            </div>
          ) : !currentChapter ? (
            <div className="max-w-4xl mx-auto bg-white p-12 text-center rounded-[40px] border-2 border-dashed border-slate-200 print:hidden">
              <h3 className="text-2xl font-black text-slate-900 mb-3">Chapter Context Missing</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Please select a valid chapter from the navigation sidebar to begin technical documentation.</p>
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
              project={project}
              generating={generating}
              onPrint={handlePrintCurrentChapter}
              onSavePastedChapter={handleSavePastedChapter}
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

      {/* ✅ NEW: Token Refill Modal */}
      {showRefillModal && (
        <RefillTokenModal
          isOpen={showRefillModal}
          onClose={() => setShowRefillModal(false)}
          projectId={project.id}
          userId={user?.id}
          userEmail={user?.email}
          tier="standard"
          currentTokensUsed={project.tokens_used}
          tokensLimit={project.tokens_limit}
        />
      )}

      {/* Feedback Widget */}
      <FeedbackWidget projectId={project.id} userId={user.id} />

      {/* Global Loading Modal */}
      <LoadingModal 
        isOpen={isGlobalLoading} 
        loadingText={globalLoadingText} 
      />
      {project.is_custom && (
        <CustomProjectSetupModal
          isOpen={showCustomSetupModal}
          projectId={project.id}
          workspaceType="standard"
          selectedChapters={project.selected_chapters || [1, 2, 3, 4, 5]}
          initialUploadedChapters={project.uploaded_chapters || {}}
          initialReferences={project.existing_references || ''}
          onSaveComplete={async () => {
            setShowCustomSetupModal(false);
            await refreshProject();
            await refreshChapters();
            showNotification('Context Saved', 'Your existing chapters and references were saved successfully!', 'success');
          }}
        />
      )}

      <CustomModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
