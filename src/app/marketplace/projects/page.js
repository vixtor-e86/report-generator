"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, Grid3X3, List, Star,
  ChevronDown, SlidersHorizontal, ArrowRight,
  Sparkles, Layers
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

export default function LiveMarketPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const projectsRef = useRef(null);

  useEffect(() => {
    async function fetchLiveProjects() {
      setLoading(true);
      try {
        let query = supabase
          .from('marketplace_projects')
          .select('*, marketplace_sellers(first_name, last_name)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('faculty', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setActiveProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProjects();
  }, [filter]);

  useEffect(() => {
    if (activeProjects.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.project-card', {
          scrollTrigger: {
            trigger: projectsRef.current,
            start: 'top 85%',
          },
          y: 20,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        });
      });
      return () => ctx.revert();
    }
  }, [activeProjects]);

  const filteredProjects = activeProjects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Search and Filters Bar */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-[#e5e7eb] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Search technical blueprints..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-12 font-bold focus:border-black"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl font-bold text-sm text-zinc-700 hover:bg-zinc-50 transition-all">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div></div>
        ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[40px] border border-zinc-200">
                <Layers className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Market Empty</h3>
                <p className="text-zinc-500 font-medium">No blueprints matching your search were found.</p>
            </div>
        ) : (
            <div ref={projectsRef} className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                : "flex flex-col gap-4"
            }>
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, viewMode }) {
  const sellerName = project.marketplace_sellers 
    ? `${project.marketplace_sellers.first_name} ${project.marketplace_sellers.last_name}` 
    : 'Verified Seller';

  if (viewMode === 'list') {
    return (
      <Link href={`/marketplace/project/${project.id}`} className="group bg-white border border-[#e5e7eb] p-4 rounded-3xl hover:border-blue-600 hover:shadow-xl transition-all flex items-center gap-6">
        <div className="w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0">
          <img src={project.preview_images?.[0]} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{project.faculty}</span>
          </div>
          <h3 className="font-black text-zinc-900 truncate text-lg group-hover:text-blue-600 transition-colors">{project.title}</h3>
          <p className="text-xs text-zinc-500 font-medium">By {sellerName}</p>
        </div>
        <div className="text-right pr-4">
          <div className="text-xl font-black text-zinc-900">{formatCurrency(project.price)}</div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fixed Rate</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/marketplace/project/${project.id}`} className="group flex flex-col bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 relative">
      <div className="relative h-52 overflow-hidden p-2">
        <img
          src={project.preview_images?.[0]}
          alt={project.title}
          className="w-full h-full object-cover rounded-[24px] transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white border border-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
            {project.faculty}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-zinc-900 font-black mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
            BY {sellerName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-zinc-50">
          <div className="flex flex-col">
            <span className="text-[#111827] font-black text-lg">
              {formatCurrency(project.price)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all shadow-lg active:scale-90">
             <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
