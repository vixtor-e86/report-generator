'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import '@/styles/project-description.css';

export default function ProjectDescription() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    faculty: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const faculties = [
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Sciences' },
    { id: 3, name: 'Arts' },
    { id: 4, name: 'Social Sciences' },
    { id: 5, name: 'Medicine' },
    { id: 6, name: 'Law' },
    { id: 7, name: 'Education' },
    { id: 8, name: 'Business' },
  ];

  const departments = [
    { id: 1, name: 'Computer Science', facultyId: 1 },
    { id: 2, name: 'Electrical Engineering', facultyId: 1 },
    { id: 3, name: 'Mechanical Engineering', facultyId: 1 },
    { id: 4, name: 'Physics', facultyId: 2 },
    { id: 5, name: 'Chemistry', facultyId: 2 },
    { id: 6, name: 'Biology', facultyId: 2 },
    { id: 7, name: 'English', facultyId: 3 },
    { id: 8, name: 'History', facultyId: 3 },
    { id: 9, name: 'Philosophy', facultyId: 3 },
  ];

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

  const handleCreateProject = () => {
    if (validateForm()) {
      setIsLoading(true);
      console.log('Creating project with:', formData);
      
      // Simulate loading for 3 seconds then navigate to workspace
      setTimeout(() => {
        setIsLoading(false);
        router.push('/premium/workspace');
      }, 3000);
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
                onChange={(e) => handleInputChange('faculty', e.target.value)}
                className={`form-select ${errors.faculty ? 'error' : ''}`}
              >
                <option value="">Select Faculty</option>
                {faculties.map(faculty => (
                  <option key={faculty.id} value={faculty.name}>
                    {faculty.name}
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
                className={`form-select ${errors.department ? 'error' : ''}`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
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