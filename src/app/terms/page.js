"use client";
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Lock, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-black transition-colors" />
            <span className="font-black uppercase text-[10px] tracking-widest text-slate-400 group-hover:text-black">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" className="w-6 h-6" alt="" />
            <span className="font-bold text-slate-900 tracking-tight">W3 WriteLab</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-[24px] text-indigo-600 mb-6 border border-indigo-100">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Terms of Service</h1>
          <p className="text-slate-500 font-medium">Last Updated: May 14, 2026</p>
        </div>

        <div className="space-y-16">
          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">01</span>
              Acceptance of Terms
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>By accessing and using W3 WriteLab, you agree to be bound by these Terms of Service. Our platform is designed as an AI-powered research assistant to help students and professionals structure academic blueprints and technical reports.</p>
              <p>W3 WriteLab is a product of W3 Hub, and all intellectual property rights related to the software, branding, and proprietary AI models belong to W3 Hub.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">02</span>
              Academic Integrity & Use Case
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium bg-amber-50/50 border border-amber-100 p-8 rounded-[32px]">
              <p className="text-amber-900 font-bold italic underline">Notice on Academic Integrity:</p>
              <p>W3 WriteLab provides "Academic Blueprints" and "Research Structures". Our tools are intended to assist in the research, organization, and drafting process. We do not support or encourage academic dishonesty.</p>
              <p>Users are strictly responsible for reviewing, verifying, and ensuring that any work submitted to an educational institution meets that institution's specific standards for originality and integrity.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">03</span>
              Marketplace & Seller Terms
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Sellers on our marketplace must go through an accreditation process involving legal identity and institutional verification. By becoming a seller, you warrant that all blueprints, ebooks, and digital assets you list are your own original creation or that you possess the necessary rights to sell them.</p>
              <p>W3 Hub takes a platform commission on every sale (typically 20-30% depending on the asset type). Payouts are processed to verified bank accounts within 3 working days of a successful withdrawal request.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">04</span>
              Payments & Refunds
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Payments for workspace packages (Standard/Premium) or marketplace assets are processed via secure third-party gateways (Paystack/Flutterwave). Due to the digital and instant nature of our services, refunds are generally not provided unless a technical failure on our platform prevented service delivery.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">05</span>
              Limitation of Liability
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>W3 Hub and its engineers are not liable for any academic or professional consequences resulting from the use or misuse of our tools. The AI-generated content is provided "as is" and should be treated as a draft for professional review.</p>
            </div>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">W3 WRITELAB LEGAL DIVISION</p>
          <p className="text-slate-500 font-medium">For inquiries: <a href="mailto:w3writelab@gmail.com" className="text-indigo-600 font-bold hover:underline">w3writelab@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
