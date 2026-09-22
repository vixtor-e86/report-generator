"use client";
import React from 'react';
import { 
  GraduationCap, Sparkles, CheckCircle2, Wallet, 
  Percent, ArrowRight, X, Mail, Phone, School, Coins
} from 'lucide-react';

export default function StudentLeadModal({ 
  isOpen, 
  onClose, 
  referralCode = '', 
  onOpenReferral = null 
}) {
  if (!isOpen) return null;

  const whatsappNumber = "08031797655";
  const emailAddress = "w33writelab@gmail.com";

  const whatsappMessage = encodeURIComponent(
    `Hello W3 WriteLab, I am interested in becoming a Campus Student Lead! I would like to submit project/thesis templates for my school/department so I can earn 10% on each project use.${referralCode ? ` My Referral Code is: ${referralCode}` : ''}`
  );
  const whatsappUrl = `https://wa.me/2348031797655?text=${whatsappMessage}`;

  const emailSubject = encodeURIComponent("Student Lead Application & Template Submission - W3 WriteLab");
  const emailBody = encodeURIComponent(
    `Hello W3 WriteLab Team,\n\nI want to apply to become a Campus Student Lead and submit templates for my institution to earn 10% commission on every project use.\n\nInstitution Name: \nFaculty / Department: \nLevel / Class: \nMy Account Email: \nMy Referral Code (if available): ${referralCode || ''}\n\nAttached / Provided below are details of our institutional guidelines:\n[Please attach your school guidelines, handbook, or sample doc]\n\nThank you!`
  );
  const emailUrl = `mailto:${emailAddress}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[36px] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-b border-slate-100 flex items-start justify-between relative">
          <div className="pr-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-2 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Campus Ambassador Program
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Become a Student Lead & Earn 10%
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Provide your school&apos;s project or thesis templates and earn passive income every time a student uses your template on W3 WriteLab.
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 shadow-sm border border-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* Key Value Highlight Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-amber-200">
              <Percent className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                10% Lifetime Royalty per Project
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                Whenever any student at your university or department generates a premium blueprint using your approved template, you earn a 10% commission.
              </p>
            </div>
          </div>

          {/* How It Works Steps */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 ml-1">
              How the Program Works
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    Send Us Your Institution&apos;s Template Guidelines
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Provide your university or department&apos;s official project handbook, thesis structure, chapter guidelines, or font/margin rules.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    We Integrate & Link It to Your Referral ID
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Our engineering team standardizes the template into the W3 generator and attaches your unique referral ID directly to it.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    Earn 10% & Redeem in Your Referral Wallet
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Royalties accumulate directly in your <strong>Referral Wallet</strong>. Once your balance reaches ₦10,000, you can request an instant bank transfer!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Submission Options */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">
              Contact Us to Submit Your Template
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group active:scale-95 text-center"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100 leading-none">Chat on WhatsApp</div>
                  <div className="text-xs font-black leading-tight mt-0.5">{whatsappNumber}</div>
                </div>
              </a>

              {/* Email Button */}
              <a
                href={emailUrl}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group active:scale-95 text-center"
              >
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">Send by Email</div>
                  <div className="text-xs font-black leading-tight mt-0.5">{emailAddress}</div>
                </div>
              </a>
            </div>
          </div>

          {/* Referral Wallet Quick Access */}
          {onOpenReferral && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReferral();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-indigo-200"
              >
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>Check My Referral Wallet & Earnings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-indigo-500" />
            Empowering campus tech & academic communities
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold uppercase text-[10px] tracking-wider"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}
