"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TemplateSelect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/');
        return;
      }

      // Fetch templates from database
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (templatesError) {
        console.error('Templates error:', templatesError);
      }

      setUser(user);
      setTemplates(templatesData || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleSelectTemplate = (templateId) => {
    router.push(`/standard/new?template=${templateId}`);
  };

  const getTemplateIcon = (name) => {
    if (name.includes('SIWES') || name.includes('Industrial')) return '🏭';
    if (name.includes('Thesis') || name.includes('Dissertation')) return '🎓';
    return '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <span className="text-2xl font-bold text-indigo-600">📄 W3 WriteLab</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Standard Tier
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Template
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the report structure that best fits your project type. 
            Each template is designed for specific academic requirements.
          </p>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template, index) => {
            const isExpanded = expandedTemplate === template.id;
            const structure = template.structure || { chapters: [] };
            const chapters = structure.chapters || [];

            return (
              <div
                key={template.id}
                className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl ${
                  index === 0 ? 'border-indigo-500 lg:scale-105' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {/* Popular Badge for first template */}
                {index === 0 && (
                  <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-t-xl text-center">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Title */}
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">
                      {getTemplateIcon(template.name)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  {/* Chapter Structure Preview */}
                  <div className="mb-6">
                    <button
                      onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                      className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-indigo-600 transition mb-3"
                    >
                      <span>Chapter Structure</span>
                      <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Always show first 3 chapters */}
                    <div className="space-y-2 text-sm text-gray-700">
                      {chapters.slice(0, isExpanded ? chapters.length : 3).map((chapter, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-indigo-600 flex-shrink-0">
                            Ch {i + 1}:
                          </span>
                          <span>{chapter.title}</span>
                        </div>
                      ))}
                      
                      {!isExpanded && chapters.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          +{chapters.length - 3} more chapters
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter Count Badge */}
                  <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold">{chapters.length} Chapters</span>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      index === 0
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Can&apos;t decide? Here&apos;s some guidance:
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Standard 5-Chapter:</strong> Perfect for final year projects, design projects, and most engineering reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>SIWES/Industrial Training:</strong> Ideal for internship reports and industrial training documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Thesis/Dissertation:</strong> Best for postgraduate research, masters thesis, and in-depth academic work</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}