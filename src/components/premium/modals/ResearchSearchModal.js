'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const Icons = {
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function ResearchSearchModal({ isOpen, onClose, projectId, onPaperSaved }) {
  const [query, setQuery] = useState('');
  const [yearStart, setYearStart] = useState('2018');
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/premium/search-papers?query=${encodeURIComponent(query)}&year=${yearStart}-${yearEnd}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      alert('Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePaper = async (paper) => {
    setSavingId(paper.paperId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('premium_research_papers')
        .insert({
          user_id: user.id,
          project_id: projectId,
          external_id: paper.paperId,
          title: paper.title,
          authors: paper.authors?.map(a => a.name) || [],
          year: paper.year,
          venue: paper.venue,
          abstract: paper.abstract,
          url: paper.url
        });

      if (error) throw error;
      onPaperSaved(); // Refresh workspace list
      alert('Paper saved to project context!');
    } catch (err) {
      alert('Failed to save paper.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Semantic Scholar Search</h2>
            <p className="text-sm text-slate-500">Find and save academic references for your project</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition"><Icons.X /></button>
        </div>

        <form onSubmit={handleSearch} className="p-6 bg-white flex flex-col sm:flex-row gap-4 border-b">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-3 text-slate-400"><Icons.Search /></div>
            <input 
              type="text" 
              placeholder="Search by topic, keywords, or authors..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="w-20 p-2 bg-slate-50 border rounded-lg text-sm" />
            <span className="text-slate-400">to</span>
            <input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="w-20 p-2 bg-slate-50 border rounded-lg text-sm" />
          </div>
          <button disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {results.length > 0 ? results.map((paper) => (
            <div key={paper.paperId} className="p-4 border rounded-xl hover:border-purple-300 transition group bg-white shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">{paper.title}</h3>
              <p className="text-xs text-purple-600 font-medium mb-2">
                {paper.year} • {paper.authors?.slice(0, 3).map(a => a.name).join(', ')}{paper.authors?.length > 3 ? ' et al.' : ''}
              </p>
              {paper.abstract && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 italic">"{paper.abstract}"</p>
              )}
              <div className="flex justify-between items-center">
                <a href={paper.url} target="_blank" className="text-xs text-slate-400 hover:underline">View on Semantic Scholar</a>
                <button 
                  onClick={() => savePaper(paper)}
                  disabled={savingId === paper.paperId}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white transition"
                >
                  {savingId === paper.paperId ? 'Saving...' : 'Save to Project'}
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-4 opacity-20">📚</div>
              <p className="text-slate-400">Search results will appear here</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
