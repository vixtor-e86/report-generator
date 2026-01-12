"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const PRICING = {
  STANDARD: Number(process.env.NEXT_PUBLIC_PRICE_STANDARD) || 10000,
  PREMIUM: Number(process.env.NEXT_PUBLIC_PRICE_PREMIUM) || 20000,
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [standardProjects, setStandardProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/'); 
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
        return;
      }

      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: userStandardProjects } = await supabase
        .from('standard_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Check for unused payments
      const { data: unusedPayments } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .is('project_id', null)
        .order('paid_at', { ascending: false })
        .limit(1);

      if (unusedPayments && unusedPayments.length > 0) {
        setPendingPayment(unusedPayments[0]);
      }

      setUser(user);
      setProfile(profile);
      setProjects(userProjects || []);
      setStandardProjects(userStandardProjects || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateFree = () => {
    const freeProjects = projects.filter(p => p.tier === 'free');
    if (freeProjects.length >= 1) {
      alert('You have already used your 1 free project. Upgrade to Standard or Premium to create more.');
      return;
    }
    router.push('/project/template-select');
  };

  const handleCreateStandard = async () => {
    // Check if user has pending payment
    if (pendingPayment) {
      if (confirm('You have an unused Standard payment. Continue with existing payment?')) {
        router.push('/template-select');
        return;
      }
    }

    setCreatingPayment(true);
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          tier: 'standard',
          amount: PRICING.STANDARD
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;

    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCreatePremium = () => {
    setShowPremiumModal(true);
  };

  const allProjects = [...projects, ...standardProjects];
  const totalReports = allProjects.length;
  const completedReports = allProjects.filter(p => p.status === 'completed').length;
  const inProgressReports = allProjects.filter(p => p.status === 'in_progress').length;
  const hasFreeProject = projects.some(p => p.tier === 'free');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 group-hover:text-indigo-700 transition">
                W3 WriteLab
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{profile.username || 'Student'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{user.email}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Free</span>
                  </div>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-indigo-200 shadow-md">
                  {(profile.username || user.email)[0].toUpperCase()}
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 text-sm font-medium transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-indigo-600 focus:outline-none p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {(profile.username || user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex-shrink-0">Free</span>
            </div>
            <button onClick={handleLogout} className="w-full text-left text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {profile.username || 'Student'}! 👋</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {profile.department && profile.department !== 'Other' ? <span>{profile.department} • </span> : null}
            {totalReports === 0 ? 'Ready to create your first report?' : `${totalReports} ${totalReports === 1 ? 'project' : 'projects'} created`}
          </p>
        </div>

        {pendingPayment && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Payment Received! 🎉
                </h3>
                <p className="text-gray-700 mb-4">
                  Your Standard tier payment of <strong>₦{pendingPayment.amount.toLocaleString()}</strong> was successful. 
                  Complete your project setup to start creating.
                </p>
                <button
                  onClick={() => router.push('/template-select')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                  Continue Project Setup
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Create New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* FREE TIER */}
            <div className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-gray-400 hover:shadow-lg transition flex flex-col">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">₦0</div>
                <p className="text-xs sm:text-sm text-gray-500">Try it out</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-sm sm:text-base flex-1">
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic AI quality
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  2 images (end only)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  PDF export only
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  No editing
                </li>
              </ul>
              <div className="mt-auto">
                <Link href="/features" className="block text-center text-sm text-gray-600 hover:text-indigo-600 font-medium mb-3 transition">
                  Learn more about features →
                </Link>
                <button onClick={handleCreateFree} disabled={hasFreeProject} className="w-full bg-gray-900 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                  {hasFreeProject ? 'Limit Reached' : 'Create Free'}
                </button>
                {hasFreeProject && <p className="text-xs text-red-600 text-center mt-2">1 free project used</p>}
              </div>
            </div>

            {/* STANDARD TIER */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 relative hover:shadow-2xl transition transform hover:scale-105 flex flex-col">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-xl text-xs sm:text-sm font-bold">POPULAR</div>
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Standard</h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-2">₦{PRICING.STANDARD.toLocaleString()}</div>
                <p className="text-xs sm:text-sm text-gray-500">Best value</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-sm sm:text-base flex-1">
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Good AI quality
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  10 images (anywhere)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  PDF + DOCX export
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Edit & regenerate
                </li>
              </ul>
              <div className="mt-auto">
                <Link href="/features" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-3 transition">
                  See what's included →
                </Link>
                <button onClick={handleCreateStandard} className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base">
                  Create Standard
                </button>
              </div>
            </div>

            {/* PREMIUM TIER */}
            <div className="bg-white border-2 border-purple-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-purple-500 hover:shadow-lg transition flex flex-col">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">₦{PRICING.PREMIUM.toLocaleString()}</div>
                <p className="text-xs sm:text-sm text-gray-500">Best quality</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-sm sm:text-base flex-1">
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Best AI model
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Unlimited images
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Custom templates
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Priority support
                </li>
              </ul>
              <div className="mt-auto">
                <Link href="/features" className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium mb-3 transition">
                  Explore premium features →
                </Link>
                <button onClick={handleCreatePremium} className="w-full bg-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition text-sm sm:text-base">
                  Create Premium
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS + PROJECTS + MODALS CONTINUE IN NEXT PART */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 sm:p-6 rounded-xl shadow-sm border border-green-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-gray-700 text-xs sm:text-sm font-medium uppercase tracking-wider">Current Plan</h3>
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">Free</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{hasFreeProject ? '0 free reports available' : '1 free report available'}</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Total Projects</h3>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{totalReports}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">{totalReports === 0 ? 'No projects yet' : `${completedReports} completed, ${inProgressReports} in progress`}</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Completed</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{completedReports}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">Reports ready to export</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Images Quota</h3>
              <div className="p-2 bg-orange-50 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">2</span>
              <span className="text-xs sm:text-sm text-gray-500">images/project</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">Free tier limit</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Projects</h2>
            {totalReports > 0 && <button className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All →</button>}
          </div>
          
          {totalReports === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center hover:border-indigo-400 transition group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition shadow-md">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Create your first report</h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">Choose a tier above to get started. Free tier includes 1 complete project with basic AI quality.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {allProjects.map((project) => (
                <Link key={project.id} href={project.tier === 'free' ? `/project/${project.id}` : `/standard/${project.id}`} className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-indigo-600 transition line-clamp-2">{project.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{project.department}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${project.status === 'completed' ? 'bg-green-100 text-green-700' : project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {project.status === 'completed' ? 'Done' : project.status === 'in_progress' ? 'Progress' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4">{project.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${project.tier === 'free' ? 'bg-gray-100' : project.tier === 'standard' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {project.tier.charAt(0).toUpperCase() + project.tier.slice(1)}
                    </span>
                    <span>Chapter {project.current_chapter || 1}/5</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>



      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Premium Tier Coming Soon!</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6 leading-relaxed">Premium tier with advanced AI, unlimited images, and custom templates is currently in development.<br /><br />Try the <span className="font-bold text-indigo-600">Standard tier</span> to experience enhanced AI quality and editing features!</p>
              <button onClick={() => setShowPremiumModal(false)} className="w-full bg-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition text-sm sm:text-base">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}