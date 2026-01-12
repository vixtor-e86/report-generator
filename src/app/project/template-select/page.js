// src/app/project/template-select/page.js
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FreeTemplateSelect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/');
        return;
      }

      // Check if user already has a free project
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('tier', 'free');

      if (existingProjects && existingProjects.length > 0) {
        alert('You have already used your 1 free project. Upgrade to Standard or Premium to create more.');
        router.push('/dashboard');
        return;
      }

      // Fetch ONLY 5-chapter templates (exclude SIWES and 6-chapter thesis)
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .eq('template_type', '5-chapter')
        .order('faculty', { ascending: true });

      if (templatesError) {
        console.error('Templates error:', templatesError);
      }

      setUser(user);
      setTemplates(templatesData || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  // Get unique faculties from templates
  const getFaculties = () => {
    const faculties = [...new Set(templates.map(t => t.faculty))].filter(Boolean);
    return faculties.map(faculty => {
      const template = templates.find(t => t.faculty === faculty);
      return {
        name: faculty,
        template: template,
        icon: getFacultyIcon(faculty)
      };
    });
  };

  const getFacultyIcon = (faculty) => {
    const icons = {
      'Engineering': '⚙️',
      'Sciences': '🔬',
      'Management Sciences': '💼',
      'Social Sciences': '👥',
      'Arts & Humanities': '🎨',
      'Law': '⚖️',
      'Education': '📚',
      'Agricultural Sciences': '🌾',
      'Environmental Science': '🌍',
      'Basic Medical Sciences': '🩺'
    };
    return icons[faculty] || '📖';
  };

  const handleFacultySelect = (faculty) => {
    const template = faculty.template;
    if (template) {
      router.push(`/project/new?template=${template.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const faculties = getFaculties();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Back to Dashboard</span>
              <span className="xs:hidden">Back</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-base sm:text-xl md:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free Tier - 5-Chapter Report
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Select Your Faculty
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the faculty that matches your department to get the right report structure
          </p>
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-12">
          {faculties.map((faculty) => (
            <div
              key={faculty.name}
              onClick={() => handleFacultySelect(faculty)}
              className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-5 lg:p-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl flex-shrink-0">{faculty.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 truncate">
                    {faculty.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    5 Chapters
                  </p>
                </div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                What's Included in Free Tier:
              </h4>
              <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                  <span>Complete 5-chapter report customized for your faculty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                  <span>2 images with captions (added in workspace)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                  <span>PDF export with professional formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                  <span>Basic AI quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold flex-shrink-0">✓</span>
                  <span>APA reference style</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 text-center max-w-4xl mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Need More Features?</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Upgrade to <strong>Standard</strong> for editing, regeneration, 10 images, DOCX export, and more reference styles!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base"
          >
            View Pricing
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}