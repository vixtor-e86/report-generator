"use client";
import { useState } from 'react';
import { 
  Search, Sparkles, RefreshCw, GraduationCap, 
  Lightbulb, BookOpen, Layers, CheckCircle2, 
  ArrowRight, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function ProjectFinder({ 
  isProcessing, 
  setIsProcessing 
}) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [researchType, setResearchType] = useState('any');
  const [industry, setIndustry] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return toast.error("Please enter a topic or area of interest");

    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/project-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          department,
          level,
          researchType,
          industry
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(data.data);
      toast.success('Found some great project topics for you!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
      {/* Search Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
        
        <div className="relative space-y-6 md:space-y-8">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-300" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What area are you interested in?"
                className="h-16 md:h-20 pl-14 md:pl-16 bg-slate-50 border-slate-100 rounded-[24px] md:rounded-[32px] font-bold text-base md:text-lg text-zinc-900 focus:border-black transition-all shadow-inner"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              <div className="relative">
                <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                <Input 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Department (Optional)"
                  className="h-14 md:h-16 pl-12 md:pl-14 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-zinc-900 focus:border-black transition-all"
                />
              </div>
              <div className="relative">
                <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                <Input 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Level/Year (Optional)"
                  className="h-14 md:h-16 pl-12 md:pl-14 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-zinc-900 focus:border-black transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              <div className="relative">
                <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                <select 
                  value={researchType}
                  onChange={(e) => setResearchType(e.target.value)}
                  className="w-full h-14 md:h-16 pl-12 md:pl-14 pr-4 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-zinc-900 focus:border-black transition-all appearance-none outline-none"
                >
                  <option value="any">Any Methodology</option>
                  <option value="quantitative">Quantitative</option>
                  <option value="qualitative">Qualitative</option>
                  <option value="mixed">Mixed Methods</option>
                </select>
              </div>
              <div className="relative">
                <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                <Input 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Industry (e.g. Health)"
                  className="h-14 md:h-16 pl-12 md:pl-14 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-zinc-900 focus:border-black transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest">Free Tool</Badge>
            </div>
            
            <Button 
              onClick={handleSearch}
              disabled={isProcessing || !query.trim()}
              className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-8 px-8 md:px-12 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 md:gap-4 transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin text-blue-400" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  Find Topics
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {results.map((topic, idx) => (
          <div key={idx} className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="text-3xl md:text-4xl">{topic.emoji || '💡'}</div>
              <Badge className="bg-slate-100 text-slate-500 border-none px-3 md:px-4 py-1 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                {topic.category || 'General'}
              </Badge>
            </div>
            
            <h3 className="text-lg md:text-xl font-black text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
              {topic.title}
            </h3>
            
            <div className="bg-slate-50 rounded-[20px] md:rounded-3xl p-4 md:p-6 border border-slate-100 mb-6 flex-1">
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                {topic.problem_gap}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">Feasibility</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 md:w-32 h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-1000" 
                      style={{ width: `${(topic.feasibility || 7) * 10}%` }}
                    />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-zinc-900">{topic.feasibility}/10</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {topic.tools?.map((tool, tIdx) => (
                  <span key={tIdx} className="px-2 md:px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] md:text-[10px] font-bold border border-blue-100">
                    #{tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {!isProcessing && results.length === 0 && (
          <div className="md:col-span-2 py-20 md:py-32 text-center bg-white border border-dashed border-slate-200 rounded-[48px] md:rounded-[64px] px-6">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200">
              <Lightbulb className="w-8 h-8 md:w-12 md:h-12" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Ready to Discover?</h2>
            <p className="text-slate-600 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] max-w-xs mx-auto">
              Enter a field of interest above to generate trending academic topics
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="md:col-span-2 py-20 md:py-32 text-center bg-white border border-[#e5e7eb] rounded-[48px] md:rounded-[64px] animate-pulse px-6">
            <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 md:mb-8">
              <div className="absolute inset-0 bg-blue-100 rounded-[32px] md:rounded-[40px] animate-ping opacity-25" />
              <div className="relative w-16 h-16 md:w-24 md:h-24 bg-blue-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-blue-600">
                <RefreshCw className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
              </div>
            </div>
            <p className="text-blue-600 font-black uppercase text-[8px] md:text-[10px] tracking-[0.3em] animate-bounce">
              Analyzing academic trends...
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-zinc-900 rounded-[32px] md:rounded-[48px] p-6 md:p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-blue-600/10 blur-[60px] md:blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2">Pro Tip for Students</h4>
            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
              When you find a topic you like, use the <span className="text-white font-bold">Reference Finder</span> to get preliminary sources and the <span className="text-white font-bold">Slide Generator</span> to prepare your project proposal presentation.
            </p>
          </div>
          <Button variant="outline" className="w-full md:w-auto border-blue-500/50 hover:bg-blue-600 hover:text-white text-blue-400 rounded-full px-8 py-5 md:py-6 font-black uppercase text-[9px] md:text-[10px] tracking-widest backdrop-blur-md transition-all h-auto">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
