"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, Grid3X3, List, Star,
  ChevronDown, X, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/marketplace/ui/sheet';
import { projects, faculties, departments, levels } from '@/data/marketplace/projects';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export default function LiveMarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [viewMode, setViewMode] = useState('grid');
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [showFilters, setShowFilters] = useState(false);

  const projectsRef = useRef(null);

  useEffect(() => {
    let result = projects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (selectedFaculty !== 'All') {
      result = result.filter((p) => p.faculty === selectedFaculty);
    }

    if (selectedDepartment !== 'All') {
      result = result.filter((p) => p.department === selectedDepartment);
    }

    if (selectedLevel !== 'All') {
      result = result.filter((p) => p.level === selectedLevel);
    }

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    setFilteredProjects(result);
  }, [searchQuery, selectedFaculty, selectedDepartment, selectedLevel, priceRange]);

  useEffect(() => {
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
  }, [filteredProjects]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('All');
    setSelectedDepartment('All');
    setSelectedLevel('All');
    setPriceRange([0, 50000]);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedFaculty !== 'All' ||
    selectedDepartment !== 'All' ||
    selectedLevel !== 'All' ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000;

  return (
    <div className="bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#111827] mb-2 tracking-tight">Project Marketplace</h1>
              <p className="text-[#6b7280] font-medium">
                Access over {projects.length} professional academic projects from verified student sellers
              </p>
            </div>
            <Link href="/marketplace/seller-setup">
              <Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-8 py-6 font-bold shadow-lg shadow-zinc-200">
                Sell Your Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-[#e5e7eb] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <Input
                placeholder="Search by topic, faculty, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-[#f8f9fc] border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-black rounded-full h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-[#9ca3af] hover:text-black" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Faculty Dropdown */}
              <div className="relative">
                <select
                  value={selectedFaculty}
                  onChange={(e) => {
                    setSelectedFaculty(e.target.value);
                    setSelectedDepartment('All');
                  }}
                  className="appearance-none bg-white border border-[#e5e7eb] text-[#111827] px-5 py-2.5 pr-12 rounded-full focus:border-black focus:outline-none text-sm font-semibold shadow-sm"
                >
                  {faculties.map((f) => (
                    <option key={f} value={f}>
                      {f === 'All' ? 'All Faculties' : f}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
              </div>

              {/* Department Dropdown */}
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={selectedFaculty === 'All'}
                  className="appearance-none bg-white border border-[#e5e7eb] text-[#111827] px-5 py-2.5 pr-12 rounded-full focus:border-black focus:outline-none disabled:opacity-50 text-sm font-semibold shadow-sm"
                >
                  <option value="All">All Departments</option>
                  {selectedFaculty !== 'All' &&
                    departments[selectedFaculty]?.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#f8f9fc] border border-[#e5e7eb] rounded-full p-1 shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-[#9ca3af] hover:text-black'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-[#9ca3af] hover:text-black'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="lg:hidden border-[#e5e7eb] text-[#111827] hover:bg-zinc-50 rounded-full h-11"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 w-2 h-2 bg-black rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 bg-white border-l border-[#e5e7eb] p-0"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
                    <span className="text-black font-bold text-lg">Filters</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-blue-600 text-sm font-bold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Faculty */}
                    <div>
                      <label className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3 block">Faculty</label>
                      <select
                        value={selectedFaculty}
                        onChange={(e) => {
                          setSelectedFaculty(e.target.value);
                          setSelectedDepartment('All');
                        }}
                        className="w-full bg-[#f8f9fc] border border-[#e5e7eb] text-[#111827] px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-black"
                      >
                        {faculties.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3 block">Department</label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        disabled={selectedFaculty === 'All'}
                        className="w-full bg-[#f8f9fc] border border-[#e5e7eb] text-[#111827] px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-black disabled:opacity-50"
                      >
                        <option value="All">All Departments</option>
                        {selectedFaculty !== 'All' &&
                          departments[selectedFaculty]?.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Level */}
                    <div>
                      <label className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3 block">Level</label>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full bg-[#f8f9fc] border border-[#e5e7eb] text-[#111827] px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-black"
                      >
                        <option value="All">All Levels</option>
                        {levels.map((l) => (
                          <option key={l} value={l}>
                            {l} Level
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-3 block">
                        Max Price: {formatCurrency(priceRange[1])}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#e5e7eb]">
                    <Button onClick={() => setShowFilters(false)} className="w-full bg-black text-white rounded-xl py-6">
                      Show Results
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[#9ca3af] text-xs font-bold uppercase tracking-wide mr-2">Active:</span>
              {selectedFaculty !== 'All' && (
                <Badge
                  variant="secondary"
                  className="bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200 cursor-pointer px-3 py-1 rounded-full text-xs font-bold"
                  onClick={() => setSelectedFaculty('All')}
                >
                  {selectedFaculty}
                  <X className="w-3 h-3 ml-1.5" />
                </Badge>
              )}
              {selectedDepartment !== 'All' && (
                <Badge
                  variant="secondary"
                  className="bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200 cursor-pointer px-3 py-1 rounded-full text-xs font-bold"
                  onClick={() => setSelectedDepartment('All')}
                >
                  {selectedDepartment}
                  <X className="w-3 h-3 ml-1.5" />
                </Badge>
              )}
              {selectedLevel !== 'All' && (
                <Badge
                  variant="secondary"
                  className="bg-zinc-100 text-black border-zinc-200 hover:bg-zinc-200 cursor-pointer px-3 py-1 rounded-full text-xs font-bold"
                  onClick={() => setSelectedLevel('All')}
                >
                  {selectedLevel}L
                  <X className="w-3 h-3 ml-1.5" />
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-zinc-400 text-xs font-bold hover:text-black ml-2 uppercase tracking-wider transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-[#6b7280] font-medium text-sm">
            Found <span className="text-black font-bold">{filteredProjects.length}</span> professional projects
          </p>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-[#e5e7eb] shadow-sm">
            <div className="w-20 h-20 bg-[#f8f9fc] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-[#9ca3af]" />
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-2">No matches found</h3>
            <p className="text-[#6b7280] mb-8 max-w-sm mx-auto font-medium">We couldn't find any projects matching your current filters. Try broadening your search.</p>
            <Button onClick={clearFilters} variant="outline" className="border-[#e5e7eb] text-black font-bold rounded-full px-8">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div
            ref={projectsRef}
            className={
              viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
                : 'space-y-6'
            }
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, viewMode }) {
  if (viewMode === 'list') {
    return (
      <Link href={`/marketplace/project/${project.id}`}>
        <div className="project-card flex gap-6 p-5 bg-white border border-[#e5e7eb] rounded-[24px] hover:border-black transition-all duration-300 shadow-sm hover:shadow-xl group">
          <div className="w-64 h-44 flex-shrink-0 rounded-[18px] overflow-hidden">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0 py-2">
            <div className="flex items-start justify-between gap-6 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-zinc-100 text-zinc-600 border-none hover:bg-zinc-100 text-[10px] font-bold py-0 h-5">
                    {project.faculty}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-600 border-none hover:bg-blue-50 text-[10px] font-bold py-0 h-5">
                    {project.level}L
                  </Badge>
                </div>
                <h3 className="text-[#111827] font-bold text-xl mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-[#6b7280] text-sm line-clamp-2 leading-relaxed font-medium">
                  {project.description}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#111827] font-black text-2xl">
                  {formatCurrency(project.price)}
                </p>
                {project.originalPrice && (
                  <p className="text-[#9ca3af] text-sm line-through font-bold">
                    {formatCurrency(project.originalPrice)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.seller.displayName}`}
                    alt={project.seller.displayName}
                    className="w-7 h-7 rounded-full border border-zinc-100"
                  />
                  <span className="text-[#6b7280] text-sm font-bold">{project.seller.displayName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-[#111827] text-sm font-black">{project.rating}</span>
                  <span className="text-[#9ca3af] text-xs font-bold">({project.reviewCount})</span>
                </div>
              </div>
              <Button size="sm" className="bg-[#f8f9fc] hover:bg-zinc-900 text-black hover:text-white rounded-full px-6 font-bold transition-all border border-[#e5e7eb]">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/marketplace/project/${project.id}`}>
      <div className="project-card group bg-white border border-[#e5e7eb] rounded-[28px] overflow-hidden hover:border-black transition-all duration-300 h-full flex flex-col shadow-sm hover:shadow-2xl">
        <div className="relative h-52 overflow-hidden p-2">
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover rounded-[22px] transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute top-5 left-5 flex gap-2">
            <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[#111827] text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm border border-zinc-100">
              {project.faculty}
            </span>
          </div>
          {project.originalPrice && (
            <div className="absolute top-5 right-5">
              <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                Save {Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
              {project.level} LEVEL
            </span>
          </div>
          <h3 className="text-[#111827] font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
            {project.title}
          </h3>
          <p className="text-[#6b7280] text-[13px] line-clamp-2 mb-6 flex-1 leading-relaxed font-medium">
            {project.description}
          </p>
          <div className="flex items-center gap-2.5 mb-5">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.seller.displayName}`}
              alt={project.seller.displayName}
              className="w-7 h-7 rounded-full border border-zinc-100 shadow-sm"
            />
            <span className="text-[#6b7280] text-xs font-bold truncate">{project.seller.displayName}</span>
          </div>
          <div className="flex items-center justify-between pt-5 border-t border-zinc-50 mt-auto">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-[#111827] text-sm font-black">{project.rating}</span>
            </div>
            <div className="text-right">
              <span className="text-[#111827] font-black text-lg">
                {formatCurrency(project.price)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
