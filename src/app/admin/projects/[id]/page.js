"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/admin/projects/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center p-12 text-slate-500">
        Project not found. <Link href="/admin/projects" className="text-indigo-600 underline">Go back</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/projects" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
          ← Back to Projects
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            <p className="text-slate-500 mt-1">
              By <span className="font-medium text-slate-900">{project.user_profiles?.username}</span> • {project.department}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
            (project.tier || 'free') === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {project.tier || 'free'} Tier
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
          <div className="text-lg font-bold text-slate-900 mt-1 capitalize">{project.status?.replace('_', ' ')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Chapters Generated</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{project.chapters?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Created Date</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{new Date(project.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-700">Project Content</h2>
        </div>
        
        {project.chapters?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No chapters generated yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.chapters.map((chapter) => (
              <div key={chapter.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {chapter.chapter_number}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{chapter.title}</h3>
                    <p className="text-xs text-slate-500">Generated {new Date(chapter.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChapter(chapter)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                >
                  Read Content
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read Modal */}
      {selectedChapter && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Chapter {selectedChapter.chapter_number}</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedChapter.title}</h2>
              </div>
              <button onClick={() => setSelectedChapter(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{selectedChapter.content}</ReactMarkdown>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setSelectedChapter(null)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium text-sm"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
