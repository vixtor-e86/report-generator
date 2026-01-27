"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import FeedbackWidget from '@/components/FeedbackWidget';
import { PRICING, PRICING_FORMATTED } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import bgImage from './bg.jpg';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        flowType: 'pkce',
      },
    });

    if (error) {
      console.error('Login failed:', error.message);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-10 h-10" />
              <span className={`text-xl font-bold tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                W3 WriteLab
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
               <div className="w-fit"><GoogleAuthButton /></div>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 hover:text-indigo-600 transition-colors">
                <span className="sr-only">Open menu</span>
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 animate-in slide-in-from-top-5">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#pricing" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <a href="#how-it-works" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>How it Works</a>
              <div className="pt-2"><GoogleAuthButton /></div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={bgImage} 
            alt="Project Workspace" 
            fill 
            className="object-cover"
            priority
            placeholder="blur"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI-Powered Report Generator</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-5xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Write Complex Projects <br className="hidden md:block" />
            <span className="text-indigo-600">In Minutes, Not Weeks</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            Eliminate the stress of documentation. Generate complete 5 chapter reports with accurate citations for Engineering, Sciences, Arts, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
            <div className="w-full sm:w-auto"><GoogleAuthButton /></div>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition shadow-sm text-center flex items-center justify-center">
              See How It Works
            </a>
          </div>

          <p className="mt-8 text-sm text-white font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            No credit card required · Free initial report · Export to Word & PDF
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 -mt-10 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">95%</div>
              <div className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Faster Completion</div>
              <div className="text-slate-500 text-sm mt-1">From 40+ hours to minutes</div>
            </div>
            <div className="text-center pt-8 md:pt-0">
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">10+</div>
              <div className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Faculties Supported</div>
              <div className="text-slate-500 text-sm mt-1">Specialized templates for every field</div>
            </div>
            <div className="text-center pt-8 md:pt-0">
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Citation Accuracy</div>
              <div className="text-slate-500 text-sm mt-1">APA, IEEE, Harvard & more</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-indigo-600 uppercase tracking-wide mb-2">Powerful Features</h2>
            <p className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need for a Perfect Report</p>
            <p className="text-lg text-slate-600">We handle the technical writing structure so you can focus on the project.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smart Chapter Generation", desc: "Our AI understands your specific field to write Introduction, Literature Review, Methodology, and more.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
              { title: "Automatic Citations", desc: "Forget manual formatting. We generate APA, IEEE, or Harvard standard citations automatically within the text and reference list.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
              { title: "Export Ready", desc: "Download your report in editable Microsoft Word format or PDF, perfectly formatted and ready to print.", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
              { title: "Faculty Templates", desc: "From Engineering to Law, Medicine, and Arts. Choose the template that matches your department's standards.", icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" },
              { title: "Context Aware", desc: "Input your specific project details, components, and objectives. The AI tailors the content to YOUR specific topic.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M17.636 17.636l-.707-.707M12 21v-1M6.364 17.636l.707-.707M3 12h1M6.364 6.364l.707.707M12 6a6 6 0 100 12 6 6 0 000-12z" },
              { title: "Image Support", desc: "Upload your diagrams, charts, and results. We place them professionally within the document structure.", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-indigo-200 transition-transform">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Three Steps to Done</h2>
            <p className="text-lg text-slate-600">Complex reports simplified into a linear workflow.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0"></div>
            
            {[
              { step: "01", title: "Input Details", desc: "Select your faculty (Engineering, Sciences, Arts, etc.) and enter your project topic. The more detail you provide, the better the output." },
              { step: "02", title: "AI Generation", desc: "Our engine processes your input, structuring arguments, generating citations (APA/IEEE/Harvard), and writing 5 complete chapters." },
              { step: "03", title: "Review & Export", desc: "Preview your report, regenerate sections if needed, and export to DOCX or PDF for final submission." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center group">
                <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:border-indigo-100 transition-colors">
                  <span className="text-3xl font-black text-indigo-600">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">Invest in your grades without breaking the bank.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* FREE TIER */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">{PRICING_FORMATTED.FREE}</span>
                <span className="text-slate-500">/ forever</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">Perfect for testing the capabilities.</p>
              <button onClick={handleLogin} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors mb-8">Get Started Free</button>
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 1 Complete Report</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> All 10 Faculties</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> APA/IEEE/Harvard Styles</li>
                <li className="flex gap-3 text-orange-600"><svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 30-day storage limit</li>
                <li className="flex gap-3 text-slate-400"><svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> No Word Export</li>
              </ul>
            </div>

            {/* STANDARD TIER */}
            <div className="relative p-8 rounded-3xl border-2 border-indigo-600 bg-slate-900 shadow-2xl scale-105 z-10">
              <div className="absolute top-0 right-0 -mt-4 mr-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
              <h3 className="text-lg font-semibold text-white mb-2">Standard</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{PRICING_FORMATTED.STANDARD}</span>
                <span className="text-indigo-200">/ report</span>
              </div>
              <p className="text-indigo-100 text-sm mb-6">For final year students who need quality.</p>
              <button onClick={handleLogin} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors mb-8 shadow-lg shadow-indigo-900/50">Choose Standard</button>
              <ul className="space-y-4 text-sm text-indigo-50">
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Editable Word (DOCX) + PDF</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> All 10 Faculties + SIWES</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Unlimited Regenerations</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Upload up to 10 Images</li>
              </ul>
            </div>

            {/* PREMIUM TIER */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Premium</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">{PRICING_FORMATTED.PREMIUM}</span>
                <span className="text-slate-500">/ report</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">Maximum power and priority support.</p>
              <button onClick={handleLogin} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors mb-8">Choose Premium</button>
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Superior AI Model</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Custom Templates & Styles</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Priority Processing</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Unlimited Images</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Citation Styles Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Academic Standard</div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">All Major Citation Styles Supported</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Whether your institution requires APA, IEEE, or Harvard referencing, we&apos;ve got you covered. Our AI ensures all citations are correctly formatted in-text and in your bibliography.
              </p>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700">APA 7th</span>
                <span className="px-4 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700">IEEE</span>
                <span className="px-4 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700">Harvard</span>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm shadow-inner">
              <div className="mb-4 pb-4 border-b border-slate-700">
                <span className="text-emerald-400">APA Example:</span><br/>
                &quot;Research indicates that AI tools improve productivity <span className="text-white bg-indigo-600/50 px-1 rounded">(Smith, 2023)</span>.&quot;
              </div>
              <div className="mb-4 pb-4 border-b border-slate-700">
                <span className="text-emerald-400">IEEE Example:</span><br/>
                &quot;The microcontroller operates at 16MHz <span className="text-white bg-indigo-600/50 px-1 rounded">[1]</span>.&quot;
              </div>
              <div>
                <span className="text-emerald-400">Harvard Example:</span><br/>
                &quot;According to Johnson <span className="text-white bg-indigo-600/50 px-1 rounded">(2024)</span>, the results are conclusive.&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Stop Writing, Start Creating</h2>
          <p className="text-xl text-slate-600 mb-10">Join thousands of students who have already generated their project reports.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <div className="w-full sm:w-auto"><GoogleAuthButton /></div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-3xl -z-0"></div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4 text-white">
                <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8" />
                <span className="text-xl font-bold">WriteLab</span>
              </Link>
              <p className="text-sm leading-relaxed">
                Empowering students with AI tools to document their innovations efficiently and professionally.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <FeedbackWidget 
                    customTrigger={<span className="hover:text-white transition-colors cursor-pointer">Contact Us</span>} 
                  />
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Citation Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} W3 WriteLab. All rights reserved.</p>
            <p className="flex items-center gap-1">Developed by <span className="text-white font-semibold">W3 Hub</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
