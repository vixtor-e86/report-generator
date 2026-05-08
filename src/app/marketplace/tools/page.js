"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, Wrench, ShieldCheck, BookOpen, Presentation, 
  BarChart3, Code2, Lightbulb, RefreshCw, SpellCheck, 
  Quote, Image, ArrowRight, Zap, Check, Star, Wallet
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { academicTools, toolCategories } from '@/data/marketplace/tools';
import { formatCurrency } from '@/lib/utils';
import { useWallet } from '@/contexts/marketplace/WalletContext';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  ShieldCheck,
  UserCheck: ShieldCheck,
  Presentation,
  BookOpen,
  Search,
  Lightbulb,
  BarChart3,
  SpellCheck,
  Quote,
  Image,
  Code2,
  RefreshCw,
};

export default function AcademicToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { wallet, setShowFundingModal } = useWallet();

  const toolsRef = useRef(null);

  const filteredTools = academicTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.tool-card', {
        scrollTrigger: {
          trigger: toolsRef.current,
          start: 'top 85%',
        },
        y: 20,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [filteredTools]);

  return (
    <div className="bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] mb-1 md:mb-2 tracking-tight uppercase">Academic Tools</h1>
              <p className="text-xs md:text-sm text-[#6b7280] font-medium max-w-lg">
                Professional research and writing tools to elevate your academic work and streamline your workflow.
              </p>
            </div>
            <button 
              onClick={() => setShowFundingModal(true)}
              className="flex items-center gap-3 md:gap-4 px-5 md:px-6 py-2.5 md:py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-2xl md:rounded-[20px] shadow-sm hover:border-black transition-all active:scale-95 group text-left w-fit"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <p className="text-[#9ca3af] text-[8px] md:text-[10px] font-bold uppercase tracking-wider">Balance</p>
                <p className="text-[#111827] font-black text-base md:text-lg">{formatCurrency(wallet.balance)}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="sticky top-[70px] z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e7eb] shadow-sm pt-4 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />

              <Input
                placeholder="Search research tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-black rounded-full h-11 text-sm font-bold"
              />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full lg:w-auto overflow-x-auto custom-scrollbar">
              <TabsList className="bg-zinc-100 border border-[#e5e7eb] p-1 h-auto flex flex-nowrap md:flex-wrap rounded-full md:rounded-full min-w-max md:min-w-0">
                {toolCategories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div
          ref={toolsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        >
          {filteredTools.map((tool) => {
            const Icon = iconMap[tool.icon] || Wrench;
            return (
              <div
                key={tool.id}
                className="tool-card group bg-white border border-[#e5e7eb] rounded-[24px] md:rounded-[28px] p-6 md:p-8 hover:border-blue-500 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <Badge variant="secondary" className={`border-none px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black ${tool.pricePerUse === 0 ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-900'}`}>
                    {tool.pricePerUse === 0 ? 'FREE' : formatCurrency(tool.pricePerUse)}
                  </Badge>
                </div>
                <h3 className="text-base md:text-lg font-black text-[#111827] mb-2 md:mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{tool.name}</h3>
                <p className="text-[#6b7280] text-[12px] md:text-[13px] leading-relaxed font-medium mb-6 md:mb-8 flex-1">{tool.description}</p>
                <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-zinc-50 mt-auto">
                  <span className="text-[#9ca3af] text-[9px] md:text-[10px] font-black uppercase tracking-widest">{tool.usageCount.toLocaleString()} USES</span>
                  <Link href={`/marketplace/tools/${tool.id}`}>
                    <Button size="sm" className="bg-black hover:bg-zinc-800 text-white rounded-full px-5 md:px-6 font-bold text-[10px] md:text-xs uppercase tracking-widest h-9 md:h-10">Launch</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
