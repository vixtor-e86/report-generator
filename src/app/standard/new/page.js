"use client";
import ReferenceInfoModal from '@/components/ReferenceInfoModal';
import { getReferenceStyleOptions } from '@/lib/referenceStyles';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');

  const [universityData, setUniversityData] = useState({}); // Stores the full object
  const [facultiesList, setFacultiesList] = useState([]);   // Stores ["Engineering", "Science"...]
  const [departmentsList, setDepartmentsList] = useState([]); // Stores ONLY the active departments array
  const [description, setDescription] = useState('');
  const [referenceStyle, setReferenceStyle] = useState('apa');
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [components, setComponents] = useState([]);
  const [componentInput, setComponentInput] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [duration, setDuration] = useState('');
  const [images, setImages] = useState([]);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [tempImageData, setTempImageData] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [targetChapter, setTargetChapter] = useState('');

  const maxImages = 10;
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

      // ✅ NEW: Check for unused payment
      const { data: unusedPayments } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .is('project_id', null)
        .order('paid_at', { ascending: false })
        .limit(1);

      if (!unusedPayments || unusedPayments.length === 0) {
        alert('No valid payment found. Please make a payment first.');
        router.push('/dashboard');
        return;
      }

      setPendingPayment(unusedPayments[0]);

      // ✅ FIX: Handle the new Object structure
      const res = await fetch('/api/departments');
      const data = await res.json(); // returns { "Engineering": [...], "Science": [...] }

      setUniversityData(data);
      setFacultiesList(Object.keys(data)); // Extract keys for the Faculty Dropdown

      // Check profile for pre-existing selection
      if (profile.faculty) {
        setFaculty(profile.faculty);
        // Safely set departments for this faculty
        if (Array.isArray(data[profile.faculty])) {
          setDepartmentsList(data[profile.faculty]);
        }
      }

      if (profile.department) {
        setDepartment(profile.department);
      }

      setUser(user);
      setProfile(profile);
      setTemplate(templateData);
      setLoading(false);
    }

    loadData();
  }, [router, templateId]);

  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    setFaculty(selectedFaculty);

    // Reset department choice
    setDepartment('');

    // ✅ FIX: Ensure we only set an Array
    if (selectedFaculty && Array.isArray(universityData[selectedFaculty])) {
      setDepartmentsList(universityData[selectedFaculty]);
    } else {
      setDepartmentsList([]);
    }
  };

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
        chapterNumber: targetChapter ? parseInt(targetChapter) : null // ✅ Store chapter number
      },
    ]);

    setShowCaptionModal(false);
    setImageCaption('');
    setTargetChapter(''); // Reset
    setTempImageData(null);
  };

  const handleDeleteImage = (index) => {
    if (!confirm('Delete this image?')) return;
    setImages(images.filter((_, i) => i !== index));
  };

  const addComponent = () => {
    if (componentInput.trim() && !components.includes(componentInput.trim())) {
      setComponents([...components, componentInput.trim()]);
      setComponentInput('');
    }
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleCreateProject = async () => {
    if (isSIWES) {
      if (!companyName || !department || !duration || !description) {
        alert('Please fill in all required fields');
        return;
      }
    } else {
      if (!projectTitle || !department || !description) {
        alert('Please fill in all required fields and add at least one component');
        return;
      }
    }

    if (!pendingPayment) {
      alert('No valid payment found. Please go back and make a payment.');
      router.push('/dashboard');
      return;
    }

    setCreating(true);

    try {
      const projectData = {
        user_id: user.id,
        template_id: templateId,
        tier: 'standard',
        payment_status: 'paid',
        payment_verified_at: pendingPayment.verified_at,
        amount_paid: pendingPayment.amount,
        tokens_used: 0,
        tokens_limit: 120000,
        status: 'in_progress',
        current_chapter: 1,
        reference_style: isSIWES ? 'none' : referenceStyle,
        access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (isSIWES) {
        projectData.title = `${companyName} - Industrial Training Report`;
        projectData.department = department;
        projectData.components = [companyName];
        projectData.description = `Duration: ${duration}\n\n${description}`;
      } else {
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

      // ✅ NEW: Link payment to project
      const { error: paymentLinkError } = await supabase
        .from('payment_transactions')
        .update({ project_id: project.id, updated_at: new Date().toISOString() })
        .eq('id', pendingPayment.id);

      if (paymentLinkError) {
        console.error('Payment link error:', paymentLinkError);
        // Don't fail the whole flow, just log it
      }

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

      if (images.length > 0) {
        const imageRecords = images.map((img, i) => ({
          project_id: project.id,
          cloudinary_url: img.url,
          cloudinary_public_id: img.publicId,
          caption: img.caption,
          order_number: i + 1,
          chapter_number: img.chapterNumber || null // ✅ Add this line
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
      {/* Mobile-Friendly Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/template-select" className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Change Template</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-lg sm:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {template.name}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            {isSIWES ? 'Training Details' : 'Project Details'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            {isSIWES
              ? 'Tell us about your industrial training experience'
              : 'Tell us about your project. You can add images now or later in the workspace.'
            }
          </p>
        </div>

        {/* Payment Info Banner */}
        {pendingPayment && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold text-green-900">Payment Verified</p>
                <p className="text-green-700">₦{pendingPayment.amount.toLocaleString()} • Paid on {new Date(pendingPayment.paid_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Container - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {isSIWES ? (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Company/Organization Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., NNPC, Shell, MTN..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Faculty *
                </label>
                <select
                  value={faculty}
                  onChange={handleFacultyChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="">Select Faculty</option>
                  {facultiesList.map((fac, i) => (
                    <option key={i} value={fac}>
                      {fac}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Department *
                </label>

                {faculty === 'Other' ? (
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter your department name"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                ) : (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!faculty}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50 disabled:text-gray-400 ${department ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    <option value="">Select Department</option>
                    {/* ✅ FIX: Add Array.isArray check before mapping */}
                    {Array.isArray(departmentsList) && departmentsList.map((dept, i) => (
                      <option key={i} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Duration of Training *
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 6 months (Jan - June 2024)"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Work Experience Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  placeholder="Describe your work, skills acquired, projects..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">{description.length} characters</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g., Smart Home Automation System"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {/* ✅ REPLACED: New Faculty + Department Selection for Regular Projects */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Faculty *
                </label>
                <select
                  value={faculty}
                  onChange={handleFacultyChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mb-4"
                >
                  <option value="">Select Faculty</option>
                  {facultiesList.map((fac, i) => (
                    <option key={i} value={fac}>
                      {fac}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>

                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Department *
                </label>

                {faculty === 'Other' ? (
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter your department name"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                ) : (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!faculty}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50 disabled:text-gray-400 ${department ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    <option value="">Select Department</option>
                    {/* ✅ FIX: Added safety check here */}
                    {Array.isArray(departmentsList) && departmentsList.map((dept, i) => (
                      <option key={i} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                )}
                <p className="text-xs text-gray-600 mt-1">Pre-filled from your profile</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Components/Tools/Materials/Focus Areas
                </label>

                {components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {components.map((comp, i) => (
                      <div
                        key={i}
                        className="bg-indigo-100 text-indigo-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2"
                      >
                        <span className="truncate max-w-[150px] sm:max-w-none">{comp}</span>
                        <button
                          onClick={() => removeComponent(i)}
                          className="hover:text-indigo-900 transition flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    placeholder="e.g., Arduino Uno, Lab Equipment, Survey Tools, Research Methods..."
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={addComponent}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Optional - Add components, tools, materials, or research focus areas. Press Enter or click Add</p>
              </div>

              {/* Reference Style Selection */}
              {!isSIWES && ( // ✅ Only show for non-SIWES projects
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs sm:text-sm font-bold text-gray-900">
                      Reference Style
                    </label>
                    <button
                      onClick={() => setShowReferenceInfo(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Examples
                    </button>
                  </div>
                  <select
                    value={referenceStyle}
                    onChange={(e) => setReferenceStyle(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {getReferenceStyleOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-2">
                    {referenceStyle === 'none' 
                      ? 'No references will be added - you can add them manually later'
                      : `References will be generated in ${referenceStyle.toUpperCase()} format at the end of the final chapter`
                    }
                  </p>
                </div>
              )}


              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  placeholder="Describe what your project does, objectives, key features..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">{description.length} characters</p>
              </div>
            </>
          )}

          {/* Images Section - Mobile Optimized */}
          <div className="border-t border-gray-200 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Images (Optional)</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Add up to 10 images now or later
                </p>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
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
                    className="w-full border-2 border-dashed border-gray-400 rounded-xl p-4 sm:p-6 hover:border-indigo-500 hover:bg-indigo-50 transition text-center group"
                  >
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 group-hover:text-indigo-600 mx-auto mb-2 sm:mb-3"
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
                    <p className="text-sm sm:text-base text-gray-700 group-hover:text-indigo-700 font-bold">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      PNG, JPG up to 10MB
                    </p>
                  </button>
                )}
              </CldUploadWidget>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-200 group relative"
                  >
                    <div className="relative w-full h-32 sm:h-36 mb-2">
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
          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/template-select')}
              className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base order-2 sm:order-1"
            >
              Back to Templates
            </button>
            <button
              onClick={handleCreateProject}
              disabled={creating}
              className="w-full sm:flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  Create Project
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">What happens next?</p>
              <p>
                After creating your {isSIWES ? 'report' : 'project'}, you&apos;ll be taken to the workspace where you can generate {isSIWES ? 'parts' : 'chapters'} one by one. 
                You have <strong>120,000 tokens</strong> (~12 regenerations) and <strong>30 days access</strong> to complete your report.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption Modal - Mobile Optimized */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Add Image Caption</h3>
            {tempImageData && (
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full h-40 sm:h-48">
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              autoFocus
            />
            {/* ✅ NEW: Chapter Selector for Onboarding */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Assign to {isSIWES ? 'Part' : 'Chapter'} (Optional)
              </label>
              <select
                value={targetChapter}
                onChange={(e) => setTargetChapter(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 font-medium"
              >
                <option value="">Global (Available everywhere)</option>
                {template?.structure?.chapters?.map((ch, i) => (
                  <option key={i} value={i + 1}>
                    {isSIWES ? 'Part' : 'Chapter'} {i + 1}: {ch.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowCaptionModal(false);
                  setImageCaption('');
                  setTempImageData(null);
                }}
                className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={saveImageWithCaption}
                className="w-full sm:flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 font-semibold text-sm sm:text-base"
              >
                Save Caption
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reference Info Modal */}
          <ReferenceInfoModal 
            isOpen={showReferenceInfo}
            onClose={() => setShowReferenceInfo(false)}
            selectedStyle={referenceStyle}
          />
    </div>
  );
}

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
