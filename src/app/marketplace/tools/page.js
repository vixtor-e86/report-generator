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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#111827] mb-2 tracking-tight">Academic Tools</h1>
              <p className="text-[#6b7280] font-medium">
                Professional research and writing tools to elevate your academic work
              </p>
            </div>
            <button 
              onClick={() => setShowFundingModal(true)}
              className="flex items-center gap-4 px-6 py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-[20px] shadow-sm hover:border-black transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[#9ca3af] text-[10px] font-bold uppercase tracking-wider">Wallet Balance</p>
                <p className="text-[#111827] font-black text-lg">{formatCurrency(wallet.balance)}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-[#e5e7eb] shadow-md pt-4 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />

              <Input
                placeholder="Search research tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-black rounded-full h-11"
              />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full lg:w-auto">
              <TabsList className="bg-zinc-100 border border-[#e5e7eb] p-1 h-auto flex-wrap rounded-full shadow-inner">
                {toolCategories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          ref={toolsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filteredTools.map((tool) => {
            const Icon = iconMap[tool.icon] || Wrench;
            return (
              <div
                key={tool.id}
                className="tool-card group bg-white border border-[#e5e7eb] rounded-[28px] p-8 hover:border-blue-500 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                    <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <Badge variant="secondary" className={`border-none px-3 py-1 rounded-full text-[10px] font-black ${tool.pricePerUse === 0 ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-900'}`}>
                    {tool.pricePerUse === 0 ? 'FREE' : formatCurrency(tool.pricePerUse)}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#111827] mb-3 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                <p className="text-[#6b7280] text-[13px] leading-relaxed font-medium mb-8 flex-1">{tool.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-50 mt-auto">
                  <span className="text-[#9ca3af] text-[10px] font-black uppercase tracking-widest">{tool.usageCount.toLocaleString()} USES</span>
                  <Link href={`/marketplace/tools/${tool.id}`}>
                    <Button size="sm" className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 font-bold">Launch</Button>
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
