"use client";
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, Sparkles, ShoppingBag, Wrench, 
  ShieldCheck, BookOpen, Presentation, BarChart3,
  Code2, Zap, GraduationCap, CheckCircle2, Star
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { academicTools } from '@/data/marketplace/tools';
import { projects } from '@/data/marketplace/projects';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export default function MarketplaceHomePage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const toolsRef = useRef(null);
  const marketRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from('.hero-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power3.out',
      });
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: 'power3.out',
      });

      // Features scroll animation
      gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          y: 40,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.1,
          ease: 'power3.out',
        });
      });

      // Tools animation
      gsap.from('.tool-card', {
        scrollTrigger: {
          trigger: toolsRef.current,
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
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
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, []);

  const featuredTools = academicTools.slice(0, 6);
  const featuredProjects = projects.slice(0, 4);

  return (
    <div className="bg-[#f8f9fc]">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center overflow-hidden bg-white">
        {/* Background gradient matched with Premium */}
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
                <Link href="/marketplace/seller-setup">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-[#e5e7eb] bg-white text-[#111827] hover:bg-zinc-50 px-8 py-6 text-base font-semibold rounded-full shadow-sm"
                  >
                    <Code2 className="w-5 h-5 mr-2" />
                    Become a Seller
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-zinc-600">Vetted Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-zinc-600">Escrow Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-zinc-600">Instant Access</span>
                </div>
              </div>
            </div>

            {/* Right content - Premium Marketplace UI Preview */}
            <div className="hidden lg:block relative">
              <div className="relative bg-white rounded-[24px] border border-[#e5e7eb] shadow-2xl overflow-hidden p-2">
                <div className="bg-zinc-50 rounded-[18px] border border-zinc-100 overflow-hidden">
                  <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 leading-none">Project Catalog</p>
                        <p className="text-[11px] text-zinc-500 mt-1">4,289 Vetted Items</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-24 h-8 bg-zinc-100 rounded-full animate-pulse" />
                      <div className="w-8 h-8 bg-zinc-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="w-full h-24 bg-zinc-100 rounded-xl mb-3" />
                        <div className="h-3 w-3/4 bg-zinc-100 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-zinc-50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute -top-6 -right-6 bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[#111827] text-xs font-bold">W3-Verified</p>
                  <p className="text-zinc-500 text-[10px]">Quality Guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '15,000+', label: 'University Students' },
              { value: '8,200+', label: 'Successful Sales' },
              { value: '12+', label: 'Academic Fields' },
              { value: '₦5.2M+', label: 'Paid to Sellers' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-[#111827] mb-2">{stat.value}</p>
                <p className="text-[#6b7280] text-sm font-medium uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-[#f8f9fc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4 tracking-tight">
              Built for Academic Excellence
            </h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">
              Whether you're looking for a reference project or a specialized research tool, 
              W3write Marketplace provides the professional resources you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingBag,
                title: 'Premium Project Catalog',
                description: 'Access thousands of vetted final year projects, source codes, and research papers from top universities.',
              },
              {
                icon: ShieldCheck,
                title: 'Escrow Protection',
                description: 'Your money is safe. Funds are only released to the seller after you confirm the project meets your expectations.',
              },
              {
                icon: Wrench,
                title: 'Academic Power Tools',
                description: 'Integrated tools like AI Humanizers, Citation Finders, and Data Analyzers built specifically for students.',
              },
              {
                icon: Code2,
                title: 'Verified Sellers',
                description: 'Every seller is verified using their matriculation number and institutional credentials for complete trust.',
              },
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'No waiting. Once payment is confirmed, your project files and documentation are available for immediate download.',
              },
              {
                icon: BarChart3,
                title: 'Data-Driven Insights',
                description: 'Get projects that include full datasets, SPSS analysis, and statistical interpretations for complex research.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="feature-card p-8 bg-white border border-[#e5e7eb] rounded-[24px] hover:border-[#111827] transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-zinc-900 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-zinc-900 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{feature.title}</h3>
                <p className="text-[#6b7280] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Market Preview */}
      <section ref={marketRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4 tracking-tight">
                Recently Added Projects
              </h2>
              <p className="text-[#6b7280] text-lg max-w-xl leading-relaxed">
                Explore the latest professional academic works added by our community of 
                verified student sellers.
              </p>
            </div>
            <Link href="/marketplace/projects" className="mt-6 md:mt-0">
              <Button variant="outline" className="border-[#e5e7eb] text-[#111827] hover:bg-zinc-50 rounded-full px-6 py-5 font-bold">
                Explore Full Market
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProjects.map((project) => (
              <Link key={project.id} href={`/marketplace/project/${project.id}`}>
                <div className="market-card group bg-white border border-[#e5e7eb] rounded-[20px] overflow-hidden hover:border-[#111827] transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[#111827] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm border border-zinc-100">
                        {project.faculty}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-[#111827] font-bold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.seller.displayName}`}
                        alt={project.seller.displayName}
                        className="w-6 h-6 rounded-full border border-zinc-100"
                      />
                      <span className="text-zinc-500 text-xs font-medium">{project.seller.displayName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-[#111827] text-xs font-bold">{project.rating}</span>
                      </div>
                      <span className="text-[#111827] font-black text-sm">
                        {formatCurrency(project.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Tools Preview */}
      <section ref={toolsRef} className="py-24 bg-[#f8f9fc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4 tracking-tight">
                Academic Research Tools
              </h2>
              <p className="text-[#6b7280] text-lg max-w-xl leading-relaxed">
                Specialized AI tools to help you check plagiarism, generate slides, 
                and format references in seconds.
              </p>
            </div>
            <Link href="/marketplace/tools" className="mt-6 md:mt-0">
              <Button variant="outline" className="border-[#e5e7eb] text-[#111827] hover:bg-zinc-50 rounded-full px-6 py-5 font-bold">
                View All Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <div
                key={tool.id}
                className="tool-card p-8 bg-white border border-[#e5e7eb] rounded-[24px] hover:border-blue-500 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-7 h-7 text-blue-600" />
                  </div>
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-900 text-xs font-bold rounded-full">
                    {formatCurrency(tool.pricePerUse)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{tool.name}</h3>
                <p className="text-[#6b7280] text-sm mb-6 leading-relaxed">{tool.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                  <span className="text-zinc-400 text-xs font-medium tracking-wide">
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
            <Link href="/marketplace/seller-setup">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-base font-bold rounded-full shadow-2xl"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Open Seller Account
              </Button>
            </Link>
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

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W3</span>
                </div>
                <span className="text-black font-extrabold text-xl tracking-tighter">W3write Lab</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                The premier independent marketplace for high-quality academic projects and specialized research tools.
              </p>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold mb-6 uppercase text-xs tracking-widest">Marketplace</h4>
              <ul className="space-y-4">
                {['All Projects', 'Engineering', 'Social Sciences', 'Science'].map((item) => (
                  <li key={item}>
                    <Link href="/marketplace/projects" className="text-zinc-500 hover:text-black text-sm font-medium transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold mb-6 uppercase text-xs tracking-widest">Resources</h4>
              <ul className="space-y-4">
                {['Plagiarism Checker', 'AI Humanizer', 'Citation Finder', 'Slide Builder'].map((item) => (
                  <li key={item}>
                    <Link href="/marketplace/tools" className="text-zinc-500 hover:text-black text-sm font-medium transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold mb-6 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4">
                {['Seller Guidelines', 'Buyer Protection', 'Contact Support', 'Privacy Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-zinc-500 hover:text-black text-sm font-medium transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-[13px] font-medium">
              © 2026 W3write Lab Marketplace. Independent Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
