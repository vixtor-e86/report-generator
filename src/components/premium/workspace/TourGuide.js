// src/components/premium/workspace/TourGuide.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
  {
    target: '#step-sidebar',
    title: 'Project Structure',
    content: 'This is your project outline. Select a chapter here to start writing or editing.',
    position: 'right'
  },
  {
    target: '#step-generate',
    title: 'AI Architect',
    content: 'Click here to generate content. You can upload experimental data for the AI to analyze!',
    position: 'bottom'
  },
  {
    target: '#step-visuals',
    title: 'Diagram Studio',
    content: 'Need a flowchart or technical illustration? Open the Visual Studio to draw with AI.',
    position: 'left'
  },
  {
    target: '#step-humanizer',
    title: 'Bypass Detectors',
    content: 'Use the Humanizer to ensure your project sounds natural and bypasses AI detection.',
    position: 'left'
  },
  {
    target: '#step-export',
    title: 'Final Export',
    content: 'When ready, export your project as a professional PDF or an editable Word document.',
    position: 'bottom'
  }
];

export default function TourGuide() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('has_seen_premium_tour');
    if (!hasSeenTour) {
      setTimeout(() => setCurrentStep(0), 2000); // Start after 2 seconds
    }
  }, []);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < TOUR_STEPS.length) {
      const el = document.querySelector(TOUR_STEPS[currentStep].target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === TOUR_STEPS.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(-1);
    localStorage.setItem('has_seen_premium_tour', 'true');
  };

  if (currentStep < 0 || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Backdrop with Hole */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" style={{ 
        clipPath: `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)` 
      }} />

      {/* Popover Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute pointer-events-auto bg-white rounded-3xl shadow-2xl p-6 w-72 border border-slate-100"
        style={{
          top: step.position === 'bottom' ? targetRect.bottom + 20 : step.position === 'top' ? targetRect.top - 200 : targetRect.top,
          left: step.position === 'right' ? targetRect.right + 20 : step.position === 'left' ? targetRect.left - 300 : targetRect.left + (targetRect.width/2) - 144,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">{currentStep + 1}</span>
          <h4 className="font-black text-slate-900 text-sm">{step.title}</h4>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <button onClick={handleComplete} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Skip Tour</button>
          <div className="flex gap-2">
            <button onClick={handleNext} className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black shadow-lg hover:bg-black transition-all">
              {currentStep === TOUR_STEPS.length - 1 ? 'FINISH' : 'NEXT'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mt-6 justify-center">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-slate-900' : 'w-1 bg-slate-200'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
