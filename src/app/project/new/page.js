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

  // Form States
  const [selectedTier, setSelectedTier] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentInput, setComponentInput] = useState('');
  const [description, setDescription] = useState('');

  // Check Auth & Load Profile
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

      // Load departments
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

  // Handle Tier Selection
  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    
    if (tier !== 'free') {
      setShowComingSoon(true);
    }
  };

  // Add Component to List
  const addComponent = () => {
    if (componentInput.trim() && !components.includes(componentInput.trim())) {
      setComponents([...components, componentInput.trim()]);
      setComponentInput('');
    }
  };

  // Remove Component
  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  // Handle Project Creation
  const handleCreateProject = async () => {
    // Validation
    if (!projectTitle || !department || components.length === 0 || !description) {
      alert('Please fill in all fields and add at least one component');
      return;
    }

    if (!selectedTier) {
      alert('Please select a tier');
      return;
    }

    setCreating(true);

    try {
      console.log('Creating project with:', {
        user_id: user.id,
        title: projectTitle,
        department: department,
        components: components,
        description: description,
        tier: selectedTier,
      });

      // 1. Create Project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectTitle,
          department: department,
          components: components,
          description: description,
          tier: selectedTier,
          status: 'in_progress',
          current_chapter: 1,
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        throw new Error(projectError.message || 'Failed to create project');
      }

      console.log('Project created:', project);

      // 2. Create 5 Empty Chapters
      const chapters = [
        { project_id: project.id, chapter_number: 1, title: 'Introduction', status: 'not_generated' },
        { project_id: project.id, chapter_number: 2, title: 'Literature Review', status: 'not_generated' },
        { project_id: project.id, chapter_number: 3, title: 'Methodology', status: 'not_generated' },
        { project_id: project.id, chapter_number: 4, title: 'Results & Analysis', status: 'not_generated' },
        { project_id: project.id, chapter_number: 5, title: 'Conclusion', status: 'not_generated' },
      ];

      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(chapters);

      if (chaptersError) {
        console.error('Chapters creation error:', chaptersError);
        throw new Error(chaptersError.message || 'Failed to create chapters');
      }

      console.log('Chapters created successfully');

      // 3. Redirect to Workspace
      router.push(`/project/${project.id}`);

    } catch (error) {
      console.error('Error creating project:', error);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <span className="text-2xl font-bold text-indigo-600">📄 ReportGen</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Project</h1>
          <p className="text-gray-600 text-lg">Let&apos;s generate your engineering report in minutes</p>
        </div>

        {/* Step 1: Tier Selection */}
        {!selectedTier ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Step 1: Choose Your Tier</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* FREE Tier */}
              <div 
                onClick={() => handleTierSelect('free')}
                className="bg-white border-2 border-gray-300 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-xl transition cursor-pointer group"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-5xl font-extrabold text-gray-900 mb-2">₦0</div>
                  <p className="text-gray-500">Try it out</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Basic AI quality
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    2 images max
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    PDF export only
                  </li>
                </ul>
                
                <div className="bg-indigo-50 text-indigo-700 py-3 rounded-lg font-semibold text-center group-hover:bg-indigo-600 group-hover:text-white transition">
                  Select Free
                </div>
              </div>

              {/* STANDARD Tier */}
              <div 
                onClick={() => handleTierSelect('standard')}
                className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-500 rounded-2xl p-8 relative hover:shadow-2xl transition cursor-pointer group transform hover:scale-105"
              >
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-bold">
                  POPULAR
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard</h3>
                  <div className="text-5xl font-extrabold text-indigo-600 mb-2">₦7,500</div>
                  <p className="text-gray-500">Best value</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-700 font-semibold">
                    Everything in Free, plus:
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Enhanced AI (Gemini Pro)
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    5 images max
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    DOCX export
                  </li>
                </ul>
                
                <div className="bg-indigo-600 text-white py-3 rounded-lg font-semibold text-center group-hover:bg-indigo-700 transition">
                  Select Standard
                </div>
              </div>

              {/* PREMIUM Tier */}
              <div 
                onClick={() => handleTierSelect('premium')}
                className="bg-white border-2 border-gray-300 rounded-2xl p-8 hover:border-purple-500 hover:shadow-xl transition cursor-pointer group"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-5xl font-extrabold text-gray-900 mb-2">₦15,000</div>
                  <p className="text-gray-500">Best quality</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-700 font-semibold">
                    Everything in Standard, plus:
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Premium AI (Claude 3.5)
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Unlimited images
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Priority support
                  </li>
                </ul>
                
                <div className="bg-gray-900 text-white py-3 rounded-lg font-semibold text-center group-hover:bg-gray-800 transition">
                  Select Premium
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Project Details Form */
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Step 2: Project Details</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedTier === 'free' ? 'bg-gray-100 text-gray-700' :
                  selectedTier === 'standard' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
                </span>
                <button
                  onClick={() => setSelectedTier(null)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 space-y-6">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Smart Home Automation System"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
              </div>

              {/* Components List */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Components Used *
                </label>
                
                {components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {components.map((comp, index) => (
                      <div 
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        {comp}
                        <button
                          onClick={() => removeComponent(index)}
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())}
                    placeholder="e.g. Arduino Uno, DHT11 Sensor..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={addComponent}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add each component</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="6"
                  placeholder="Describe what your project does, its purpose, and main features..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setSelectedTier(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>Create Project</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Payment Coming Soon!</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Paystack integration is under development. For now, you can continue with the{' '}
                <span className="font-semibold">{selectedTier}</span> tier features, but payment will be required before final export.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowComingSoon(false);
                    setSelectedTier(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}