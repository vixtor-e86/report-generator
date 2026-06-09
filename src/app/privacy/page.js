"use client";
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Info, Share2, Cpu, UserCheck, Clock, ShieldAlert, UserPlus, Sliders, Mail, Edit3 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-900">
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
          <p className="text-slate-500 font-medium">Last Updated: January 01, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none mb-20">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            This Privacy Notice for W3 writelab ("we", "us", or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you visit our website at <Link href="https://w3writelab.com" className="text-blue-600 hover:underline">https://w3writelab.com</Link> or use Blueprint Lab.
          </p>
        </div>

        <div className="space-y-24">
          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">01</span>
              What Information Do We Collect?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <p className="font-bold text-slate-900">Personal Information Provided by You:</p>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Names</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Phone numbers</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Usernames</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Passwords</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Email addresses</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Universities</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Departments</li>
                </ul>
              </div>
              <p><strong>Social Media Login Data:</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account.</p>
              <p><strong>Google API:</strong> Our use of information received from Google APIs will adhere to <Link href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:underline">Google API Services User Data Policy</Link>.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">02</span>
              How Do We Process Your Information?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate account creation and authentication and otherwise manage user accounts.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">03</span>
              When and With Whom Do We Share Your Information?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We may share your information in specific situations described in this section and/or with the following third parties:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">04</span>
              Artificial Intelligence-Based Products
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium bg-blue-50/50 border border-blue-100 p-8 rounded-[32px]">
              <p>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</p>
              <p><strong>Use of AI Technologies:</strong> We provide AI Products through third-party service providers ("AI Service Providers"), including <strong>DeepSeek and Anthropic</strong>. All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties.</p>
              <p><strong>AI Products:</strong> Our AI Products are designed for <strong>AI document generation</strong>.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">05</span>
              Social Logins
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>If you choose to register or log in to our Services using a social media account, we may have access to certain information about you. We will use the information we receive only for the purposes that are described in this Privacy Notice.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">06</span>
              How Long Do We Keep Your Information?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">07</span>
              How Do We Keep Your Information Safe?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We aim to protect your personal information through a system of organisational and technical security measures. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">08</span>
              Do We Collect Information From Minors?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>We do not knowingly collect data from or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">09</span>
              What Are Your Privacy Rights?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>You may review, change, or terminate your account at any time. If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">10</span>
              Controls for Do-Not-Track Features
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">11</span>
              Do We Make Updates To This Notice?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Yes, we will update this notice as necessary to stay compliant with relevant laws. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">12</span>
              How Can You Contact Us About This Notice?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>If you have questions or comments about this notice, you may email us at <a href="mailto:w3writelab@gmail.com" className="text-blue-600 font-bold hover:underline">w3writelab@gmail.com</a> or contact us by post at:</p>
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="font-bold text-slate-900">W3 writelab</p>
                <p>NO.1, ALHASSAN EGBA STREET, ANGWAN CHAIRMAN, ADO,</p>
                <p>NASARAWA STATE, NIGERIA</p>
                <p>Ado, Nassarawa 900211</p>
                <p>Nigeria</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">13</span>
              How Can You Review, Update, or Delete Your Data?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 font-medium">
              <p>Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.</p>
            </div>
          </section>
        </div>

        <div className="mt-32 pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">W3 WRITELAB PRIVACY DIVISION</p>
          <p className="text-slate-500 font-medium">Secure technical exchange protocols active. This policy was generated via Termly.</p>
        </div>
      </div>
    </div>
  );
}
