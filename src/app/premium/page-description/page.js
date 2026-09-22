'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { PRICING } from '@/lib/pricing';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import CustomModal from '@/components/premium/modals/CustomModal';
import '@/styles/project-description.css';

const Icons = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
};

function ProjectDescriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    faculty: searchParams.get('faculty') || '',
    department: searchParams.get('department') || '',
    templateType: searchParams.get('type') || '5-chapter',
    manualObjectives: ['']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showNotification = (title, message, type = 'info', onConfirm = null) => setNotification({ isOpen: true, title, message, type, onConfirm });
  
  const [universityData, setUniversityData] = useState({});
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isOtherFaculty, setIsOtherFaculty] = useState(false);
  const [customFaculty, setCustomFaculty] = useState('');
  const [isOtherDepartment, setIsOtherDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);

        // Check for unused premium payment
        if (profile?.role !== 'admin' && profile?.role !== 'support') {
          const { data: unusedPayments } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .eq('tier', 'premium')
            .is('project_id', null)
            .order('paid_at', { ascending: false })
            .limit(1);

          if (!unusedPayments || unusedPayments.length === 0) {
            showNotification('Payment Required', 'No valid Premium payment found. Please make a payment first.', 'warning');
            setTimeout(() => router.push('/dashboard'), 3000);
            return;
          }

          setPendingPayment(unusedPayments[0]);
        }

        const res = await fetch('/api/departments');
        const data = await res.json();
        setUniversityData(data);
        const keys = Object.keys(data);
        setFacultiesList(keys);

        const initialFaculty = searchParams.get('faculty');
        const initialDept = searchParams.get('department');

        if (initialFaculty) {
          const matchedFac = keys.find(k => k.toLowerCase() === initialFaculty.toLowerCase()) ||
            keys.find(k => k.toLowerCase().includes(initialFaculty.toLowerCase()) || initialFaculty.toLowerCase().includes(k.toLowerCase()));

          if (matchedFac) {
            setFormData(prev => ({ ...prev, faculty: matchedFac }));
            setIsOtherFaculty(false);
            if (data[matchedFac]) {
              setDepartmentsList(data[matchedFac]);
              if (initialDept) {
                const matchedDept = data[matchedFac].find(d => d.toLowerCase() === initialDept.toLowerCase()) ||
                  data[matchedFac].find(d => d.toLowerCase().includes(initialDept.toLowerCase()) || initialDept.toLowerCase().includes(d.toLowerCase()));
                if (matchedDept) {
                  setFormData(prev => ({ ...prev, department: matchedDept }));
                } else if (initialDept === 'Other') {
                  setIsOtherDepartment(true);
                  setCustomDepartment('');
                  setFormData(prev => ({ ...prev, department: '' }));
                } else {
                  setIsOtherDepartment(true);
                  setCustomDepartment(initialDept);
                  setFormData(prev => ({ ...prev, department: initialDept }));
                }
              }
            }
          } else if (initialFaculty === 'Other' || initialFaculty === 'Others') {
            setIsOtherFaculty(true);
            setCustomFaculty('');
            setIsOtherDepartment(true);
            setCustomDepartment(initialDept || '');
            setFormData(prev => ({ ...prev, faculty: '', department: initialDept || '' }));
          } else {
            setIsOtherFaculty(true);
            setCustomFaculty(initialFaculty);
            setIsOtherDepartment(true);
            setCustomDepartment(initialDept || '');
            setFormData(prev => ({ ...prev, faculty: initialFaculty, department: initialDept || '' }));
          }
        }
      } catch (error) { console.error('Failed to load data:', error); }
    }
    fetchData();
  }, [router, searchParams]);

  useEffect(() => {
    if (!isOtherFaculty && formData.faculty && universityData[formData.faculty]) {
      setDepartmentsList(universityData[formData.faculty]);
    } else {
      setDepartmentsList([]);
    }
  }, [formData.faculty, universityData, isOtherFaculty]);

  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    if (selectedFaculty === 'Other') {
      setIsOtherFaculty(true);
      setCustomFaculty('');
      setIsOtherDepartment(true);
      setCustomDepartment('');
      setFormData(prev => ({ ...prev, faculty: '', department: '' }));
    } else {
      setIsOtherFaculty(false);
      setCustomFaculty('');
      setIsOtherDepartment(false);
      setCustomDepartment('');
      setFormData(prev => ({ ...prev, faculty: selectedFaculty, department: '' }));
    }
    if (errors.faculty) setErrors(prev => ({ ...prev, faculty: '' }));
  };

  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    if (selectedDept === 'Other') {
      setIsOtherDepartment(true);
      setCustomDepartment('');
      setFormData(prev => ({ ...prev, department: '' }));
    } else {
      setIsOtherDepartment(false);
      setCustomDepartment('');
      setFormData(prev => ({ ...prev, department: selectedDept }));
    }
    if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAddObjective = () => setFormData(prev => ({ ...prev, manualObjectives: [...prev.manualObjectives, ''] }));
  const handleRemoveObjective = (index) => setFormData(prev => ({ ...prev, manualObjectives: prev.manualObjectives.filter((_, i) => i !== index) }));
  const handleObjectiveChange = (index, value) => {
    const newObjs = [...formData.manualObjectives];
    newObjs[index] = value;
    setFormData(prev => ({ ...prev, manualObjectives: newObjs }));
    if (errors.objectives) setErrors(prev => ({ ...prev, objectives: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Project title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.faculty || !formData.faculty.trim()) newErrors.faculty = 'Please specify your faculty';
    if (!formData.department || !formData.department.trim()) newErrors.department = 'Please specify your department';
    
    const validObjectives = formData.manualObjectives.filter(o => o.trim());
    if (validObjectives.length === 0) {
      newErrors.objectives = 'At least one research objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProject = async () => {
    if (isLoading) return; 

    if (validateForm()) {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 🛡️ IDEMPOTENCY CHECK: Prevent duplicates
        // 1. Check if this specific payment is already linked to a project
        const hasFreeAccess = userProfile?.role === 'admin' || userProfile?.role === 'support';
        if (!hasFreeAccess && pendingPayment) {
          const { data: alreadyLinked } = await supabase
            .from('payment_transactions')
            .select('project_id')
            .eq('id', pendingPayment.id)
            .single();
          
          if (alreadyLinked?.project_id) {
            console.log('Payment already linked, redirecting...');
            router.replace(`/premium/workspace?id=${alreadyLinked.project_id}`);
            return;
          }
        }

        // 2. Check for recent project with same title (Safety fallback)
        const { data: existingRecent } = await supabase
          .from('premium_projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', formData.projectTitle.trim())
          .gt('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
          .maybeSingle();

        if (existingRecent) {
          console.log('Recent identical project found, redirecting...');
          router.replace(`/premium/workspace?id=${existingRecent.id}`);
          return;
        }

        let sourceTemplate = null;
        let finalStructure = { chapters: [] };

        if (searchParams.get('templateId')) {
          const { data: specificTemplate } = await supabase.from('templates').select('*').eq('id', searchParams.get('templateId')).single();
          if (specificTemplate) sourceTemplate = specificTemplate;
          if (sourceTemplate) finalStructure = sourceTemplate.structure;
        } else if (formData.templateType === 'custom') {
          const stored = sessionStorage.getItem('custom_template_structure');
          if (stored) finalStructure = JSON.parse(stored);
        } else {
          // Map UI 'thesis' to database '6-chapter-thesis'
          const dbTemplateType = formData.templateType === 'thesis' ? '6-chapter-thesis' : formData.templateType;

          // Fetch all templates for this template type
          const { data: allTypeTemplates } = await supabase
            .from('templates')
            .select('*')
            .eq('template_type', dbTemplateType);

          if (allTypeTemplates && allTypeTemplates.length > 0) {
            const userFac = (formData.faculty || '').trim().toLowerCase();
            
            // Build keyword synonyms for matching
            const keywords = [userFac];
            if (userFac.includes('pharm')) {
              keywords.push('pharmacy', 'pharmaceutical');
            } else if (userFac.includes('med') || userFac.includes('health') || userFac.includes('nurs')) {
              keywords.push('basic medical sciences', 'medicine', 'medical');
            } else if (userFac.includes('manage') || userFac.includes('business') || userFac.includes('account')) {
              keywords.push('management sciences', 'business');
            } else if (userFac.includes('art') || userFac.includes('humanit')) {
              keywords.push('arts & humanities', 'arts');
            } else if (userFac.includes('agric')) {
              keywords.push('agricultural sciences', 'agriculture');
            } else if (userFac.includes('environ')) {
              keywords.push('environmental science', 'environmental sciences', 'environmental');
            } else if (userFac.includes('sci') && !userFac.includes('social')) {
              keywords.push('sciences', 'science');
            } else if (userFac.includes('social')) {
              keywords.push('social sciences');
            } else if (userFac.includes('law')) {
              keywords.push('law');
            } else if (userFac.includes('educat')) {
              keywords.push('education');
            }

            // Find matching template based on faculty keywords
            const matched = allTypeTemplates.find(t => {
              if (!t.faculty) return false;
              const tFac = t.faculty.toLowerCase();
              return keywords.some(kw => tFac.includes(kw) || kw.includes(tFac));
            });

            if (matched) {
              sourceTemplate = matched;
            } else {
              // Default fallback: engineering or first available
              sourceTemplate = allTypeTemplates.find(t => t.faculty?.toLowerCase().includes('engineering')) || allTypeTemplates[0];
            }
          }
          if (sourceTemplate) finalStructure = sourceTemplate.structure;
        }

        // Ensure every chapter in finalStructure has a unique 1-indexed number, chapter, and id
        if (finalStructure?.chapters && Array.isArray(finalStructure.chapters)) {
          finalStructure.chapters = finalStructure.chapters.map((ch, idx) => ({
            ...ch,
            number: idx + 1,
            chapter: idx + 1,
            id: idx + 1,
            title: ch.title || `Chapter ${idx + 1}`
          }));
        }

        const customTemplateData = {
          user_id: user.id,
          name: sourceTemplate ? sourceTemplate.name : 'Custom Template',
          description: sourceTemplate ? sourceTemplate.description : 'Custom project structure',
          structure: finalStructure,
          source_template_id: sourceTemplate?.id || null
        };

        const { data: newCustomTemplate, error: templateError } = await supabase.from('custom_templates').insert(customTemplateData).select().single();
        if (templateError) throw new Error('Template creation failed: ' + templateError.message);

        sessionStorage.removeItem('custom_template_structure');

        const { data: newProject, error: projectError } = await supabase
          .from('premium_projects')
          .insert({
            user_id: user.id,
            title: formData.projectTitle,
            description: formData.description,
            faculty: formData.faculty,
            department: formData.department,
            status: 'in_progress',
            tier: 'premium',
            current_chapter: 1,
            tokens_limit: 300000,
            tokens_used: 0,
            payment_status: hasFreeAccess ? 'admin_bypass' : 'paid',
            amount_paid: hasFreeAccess ? 0 : PRICING.PREMIUM,
            template_id: newCustomTemplate.id,
            use_manual_objectives: true,
            manual_objectives: formData.manualObjectives.filter(o => o.trim())
          })
          .select()
          .single();

        if (projectError) throw new Error(projectError.message);

        // ✅ Link payment to project securely via backend
        if (pendingPayment) {
          try {
            await fetch('/api/admin/consume-transaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId: pendingPayment.id,
                projectId: newProject.id,
                userId: user.id
              })
            });
          } catch (consumeErr) {
            console.error('Failed to consume transaction:', consumeErr);
          }
        }

        router.replace(`/premium/workspace?id=${newProject.id}`);
      } catch (err) {
        console.error('Error creating project:', err);
        showNotification('Creation Error', err.message || 'Failed to create project.', 'error');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="project-description-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="description-container">
        <div className="header-section">
          <motion.img initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} src="/premium_icon/favicon.ico" alt="Logo" className="icon-badge" />
          <h1>Project Details</h1>
          <p>Tell us about your academic project</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="form-card">
          <div className="form-group">
            <label htmlFor="projectTitle" className="form-label">Project Title <span className="required">*</span></label>
            <input id="projectTitle" type="text" value={formData.projectTitle} onChange={(e) => handleInputChange('projectTitle', e.target.value)} placeholder="Enter your project title" className={`form-input ${errors.projectTitle ? 'error' : ''}`} />
            {errors.projectTitle && <span className="error-message">{errors.projectTitle}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Project Description / Scope <span className="required">*</span></label>
            <textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Provide a detailed overview of your project" className={`form-textarea ${errors.description ? 'error' : ''}`} rows={5} />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          {/* Mandatory Objectives Section */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: '#111827', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Icons.Target /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#111827' }}>Aims & Objectives <span style={{ color: '#ef4444' }}>*</span></p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Define specific goals for your project</p>
                </div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 8px' }}>
              {formData.manualObjectives.map((obj, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#111827', minWidth: '32px', textAlign: 'center' }}>{idx + 1}</div>
                  <input type="text" value={obj} onChange={(e) => handleObjectiveChange(idx, e.target.value)} placeholder="e.g. To design a smart irrigation system..." style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                  {formData.manualObjectives.length > 1 && (
                    <button type="button" onClick={() => handleRemoveObjective(idx)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Icons.Trash /></button>
                  )}
                </div>
              ))}
              {errors.objectives && <span className="error-message" style={{ marginLeft: '40px' }}>{errors.objectives}</span>}
              <button type="button" onClick={handleAddObjective} style={{ marginTop: '6px', padding: '12px', background: 'white', border: '1px dashed #111827', color: '#111827', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Icons.Plus /> Add Another Objective
              </button>
            </motion.div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faculty" className="form-label">Faculty <span className="required">*</span></label>
              {userProfile?.is_international || formData.templateType === 'custom' ? (
                <input 
                  type="text" 
                  value={formData.faculty} 
                  onChange={(e) => handleInputChange('faculty', e.target.value)} 
                  placeholder="e.g. School of Engineering" 
                  className={`form-input ${errors.faculty ? 'error' : ''}`} 
                />
              ) : (
                <>
                  <select 
                    id="faculty" 
                    value={isOtherFaculty ? 'Other' : formData.faculty} 
                    onChange={handleFacultyChange} 
                    className={`form-select ${errors.faculty ? 'error' : ''}`}
                  >
                    <option value="">Select Faculty</option>
                    {facultiesList.map((fac, index) => (<option key={index} value={fac}>{fac}</option>))}
                    <option value="Other">Other</option>
                  </select>
                  {isOtherFaculty && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        value={customFaculty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFaculty(val);
                          setFormData(prev => ({ ...prev, faculty: val }));
                          if (errors.faculty) setErrors(prev => ({ ...prev, faculty: '' }));
                        }}
                        placeholder="Enter your faculty name"
                        className={`form-input ${errors.faculty ? 'error' : ''}`}
                      />
                    </div>
                  )}
                </>
              )}
              {errors.faculty && <span className="error-message">{errors.faculty}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">Department <span className="required">*</span></label>
              {userProfile?.is_international || isOtherFaculty || formData.templateType === 'custom' ? (
                <input 
                  type="text" 
                  value={formData.department} 
                  onChange={(e) => handleInputChange('department', e.target.value)} 
                  placeholder="Enter your department name" 
                  className={`form-input ${errors.department ? 'error' : ''}`} 
                />
              ) : (
                <>
                  <select 
                    id="department" 
                    value={isOtherDepartment ? 'Other' : formData.department} 
                    onChange={handleDepartmentChange} 
                    disabled={!formData.faculty} 
                    className={`form-select ${errors.department ? 'error' : ''} ${!formData.faculty ? 'disabled' : ''}`}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((dept, index) => (<option key={index} value={dept}>{dept}</option>))}
                    <option value="Other">Other</option>
                  </select>
                  {isOtherDepartment && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        value={customDepartment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomDepartment(val);
                          setFormData(prev => ({ ...prev, department: val }));
                          if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
                        }}
                        placeholder="Enter your department name"
                        className={`form-input ${errors.department ? 'error' : ''}`}
                      />
                    </div>
                  )}
                </>
              )}
              {errors.department && <span className="error-message">{errors.department}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-back" onClick={() => router.replace('/premium/template-selection')}>← Back</button>
            <button type="button" className="btn-create" onClick={handleCreateProject}>Create Project →</button>
          </div>
        </motion.div>
      </motion.div>

      <LoadingModal isOpen={isLoading} loadingText="Setting up your workspace..." />
      <CustomModal isOpen={notification.isOpen} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} title={notification.title} message={notification.message} type={notification.type} />
    </div>
  );
}

export default function ProjectDescription() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ProjectDescriptionContent />
    </Suspense>
  );
}
