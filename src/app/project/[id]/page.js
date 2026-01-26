"use client";
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm'; 
import { useReactToPrint } from 'react-to-print';

export default function Workspace({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [tempImageData, setTempImageData] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // ✅ NEW
  const [paymentProcessing, setPaymentProcessing] = useState(false); // ✅ NEW
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const currentChapterRef = useRef();
  const fullReportRef = useRef();

  // ... (Load Project Data effect remains the same)

  // ... (Image functions remain the same)

  // ... (Generate Chapter Logic remains the same)

  // ✅ NEW: Payment Handler
  const handleUnlockPayment = async () => {
    setPaymentProcessing(true);
    try {
      const response = await fetch('/api/flutterwave/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          tier: 'free_unlock', // Special tier for unlocking
          amount: 2000,
          projectId: project.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Flutterwave
      window.location.href = data.authorization_url;

    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to start payment');
      setPaymentProcessing(false);
    }
  };

  // ✅ NEW: Check Access Wrapper
  const checkAccessAndPrint = (printFunction) => {
    if (project?.tier === 'free' && !project?.is_unlocked) {
      setShowPaymentModal(true);
    } else {
      printFunction();
    }
  };

  // Print Current Chapter (Wrapped)
  const handlePrintCurrentChapter = useReactToPrint({
    contentRef: currentChapterRef,
    documentTitle: `Chapter-${selectedChapter}-${project?.title || 'Report'}`,
    pageStyle: `
      @page { size: auto; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        @page { size: auto; margin: 20mm; }
      }
    `,
    onBeforeGetContent: () => {
      if (project?.tier === 'free' && !project?.is_unlocked) return Promise.reject("Locked"); // Prevent if locked (double check)
      const fullReportDiv = fullReportRef.current?.parentElement;
      if (fullReportDiv) fullReportDiv.style.display = 'none';
    },
    onAfterPrint: () => {
      const fullReportDiv = fullReportRef.current?.parentElement;
      if (fullReportDiv) fullReportDiv.style.display = '';
    }
  });

  // Print Full Report (Wrapped)
  const handlePrintFullReport = useReactToPrint({
    contentRef: fullReportRef,
    documentTitle: `${project?.title || 'Full-Report'}`,
    pageStyle: `
      @page { size: A4; margin: 25mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .page-break { page-break-before: always; }
      }
    `,
    onBeforeGetContent: () => {
      if (project?.tier === 'free' && !project?.is_unlocked) return Promise.reject("Locked");
      const fullReportDiv = fullReportRef.current?.parentElement;
      const currentChapterDiv = currentChapterRef.current;
      if (fullReportDiv) fullReportDiv.style.display = 'block';
      if (currentChapterDiv) currentChapterDiv.style.display = 'none';
    },
    onAfterPrint: () => {
      const fullReportDiv = fullReportRef.current?.parentElement;
      const currentChapterDiv = currentChapterRef.current;
      if (fullReportDiv) fullReportDiv.style.display = '';
      if (currentChapterDiv) currentChapterDiv.style.display = '';
    }
  });

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentChapter = chapters.find(ch => ch.chapter_number === selectedChapter);
  const maxImages = 2; // Free tier fixed at 2 images
  const allChaptersGenerated = chapters.every(ch => ch.status === 'draft' || ch.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 lg:w-80
        bg-white border-r border-gray-200 
        transition-transform duration-300 
        flex flex-col 
        print:hidden
      `}>
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <img src="/favicon.ico" alt="W3 WriteLab" className="w-9 h-9" />
            <span className="text-lg font-bold text-indigo-600">W3 WriteLab</span>
          </div>
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 truncate text-sm sm:text-base">{project.title}</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 bg-gray-100 text-gray-700">
              FREE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{project.department}</p>
        </div>

        {/* Chapters Navigation */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chapters</h3>
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => {
                  setSelectedChapter(chapter.chapter_number);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition ${
                  selectedChapter === chapter.chapter_number
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    Chapter {chapter.chapter_number}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
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
                <div className="text-xs text-gray-600 truncate">{chapter.title}</div>
              </button>
            ))}
          </div>

          {/* Images Section */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</h3>
              <span className="text-xs text-gray-500">{images.length}/{maxImages}</span>
            </div>

            {images.length < maxImages && (
              <CldUploadWidget 
                uploadPreset="reportgen_uploads"
                onSuccess={handleImageUpload}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 hover:border-indigo-400 hover:bg-indigo-50 transition text-center group"
                  >
                    <span className="text-xs sm:text-sm text-gray-600 group-hover:text-indigo-600">Upload Image</span>
                  </button>
                )}
              </CldUploadWidget>
            )}

            <div className="mt-4 space-y-2">
              {images.map((img) => (
                <div key={img.id} className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-200 group relative">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Image 
                      src={img.cloudinary_url} 
                      alt={img.caption}
                      width={50}
                      height={50}
                      className="rounded object-cover sm:w-[60px] sm:h-[60px]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{img.caption}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-red-500 p-1 text-xl sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 print:hidden">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="text-gray-600 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">Chapter {currentChapter?.chapter_number}</span>
                <span className="sm:hidden">Ch. {currentChapter?.chapter_number}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {currentChapter?.status === 'not_generated' && (
                <button 
                  onClick={handleGenerateChapter}
                  disabled={generating}
                  className="bg-indigo-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 text-xs sm:text-base"
                >
                  <span className="hidden sm:inline">{generating ? 'Generating...' : 'Generate Chapter'}</span>
                  <span className="sm:hidden">{generating ? 'Gen...' : 'Generate'}</span>
                </button>
              )}
              
              {/* Print Current Chapter */}
              <button 
                onClick={() => checkAccessAndPrint(handlePrintCurrentChapter)}
                disabled={currentChapter?.status === 'not_generated'}
                className="bg-gray-800 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-1.5 disabled:opacity-50 text-xs sm:text-base"
                title="Print Current Chapter"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden lg:inline">Print Chapter</span>
              </button>

              {/* Print Full Report */}
              <button 
                onClick={() => checkAccessAndPrint(handlePrintFullReport)}
                disabled={!allChaptersGenerated}
                className="bg-green-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:bg-gray-400 text-xs sm:text-base"
                title={allChaptersGenerated ? "Print Full Report" : "Generate all chapters first"}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden lg:inline">Full Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {currentChapter?.status === 'not_generated' ? (
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 text-center rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Generate</h3>
              <p className="text-gray-600 text-sm sm:text-base">Click &quot;Generate Chapter&quot; to begin.</p>
            </div>
          ) : (
            <div ref={currentChapterRef} className="print:p-8"> 
              <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 lg:p-12 shadow-sm border border-gray-200 min-h-[600px] sm:min-h-[800px] print:shadow-none print:border-none print:p-0">
                
                <div className="prose prose-sm sm:prose-lg max-w-none 
                  text-gray-900 
                  prose-p:text-justify prose-p:leading-relaxed prose-p:mb-4 sm:prose-p:mb-6
                  prose-headings:font-bold prose-headings:text-gray-900 
                  prose-h2:text-xl sm:prose-h2:text-3xl prose-h2:text-center prose-h2:uppercase prose-h2:tracking-wide prose-h2:mb-6 sm:prose-h2:mb-10 prose-h2:mt-0
                  prose-h3:text-base sm:prose-h3:text-xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3 sm:prose-h3:mb-4 prose-h3:border-b prose-h3:border-gray-200 prose-h3:pb-2
                  prose-li:text-gray-800 prose-li:mb-2
                  prose-strong:text-black prose-strong:font-bold
                  prose-table:text-xs sm:prose-table:text-base">
                  
                  {currentChapter?.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentChapter.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-500 italic text-sm sm:text-base">Content will appear here...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN FULL REPORT FOR PRINTING */}
      <div className="hidden print:hidden">
        <div ref={fullReportRef}>
          {/* Cover Page */}
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-12 page-break">
            <div className="mb-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">R</span>
              </div>
              <h1 className="text-4xl font-bold uppercase mb-4 text-gray-900">{project.title}</h1>
              <div className="w-32 h-1 bg-indigo-600 mx-auto mb-8"></div>
            </div>

            <div className="space-y-3 text-lg text-gray-700 mb-12">
              <p className="font-semibold">BY</p>
              <p className="text-xl font-bold text-gray-900">{userProfile?.full_name || userProfile?.username || 'Student Name'}</p>
            </div>

            <div className="space-y-2 text-gray-700 mb-16">
              <p className="font-semibold uppercase">{project.department}</p>
              <p>{userProfile?.universities?.name || userProfile?.custom_institution || 'University Name'}</p>
            </div>

            <div className="text-gray-600">
              <p className="font-semibold">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="min-h-screen p-12 page-break">
            <h2 className="text-3xl font-bold text-center uppercase mb-12 text-gray-900">Table of Contents</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="flex justify-between items-baseline border-b border-gray-300 pb-2">
                  <span className="font-semibold text-gray-900">
                    CHAPTER {chapter.chapter_number}: {chapter.title.toUpperCase()}
                  </span>
                  <span className="text-gray-600">{index + 1}</span>
                </div>
              ))}
              {images.length > 0 && (
                <div className="flex justify-between items-baseline border-b border-gray-300 pb-2">
                  <span className="font-semibold text-gray-900">LIST OF FIGURES</span>
                  <span className="text-gray-600">{chapters.length + 1}</span>
                </div>
              )}
            </div>
          </div>

          {/* All Chapters */}
          {chapters.map((chapter) => (
            <div key={chapter.id} className="page-break p-12">
              <div className="prose prose-lg max-w-none 
                text-gray-900 text-base
                prose-p:text-justify prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base
                prose-headings:font-bold prose-headings:text-gray-900 
                prose-h2:text-3xl prose-h2:text-center prose-h2:uppercase prose-h2:tracking-wide prose-h2:mb-10 prose-h2:mt-0
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:border-b prose-h3:border-gray-200 prose-h3:pb-2
                prose-li:text-gray-800 prose-li:mb-2 prose-li:text-base
                prose-strong:text-black prose-strong:font-bold
                prose-table:text-base prose-td:text-base prose-th:text-base">
                
                {chapter.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {chapter.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-gray-400 italic">Chapter not generated yet</div>
                )}
              </div>
            </div>
          ))}

          {/* List of Figures */}
          {images.length > 0 && (
            <div className="page-break p-12">
              <h2 className="text-3xl font-bold text-center uppercase mb-12 text-gray-900">List of Figures</h2>
              <div className="space-y-12">
                {images.map((img, index) => (
                  <div key={img.id} className="flex flex-col items-center">
                    <div className="relative w-full max-w-2xl h-[400px] mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={img.cloudinary_url} 
                        alt={img.caption}
                        className="w-full h-full object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                    <p className="text-gray-900 font-bold italic text-center">
                      Figure {index + 1}: {img.caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption Modal */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Add Image Caption</h3>
            {tempImageData && (
              <div className="mb-4 sm:mb-6">
                <Image 
                  src={tempImageData.url} 
                  alt="Upload preview" 
                  width={400} 
                  height={300} 
                  className="rounded-lg w-full object-cover"
                />
              </div>
            )}
            <textarea
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Describe this image (e.g., 'Circuit diagram showing power supply connections')..."
              rows="3"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base placeholder-gray-700 text-gray-900"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowCaptionModal(false); 
                  setImageCaption(''); 
                  setTempImageData(null);
                }} 
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 text-sm sm:text-base font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={saveImageWithCaption} 
                className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 text-sm sm:text-base font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full Report</h3>
              <p className="text-gray-600 mb-6">
                To download or print this report, a one-time unlock fee is required.
              </p>

              <div className="bg-indigo-50 rounded-xl p-4 mb-8">
                <div className="text-sm text-indigo-800 font-semibold uppercase tracking-wider mb-1">Unlock Fee</div>
                <div className="text-3xl font-extrabold text-indigo-600">₦2,000</div>
              </div>

              <button 
                onClick={handleUnlockPayment}
                disabled={paymentProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Pay ₦2,000 to Unlock</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}