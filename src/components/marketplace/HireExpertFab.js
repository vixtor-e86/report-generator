"use client";
import { useState } from 'react';
import { 
  Briefcase, MessageCircle, Mail, Phone, 
  X, Check, Copy, ExternalLink, Sparkles, 
  BookOpen, BarChart3, Code2, Cpu, CircuitBoard, 
  Zap, Compass, Wrench, ArrowRight
} from 'lucide-react';

const HIRE_SERVICES = [
  {
    id: 'journal-research',
    title: 'Journal Research & Publication Assistant',
    category: 'Research & Academics',
    description: 'Literature review, manuscript structuring, journal formatting (IEEE, Elsevier, Springer, Scopus), and publication peer-review readiness.',
    icon: BookOpen,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    badge: 'Publishing'
  },
  {
    id: 'spss-analyst',
    title: 'SPSS Analyst',
    category: 'Data Analysis',
    description: 'Statistical analysis, hypothesis testing, ANOVA, t-test, Chi-square, regression, reliability tests, and comprehensive result interpretation.',
    icon: BarChart3,
    iconColor: 'text-blue-600 bg-blue-50 border-blue-100',
    badge: 'Statistics'
  },
  {
    id: 'software-dev',
    title: 'Project Software Development',
    category: 'Software & AI',
    description: 'Full-stack web applications, mobile apps, desktop systems, AI/ML models, backend APIs, and embedded software development with full source code.',
    icon: Code2,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    badge: 'Development'
  },
  {
    id: 'matlab-sim',
    title: 'MATLAB Simulation',
    category: 'Engineering & Simulation',
    description: 'Mathematical modelling, Simulink control systems, signal & image processing, power systems analysis, and custom algorithm simulations.',
    icon: Cpu,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-100',
    badge: 'Simulation'
  },
  {
    id: 'proteus-sim',
    title: 'Proteus Simulation',
    category: 'Hardware Simulation',
    description: 'Circuit schematic design, microcontroller simulation (Arduino, PIC, STM32, 8051), and interactive PCB virtual verification.',
    icon: CircuitBoard,
    iconColor: 'text-teal-600 bg-teal-50 border-teal-100',
    badge: 'Electronics'
  },
  {
    id: 'circuit-design',
    title: 'Circuit Design',
    category: 'Hardware & Electronics',
    description: 'Custom schematic capture, breadboard prototyping layouts, PCB design & routing, power supplies, sensors, and component sourcing lists.',
    icon: Zap,
    iconColor: 'text-orange-600 bg-orange-50 border-orange-100',
    badge: 'Hardware'
  },
  {
    id: 'autocad-design',
    title: 'AutoCAD Design',
    category: 'CAD & Drafting',
    description: '2D technical drafting, 3D mechanical modelling, architectural floor plans, civil engineering structural plans, and manufacturing blueprints.',
    icon: Compass,
    iconColor: 'text-purple-600 bg-purple-50 border-purple-100',
    badge: 'Drafting'
  },
  {
    id: 'project-construction',
    title: 'Project Construction & Fabrication',
    category: 'Physical Prototyping',
    description: 'Complete physical build, soldering, testing, and casing across: Electronic, Electrical, Computer Science, Mechanical, Mechatronic, Robotics, and Computer Engineering.',
    icon: Wrench,
    iconColor: 'text-rose-600 bg-rose-50 border-rose-100',
    badge: 'Fabrication'
  }
];

const CONTACT_INFO = {
  phone: '08031797655',
  phoneFormatted: '+234 803 179 7655',
  email: 'w33writelab@gmail.com',
  whatsappBase: 'https://wa.me/2348031797655'
};

export default function HireExpertFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const getWhatsAppUrl = (serviceTitle = '') => {
    const text = serviceTitle 
      ? `Hello W3 WriteLab, I would like to hire an expert for: ${serviceTitle}. Please provide pricing and timeline.`
      : `Hello W3 WriteLab, I would like to hire an expert for my project.`;
    return `${CONTACT_INFO.whatsappBase}?text=${encodeURIComponent(text)}`;
  };

  const getEmailUrl = (serviceTitle = '') => {
    const subject = serviceTitle 
      ? `Hire Expert Inquiry: ${serviceTitle}` 
      : `Hire Expert Inquiry - W3 WriteLab`;
    const body = serviceTitle 
      ? `Hello W3 WriteLab Team,\n\nI am interested in hiring an expert for: ${serviceTitle}.\n\nPlease let me know the requirements, estimated cost, and turnaround time.\n\nThank you.`
      : `Hello W3 WriteLab Team,\n\nI am interested in hiring an expert for my project.\n\nThank you.`;
    return `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center group">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-indigo-500/20 border border-slate-700/80 transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Hire an expert"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="font-extrabold text-sm tracking-wide">Hire an Expert</span>
          </div>
          
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white rounded-full">
            Available
          </span>
        </button>
      </div>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-start justify-between relative">
              <div className="pr-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-100/60">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Technical Services & Freelance Hub
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Hire Verified Specialists
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                  Collaborate directly with our vetted engineers, researchers, and data analysts for custom project execution, simulations, and fabrication.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Contact Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6 bg-slate-50 border-b border-slate-100">
              {/* WhatsApp Quick Action */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-100 block">Instant WhatsApp</span>
                    <span className="font-extrabold text-sm sm:text-base text-white">{CONTACT_INFO.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white group-hover:text-emerald-700 transition-colors">
                  Chat <ArrowRight className="w-3 h-3" />
                </div>
              </a>

              {/* Email Quick Action */}
              <a
                href={getEmailUrl()}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="truncate pr-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">Email Inquiry</span>
                    <span className="font-extrabold text-sm sm:text-base text-white truncate block">{CONTACT_INFO.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg group-hover:bg-white group-hover:text-slate-900 transition-colors shrink-0">
                  Send <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            </div>

            {/* Scrollable Services List */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-3.5 flex-1 divide-y divide-slate-100">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Available Specializations ({HIRE_SERVICES.length})
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  Click any service to request on WhatsApp
                </span>
              </div>

              {HIRE_SERVICES.map((svc) => {
                const IconComponent = svc.icon;
                return (
                  <div
                    key={svc.id}
                    className="pt-3.5 first:pt-0 group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${svc.iconColor}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                            {svc.title}
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {svc.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                          {svc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0">
                      <a
                        href={getWhatsAppUrl(svc.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
                        </svg>
                        Hire on WhatsApp
                      </a>
                      
                      <a
                        href={getEmailUrl(svc.title)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Send email for this service"
                        aria-label="Email inquiry for this service"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Footer / Quick Copy Tools */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call or WhatsApp: <strong className="text-white">{CONTACT_INFO.phone}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(CONTACT_INFO.phone, 'phone')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 font-semibold"
                >
                  {copiedType === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedType === 'phone' ? 'Copied Number!' : 'Copy Phone'}
                </button>

                <button
                  onClick={() => copyToClipboard(CONTACT_INFO.email, 'email')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 font-semibold"
                >
                  {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedType === 'email' ? 'Copied Email!' : 'Copy Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
