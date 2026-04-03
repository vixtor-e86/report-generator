// src/components/premium/workspace/TourGuide.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const TOUR_STEPS = [
  { target: '#step-sidebar', title: 'Project Structure', content: 'This is your project outline. Select a chapter here to start writing or editing.', position: 'right' },
  { target: '#step-generate', title: 'AI Architect', content: 'Click here to generate content. You can upload experimental data for the AI to analyze!', position: 'bottom' },
  { target: '#step-visuals', title: 'Diagram Studio', content: 'Need a flowchart or technical illustration? Open the Visual Studio to draw with AI.', position: 'left' },
  { target: '#step-references', title: 'Reference Finder', content: 'Search for academic papers and automatically fetch citations for your project.', position: 'left' },
  { target: '#step-humanizer', title: 'Bypass Detectors', content: 'Use the Humanizer to ensure your project sounds natural and bypasses AI detection.', position: 'left' },
  { target: '#step-presentation', title: 'Presentation Builder', content: 'Ready to present? Generate professional PowerPoint slides based on your report.', position: 'left' },
  { target: '#step-files-tab', title: 'Project Files', content: 'Upload and manage your project files here. Supported formats: PDF, DOCX, XLSX, and TXT files.', position: 'left' },
  { target: '#step-export', title: 'Final Export', content: 'When ready, export your project as a professional PDF or an editable Word document.', position: 'bottom' }
];

export default function TourGuide({ projectId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const updatePosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < TOUR_STEPS.length) {
      const el = document.querySelector(TOUR_STEPS[currentStep].target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else if (retryCount < 5) {
        // If element not found yet, wait and retry
        setTimeout(() => setRetryCount(prev => prev + 1), 500);
      }
    }
  }, [currentStep, retryCount]);

  useEffect(() => {
    // Check if user has seen the tour FOR THIS SPECIFIC PROJECT
    if (!projectId) return;
    const hasSeenTour = localStorage.getItem(`has_seen_tour_${projectId}`);
    
    if (!hasSeenTour) {
      const timer = setTimeout(() => setCurrentStep(0), 3000); 
      return () => clearTimeout(timer);
    }
  }, [projectId]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, updatePosition]);

  const handleNext = () => {
    if (currentStep === TOUR_STEPS.length - 1) handleComplete();
    else {
      setRetryCount(0);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(-1);
    if (projectId) {
      localStorage.setItem(`has_seen_tour_${projectId}`, 'true');
    }
    if (onComplete) onComplete();
  };

  if (currentStep < 0 || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];

  // Responsive bubble positioning
  const bubbleWidth = 280;
  let top = step.position === 'bottom' ? targetRect.bottom + 20 : step.position === 'top' ? targetRect.top - 200 : targetRect.top;
  let left = step.position === 'right' ? targetRect.right + 20 : step.position === 'left' ? targetRect.left - (bubbleWidth + 20) : targetRect.left + (targetRect.width/2) - (bubbleWidth/2);

  // Safety: Prevent overflow
  if (left < 20) left = 20;
  if (left + bubbleWidth > window.innerWidth) left = window.innerWidth - (bubbleWidth + 20);

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Dynamic Backdrop Hole */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-all duration-500" style={{ 
        clipPath: `polygon(0% 0%, 0% 100%, ${targetRect.left - 10}px 100%, ${targetRect.left - 10}px ${targetRect.top - 10}px, ${targetRect.right + 10}px ${targetRect.top - 10}px, ${targetRect.right + 10}px ${targetRect.bottom + 10}px, ${targetRect.left - 10}px ${targetRect.bottom + 10}px, ${targetRect.left - 10}px 100%, 100% 100%, 100% 0%)` 
      }} />

      {/* Bubble */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute pointer-events-auto bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] p-6 border border-slate-100"
        style={{ top, left, width: bubbleWidth }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">{currentStep + 1}</span>
          <h4 className="font-black text-slate-900 text-sm tracking-tight">{step.title}</h4>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <button onClick={handleComplete} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Skip</button>
          <button onClick={handleNext} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black shadow-lg hover:bg-black transition-all active:scale-95">
            {currentStep === TOUR_STEPS.length - 1 ? 'GET STARTED' : 'NEXT STEP'}
          </button>
        </div>

        <div className="flex gap-1.5 mt-6 justify-center">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
