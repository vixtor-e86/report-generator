"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';

export default function Workspace({ params }) {
  // FIX: Unwrap params Promise for Next.js 16
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [tempImageData, setTempImageData] = useState(null);
  const [imageCaption, setImageCaption] = useState('');

  // Load Project Data
  useEffect(() => {
    async function loadWorkspace() {
      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        console.error('Project error:', projectError);
        router.push('/dashboard');
        return;
      }

      // Get chapters
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true });

      // Get images (if any)
      const { data: imagesData } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      setProject(projectData);
      setChapters(chaptersData || []);
      setImages(imagesData || []);
      setLoading(false);
    }

    if (projectId) {
      loadWorkspace();
    }
  }, [projectId, router]);

  // Handle Image Upload Success
  const handleImageUpload = async (result) => {
    if (!project) return;
    
    // Store temp data and show caption modal
    setTempImageData({
      url: result.info.secure_url,
      publicId: result.info.public_id,
    });
    setShowCaptionModal(true);
  };

  // Save image with caption to database
  const saveImageWithCaption = async () => {
    if (!imageCaption.trim()) {
      alert('Please enter a caption for the image');
      return;
    }

    const { data, error } = await supabase
      .from('project_images')
      .insert({
        project_id: project.id,
        cloudinary_url: tempImageData.url,
        cloudinary_public_id: tempImageData.publicId,
        caption: imageCaption.trim(),
        order_number: images.length + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setImages([...images, data]);
      setShowCaptionModal(false);
      setImageCaption('');
      setTempImageData(null);
    } else {
      alert('Failed to save image');
    }
  };

  // Delete image from database
  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;

    const { error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);

    if (!error) {
      setImages(images.filter(img => img.id !== imageId));
    } else {
      alert('Failed to delete image');
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
  const maxImages = project.tier === 'free' ? 2 : project.tier === 'standard' ? 5 : 999;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 truncate">{project.title}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              project.tier === 'free' ? 'bg-gray-100 text-gray-700' :
              project.tier === 'standard' ? 'bg-blue-100 text-blue-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {project.tier}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{project.department}</p>
        </div>

        {/* Chapters Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chapters</h3>
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapter(chapter.chapter_number)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  selectedChapter === chapter.chapter_number
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    Chapter {chapter.chapter_number}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    chapter.status === 'approved' ? 'bg-green-100 text-green-700' :
                    chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    chapter.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {chapter.status === 'not_generated' ? 'Not Started' :
                     chapter.status === 'generating' ? 'Generating...' :
                     chapter.status === 'draft' ? 'Draft' : 'Complete'}
                  </span>
                </div>
                <div className="text-xs text-gray-600">{chapter.title}</div>
              </button>
            ))}
          </div>

          {/* Images Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</h3>
              <span className="text-xs text-gray-500">{images.length}/{maxImages}</span>
            </div>

            {/* Upload Button */}
            {images.length < maxImages && (
              <CldUploadWidget 
                uploadPreset="reportgen_uploads"
                onSuccess={handleImageUpload}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50 transition text-center group"
                  >
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-600 group-hover:text-indigo-600">Upload Image</span>
                  </button>
                )}
              </CldUploadWidget>
            )}

            {/* Image List */}
            <div className="mt-4 space-y-2">
              {images.map((img, index) => (
                <div key={img.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 group relative">
                  <div className="flex items-center gap-3">
                    <Image 
                      src={img.cloudinary_url} 
                      alt={img.caption}
                      width={60}
                      height={60}
                      className="rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{img.caption}</p>
                      <p className="text-xs text-gray-500">Image {index + 1}</p>
                    </div>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                      title="Delete image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">Project Progress</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${(chapters.filter(ch => ch.status === 'approved').length / chapters.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {chapters.filter(ch => ch.status === 'approved').length}/{chapters.length}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Chapter {currentChapter?.chapter_number}: {currentChapter?.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentChapter?.status === 'not_generated' ? 'Ready to generate' :
                   currentChapter?.status === 'generating' ? 'AI is working...' :
                   currentChapter?.status === 'draft' ? 'Review and approve' :
                   'Approved - Ready for export'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentChapter?.status !== 'approved' && (
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Chapter
                </button>
              )}
              
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentChapter?.status === 'not_generated' ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Generate</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Click the &quot;Generate Chapter&quot; button above to let AI create this chapter based on your project details.
                </p>
                <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-gray-900 mb-3">This chapter will include:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {currentChapter.chapter_number === 1 && (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Background of the Study
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Problem Statement
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Objectives & Scope
                        </li>
                      </>
                    )}
                    {currentChapter.chapter_number === 2 && (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Theoretical Framework
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Related Work Review
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          IEEE Citations
                        </li>
                      </>
                    )}
                    {currentChapter.chapter_number === 3 && (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          System Design & Architecture
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Implementation Steps
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Bill of Materials
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Assembly & Coding Procedures
                        </li>
                      </>
                    )}
                    {currentChapter.chapter_number === 4 && (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Tests Conducted
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Results & Data Analysis
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Performance Evaluation
                        </li>
                      </>
                    )}
                    {currentChapter.chapter_number === 5 && (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Summary of Findings
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Project Conclusion
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Future Recommendations
                        </li>
                      </>
                    )}
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Professional academic formatting
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200 min-h-[600px]">
              <div className="prose prose-lg max-w-none">
                {currentChapter?.content ? (
                  <div dangerouslySetInnerHTML={{ __html: currentChapter.content }} />
                ) : (
                  <div className="text-gray-600 italic">
                    Content will appear here after generation...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption Modal */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Image Caption</h3>
            <p className="text-gray-600 mb-6">
              Describe what this image shows (e.g., &quot;Circuit diagram showing ESP32 connections&quot;)
            </p>
            
            {/* Image Preview */}
            {tempImageData && (
              <div className="mb-6">
                <Image 
                  src={tempImageData.url} 
                  alt="Upload preview"
                  width={400}
                  height={300}
                  className="rounded-lg w-full object-cover"
                />
              </div>
            )}

            {/* Caption Input */}
            <textarea
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="e.g., Circuit diagram of the smart home system"
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none mb-6"
              autoFocus
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCaptionModal(false);
                  setImageCaption('');
                  setTempImageData(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveImageWithCaption}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Save Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}