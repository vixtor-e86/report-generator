"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UniversitySelector from '@/components/UniversitySelector';

export default function Onboarding() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState(null);
  const [department, setDepartment] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);

  // 1. Check Auth & Load Departments
  useEffect(() => {
    async function init() {
      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);

      // Load departments from our new API
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartmentsList(data);
      
      setLoading(false);
    }
    init();
  }, [router]);

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !university || !department) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      // Insert into user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id, // Links to the Auth User
          full_name: user.user_metadata.full_name,
          username: username,
          university_id: university.id === 'other' ? null : university.id,
          custom_institution: university.id === 'other' ? university.name : null,
          department: department,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Success! Go to dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('Error creating profile:', error);
      alert(`Failed to create profile: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    // UPDATED: Added px-4 for mobile side padding and reduced py-12 to py-6 on mobile
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* UPDATED: text-2xl for mobile, 3xl for desktop */}
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about yourself to personalize your reports.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* UPDATED: Added rounded-lg (always rounded) and kept shadow */}
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  // UPDATED: text-base prevents iOS zoom, sm:text-sm for desktop
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                  placeholder="e.g. Vixtor_Engr"
                />
              </div>
            </div>

            {/* University Selector */}
            <div>
               <UniversitySelector 
                 onSelect={(uni) => setUniversity(uni)} 
                 selectedId={university?.id}
               />
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <div className="mt-1">
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  // UPDATED: text-base for mobile
                  className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}