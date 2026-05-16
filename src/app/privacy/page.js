"use client";
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-[24px] text-blue-600 mb-6 border border-blue-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium">Last Updated: May 14, 2026</p>
        </div>

        <div className="space-y-16">
          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">01</span>
              Information We Collect
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We collect information necessary to provide our AI research services and maintain a secure marketplace. This includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-slate-900">Account Data:</strong> Email, username, and authentication details via Supabase Auth.</li>
                <li><strong className="text-slate-900">Project Data:</strong> Topics, components, and content you input for blueprint generation.</li>
                <li><strong className="text-slate-900">Seller Verification:</strong> Full name, institutional details, and photo identification (passports) for accreditation.</li>
                <li><strong className="text-slate-900">Payment Data:</strong> Transaction references and amount (we do not store full credit card details; these are handled by Paystack/Flutterwave).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">02</span>
              How We Use Your Data
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Your data is used to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Power our AI research engine to generate accurate academic blueprints.</li>
                <li>Verify the identity of sellers to maintain a high-trust marketplace.</li>
                <li>Process payout requests to your provided bank account.</li>
                <li>Send critical platform notifications and updates.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">03</span>
              Data Protection & Security
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium bg-blue-50/50 border border-blue-100 p-8 rounded-[32px]">
              <p>We take data security seriously. All sensitive documents, including seller identity photos, are stored in encrypted Cloudflare R2 buckets. Our database is secured by Supabase with Row Level Security (RLS), ensuring you only ever have access to your own data.</p>
              <p className="mt-4">We do not sell your personal information or project data to third-party advertisers.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">04</span>
              Third-Party Services
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We utilize industry-leading partners to deliver our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-slate-900">AI Processing:</strong> Google Gemini and DeepSeek models.</li>
                <li><strong className="text-slate-900">Cloud Infrastructure:</strong> Vercel and Cloudflare.</li>
                <li><strong className="text-slate-900">Database:</strong> Supabase (PostgreSQL).</li>
                <li><strong className="text-slate-900">Payments:</strong> Paystack and Flutterwave.</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">W3 WRITELAB PRIVACY DIVISION</p>
          <p className="text-slate-500 font-medium">Secure technical exchange protocols active.</p>
        </div>
      </div>
    </div>
  );
}
