"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthModal from '@/components/AuthModal';
import FeedbackWidget from '@/components/FeedbackWidget';
import { PRICING, PRICING_FORMATTED } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import bgImage from './bg.jpg';
import { 
  ShoppingBag, Sparkles, BookOpen, Wrench, 
  ArrowRight, BarChart3, Code2, Presentation,
  Image as ImageIcon, UserCheck
} from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumAnnouncement, setShowPremiumAnnouncement] = useState(false);
  const [trendingItems, setTrendingItems] = useState([
    { title: "Design & Construction of a Smart Solar Irrigation System", category: "Engineering", price: "₦15,000", downloads: "128", type: "project" },
    { title: "Implementation of an AI-Based E-Commerce Recommendation Engine", category: "Computer Science", price: "₦12,500", downloads: "94", type: "project" },
    { title: "Technical SIWES Report: Electrical Transmission Lines Maintenance", category: "SIWES / Practical", price: "₦8,000", downloads: "210", type: "project" }
  ]);

  useEffect(() => {
    const fetchTrendingItems = async () => {
      try {
        // Fetch projects
        const { data: dbProjects } = await supabase
          .from('marketplace_projects')
          .select('title, price, faculty, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch ebooks
        const { data: dbEbooks } = await supabase
          .from('marketplace_ebooks')
          .select('title, price, category, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        let combined = [];
        if (dbProjects && dbProjects.length > 0) {
          combined = [...combined, ...dbProjects.map(p => ({
            title: p.title,
            price: `₦${Number(p.price).toLocaleString()}`,
            category: p.faculty || 'Engineering',
            created_at: p.created_at,
            downloads: Math.floor(Math.random() * 50) + 80,
            type: 'project'
          }))];
        }
        if (dbEbooks && dbEbooks.length > 0) {
          combined = [...combined, ...dbEbooks.map(e => ({
            title: e.title,
            price: `₦${Number(e.price).toLocaleString()}`,
            category: e.category || 'Ebook',
            created_at: e.created_at,
            downloads: Math.floor(Math.random() * 30) + 40,
            type: 'ebook'
          }))];
        }

        if (combined.length > 0) {
          combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setTrendingItems(combined.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch trending items:", err);
      }
    };
    fetchTrendingItems();
  }, []);

  useEffect(() => {
    // Check if announcement was already seen in this session
    const hasSeenAnnouncement = sessionStorage.getItem('has_seen_premium_announcement');
    if (!hasSeenAnnouncement) {
      const timer = setTimeout(() => {
        setShowPremiumAnnouncement(true);
      }, 1500); // Show after 1.5s
      return () => clearTimeout(timer);
    }
  }, []);

  const closeAnnouncement = () => {
    setShowPremiumAnnouncement(false);
    sessionStorage.setItem('has_seen_premium_announcement', 'true');
  };

  useEffect(() => {
    // Capture referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('referred_by_code', ref);
    }

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

  const openAuth = () => setShowAuthModal(true);

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
              <a href="#tools" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Academic Tools</a>
              <button onClick={openAuth} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer">Marketplace</button>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
               <button 
                 onClick={openAuth}
                 className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
               >
                 Sign In
               </button>
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
              <a href="#tools" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>Academic Tools</a>
              <button onClick={() => { setIsMenuOpen(false); openAuth(); }} className="text-left text-base font-medium text-slate-600 hover:text-indigo-600 bg-transparent border-none cursor-pointer">Marketplace</button>
              <a href="#pricing" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <a href="#how-it-works" className="text-base font-medium text-slate-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>How it Works</a>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuth();
                  }}
                  className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  Sign In
                </button>
              </div>
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
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI-Powered Research Assistant</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-5xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Structure Academic Blueprints <br className="hidden md:block" />
            <span className="text-indigo-600">In Minutes, Not Weeks</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            Elevate your project research. Generate comprehensive academic blueprints with accurate citations for Engineering, Sciences, Arts, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
            <button 
              onClick={openAuth}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 flex items-center justify-center"
            >
              Get Started
            </button>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition shadow-sm text-center flex items-center justify-center">
              See How It Works
            </a>
            <Link href="/features" className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition shadow-sm text-center flex items-center justify-center">
              View Full Features
            </Link>
          </div>

          <p className="mt-8 text-sm text-white font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            No credit card required · Free initial blueprint · Export to Word & PDF
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

      {/* Marketplace Section */}
      <section id="marketplace" className="py-20 bg-slate-50 overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Copy & CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
                <ShoppingBag className="w-3.5 h-3.5" />
                Academic Marketplace & Ebook Hub
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                Buy Premium Blueprints <br className="hidden md:block" />
                or <span className="text-indigo-600">Monetize Your Research</span>
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Skip the trial and error. Access a growing repository of vetted, top-tier project blueprints, SIWES technical reports, and specialized academic ebooks. Written by top graduates, approved by institutions.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Vetted Academic Content</h4>
                    <p className="text-sm text-slate-500">Every project upload goes through plagiarism, structure, and technical checks before listing.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Monetize Your Hard Work</h4>
                    <p className="text-sm text-slate-500">Turn your final year projects, seminars, and technical papers into a steady income stream.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={openAuth} className="px-8 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black text-center transition shadow-lg flex items-center justify-center gap-2 cursor-pointer border-none">
                  <ShoppingBag className="w-4 h-4" />
                  Explore Marketplace
                </button>
                <button onClick={openAuth} className="px-8 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-center flex items-center justify-center gap-2 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Become a Seller
                </button>
              </div>
            </div>
            
            {/* Right Column: Visual Preview Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-[32px] blur-3xl -z-10"></div>
              
              <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trending Blueprints</span>
                </div>
                
                <div className="space-y-4">
                  {trendingItems.map((proj, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 hover:bg-indigo-50/30 border border-slate-100 rounded-2xl transition-all group flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wide block mb-1">{proj.category}</span>
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{proj.title}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">{proj.downloads} students bought</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 text-sm block">{proj.price}</span>
                        <button onClick={openAuth} className="inline-flex items-center text-xs font-bold text-indigo-600 mt-1 hover:underline bg-transparent border-none cursor-pointer">
                          View <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-indigo-600 uppercase tracking-wide mb-2">Powerful Features</h2>
            <p className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need for a Perfect Blueprint</p>
            <p className="text-lg text-slate-600">We handle the technical research structure so you can focus on the core project development.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smart Blueprint Generation", desc: "Our AI understands your specific field to structure Introduction, Literature Review, Methodology, and more.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
              { title: "Automatic Citations", desc: "Forget manual formatting. We generate APA, IEEE, or Harvard standard citations automatically within the text and reference list.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
              { title: "Export Ready", desc: "Download your blueprint in editable Microsoft Word format or PDF, perfectly formatted and ready for your review.", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
              { title: "Academic Templates", desc: "From Engineering to Law, Medicine, and Arts. Choose the template that matches your department's specific standards.", icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" },
              { title: "Context Aware", desc: "Input your specific project details, components, and objectives. The AI tailors the research to YOUR specific topic.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M17.636 17.636l-.707-.707M12 21v-1M6.364 17.636l.707-.707M3 12h1M6.364 6.364l.707.707M12 6a6 6 0 100 12 6 6 0 000-12z" },
              { title: "Asset Integration", desc: "Upload your diagrams, charts, and data sets. We integrate them professionally within the blueprint structure.", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
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

      {/* Academic Power Tools Section */}
      <section id="tools" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <Wrench className="w-3.5 h-3.5" />
              Academic Power Tools
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">AI Academic Utilities</h2>
            <p className="text-lg text-slate-600">
              A comprehensive suite of specialized tools built to solve specific student and researcher bottlenecks, available on-demand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Diagram & Image Studio",
                desc: "Describe flowcharts, block diagrams, or technical illustrations in plain English and let AI draft them in seconds.",
                icon: <ImageIcon className="w-6 h-6 text-indigo-600" />,
                badge: "₦200 / use",
                link: "/marketplace/tools/diagram-studio"
              },
              {
                title: "AI Text Humanizer",
                desc: "Rephrase AI-generated project chapters to flow with natural, academic-grade tone while bypassing institutional detector tools.",
                icon: <UserCheck className="w-6 h-6 text-indigo-600" />,
                badge: "₦1,000 / 1k words",
                link: "/marketplace/tools/ai-humanizer"
              },
              {
                title: "Data Analysis Engine",
                desc: "Upload CSV or Excel data sheets to instantly run statistics, output charts, and generate detailed interpretations.",
                icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
                badge: "₦1,500 / use",
                link: "/marketplace/tools/data-analysis"
              },
              {
                title: "Code Explainer",
                desc: "Paste programming scripts (up to 500 lines) to receive structural flow explanations and block-by-block logic breakdowns.",
                icon: <Code2 className="w-6 h-6 text-indigo-600" />,
                badge: "₦500 / use",
                link: "/marketplace/tools/code-explainer"
              },
              {
                title: "Slide Presentation Deck",
                desc: "Turn your research proposal, report, or thesis draft document directly into fully styled PowerPoint presentation slides.",
                icon: <Presentation className="w-6 h-6 text-indigo-600" />,
                badge: "₦2,000 / use",
                link: "/marketplace/tools/slide-generator"
              },
              {
                title: "Citation & Reference Finder",
                desc: "Scan the web for peer-reviewed academic papers matching your study and generate perfectly formatted references.",
                icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
                badge: "FREE / Deep Search ₦200",
                link: "/marketplace/tools/reference-finder"
              }
            ].map((tool, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-indigo-100 hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                      {tool.icon}
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{tool.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{tool.desc}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active & Vetted</span>
                  <button onClick={openAuth} className="inline-flex items-center text-xs font-black text-indigo-600 hover:underline uppercase tracking-wider gap-1 bg-transparent border-none cursor-pointer">
                    Try Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <button onClick={openAuth} className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition active:scale-95 cursor-pointer border-none">
              Browse All Academic Tools
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Three Steps to Done</h2>
            <p className="text-lg text-slate-600">Complex research simplified into a linear workflow.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0"></div>
            
            {[
              { step: "01", title: "Input Details", desc: "Select your faculty and enter your project topic. The more technical detail you provide, the deeper the research output." },
              { step: "02", title: "AI Generation", desc: "Our engine structures the arguments, generates citations, and drafts 5 complete chapters based on your methodology." },
              { step: "03", title: "Review & Export", desc: "Preview your blueprint, regenerate sections for depth, and export to DOCX or PDF for your academic review." }
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
              <button onClick={openAuth} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors mb-8">Get Started Free</button>
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
              <button onClick={openAuth} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors mb-8 shadow-lg shadow-indigo-900/50">Choose Standard</button>
              <ul className="space-y-4 text-sm text-indigo-50">
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Editable Word (DOCX) + PDF</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> All 10 Faculties + SIWES</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Smart Suggestions & Modifications</li>
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
              <button onClick={openAuth} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors mb-8">Choose Premium</button>
              <ul className="space-y-4 text-sm text-slate-700 mb-8">
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Superior AI Model</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Custom Templates & Styles</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Priority Processing</li>
                <li className="flex gap-3"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Unlimited Images</li>
              </ul>
              <div className="pt-4 border-t border-slate-100 text-center">
                <Link href="/features" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  See what&apos;s included →
                </Link>
              </div>
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
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Stop Searching, Start Structuring</h2>
          <p className="text-xl text-slate-600 mb-10">Join thousands of students who have already elevated their project research.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={openAuth}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30"
            >
              Start Your Blueprint
            </button>
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
              <p className="text-sm leading-relaxed mb-6">
                Empowering students with AI tools to structure their research efficiently and professionally.
              </p>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <p className="leading-relaxed">
                    NO.1, ALHASSAN EGBA STREET, ANGWAN CHAIRMAN, ADO, NASARAWA STATE, NIGERIA
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <a href="mailto:w3writelab@gmail.com" className="hover:text-white transition-colors">w3writelab@gmail.com</a>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Templates</Link></li>
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
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Citation Guide</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} W3 WriteLab. All rights reserved.</p>
            <p className="flex items-center gap-1">Developed by <span className="text-white font-semibold">W3 Hub</span></p>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Premium Announcement Modal */}
      {showPremiumAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-12 h-12" />
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Premium is Ready!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Our most powerful research engine is now live. Experience superior AI, custom templates, and priority processing.
            </p>

            {/* YouTube Walkthrough Section */}
            <div className="mb-8 group">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Watch Walkthrough Guide</p>
              <a 
                href="https://youtube.com/watch?v=KIfsDZbiMDo"
                target="_blank" 
                rel="noopener noreferrer"
                className="relative block aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl border-4 border-white transition-transform hover:scale-[1.02] active:scale-95"
              >
                <img 
                  src="https://img.youtube.com/vi/KIfsDZbiMDo/maxresdefault.jpg" 
                  alt="Tutorial Preview" 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl group-hover:bg-red-500 transition-colors">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-bold">Mastering the 3 Packages • 60 mins Guide</p>
                </div>
              </a>
            </div>
            
            <button 
              onClick={closeAnnouncement}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
