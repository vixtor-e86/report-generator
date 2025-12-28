"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NewProject() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentInput, setComponentInput] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profile) {
        router.push('/onboarding');
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

      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartmentsList(data);
      setUser(user);
      setProfile(profile);
      setDepartment(profile.department || '');
      setLoading(false);
    }
    loadData();
  }, [router]);

  const addComponent = () => {
    if (componentInput.trim() && !components.includes(componentInput.trim())) {
      setComponents([...components, componentInput.trim()]);
      setComponentInput('');
    }
  };

  const removeComponent = (index) => setComponents(components.filter((_, i) => i !== index));

  const handleCreateProject = async () => {
    if (!projectTitle || !department || components.length === 0 || !description) {
      alert('Please fill in all fields and add at least one component');
      return;
    }

    setCreating(true);
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectTitle,
          department,
          components,
          description,
          tier: 'free',
          status: 'in_progress',
          current_chapter: 1
        })
        .select()
        .single();

      if (projectError) throw new Error(projectError.message || 'Failed to create project');

      const chapters = [
        { project_id: project.id, chapter_number: 1, title: 'Introduction', status: 'not_generated' },
        { project_id: project.id, chapter_number: 2, title: 'Literature Review', status: 'not_generated' },
        { project_id: project.id, chapter_number: 3, title: 'Methodology', status: 'not_generated' },
        { project_id: project.id, chapter_number: 4, title: 'Results & Analysis', status: 'not_generated' },
        { project_id: project.id, chapter_number: 5, title: 'Conclusion', status: 'not_generated' }
      ];
      await supabase.from('chapters').insert(chapters);
      router.push(`/project/${project.id}`);
    } catch (error) {
      alert(`Failed to create project: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free Tier
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Create Your Free Project
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Fill in the details below to generate your complete 5-chapter engineering report. 
            This is your <strong>one free project</strong> &mdash; make it count!
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Smart Home Automation System Using IoT"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 text-sm sm:text-base placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="">Select Department</option>
              {departmentsList.map((dept, i) => (
                <option key={i} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Pre-filled from your profile</p>
          </div>

          {/* Components */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Components/Tools Used *
            </label>

            {components.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {components.map((comp, i) => (
                  <div
                    key={i}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span>{comp}</span>
                    <button
                      onClick={() => removeComponent(i)}
                      className="hover:text-indigo-900 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addComponent();
                  }
                }}
                placeholder="e.g., Arduino Uno, DHT11 Sensor, Raspberry Pi..."
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 text-sm sm:text-base placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button
                onClick={addComponent}
                className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to include a component</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Project Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="6"
              placeholder="Describe what your project does, its objectives, and key features..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 text-sm sm:text-base placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Provide a clear overview of your project</p>
              <p className="text-xs text-gray-500">{description.length} characters</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-1">What's included in Free Tier:</p>
                <ul className="space-y-1 text-xs sm:text-sm">
                  <li>✓ Complete 5-chapter report</li>
                  <li>✓ 2 images with captions (added in workspace)</li>
                  <li>✓ PDF export</li>
                  <li>✓ Basic AI quality (Gemini 1.5 Flash)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={creating}
              className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Project...
                </>
              ) : (
                <>
                  Create Free Project
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Want More Section */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Need more features?</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Upgrade to <strong>Standard</strong> for editing, regeneration, 10 images, and DOCX export!
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