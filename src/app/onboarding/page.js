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
  
  // ✅ NEW: Faculty & Department States
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  
  // ✅ NEW: Data Management States
  const [universityData, setUniversityData] = useState({}); // Stores full JSON
  const [facultiesList, setFacultiesList] = useState([]);   // Stores ["Engineering", "Science"...]
  const [departmentsList, setDepartmentsList] = useState([]); // Stores active department list

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

      // ✅ FIX: Load departments and handle Object structure
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        
        setUniversityData(data);
        setFacultiesList(Object.keys(data)); // Extract Faculty names
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
      
      setLoading(false);
    }
    init();
  }, [router]);

  // ✅ NEW: Handle Faculty Change
  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    setFaculty(selectedFaculty);
    
    // Reset department
    setDepartment('');
    
    // Update department list based on selected faculty
    if (selectedFaculty && Array.isArray(universityData[selectedFaculty])) {
      setDepartmentsList(universityData[selectedFaculty]);
    } else {
      setDepartmentsList([]);
    }
  };

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !university || !faculty || !department) {
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
          faculty: faculty, // ✅ SAVE FACULTY
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-4">
        <div className="flex items-center gap-2 mb-2">
          <img src="/favicon.ico" alt="W3 WriteLab" className="w-12 h-12" />
          <span className="text-2xl font-bold text-indigo-600">W3 WriteLab</span>
        </div>
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about yourself to personalize your reports.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
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

            {/* ✅ NEW: Faculty Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Faculty</label>
              <div className="mt-1">
                <select
                  required
                  value={faculty}
                  onChange={handleFacultyChange}
                  className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                >
                  <option value="">Select Faculty</option>
                  {facultiesList.map((fac, index) => (
                    <option key={index} value={fac}>{fac}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <div className="mt-1">
                {faculty === 'Other' ? (
                  // Text input if Faculty is Other
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                    placeholder="Enter Department Name"
                  />
                ) : (
                  // Dropdown if Faculty is selected
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!faculty}
                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">Select Department</option>
                    {/* ✅ Safety Check Added */}
                    {Array.isArray(departmentsList) && departmentsList.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                )}
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