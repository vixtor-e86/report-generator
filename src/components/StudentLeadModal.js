"use client";
import React from 'react';
import { 
  Gift, Percent, X, Mail, School, Lock
} from 'lucide-react';

export default function StudentLeadModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const whatsappNumber = "08031797655";
  const emailAddress = "w33writelab@gmail.com";

  const whatsappMessage = encodeURIComponent(
    "Hello W3 WriteLab, I am interested in becoming a Campus Student Lead! I would like to submit project/thesis templates for my school/department so I can earn 10% on each project use."
  );
  const whatsappUrl = `https://wa.me/2348031797655?text=${whatsappMessage}`;

  const emailSubject = encodeURIComponent("Student Lead Application & Template Submission - W3 WriteLab");
  const emailBody = encodeURIComponent(
    "Hello W3 WriteLab Team,\n\nI want to apply to become a Campus Student Lead and submit templates for my institution to earn 10% commission on every project use.\n\nInstitution Name: \nFaculty / Department: \nLevel / Class: \nMy Account Email: \n\nAttached / Provided below are details of our institutional guidelines:\n[Please attach your school guidelines, handbook, or sample doc]\n\nThank you!"
  );
  const emailUrl = `mailto:${emailAddress}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl sm:rounded-[36px] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-slate-100 flex items-start justify-between relative">
          <div className="pr-4 sm:pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2 border border-amber-200">
              <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600" />
              Student Lead & Royalties
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Become a Student Lead & Earn 10%
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-600 font-medium mt-1 leading-snug">
              Provide your school&apos;s project or thesis templates and earn passive royalties every time a student uses your template on W3 WriteLab.
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 shadow-sm border border-slate-200/60"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-700">
          
          {/* Key Value Highlight Card */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/80 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-md shadow-orange-200">
              <Percent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                10% Royalty per Project Use
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                Every time any student generates a project using your template, a 10% commission is credited directly to you.
              </p>
            </div>
          </div>

          {/* How It Works Steps */}
          <div>
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-2 sm:mb-3 ml-1">
              How the Program Works
            </h3>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 sm:gap-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    Submit Your School&apos;s Template Guidelines
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                    Contact us via WhatsApp or Email with your university/department project manual, thesis structure, or margin/font rules.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 sm:gap-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    Template Integrated & Linked to You
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                    Our technical team formats the template into the W3 generator and connects your profile to track all usages.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 sm:gap-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    Earn 10% Royalties on Every Usage
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                    You automatically earn 10% every time a project uses your template. Earnings accumulate in your Referral Wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice regarding Referral Workspace Access */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 sm:gap-3 text-[11px] sm:text-xs leading-relaxed text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black uppercase text-[10px] tracking-wider text-amber-950 mb-0.5">
                Referral Center Access Requirement
              </strong>
              <span>
                To access your Referral Wallet, view royalties, and request bank payouts, you must have an active purchased project. The Referral Center is located directly inside your project workspace.
              </span>
            </div>
          </div>

          {/* Contact & Submission Options */}
          <div className="space-y-2.5 sm:space-y-3 pt-1">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 ml-1">
              Contact Us to Become a Lead
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50 transition-all flex items-center justify-center gap-2.5 group active:scale-95 text-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-100 leading-none">Chat on WhatsApp</div>
                  <div className="text-xs sm:text-xs font-black leading-tight mt-0.5">{whatsappNumber}</div>
                </div>
              </a>

              {/* Email Button */}
              <a
                href={emailUrl}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-200/50 transition-all flex items-center justify-center gap-2.5 group active:scale-95 text-center"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">Send via Email</div>
                  <div className="text-xs sm:text-xs font-black leading-tight mt-0.5">{emailAddress}</div>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 truncate pr-2">
            <School className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate">W3 WriteLab Academic Contributor Network</span>
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold uppercase text-[10px] tracking-wider shrink-0"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}
