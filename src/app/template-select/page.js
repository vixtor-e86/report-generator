"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function TemplateSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Payment verification state
  const [noPaymentFound, setNoPaymentFound] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

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


  useEffect(() => {
    async function verifyPaymentIfNeeded() {
      // Don't proceed if no user
      if (!user) return;

      // ✅ NEW: Admin bypass
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setPaymentVerified(true);
        return;
      }

      // Check for Flutterwave or Paystack params
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const paymentRef = searchParams.get('payment_ref'); // Keep for backward compatibility

      if (transactionId || txRef || paymentRef) {
        // User came back from payment provider
        setVerifyingPayment(true);
        try {
          // Construct verification URL
          let verifyUrl = '/api/flutterwave/verify?';
          if (transactionId) verifyUrl += `transaction_id=${transactionId}`;
          else if (txRef) verifyUrl += `tx_ref=${txRef}`;
          else if (paymentRef) verifyUrl += `tx_ref=${paymentRef}`; // Fallback

          const response = await fetch(verifyUrl);
          const data = await response.json();

          if (data.verified) {
            setPaymentVerified(true);
            setPendingPayment(data.transaction);

            // Clean URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('transaction_id');
            newUrl.searchParams.delete('tx_ref');
            newUrl.searchParams.delete('status');
            newUrl.searchParams.delete('payment_ref');
            window.history.replaceState({}, '', newUrl);
          } else {
            alert('Payment verification failed. Please contact support if you were charged.');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Verification error:', error);
          alert('Failed to verify payment. Please contact support.');
          router.push('/dashboard');
        } finally {
          setVerifyingPayment(false);
        }
      } else {
        // No payment reference in URL - check for existing unused payment
        const { data: unusedPayments } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .is('project_id', null)
          .order('paid_at', { ascending: false })
          .limit(1);

        if (unusedPayments && unusedPayments.length > 0) {
          // Found existing payment - allow them to proceed
          setPendingPayment(unusedPayments[0]);
          setPaymentVerified(true);
        } else {
          // ✅ NO PAYMENT - Show blocking screen
          setNoPaymentFound(true);
        }
      }
    }

    if (user) {
      verifyPaymentIfNeeded();
    }
  }, [user, searchParams, router]);

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

  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Verifying your payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait, do not refresh the page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (noPaymentFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Required</h2>
          <p className="text-gray-600 mb-6">
            You need to complete payment before accessing templates. Please return to the dashboard and click "Create Standard" to make a payment.
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const templateTypes = getTemplateTypes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      {/* Navigation - Mobile Responsive */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Back Button */}
            {step === 1 ? (
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
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Template Types</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}

            {/* Logo - Responsive sizing */}
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-base sm:text-xl md:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Payment Success Banner */}
      {paymentVerified && pendingPayment && (
        <div className="bg-green-50 border-b-2 border-green-500 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Payment Verified! ₦{pendingPayment.amount.toLocaleString()}</span>
              <span className="text-sm">- Now select your template</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Progress Indicator - Mobile Responsive */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {/* Step 1 */}
            <div className={`flex items-center gap-1 sm:gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-base ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="font-semibold text-xs sm:text-sm hidden xs:inline">Template</span>
            </div>

            {/* Connector */}
            <div className={`h-0.5 w-8 sm:w-12 md:w-24 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className={`flex items-center gap-1 sm:gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-base ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-semibold text-xs sm:text-sm hidden xs:inline">Faculty</span>
            </div>

            {/* Connector */}
            <div className={`h-0.5 w-8 sm:w-12 md:w-24 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>

            {/* Step 3 */}
            <div className={`flex items-center gap-1 sm:gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-base ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="font-semibold text-xs sm:text-sm hidden xs:inline">Details</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Template Type Selection */}
        {step === 1 && (
          <>
            {/* Header - Mobile Responsive */}
            <div className="text-center mb-8 sm:mb-12 px-4">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Standard Tier
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Choose Your Template Type
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
                Select the report structure that matches your academic requirement
              </p>
            </div>

            {/* Template Type Cards - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              {templateTypes.map((type, index) => (
                <div
                  key={type.id}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer ${
                    type.popular ? 'border-indigo-500 sm:scale-105' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  {/* Popular Badge */}
                  {type.popular && (
                    <div className="bg-indigo-600 text-white text-xs font-bold px-3 sm:px-4 py-1 rounded-t-xl text-center">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="p-4 sm:p-6 lg:p-8">
                    {/* Icon & Title */}
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">{type.icon}</div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                        {type.name}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {type.description}
                      </p>
                    </div>

                    {/* Faculty Count Badge */}
                    {type.id !== 'siwes' && (
                      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-600">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold">{type.count} Faculties Available</span>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base ${
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

            {/* Info Section - Mobile Responsive */}
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
                    Can&apos;t decide? Here&apos;s some guidance:
                  </h4>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold flex-shrink-0">•</span>
                      <span><strong>5-Chapter Report:</strong> Perfect for undergraduate final year projects across all faculties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold flex-shrink-0">•</span>
                      <span><strong>6-Chapter Thesis:</strong> Best for postgraduate research, masters thesis, and in-depth academic work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold flex-shrink-0">•</span>
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
            {/* Header - Mobile Responsive */}
            <div className="text-center mb-8 sm:mb-12 px-4">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {templateTypes.find(t => t.id === selectedType)?.name}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Select Your Faculty
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the faculty that matches your department or field of study
              </p>
            </div>

            {/* Faculty Cards Grid - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-12">
              {availableFaculties.map((faculty) => (
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
                        {faculty.template?.structure?.chapters?.length || 0} Chapters
                      </p>
                    </div>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Faculty Info - Mobile Responsive */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-5 lg:p-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs sm:text-sm text-gray-700">
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

export default function TemplateSelect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TemplateSelectContent />
    </Suspense>
  );
}
