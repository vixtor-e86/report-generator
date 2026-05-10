"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, Grid3X3, List, Star,
  ChevronDown, SlidersHorizontal, ArrowRight,
  Sparkles, Layers, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

export default function LiveMarketPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItems, setActiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all, blueprints, ebooks
  const [facultyFilter, setFacultyFilter] = useState('all');
  
  const marketRef = useRef(null);

  useEffect(() => {
    async function fetchMarketItems() {
      setLoading(true);
      try {
        const fetchBlueprints = async () => {
          let query = supabase
            .from('marketplace_projects')
            .select('*, marketplace_sellers(first_name, last_name)')
            .eq('status', 'active');
          
          if (facultyFilter !== 'all') {
            query = query.eq('faculty', facultyFilter);
          }
          const { data } = await query;
          return (data || []).map(item => ({ ...item, itemType: 'blueprint' }));
        };

        const fetchEbooks = async () => {
          let query = supabase
            .from('marketplace_ebooks')
            .select('*, marketplace_sellers(first_name, last_name)')
            .eq('status', 'active');
          const { data } = await query;
          return (data || []).map(item => ({ ...item, itemType: 'ebook' }));
        };

        let combined = [];
        if (typeFilter === 'all') {
          const [blueprints, ebooks] = await Promise.all([fetchBlueprints(), fetchEbooks()]);
          combined = [...blueprints, ...ebooks];
        } else if (typeFilter === 'blueprints') {
          combined = await fetchBlueprints();
        } else {
          combined = await fetchEbooks();
        }

        // Sort by newest
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setActiveItems(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketItems();
  }, [typeFilter, facultyFilter]);

  useEffect(() => {
    if (activeItems.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.market-card', {
          scrollTrigger: {
            trigger: marketRef.current,
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
  }, [activeItems]);

  const filteredItems = activeItems.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Search and Filters Bar */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-[#e5e7eb] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Search market..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-12 font-bold focus:border-black"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 justify-center">
              <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button 
                  onClick={() => setTypeFilter('all')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'all' ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                >
                  All Items
                </button>
                <button 
                  onClick={() => setTypeFilter('blueprints')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'blueprints' ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                >
                  Blueprints
                </button>
                <button 
                  onClick={() => setTypeFilter('ebooks')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'ebooks' ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                >
                  Ebooks
                </button>
              </div>

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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div></div>
        ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[40px] border border-zinc-200">
                <Layers className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Market Empty</h3>
                <p className="text-zinc-500 font-medium">No items matching your criteria were found.</p>
            </div>
        ) : (
            <div ref={marketRef} className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                : "flex flex-col gap-4"
            }>
                {filteredItems.map((item) => (
                    <MarketCard key={item.id} item={item} viewMode={viewMode} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

function MarketCard({ item, viewMode }) {
  const sellerName = item.marketplace_sellers 
    ? `${item.marketplace_sellers.first_name} ${item.marketplace_sellers.last_name}` 
    : 'Verified Seller';

  const detailUrl = item.itemType === 'blueprint' 
    ? `/marketplace/project/${item.id}` 
    : `/marketplace/ebook/${item.id}`;

  const image = item.itemType === 'blueprint' ? item.preview_images?.[0] : item.cover_image;
  const tag = item.itemType === 'blueprint' ? item.faculty : item.category;

  if (viewMode === 'list') {
    return (
      <Link href={detailUrl} className="market-card group bg-white border border-[#e5e7eb] p-4 rounded-3xl hover:border-blue-600 hover:shadow-xl transition-all flex items-center gap-6">
        <div className={`rounded-2xl overflow-hidden flex-shrink-0 ${item.itemType === 'blueprint' ? 'w-32 h-24' : 'w-20 h-28 border border-zinc-100'}`}>
          <img src={image} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${item.itemType === 'blueprint' ? 'text-blue-600' : 'text-zinc-600'}`}>{tag}</span>
          </div>
          <h3 className="font-black text-zinc-900 truncate text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h3>
          <p className="text-xs text-zinc-500 font-medium">By {sellerName}</p>
        </div>
        <div className="text-right pr-4">
          <div className="text-xl font-black text-zinc-900">{formatCurrency(item.price)}</div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Digital Asset</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={detailUrl} className="market-card group flex flex-col bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 relative">
      <div className={`relative overflow-hidden p-2 ${item.itemType === 'blueprint' ? 'h-52' : 'h-64'}`}>
        <img
          src={image}
          alt={item.title}
          className="w-full h-full object-cover rounded-[24px] transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 bg-white border border-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg`}>
            {tag}
          </span>
        </div>
        {item.itemType === 'ebook' && (
             <div className="absolute top-4 right-4">
                <Badge className="bg-zinc-900 text-white border-none text-[8px] px-2">EBOOK</Badge>
             </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-zinc-900 font-black mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
            {item.title}
          </h3>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
            BY {sellerName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-zinc-50">
          <div className="flex flex-col">
            <span className="text-[#111827] font-black text-lg">
              {formatCurrency(item.price)}
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
