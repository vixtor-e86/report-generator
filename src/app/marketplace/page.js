"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, Sparkles, ShoppingBag, Wrench, 
  ShieldCheck, BookOpen, Presentation, BarChart3,
  Code2, Zap, GraduationCap, CheckCircle2, Star,
  Clock, LayoutDashboard, Landmark, UserCheck, Code2 as CodeIcon
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { academicTools } from '@/data/marketplace/tools';
import { projects } from '@/data/marketplace/projects';
import { formatCurrency } from '@/lib/utils';
import { useUser } from '@/contexts/marketplace/UserContext';

gsap.registerPlugin(ScrollTrigger);

export default function MarketplaceHomePage() {
  const { user, sellerStatus } = useUser();
  const [showPendingModal, setShowPendingModal] = useState(false);

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const toolsRef = useRef(null);
  const marketRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from('.hero-title', {
        y: 30,
        opacity: 1, // Changed from 0 to 1 for instant visibility
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.hero-subtitle', {
        y: 20,
        opacity: 1,
        duration: 0.6,
        delay: 0.2,
        ease: 'power3.out',
      });
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 1,
        duration: 0.6,
        delay: 0.4,
        ease: 'power3.out',
      });

      // Tools animation
      gsap.from('.tool-card', {
        scrollTrigger: {
          trigger: toolsRef.current,
          start: 'top 80%',
        },
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
      });

      // Market preview animation
      gsap.from('.market-card', {
        scrollTrigger: {
          trigger: marketRef.current,
          start: 'top 80%',
        },
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-[#f8f9fc] border-b border-[#e5e7eb]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="hero-title">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-zinc-900 text-xs font-bold uppercase tracking-wider mb-6">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Official Academic Marketplace
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-[1.1] mb-6 tracking-tight">
                  The Gold Standard for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Academic Projects.
                  </span>
                </h1>
              </div>
              
              <p className="hero-subtitle text-lg sm:text-xl text-[#6b7280] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Unlock access to thousands of vetted, high-quality projects across Engineering, 
                Science, and the Arts. Buy premium work or sell your own to a global audience.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/marketplace/projects">
                  <Button 
                    size="lg" 
                    className="bg-[#111827] hover:bg-black text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg transition-all"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Browse Catalog
                  </Button>
                </Link>
                
                {user?.isSeller ? (
                  <Link href="/marketplace/dashboard">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-[#111827] border-2 bg-white text-[#111827] hover:bg-zinc-50 px-8 py-6 text-base font-bold rounded-full shadow-sm"
                    >
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Seller Dashboard
                    </Button>
                  </Link>
                ) : sellerStatus === 'pending' ? (
                  <Button 
                    onClick={() => setShowPendingModal(true)}
                    size="lg" 
                    variant="outline"
                    className="border-blue-600 border-2 bg-white text-blue-600 hover:bg-zinc-50 px-8 py-6 text-base font-bold rounded-full shadow-sm"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Pending Clearance
                  </Button>
                ) : (
                  <Link href="/marketplace/seller-setup">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-[#e5e7eb] bg-white text-[#111827] hover:bg-zinc-50 px-8 py-6 text-base font-semibold rounded-full shadow-sm"
                    >
                      <UserCheck className="w-5 h-5 mr-2" />
                      Become a Seller
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-zinc-600">Vetted Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-zinc-600">Secure Payments</span>
                </div>
              </div>
            </div>

            {/* Right content - Abstract visual */}
            <div className="hidden lg:block relative">
              <div className="relative z-10 bg-white rounded-[40px] border border-[#e5e7eb] shadow-2xl p-4 overflow-hidden">
                <div className="bg-zinc-50 rounded-[32px] overflow-hidden border border-zinc-100">
                  <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="px-4 py-1.5 bg-zinc-50 rounded-full border border-zinc-100">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Project Catalog Preview</span>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((project) => (
                      <div key={project.id} className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="w-full h-20 rounded-xl mb-2 overflow-hidden">
                          <img src={project.thumbnail} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="h-2 w-full bg-zinc-900 rounded mb-1.5" />
                        <div className="h-2 w-2/3 bg-zinc-300 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-60 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section ref={toolsRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 block">Research Engine</span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">Academic Power Tools</h2>
            </div>
            <Link href="/marketplace/tools">
              <Button variant="ghost" className="text-zinc-500 hover:text-black font-bold group">
                View All Research Tools
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academicTools.slice(0, 3).map((tool) => (
              <div key={tool.id} className="tool-card group bg-[#f8f9fc] border border-[#e5e7eb] rounded-[32px] p-8 hover:bg-white hover:shadow-2xl hover:border-blue-200 transition-all duration-500">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500 border border-zinc-100">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3 tracking-tight">{tool.name}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-6 font-medium">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {tool.usageCount.toLocaleString()} USES
                  </span>
                  <Link href={`/marketplace/tools/${tool.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5">
                      Use Tool
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Preview Section */}
      <section ref={marketRef} className="py-24 bg-[#f8f9fc] border-y border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 block">Live Marketplace</span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">Recent Technical Blueprints</h2>
            </div>
            <Link href="/marketplace/projects">
              <Button className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 shadow-xl">
                Explore Full Market
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.slice(0, 4).map((project) => (
              <div key={project.id} className="market-card group bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="relative h-48 overflow-hidden p-2">
                  <img src={project.thumbnail} className="w-full h-full object-cover rounded-[24px] group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white text-[#111827] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md border border-zinc-100">
                      {project.faculty}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-[#111827] mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{project.title}</h3>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-900">{project.rating}</span>
                    <span className="text-xs text-zinc-400 font-medium">({project.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                    <span className="font-black text-zinc-900">{formatCurrency(project.price)}</span>
                    <Link href={`/marketplace/project/${project.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-zinc-100">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-900 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
            Ready to Monetize your Academic Work?
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of verified student sellers earning from their hard-earned projects. 
            Sign up today and start listing your work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.isSeller ? (
              <Link href="/marketplace/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-zinc-900 hover:bg-zinc-100 px-10 py-7 text-base font-black rounded-full shadow-2xl"
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Access Seller Panel
                </Button>
              </Link>
            ) : sellerStatus === 'pending' ? (
              <Button 
                onClick={() => setShowPendingModal(true)}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-base font-black rounded-full shadow-2xl"
              >
                <Clock className="w-5 h-5 mr-2" />
                Under Review
              </Button>
            ) : (
              <Link href="/marketplace/seller-setup">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-base font-black rounded-full shadow-2xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Open Seller Account
                </Button>
              </Link>
            )}
            <Link href="/marketplace/projects">
              <Button 
                size="lg" 
                variant="outline"
                className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 px-10 py-7 text-base font-bold rounded-full"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pending Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPendingModal(false)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <Landmark className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Application Pending</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Your seller accreditation request is currently being reviewed by our admin panel. You'll be notified once you're cleared to publish.
            </p>
            <Button 
              onClick={() => setShowPendingModal(false)}
              className="w-full bg-black text-white rounded-2xl py-6 font-black uppercase text-xs tracking-widest shadow-xl"
            >
              Understood
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src="/favicon.ico" alt="W3 WriteLab" className="w-10 h-10" />
                <span className="text-2xl font-black text-indigo-600 tracking-tight">W3 Marketplace</span>
              </div>
              <p className="text-zinc-500 text-base max-w-md leading-relaxed font-medium">
                The leading platform for verified academic work. Connecting student researchers with premium blueprints and technical documentation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/marketplace/projects" className="text-zinc-500 hover:text-black font-medium transition-colors">Project Catalog</Link></li>
                <li><Link href="/marketplace/tools" className="text-zinc-500 hover:text-black font-medium transition-colors">Research Tools</Link></li>
                <li><Link href="/marketplace/dashboard" className="text-zinc-500 hover:text-black font-medium transition-colors">User Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Seller Hub</h4>
              <ul className="space-y-4">
                <li><Link href="/marketplace/seller-setup" className="text-zinc-500 hover:text-black font-medium transition-colors">Become a Seller</Link></li>
                <li><Link href="/marketplace/dashboard?tab=purchases" className="text-zinc-500 hover:text-black font-medium transition-colors">Seller Guidelines</Link></li>
                <li><Link href="/marketplace/dashboard?tab=wallet" className="text-zinc-500 hover:text-black font-medium transition-colors">Payout System</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-[13px] font-medium">
              © 2026 W3write Lab Marketplace. Independent Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
