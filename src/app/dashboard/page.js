"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Check Auth & Load Data
  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/'); 
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
        return;
      }

      // Get user's projects
      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setUser(user);
      setProfile(profile);
      setProjects(userProjects || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Calculate stats
  const totalReports = projects.length;
  const completedReports = projects.filter(p => p.status === 'completed').length;
  const inProgressReports = projects.filter(p => p.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 group-hover:text-indigo-700 transition">
                📄 W3 WriteLab
              </span>
            </Link>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-6">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{profile.username || 'Student'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{user.email}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Free
                    </span>
                  </div>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-indigo-200 shadow-md">
                  {(profile.username || user.email)[0].toUpperCase()}
                </div>
              </div>

              <div className="h-8 w-px bg-gray-200"></div>

              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-indigo-600 focus:outline-none p-2"
              >
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

        {/* Mobile Menu */}
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
            <button 
              onClick={handleLogout}
              className="w-full text-left text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {profile.username || 'Student'}! 👋</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {profile.department && profile.department !== 'Other' ? (
                <span>{profile.department} • </span>
              ) : null}
              {totalReports === 0 ? 'Ready to create your first report?' : `${totalReports} ${totalReports === 1 ? 'project' : 'projects'} created`}
            </p>
          </div>
          <Link 
            href="/project/new" 
            className="bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 hover:shadow-lg w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create New Project
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Plan Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 sm:p-6 rounded-xl shadow-sm border border-green-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-gray-700 text-xs sm:text-sm font-medium uppercase tracking-wider">Current Plan</h3>
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">Free</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
                {projects.some(p => p.tier === 'free') 
                ? '0 free reports available' 
                : '1 free report available'}
            </p>
          </div>

          {/* Total Reports Card */}
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
            <p className="text-xs sm:text-sm text-gray-500">
              {totalReports === 0 ? 'No projects yet' : `${completedReports} completed, ${inProgressReports} in progress`}
            </p>
          </div>

          {/* Completed Card */}
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

          {/* Storage Card */}
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

        {/* Recent Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Projects</h2>
            {projects.length > 0 && (
              <button className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All →
              </button>
            )}
          </div>
          
          {projects.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center hover:border-indigo-400 transition group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition shadow-md">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Create your first report</h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
                Start by creating a new project. You&apos;ll need your project topic, engineering department, 
                components used, and a brief description of your project.
              </p>
              <Link 
                href="/project/new" 
                className="inline-flex items-center bg-indigo-600 text-white px-5 sm:px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md hover:shadow-lg gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
                Start New Project
              </Link>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <Link 
                  key={project.id} 
                  href={`/project/${project.id}`}
                  className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-indigo-600 transition line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{project.department}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status === 'completed' ? 'Done' :
                       project.status === 'in_progress' ? 'Progress' : 'Draft'}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      project.tier === 'free' ? 'bg-gray-100' :
                      project.tier === 'standard' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
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
    </div>
  );
}