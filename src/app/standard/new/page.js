"use client";
import ReferenceInfoModal from '@/components/ReferenceInfoModal';
import { getReferenceStyleOptions } from '@/lib/referenceStyles';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import { PRICING } from '@/lib/pricing';

const Icons = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
};

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');

  const [universityData, setUniversityData] = useState({});
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [description, setDescription] = useState('');
  const [referenceStyle, setReferenceStyle] = useState('apa');
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [components, setComponents] = useState([]);
  const [componentInput, setComponentInput] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [duration, setDuration] = useState('');
  const [images, setImages] = useState([]);
  const [manualObjectives, setManualObjectives] = useState(['']);
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

      const adminStatus = profile.role === 'admin';
      setIsAdmin(adminStatus);

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

      if (!adminStatus) {
        const { data: unusedPayments, error: paymentError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .eq('tier', 'standard') // ✅ FIX: Only use standard payments for standard projects
          .is('project_id', null)
          .order('paid_at', { ascending: false })
          .limit(1);

        if (paymentError) {
          console.error('Payment check error:', paymentError);
          alert('Error checking payment status. Please try again.');
          router.push('/dashboard');
          return;
        }

        if (!unusedPayments || unusedPayments.length === 0) {
          alert('No valid payment found. Please make a payment first.');
          router.push('/dashboard');
          return;
        }

        const paymentDate = new Date(unusedPayments[0].paid_at || unusedPayments[0].created_at);
        const hoursSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60);

        if (hoursSincePayment > 24) {
          alert('This payment session has expired. Please make a new payment.');
          router.push('/dashboard');
          return;
        }

        setPendingPayment(unusedPayments[0]);
      }

      const res = await fetch('/api/departments');
      const data = await res.json();

      setUniversityData(data);
      setFacultiesList(Object.keys(data));

      if (profile.faculty) {
        setFaculty(profile.faculty);
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
    setDepartment('');
    if (selectedFaculty && Array.isArray(universityData[selectedFaculty])) {
      setDepartmentsList(universityData[selectedFaculty]);
    } else {
      setDepartmentsList([]);
    }
  };

  const handleAddObjective = () => setManualObjectives([...manualObjectives, '']);
  const handleRemoveObjective = (index) => setManualObjectives(manualObjectives.filter((_, i) => i !== index));
  const handleObjectiveChange = (index, value) => {
    const newObjs = [...manualObjectives];
    newObjs[index] = value;
    setManualObjectives(newObjs);
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
        chapterNumber: targetChapter ? parseInt(targetChapter) : null
      },
    ]);

    setShowCaptionModal(false);
    setImageCaption('');
    setTargetChapter('');
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
    const validObjectives = manualObjectives.filter(o => o.trim());
    
    if (isSIWES) {
      if (!companyName || !department || !duration || !description || validObjectives.length === 0) {
        alert('Please fill in all required fields including at least one objective');
        return;
      }
    } else {
      if (!projectTitle || !department || !description || validObjectives.length === 0) {
        alert('Please fill in all mandatory fields (Title, Objectives, and Description)');
        return;
      }
    }

    if (!isAdmin && !pendingPayment) {
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
        payment_status: isAdmin ? 'admin_bypass' : 'paid',
        payment_verified_at: isAdmin ? new Date().toISOString() : pendingPayment.verified_at,
        amount_paid: isAdmin ? 0 : PRICING.STANDARD,
        tokens_used: 0,
        tokens_limit: 120000,
        status: 'in_progress',
        current_chapter: 1,
        reference_style: isSIWES ? 'none' : referenceStyle,
        access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        use_manual_objectives: true,
        manual_objectives: validObjectives
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

      if (isAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'create_standard_project_bypass',
          details: { project_id: project.id, title: projectData.title, template: template.name }
        });
      }

      if (!isAdmin && pendingPayment) {
        await supabase.from('payment_transactions').update({ project_id: project.id, updated_at: new Date().toISOString() }).eq('id', pendingPayment.id);
      }

      const structure = template.structure || { chapters: [] };
      const chaptersToCreate = structure.chapters.map((ch, i) => ({
        project_id: project.id,
        chapter_number: i + 1,
        title: ch.title,
        status: 'not_generated',
      }));

      const { error: chaptersError } = await supabase.from('standard_chapters').insert(chaptersToCreate);
      if (chaptersError) throw chaptersError;

      if (images.length > 0) {
        const imageRecords = images.map((img, i) => ({
          project_id: project.id,
          cloudinary_url: img.url,
          cloudinary_public_id: img.publicId,
          caption: img.caption,
          order_number: i + 1,
          chapter_number: img.chapterNumber || null
        }));
        await supabase.from('standard_images').insert(imageRecords);
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
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/template-select" className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 0 1-2 2z" /></svg>
            {template.name}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            {isSIWES ? 'Training Details' : 'Project Details'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            {isSIWES ? 'Tell us about your industrial training experience' : 'Tell us about your project. You can add images now or later in the workspace.'}
          </p>
        </div>

        {pendingPayment && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="text-sm">
                <p className="font-semibold text-green-900">Payment Verified</p>
                <p className="text-green-700">₦{pendingPayment.amount.toLocaleString()} • Paid on {new Date(pendingPayment.paid_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {isSIWES ? (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Company/Organization Name *</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., NNPC, Shell, MTN..." className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Faculty *</label>
                  <select value={faculty} onChange={handleFacultyChange} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"><option value="">Select Faculty</option>{facultiesList.map((fac, i) => (<option key={i} value={fac}>{fac}</option>))}<option value="Other">Other</option></select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Department *</label>
                  {faculty === 'Other' ? (<input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Enter your department name" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />) : (<select value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!faculty} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50 disabled:text-gray-400 ${department ? 'text-gray-900' : 'text-gray-500'}`}><option value="">Select Department</option>{Array.isArray(departmentsList) && departmentsList.map((dept, i) => (<option key={i} value={dept}>{dept}</option>))}<option value="Other">Other</option></select>)}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Duration of Training *</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 6 months (Jan - June 2024)" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Project Title *</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g., Smart Home Automation System" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Faculty *</label>
                  <select value={faculty} onChange={handleFacultyChange} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"><option value="">Select Faculty</option>{facultiesList.map((fac, i) => (<option key={i} value={fac}>{fac}</option>))}<option value="Other">Other</option></select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Department *</label>
                  {faculty === 'Other' ? (<input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Enter your department name" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />) : (<select value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!faculty} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50 disabled:text-gray-400 ${department ? 'text-gray-900' : 'text-gray-500'}`}><option value="">Select Department</option>{Array.isArray(departmentsList) && departmentsList.map((dept, i) => (<option key={i} value={dept}>{dept}</option>))}<option value="Other">Other</option></select>)}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Components/Focus Areas</label>
                {components.length > 0 && (<div className="flex flex-wrap gap-2 mb-3">{components.map((comp, i) => (<div key={i} className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"><span className="truncate max-w-[150px]">{comp}</span><button onClick={() => removeComponent(i)} className="hover:text-indigo-900 transition flex-shrink-0">×</button></div>))}</div>)}
                <div className="flex gap-2"><input type="text" value={componentInput} onChange={(e) => setComponentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())} placeholder="e.g., Arduino, Survey Tools, Lab Methods..." className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /><button onClick={addComponent} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">Add</button></div>
              </div>
              {!isSIWES && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between mb-2"><label className="block text-xs sm:text-sm font-bold text-gray-900">Reference Style</label><button onClick={() => setShowReferenceInfo(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">View Examples</button></div>
                  <select value={referenceStyle} onChange={(e) => setReferenceStyle(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none">{getReferenceStyleOptions().map(option => (<option key={option.value} value={option.value}>{option.icon} {option.label}</option>))}</select>
                </div>
              )}
            </>
          )}

          {/* Mandatory Objectives Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><Icons.Target /></div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{isSIWES ? 'Training Objectives' : 'Research Objectives'} *</h3>
                <p className="text-[11px] text-gray-500 font-medium">Define at least one specific goal for your report.</p>
              </div>
            </div>
            <div className="space-y-3">
              {manualObjectives.map((obj, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="px-3 py-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-400 border border-gray-100">{idx + 1}</div>
                  <input type="text" value={obj} onChange={(e) => handleObjectiveChange(idx, e.target.value)} placeholder={isSIWES ? "e.g. To gain practical experience in oil refinery..." : "e.g. To design a solar-powered irrigation system..."} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                  {manualObjectives.length > 1 && (<button onClick={() => handleRemoveObjective(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"><Icons.Trash /></button>)}
                </div>
              ))}
              <button onClick={handleAddObjective} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"><Icons.Plus /> Add Another Objective</button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">{isSIWES ? 'Work Experience Description *' : 'Project Description *'}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="5" placeholder={isSIWES ? "Describe your overall training experience..." : "Provide a detailed overview of your project..."} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button onClick={() => router.push('/template-select')} className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition text-sm order-2 sm:order-1">Back</button>
            <button onClick={handleCreateProject} disabled={creating} className="w-full sm:flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm order-1 sm:order-2">{creating ? (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>) : (<>Create Workspace <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>)}</button>
          </div>
        </div>
      </div>
      <ReferenceInfoModal isOpen={showReferenceInfo} onClose={() => setShowReferenceInfo(false)} selectedStyle={referenceStyle} />
    </div>
  );
}

export default function StandardNewProject() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div></div>}>
      <NewProjectContent />
    </Suspense>
  );
}
