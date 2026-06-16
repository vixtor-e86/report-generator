"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [counts, setCounts] = useState({ all: 0, free: 0, unlocked: 0, standard: 0, premium: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, free, standard, premium
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProjects(displayLimit);
  }, [displayLimit]);

  const fetchProjects = async (limit) => {
    try {
      if (limit > 50) setLoadingMore(true);
      else setLoading(true);

      const response = await fetch(`/api/admin/projects?limit=${limit}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setProjects(data.projects || []);
      setCounts(data.counts || { all: 0, free: 0, standard: 0, premium: 0 });
      
      // If we got fewer projects than we asked for, there are no more to load
      if (data.projects?.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || (project.tier || 'free') === filter;
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (project.title || '').toLowerCase().includes(s) ||
      (project.user_profiles?.username || '').toLowerCase().includes(s) ||
      (project.user_profiles?.email || '').toLowerCase().includes(s);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Projects</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">Manage and view all user generated reports</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', 'free', 'unlocked', 'standard', 'premium'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition capitalize ${
                  filter === tier
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier} ({counts[tier]?.toLocaleString() || 0})
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full md:w-72 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-sm"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Project Title</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 line-clamp-1 max-w-[220px]" title={project.title}>
                      {project.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{project.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-bold">{project.user_profiles?.username || 'No Username'}</div>
                    <div className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{project.user_profiles?.email || 'No Email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm ${
                      (project.tier || 'free') === 'standard' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 
                      (project.tier || 'free') === 'premium' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      (project.tier || 'free') === 'unlocked' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {project.tier || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tokens:</span>
                            <span className="text-xs font-black text-slate-900">{project.tokens_used?.toLocaleString() || 0}</span>
                        </div>
                        {project.tier === 'premium' && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Humanized:</span>
                                <span className="text-xs font-black text-emerald-600">{project.humanizer_words_used?.toLocaleString() || 0} w</span>
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      project.status === 'in_progress' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {project.status === 'completed' ? 'Finalized' : 'Syncing'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-bold text-slate-700">{new Date(project.created_at).toLocaleDateString()}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-black">{new Date(project.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProjects.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No projects found.
          </div>
        )}

        {/* Load More Button */}
        {hasMore && filteredProjects.length > 0 && (
          <div className="p-8 border-t border-slate-100 flex justify-center bg-slate-50/30">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 active:scale-95"
            >
              {loadingMore ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                  Initialising More...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                  Load More Projects
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
