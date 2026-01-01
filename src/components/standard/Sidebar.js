"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { supabase } from '@/lib/supabase';
import TokenBar from './TokenBar';

export default function Sidebar({
  project,
  chapters,
  images,
  selectedChapter,
  onChapterSelect,
  onImageUploadComplete,
  sidebarOpen,
  onToggleSidebar
}) {
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [tempImageData, setTempImageData] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [targetChapter, setTargetChapter] = useState(''); // '' = Global
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate] = useState(null);

  const maxImages = 10; // Increased limit slightly since they can split them now

  useEffect(() => {
    async function fetchTemplate() {
      if (project?.template_id) {
        const { data } = await supabase
          .from('templates')
          .select('name')
          .eq('id', project.template_id)
          .single();
        
        setTemplate(data);
      }
    }
    fetchTemplate();
  }, [project?.template_id]);

  const isSIWES = template?.name?.toLowerCase().includes('siwes') || 
                  template?.name?.toLowerCase().includes('industrial');
  const itemLabel = isSIWES ? 'Part' : 'Chapter';

  const handleImageUpload = (result) => {
    setTempImageData({
      url: result.info.secure_url,
      publicId: result.info.public_id,
    });
    // Default to currently selected chapter if one is active, else Global
    setTargetChapter(selectedChapter ? selectedChapter.toString() : '');
    setShowCaptionModal(true);
  };

  const saveImageWithCaption = async () => {
    if (!imageCaption.trim()) {
      alert('Please enter a caption for the image');
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase
        .from('standard_images')
        .insert({
          project_id: project.id,
          cloudinary_url: tempImageData.url,
          cloudinary_public_id: tempImageData.publicId,
          caption: imageCaption.trim(),
          order_number: images.length + 1,
          chapter_number: targetChapter ? parseInt(targetChapter) : null // ✅ Save chapter number
        })
        .select()
        .single();

      if (error) throw error;

      setShowCaptionModal(false);
      setImageCaption('');
      setTargetChapter('');
      setTempImageData(null);
      onImageUploadComplete();
      alert('Image uploaded successfully!');

    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;

    try {
      const { error } = await supabase
        .from('standard_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      onImageUploadComplete();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  return (
    <>
      <div
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-0 left-0 z-50 w-80 lg:w-80
          bg-white border-r border-gray-200 transition-transform duration-300 
          flex flex-col print:hidden
        `}
      >
        {/* Header & Token Bar (Unchanged) */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <img src="/favicon.ico" alt="W3 WriteLab" className="w-9 h-9" />
            <span className="text-lg font-bold text-indigo-600">W3 WriteLab</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Dashboard
            </Link>
            <button onClick={onToggleSidebar} className="lg:hidden text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 truncate text-sm sm:text-base flex-1">{project.title}</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 bg-indigo-100 text-indigo-700">STANDARD</span>
          </div>
          <p className="text-xs text-gray-500">{project.department}</p>
        </div>
        <div className="px-4 py-3 border-b border-gray-200">
          <TokenBar used={project.tokens_used} limit={project.tokens_limit} />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{isSIWES ? 'Parts' : 'Chapters'}</h3>
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => onChapterSelect(chapter.chapter_number)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition ${
                  selectedChapter === chapter.chapter_number
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">{itemLabel} {chapter.chapter_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      chapter.status === 'approved' || chapter.status === 'draft' || chapter.status === 'edited' ? 'bg-green-100 text-green-700' :
                      chapter.status === 'generating' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {chapter.status === 'not_generated' ? 'Not Started' : chapter.status === 'generating' ? 'Generating...' : chapter.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate">{chapter.title}</div>
              </button>
            ))}
          </div>

          {/* Images Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</h3>
              <span className="text-xs text-gray-500">{images.length}/{maxImages}</span>
            </div>

            {images.length < maxImages && (
              <CldUploadWidget uploadPreset="reportgen_uploads" onSuccess={handleImageUpload}>
                {({ open }) => (
                  <button onClick={() => open()} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-indigo-400 hover:bg-indigo-50 transition text-center group mb-3">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs text-gray-600 group-hover:text-indigo-600">Upload Image</span>
                  </button>
                )}
              </CldUploadWidget>
            )}

            <div className="space-y-2">
              {images.map((img) => (
                <div key={img.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 group relative">
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image src={img.cloudinary_url} alt={img.caption} fill className="rounded object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{img.caption}</p>
                      {/* ✅ Display Tag: Global or Chapter X */}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${img.chapter_number ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                        {img.chapter_number ? `${itemLabel} ${img.chapter_number}` : 'Global'}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteImage(img.id)} className="text-red-500 p-1 text-xl opacity-0 group-hover:opacity-100 transition flex-shrink-0">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && <div onClick={onToggleSidebar} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" />}

      {/* Caption Modal with Chapter Selector */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Image Details</h3>
            {tempImageData && (
              <div className="mb-4 relative w-full h-40">
                <Image src={tempImageData.url} alt="Upload preview" fill className="rounded-lg object-cover" />
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Caption</label>
                <textarea
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Describe this image..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500"
                  autoFocus
                />
              </div>

              {/* ✅ NEW: Chapter Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Use in {itemLabel} (Optional)</label>
                <select
                  value={targetChapter}
                  onChange={(e) => setTargetChapter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                >
                  <option value="">Global (Available in ALL {itemLabel}s)</option>
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.chapter_number}>
                      {itemLabel} {ch.chapter_number}: {ch.title.substring(0, 30)}...
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  "Global" images can be referenced anywhere. Specific images only appear in that chapter's prompt.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowCaptionModal(false); setImageCaption(''); setTempImageData(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold text-sm">Cancel</button>
              <button onClick={saveImageWithCaption} disabled={uploading} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {uploading ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}