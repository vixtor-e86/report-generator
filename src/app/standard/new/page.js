"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';

// ✅ Separate component that uses useSearchParams
function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Common fields
  const [department, setDepartment] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [description, setDescription] = useState('');

  // Standard/Thesis fields
  const [projectTitle, setProjectTitle] = useState('');
  const [components, setComponents] = useState([]);
  const [componentInput, setComponentInput] = useState('');

  // SIWES-specific fields
  const [companyName, setCompanyName] = useState('');
  const [duration, setDuration] = useState('');

  // Image state
  const [images, setImages] = useState([]);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [tempImageData, setTempImageData] = useState(null);
  const [imageCaption, setImageCaption] = useState('');

  const maxImages = 10;

  // Check if template is SIWES
  const isSIWES = template?.name?.toLowerCase().includes('siwes') || 
                  template?.name?.toLowerCase().includes('industrial');

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
        return;
      }

      if (!templateId) {
        router.push('/template-select');
        return;
      }

      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !templateData) {
        alert('Template not found');
        router.push('/template-select');
        return;
      }

      const res = await fetch('/api/departments');
      const data = await res.json();

      setUser(user);
      setProfile(profile);
      setTemplate(templateData);
      setDepartmentsList(data);
      setDepartment(profile.department || '');
      setLoading(false);
    }

    loadData();
  }, [router, templateId]);

  // Image handlers
  const handleImageUpload = (result) => {
    setTempImageData({
      url: result.info.secure_url,
      publicId: result.info.public_id,
    });
    setShowCaptionModal(true);
  };

  const saveImageWithCaption = () => {
    if (!imageCaption.trim()) {
      alert('Please enter a caption for the image');
      return;
    }

    setImages([
      ...images,
      {
        url: tempImageData.url,
        publicId: tempImageData.publicId,
        caption: imageCaption.trim(),
      },
    ]);

    setShowCaptionModal(false);
    setImageCaption('');
    setTempImageData(null);
  };

  const handleDeleteImage = (index) => {
    if (!confirm('Delete this image?')) return;
    setImages(images.filter((_, i) => i !== index));
  };

  // Component handlers (for Standard/Thesis only)
  const addComponent = () => {
    if (componentInput.trim() && !components.includes(componentInput.trim())) {
      setComponents([...components, componentInput.trim()]);
      setComponentInput('');
    }
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  // Create project
  const handleCreateProject = async () => {
    // Validation based on template type
    if (isSIWES) {
      if (!companyName || !department || !duration || !description) {
        alert('Please fill in all required fields');
        return;
      }
    } else {
      if (!projectTitle || !department || components.length === 0 || !description) {
        alert('Please fill in all required fields and add at least one component');
        return;
      }
    }

    setCreating(true);

    try {
      // Prepare project data based on template type
      const projectData = {
        user_id: user.id,
        template_id: templateId,
        tier: 'standard',
        payment_status: 'paid',
        payment_verified_at: new Date().toISOString(),
        amount_paid: 10000.00,
        tokens_used: 0,
        tokens_limit: 120000,
        status: 'in_progress',
        current_chapter: 1,
        access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (isSIWES) {
        // SIWES project
        projectData.title = `${companyName} - Industrial Training Report`;
        projectData.department = department;
        projectData.components = [companyName]; // Store company name
        projectData.description = `Duration: ${duration}\n\n${description}`;
      } else {
        // Standard/Thesis project
        projectData.title = projectTitle;
        projectData.department = department;
        projectData.components = components;
        projectData.description = description;
      }

      const { data: project, error: projectError } = await supabase
        .from('standard_projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      // Create chapters based on template structure
      const structure = template.structure || { chapters: [] };
      const chaptersToCreate = structure.chapters.map((ch, i) => ({
        project_id: project.id,
        chapter_number: i + 1,
        title: ch.title,
        status: 'not_generated',
      }));

      const { error: chaptersError } = await supabase
        .from('standard_chapters')
        .insert(chaptersToCreate);

      if (chaptersError) throw chaptersError;

      // Save images if any
      if (images.length > 0) {
        const imageRecords = images.map((img, i) => ({
          project_id: project.id,
          cloudinary_url: img.url,
          cloudinary_public_id: img.publicId,
          caption: img.caption,
          order_number: i + 1,
        }));

        const { error: imagesError } = await supabase
          .from('standard_images')
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      router.push(`/standard/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/template-select" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Change Template
            </Link>
            <span className="text-2xl font-bold text-indigo-600">📄 W3 WriteLab</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {template.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isSIWES ? 'Training Details' : 'Project Details'}
          </h1>
          <p className="text-gray-600">
            {isSIWES 
              ? 'Tell us about your industrial training experience'
              : 'Tell us about your project. You can add images now or later in the workspace.'
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8">
          {/* SIWES-specific fields */}
          {isSIWES ? (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Company/Organization Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Nigerian National Petroleum Corporation (NNPC)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Department/Division Attached To *
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Electrical Engineering Department, IT Department"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Duration of Training *
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 6 months (January - June 2024)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Work Experience Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="6"
                  placeholder="Describe the work you did, skills acquired, departments visited, projects worked on, etc..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>
            </>
          ) : (
            /* Standard/Thesis fields */
            <>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g., Smart Home Automation System Using IoT"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Pre-filled from your profile</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Components/Tools Used *
                </label>

                {components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {components.map((comp, i) => (
                      <div
                        key={i}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        <span>{comp}</span>
                        <button
                          onClick={() => removeComponent(i)}
                          className="hover:text-indigo-900 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={componentInput}
                    onChange={(e) => setComponentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addComponent();
                      }
                    }}
                    placeholder="e.g., Arduino Uno, DHT11 Sensor, Raspberry Pi..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={addComponent}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter or click Add</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="6"
                  placeholder="Describe what your project does, its objectives, and key features..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>
            </>
          )}

          {/* Images Section (common for both) */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Images (Optional)</h3>
                <p className="text-sm text-gray-600">
                  Add up to 10 images now or add them later in the workspace
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {images.length}/{maxImages}
              </span>
            </div>

            {images.length < maxImages && (
              <CldUploadWidget
                uploadPreset="reportgen_uploads"
                onSuccess={handleImageUpload}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50 transition text-center group"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 group-hover:text-indigo-500 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-gray-600 group-hover:text-indigo-600 font-medium">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </button>
                )}
              </CldUploadWidget>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-200 group relative"
                  >
                    <div className="relative w-full h-32 mb-2">
                      <Image
                        src={img.url}
                        alt={img.caption}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2">
                      {img.caption}
                    </p>
                    <button
                      onClick={() => handleDeleteImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/template-select')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Back to Templates
            </button>
            <button
              onClick={handleCreateProject}
              disabled={creating}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Project...
                </>
              ) : (
                <>
                  Create Project
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">What happens next?</p>
              <p>
                After creating your {isSIWES ? 'report' : 'project'}, you'll be taken to the workspace where you can generate {isSIWES ? 'parts' : 'chapters'} one by one. 
                You have <strong>120,000 tokens</strong> (~12 regenerations) and <strong>30 days access</strong> to complete your report.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption Modal */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Image Caption</h3>
            {tempImageData && (
              <div className="mb-6">
                <div className="relative w-full h-48">
                  <Image
                    src={tempImageData.url}
                    alt="Upload preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              </div>
            )}
            <textarea
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Describe this image (e.g., 'Circuit diagram showing power supply connections')..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCaptionModal(false);
                  setImageCaption('');
                  setTempImageData(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveImageWithCaption}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold"
              >
                Save Caption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ✅ Main component wrapped in Suspense
export default function StandardNewProject() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}