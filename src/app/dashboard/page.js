"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';

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
  const [isAdmin, setIsAdmin] = useState(false);
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

      const adminStatus = profile.role === 'admin';
      setIsAdmin(adminStatus);

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
      setProjects((userProjects || []).map(p => ({ ...p, tier: p.tier || 'free' })));
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
    if (!isAdmin) {
      const freeProjects = projects.filter(p => p.tier === 'free');
      if (freeProjects.length >= 1) {
        alert('You have already used your 1 free project. Upgrade to Standard or Premium to create more.');
        return;
      }
    }
    router.push('/project/template-select');
  };

  const handleCreateStandard = async () => {
    if (isAdmin) {
      router.push('/template-select');
      return;
    }

    if (pendingPayment) {
      if (confirm('You have an unused Standard payment. Continue with existing payment?')) {
        router.push('/template-select');
        return;
      }
    }

    setCreatingPayment(true);
    try {
      const response = await fetch('/api/flutterwave/initialize', {
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

      window.location.href = data.authorization_url;

    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCreatePremium = () => {
    if (isAdmin) {
      router.push('/premium/template-selection');
    } else {
      setShowPremiumModal(true);
    }
  };

  const allProjects = [...projects, ...standardProjects];
  const totalReports = allProjects.length;
  const completedReports = allProjects.filter(p => p.status === 'completed').length;
  const inProgressReports = allProjects.filter(p => p.status === 'in_progress').length;
  const hasFreeProject = projects.some(p => p.tier === 'free');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">W3 WriteLab</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin Panel
                </Link>
              )}
              
              <div className="h-6 w-px bg-slate-200"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{profile.username || 'Student'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isAdmin ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isAdmin ? 'Administrator' : 'Free Account'}
                  </span>
                </div>
                <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                  {(profile.username || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                {(profile.username || user.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{profile.username}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            {isAdmin && (
              <Link href="/admin" className="block text-slate-600 font-medium hover:text-indigo-600">Admin Panel</Link>
            )}
            <button onClick={handleLogout} className="block w-full text-left text-red-600 font-medium">Sign Out</button>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your reports and create new projects.</p>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Admin Mode Active
            </span>
          )}
        </div>

        {/* Payment Success Alert */}
        {pendingPayment && !isAdmin && (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900">Payment Successful!</h3>
              <p className="text-emerald-700 text-sm mt-1">Your Standard tier payment of <strong>₦{pendingPayment.amount.toLocaleString()}</strong> has been confirmed.</p>
            </div>
            <button onClick={() => router.push('/template-select')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition shadow-sm">
              Continue Setup →
            </button>
          </div>
        )}

        {/* Project Creation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* FREE TIER */}
          <div className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Starter</h3>
                <p className="text-slate-500 text-sm">Essential features</p>
              </div>
              <span className="text-2xl font-bold text-slate-900">₦0</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> 1 Project Limit</li>
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Basic AI Model</li>
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> PDF Export Only</li>
            </ul>
            <div className="mt-auto">
              <Link href="/features" className="block text-center text-sm text-gray-600 hover:text-indigo-600 font-medium mb-3 transition">
                Learn more about features →
              </Link>
              <button 
                onClick={handleCreateFree}
                disabled={!isAdmin && hasFreeProject}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isAdmin && hasFreeProject ? 'Limit Reached' : 'Create Free Project'}
              </button>
            </div>
          </div>

          {/* STANDARD TIER */}
          <div className="relative bg-slate-900 rounded-xl border border-indigo-500 p-6 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">POPULAR</div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">Standard</h3>
                <p className="text-indigo-200 text-sm">Professional grade</p>
              </div>
              <span className="text-2xl font-bold text-white">{isAdmin ? 'Free' : `₦${PRICING.STANDARD.toLocaleString()}`}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm text-indigo-100"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Unlimited Projects</li>
              <li className="flex gap-2 text-sm text-indigo-100"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> DOCX + PDF Export</li>
              <li className="flex gap-2 text-sm text-indigo-100"><svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Advanced Editing</li>
            </ul>
            <div className="mt-auto">
              <Link href="/features" className="block text-center text-sm text-indigo-200 hover:text-white font-medium mb-3 transition">
                See what&apos;s included →
              </Link>
              <button 
                onClick={handleCreateStandard}
                disabled={creatingPayment}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70"
              >
                {creatingPayment ? 'Processing...' : (isAdmin ? 'Create Standard' : 'Select Standard')}
              </button>
            </div>
          </div>

          {/* PREMIUM TIER */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Premium</h3>
                <p className="text-slate-500 text-sm">Maximum power</p>
              </div>
              <span className="text-2xl font-bold text-slate-900">{isAdmin ? 'Free' : `₦${PRICING.PREMIUM.toLocaleString()}`}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Superior AI Model</li>
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Custom Templates</li>
              <li className="flex gap-2 text-sm text-slate-600"><svg className="w-5 h-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Priority Support</li>
            </ul>
            <button onClick={handleCreatePremium} className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors bg-slate-900 text-white hover:bg-slate-800">
              {isAdmin ? 'Create Premium' : 'Select Premium'}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Total Reports</p>
            <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">In Progress</p>
            <p className="text-2xl font-bold text-slate-900">{inProgressReports}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Completed</p>
            <p className="text-2xl font-bold text-slate-900">{completedReports}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Plan Status</p>
            <p className={`text-lg font-bold ${isAdmin ? 'text-indigo-600' : 'text-slate-900'}`}>
              {isAdmin ? 'Admin' : hasFreeProject ? 'Active' : 'New'}
            </p>
          </div>
        </div>

        {/* Recent Projects List */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Your Projects</h2>
          
          {totalReports === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-slate-900 font-medium mb-1">No projects yet</h3>
              <p className="text-slate-500 text-sm">Select a plan above to create your first report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((project) => (
                <Link 
                  key={project.id} 
                  href={project.tier === 'free' ? `/project/${project.id}` : `/standard/${project.id}`}
                  className="group block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                      project.tier === 'free' ? 'bg-slate-100 text-slate-600' : 
                      project.tier === 'standard' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {project.tier}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      project.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        project.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></span>
                      {project.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{project.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    
                    {/* Expiration Warning for Free Projects */}
                    {project.tier === 'free' && (
                      <span className="text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                        Expires in {Math.max(0, 30 - Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    )}

                    <span>Chapter {project.current_chapter || 1}/5</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Premium Coming Soon</h3>
            <p className="text-center text-slate-600 mb-6 text-sm">We are fine-tuning our most powerful AI models. Please try the <strong className="text-indigo-600">Standard</strong> plan for professional results today.</p>
            <button onClick={() => setShowPremiumModal(false)} className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
