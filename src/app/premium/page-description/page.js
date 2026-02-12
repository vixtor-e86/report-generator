'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import '@/styles/project-description.css';

function ProjectDescriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    faculty: searchParams.get('faculty') || '',
    department: searchParams.get('department') || '',
    templateType: searchParams.get('type') || '5-chapter'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Data for dropdowns
  const [universityData, setUniversityData] = useState({});
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        setUniversityData(data);
        setFacultiesList(Object.keys(data));
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    }
    fetchData();
  }, []);

  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      faculty: selectedFaculty, 
      department: '' // Reset department when faculty changes
    }));
    
    if (errors.faculty) setErrors(prev => ({ ...prev, faculty: '' }));

    // Update department list
    if (selectedFaculty && Array.isArray(universityData[selectedFaculty])) {
      setDepartmentsList(universityData[selectedFaculty]);
    } else {
      setDepartmentsList([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectTitle.trim()) {
      newErrors.projectTitle = 'Project title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    
    if (!formData.faculty) {
      newErrors.faculty = 'Please select a faculty';
    }
    
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProject = async () => {
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Find Source Template (if applicable)
        let sourceTemplate = null;
        if (formData.templateType !== 'custom') {
          // Try to find a specific template for this faculty/type
          const { data: templates } = await supabase
            .from('templates')
            .select('*')
            .eq('template_type', formData.templateType)
            .ilike('faculty', `%${formData.faculty}%`) // Fuzzy match faculty
            .limit(1);
          
          if (templates && templates.length > 0) {
            sourceTemplate = templates[0];
          } else {
            // Fallback to generic if no faculty specific one
            const { data: generic } = await supabase
              .from('templates')
              .select('*')
              .eq('template_type', formData.templateType)
              .limit(1);
            if (generic) sourceTemplate = generic[0];
          }
        }

        // 2. Create Custom Template (Clone)
        const customTemplateData = {
          user_id: user.id,
          name: sourceTemplate ? sourceTemplate.name : 'Custom Template',
          description: sourceTemplate ? sourceTemplate.description : 'Custom project structure',
          structure: sourceTemplate ? sourceTemplate.structure : { chapters: [] }, // Default or Cloned
          source_template_id: sourceTemplate?.id || null
        };

        const { data: newCustomTemplate, error: templateError } = await supabase
          .from('custom_templates')
          .insert(customTemplateData)
          .select()
          .single();

        if (templateError) throw new Error('Failed to create project template: ' + templateError.message);

        // 3. Create Premium Project
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
            tokens_limit: 500000,
            tokens_used: 0,
            payment_status: 'paid',
            amount_paid: 20000,
            template_id: newCustomTemplate.id // Link to the NEW custom template
          })
          .select()
          .single();

        if (projectError) throw new Error(projectError.message);

        // Navigate to workspace with ID
        router.push(`/premium/workspace?id=${newProject.id}`);
      } catch (err) {
        console.error('Error creating project:', err);
        alert(err.message || 'Failed to create project. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const characterCount = formData.description.length;
  const isOverLimit = characterCount > 500;

  return (
    <div className="project-description-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="description-container"
      >
        <div className="header-section">
          <motion.img
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            src="/favicon.ico"
            alt="Logo"
            className="icon-badge"
          />
          <h1>Project Details</h1>
          <p>Tell us about your academic project</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="form-card"
        >
          <div className="form-group">
            <label htmlFor="projectTitle" className="form-label">
              Project Title <span className="required">*</span>
            </label>
            <input
              id="projectTitle"
              type="text"
              value={formData.projectTitle}
              onChange={(e) => handleInputChange('projectTitle', e.target.value)}
              placeholder="Enter your project title"
              className={`form-input ${errors.projectTitle ? 'error' : ''}`}
            />
            {errors.projectTitle && (
              <span className="error-message">{errors.projectTitle}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Short Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide a brief overview of your project (max 500 characters)"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              rows={5}
            />
            <div className="textarea-footer">
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
              <span className={`character-count ${isOverLimit ? 'over-limit' : ''}`}>
                {characterCount}/500
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faculty" className="form-label">
                Faculty <span className="required">*</span>
              </label>
              <select
                id="faculty"
                value={formData.faculty}
                onChange={handleFacultyChange}
                className={`form-select ${errors.faculty ? 'error' : ''}`}
              >
                <option value="">Select Faculty</option>
                {facultiesList.map((fac, index) => (
                  <option key={index} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
              {errors.faculty && (
                <span className="error-message">{errors.faculty}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">
                Department <span className="required">*</span>
              </label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={!formData.faculty}
                className={`form-select ${errors.department ? 'error' : ''} ${!formData.faculty ? 'disabled' : ''}`}
              >
                <option value="">Select Department</option>
                {departmentsList.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <span className="error-message">{errors.department}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-back"
              onClick={() => router.back()}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn-create"
              onClick={handleCreateProject}
            >
              Create Project →
            </button>
          </div>
        </motion.div>

        <div className="info-cards">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="info-card"
          >
            <div className="info-icon">💡</div>
            <div>
              <h3>Pro Tip</h3>
              <p>Keep your description concise and focused on your main research objectives</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="info-card"
          >
            <div className="info-icon">✏️</div>
            <div>
              <h3>Note</h3>
              <p>You can write your full abstract later in the workspace editor</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <LoadingModal 
        isOpen={isLoading} 
        loadingText="Setting up your workspace..." 
      />
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