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
  const [selectedTier, setSelectedTier] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
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
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (!profile) {
        router.push('/onboarding');
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

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    if (tier !== 'free') setShowComingSoon(true);
  };

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
    if (!selectedTier) {
      alert('Please select a tier');
      return;
    }
    setCreating(true);
    try {
      if (selectedTier === 'free') {
        const { data: existingProjects } = await supabase.from('projects').select('id').eq('user_id', user.id).eq('tier', 'free');
        if (existingProjects && existingProjects.length > 0) {
          alert('You are limited to 1 Free project. Upgrade to Standard or Premium to create more.');
          setCreating(false);
          return;
        }
      }
      const { data: project, error: projectError } = await supabase.from('projects').insert({
        user_id: user.id, title: projectTitle, department, components, description, tier: selectedTier, status: 'in_progress', current_chapter: 1
      }).select().single();
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
            </Link>
            <span className="text-lg sm:text-2xl font-bold text-indigo-600">📄 W3 WriteLab</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Create New Project</h1>
          <p className="text-gray-600 text-sm sm:text-lg">Generate your professional report in minutes</p>
        </div>

        {!selectedTier || showComingSoon ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Step 1: Choose Your Tier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
              {/* FREE */}
              <div onClick={() => handleTierSelect('free')} className="bg-white border-2 border-gray-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-indigo-500 hover:shadow-xl transition cursor-pointer group">
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">₦0</div>
                  <p className="text-gray-500 text-sm sm:text-base">Try it out</p>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Basic AI quality</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>2 images (end only)</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>PDF export only</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>No editing</li>
                </ul>
                <div className="bg-indigo-50 text-indigo-700 py-2.5 sm:py-3 rounded-lg font-semibold text-center group-hover:bg-indigo-600 group-hover:text-white transition text-sm sm:text-base">Select Free</div>
              </div>

              {/* STANDARD */}
              <div onClick={() => handleTierSelect('standard')} className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 relative hover:shadow-2xl transition cursor-pointer group transform hover:scale-105">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-xl text-xs sm:text-sm font-bold">POPULAR</div>
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Standard</h3>
                  <div className="text-4xl sm:text-5xl font-extrabold text-indigo-600 mb-2">₦10,000</div>
                  <p className="text-gray-500 text-sm sm:text-base">Best value</p>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 text-gray-700 font-semibold text-sm sm:text-base">Everything in Free, plus:</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Good AI quality</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>10 images (place anywhere)</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>PDF + DOCX export</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Edit before printing</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Regeneration allowed</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>3 templates</li>
                </ul>
                <div className="bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-center group-hover:bg-indigo-700 transition text-sm sm:text-base">Select Standard</div>
              </div>

              {/* PREMIUM */}
              <div onClick={() => handleTierSelect('premium')} className="bg-white border-2 border-gray-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-purple-500 hover:shadow-xl transition cursor-pointer group sm:col-span-2 lg:col-span-1">
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">₦20,000</div>
                  <p className="text-gray-500 text-sm sm:text-base">Best quality</p>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 text-gray-700 font-semibold text-sm sm:text-base">Everything in Standard, plus:</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Best AI model</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Unlimited images</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Custom templates</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>AI template extraction</li>
                  <li className="flex items-center gap-2 text-gray-700 text-sm sm:text-base"><svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Priority support</li>
                </ul>
                <div className="bg-gray-900 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-center group-hover:bg-gray-800 transition text-sm sm:text-base">Select Premium</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Step 2: Project Details</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">Selected:</span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${selectedTier === 'free' ? 'bg-gray-100 text-gray-700' : selectedTier === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}</span>
                <button onClick={() => setSelectedTier(null)} className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 underline">Change</button>
              </div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title *</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. Smart Home Automation System" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm sm:text-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm sm:text-base">
                  <option value="">Select Department</option>
                  {departmentsList.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Components Used *</label>
                {components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {components.map((comp, i) => (
                      <div key={i} className="bg-indigo-100 text-indigo-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                        <span className="truncate max-w-[150px] sm:max-w-none">{comp}</span>
                        <button onClick={() => removeComponent(i)} className="hover:text-indigo-900 transition flex-shrink-0"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={componentInput} onChange={(e) => setComponentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())} placeholder="e.g. Arduino Uno, DHT11..." className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm sm:text-base" />
                  <button onClick={addComponent} className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg><span className="hidden sm:inline">Add</span></button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter or click Add</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="5" placeholder="Describe what your project does..." className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm sm:text-base" />
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button onClick={() => setSelectedTier(null)} className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base">Back</button>
                <button onClick={handleCreateProject} disabled={creating} className="w-full sm:flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base">{creating ? <><div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>Creating...</> : <>Create Project</>}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"><svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Payment Coming Soon!</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6 leading-relaxed">Payment integration is in development. The <span className="font-semibold text-gray-900">{selectedTier}</span> tier is not yet available.<br /><br />Please proceed with the <span className="font-bold text-indigo-600">Free</span> tier.</p>
              <button onClick={() => { setShowComingSoon(false); setSelectedTier(null); }} className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base">Okay, Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}