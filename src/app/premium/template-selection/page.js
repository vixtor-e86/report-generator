'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FacultyModal from '@/components/premium/modals/FacultyModal';
import DepartmentModal from '@/components/premium/modals/DepartmentModal';
import CustomModal from '@/components/premium/modals/CustomModal';
import LoadingModal from '@/components/premium/modals/LoadingModal';
import ManualBuilder from '@/components/premium/modals/ManualBuilder';
import TemplateCard from '@/components/premium/TemplateCard';
import '@/styles/template-selection.css';

export default function TemplateSelection() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');

  // NEW: Custom Notification State
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showNotification = (title, message, type = 'info') => {
    setNotification({ isOpen: true, title, message, type });
  };

  const templates = [
    {
      id: '5-chapter',
      title: '5-Chapter Project',
      description: 'Standard undergraduate project structure',
      icon: '📘',
      color: 'blue',
      action: () => setActiveModal('faculty')
    },
    {
      id: 'thesis',
      title: 'Thesis (6 Chapters)',
      description: 'Postgraduate research thesis',
      icon: '🎓',
      color: 'purple',
      action: () => setActiveModal('department')
    },
    {
      id: 'custom',
      title: 'Custom Template',
      description: 'Build or upload your own structure',
      icon: '⚡',
      color: 'orange',
      action: () => setActiveModal('custom')
    },
  ];

  const handleProceed = async (templateType, additionalData = {}) => {
    try {
      // Close any open modal
      setActiveModal(null);
      setIsLoading(true);

      // Helper for delay
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Step 1: Initialization
      if (templateType === '5-chapter') {
        setLoadingText(`Initializing ${additionalData.faculty?.name || 'Selected'} template...`);
      } else if (templateType === 'thesis') {
        setLoadingText(`Configuring ${additionalData.department?.name || 'Selected'} thesis...`);
      } else if (templateType === 'custom') {
        setLoadingText('Initializing custom builder...');
      }

      await wait(1500);

      // Step 2: Compiling
      setLoadingText('Compiling document structure...');
      await wait(1500);

      // Step 3: Optimization
      setLoadingText('Optimizing project assets...');
      await wait(1000);
      
      // Store custom structure if present
      if (templateType === 'custom' && additionalData.chapters) {
        sessionStorage.setItem('custom_template_structure', JSON.stringify({ chapters: additionalData.chapters }));
      } else {
        sessionStorage.removeItem('custom_template_structure');
      }

      // Build query params
      const params = new URLSearchParams();
      if (templateType) params.set('type', templateType);
      if (additionalData.faculty) params.set('faculty', additionalData.faculty.name || additionalData.faculty);
      if (additionalData.department) params.set('department', additionalData.department.name || additionalData.department);
      
      // Navigate
      router.push(`/premium/page-description?${params.toString()}`);
    } catch (err) {
      setIsLoading(false);
      showNotification('Error', 'An unexpected error occurred. Please try again.', 'error');
    }
  };

  return (
    <div className="template-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="content-wrapper"
      >
        <div className="header-section">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="logo-container"
          >
            <img src="/premium_icon/favicon.ico" alt="W3 Writelab" className="logo-icon" />
            <span className="premium-tag">PREMIUM</span>
          </motion.div>
          <h1>Choose Your Template</h1>
          <p>Select the structure that matches your academic project</p>
        </div>

        <div className="templates-grid">
          {templates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      <FacultyModal
        isOpen={activeModal === 'faculty'}
        onClose={() => setActiveModal(null)}
        onSelect={(faculty) => {
          handleProceed('5-chapter', { faculty });
        }}
      />

      <DepartmentModal
        isOpen={activeModal === 'department'}
        onClose={() => setActiveModal(null)}
        onSelect={(dept) => {
          handleProceed('thesis', { department: dept });
        }}
      />

      {/* Manual Template Builder Modal */}
      {activeModal === 'custom' && (
        <div className="modal-backdrop" style={{ zIndex: 100 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-container"
          >
            <div className="modal-header">
              <h2>Custom Structure</h2>
              <p>Design your own chapter and section layout</p>
              <button onClick={() => setActiveModal(null)} className="close-btn">×</button>
            </div>
            <ManualBuilder 
              onBack={() => setActiveModal(null)}
              onProceed={(data) => {
                handleProceed('custom', data);
              }}
            />
          </motion.div>
        </div>
      )}

      <CustomModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      <LoadingModal isOpen={isLoading} loadingText={loadingText} />
    </div>
  );
}
