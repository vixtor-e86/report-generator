"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import CustomModal from '@/components/premium/modals/CustomModal';

function AdvancedTemplateSelectContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [notification, setNotification] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const showNotification = (title, message, type = 'info') => {
    setNotification({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          router.push('/'); 
          return;
        }

        setUser(session.user);

        // Fetch advanced templates
        const { data: templatesData } = await supabase
          .from('templates')
          .select('*')
          .eq('is_advanced', true);
        
        if (templatesData) {
          setTemplates(templatesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleTemplateSelect = (item) => {
    // Advanced templates are only for Premium projects
    router.replace(`/premium/page-description?templateId=${item.id}&faculty=${encodeURIComponent(item.faculty || '')}&department=${encodeURIComponent(item.department || '')}`);
  };

  const filteredTemplates = templates.filter(t => {
    const term = searchTerm.toLowerCase();
    return (t.school && t.school.toLowerCase().includes(term)) ||
           (t.faculty && t.faculty.toLowerCase().includes(term)) ||
           (t.department && t.department.toLowerCase().includes(term)) ||
           (t.name && t.name.toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link
              href="/template-select"
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Back to Selection</span>
              <span className="xs:hidden">Back</span>
            </Link>

            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-base sm:text-xl md:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Advanced Templates
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Find Your Institution's Template
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Search for specific templates uploaded for your school, faculty, or department.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by School, Faculty, or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
            />
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-2xl mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500">
              We couldn't find any advanced templates matching your search criteria. 
              Try a different search term or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-12">
            {filteredTemplates.map((item) => (
              <div
                key={item.id}
                onClick={() => handleTemplateSelect(item)}
                className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-5 lg:p-6 flex flex-col h-full"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 line-clamp-2">
                      {item.department || item.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm">
                    {item.school && (
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 font-semibold mt-0.5">🏫</span>
                        <span className="text-gray-700"><strong>School:</strong> {item.school}</span>
                      </div>
                    )}
                    {item.faculty && (
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 font-semibold mt-0.5">📚</span>
                        <span className="text-gray-700"><strong>Faculty:</strong> {item.faculty}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-indigo-600 text-sm font-semibold">
                  <span>Select Template</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
}

export default function AdvancedTemplateSelect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <AdvancedTemplateSelectContent />
    </Suspense>
  );
}
