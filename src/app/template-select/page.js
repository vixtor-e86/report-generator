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
  
  // Two-tier selection state
  const [step, setStep] = useState(1); // 1 = Template Type, 2 = Faculty Selection
  const [selectedType, setSelectedType] = useState(null); // '5-chapter', '6-chapter-thesis', 'siwes'
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/');
        return;
      }

      // Fetch all templates from database
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

  // Get template types with their counts
  const getTemplateTypes = () => {
    const types = [
      {
        id: '5-chapter',
        name: '5-Chapter Report',
        icon: '📄',
        description: 'Standard format for undergraduate final year projects and design work',
        popular: true,
        count: templates.filter(t => t.template_type === '5-chapter').length
      },
      {
        id: '6-chapter-thesis',
        name: '6-Chapter Thesis',
        icon: '🎓',
        description: 'Extended format for postgraduate research, masters, and in-depth studies',
        popular: false,
        count: templates.filter(t => t.template_type === '6-chapter-thesis').length
      },
      {
        id: 'siwes',
        name: 'SIWES/Industrial Training',
        icon: '🏭',
        description: 'For Student Industrial Work Experience Scheme and internship reports',
        popular: false,
        count: templates.filter(t => t.template_type === 'siwes').length
      }
    ];
    return types;
  };

  // Get faculties for selected type
  const getFacultiesForType = (type) => {
    if (type === 'siwes') return []; // SIWES doesn't need faculty selection
    
    const facultyTemplates = templates.filter(t => t.template_type === type && t.faculty);
    const faculties = [...new Set(facultyTemplates.map(t => t.faculty))];
    
    return faculties.map(faculty => {
      const template = facultyTemplates.find(t => t.faculty === faculty);
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

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    
    if (typeId === 'siwes') {
      // SIWES goes directly to project creation
      const siwesTemplate = templates.find(t => t.template_type === 'siwes');
      if (siwesTemplate) {
        router.push(`/standard/new?template=${siwesTemplate.id}`);
      }
    } else {
      // Show faculty selection
      const faculties = getFacultiesForType(typeId);
      setAvailableFaculties(faculties);
      setStep(2);
    }
  };

  const handleFacultySelect = (faculty) => {
    const template = faculty.template;
    if (template) {
      router.push(`/standard/new?template=${template.id}`);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedFaculty(null);
    setAvailableFaculties([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const templateTypes = getTemplateTypes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {step === 1 ? (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Template Types
              </button>
            )}
            <span className="text-2xl font-bold text-indigo-600">📄 W3 WriteLab</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="font-semibold hidden sm:inline">Template Type</span>
            </div>
            <div className={`h-0.5 w-12 sm:w-24 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-semibold hidden sm:inline">Faculty</span>
            </div>
            <div className={`h-0.5 w-12 sm:w-24 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="font-semibold hidden sm:inline">Details</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Template Type Selection */}
        {step === 1 && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Standard Tier
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Template Type
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Select the report structure that matches your academic requirement
              </p>
            </div>

            {/* Template Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {templateTypes.map((type, index) => (
                <div
                  key={type.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer ${
                    type.popular ? 'border-indigo-500 lg:scale-105' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  {/* Popular Badge */}
                  {type.popular && (
                    <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-t-xl text-center">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon & Title */}
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">{type.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {type.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {type.description}
                      </p>
                    </div>

                    {/* Faculty Count Badge */}
                    {type.id !== 'siwes' && (
                      <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold">{type.count} Faculties Available</span>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        type.popular
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {type.id === 'siwes' ? 'Continue' : 'Choose Faculty →'}
                    </button>
                  </div>
                </div>
              ))}
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
                      <span><strong>5-Chapter Report:</strong> Perfect for undergraduate final year projects across all faculties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>6-Chapter Thesis:</strong> Best for postgraduate research, masters thesis, and in-depth academic work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>SIWES/Industrial Training:</strong> Specifically for internship and industrial training documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Faculty Selection */}
        {step === 2 && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {templateTypes.find(t => t.id === selectedType)?.name}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Select Your Faculty
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the faculty that matches your department or field of study
              </p>
            </div>

            {/* Faculty Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {availableFaculties.map((faculty) => (
                <div
                  key={faculty.name}
                  onClick={() => handleFacultySelect(faculty)}
                  className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{faculty.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {faculty.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {faculty.template?.structure?.chapters?.length || 0} Chapters
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Faculty Info */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">Faculty-Specific Templates</p>
                  <p>
                    Each faculty has a customized structure with section names, terminology, and requirements 
                    specific to your field of study. This ensures your report meets the exact standards expected 
                    in your discipline.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}