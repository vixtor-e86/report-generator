"use client";

import { useState, useEffect, useRef } from 'react';

export default function UniversitySelector({ onSelect, selectedId }) {
  const [universities, setUniversities] = useState([]);
  const [filteredUnis, setFilteredUnis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // 1. Fetch universities on mount
  useEffect(() => {
    async function fetchUniversities() {
      try {
        const res = await fetch('/api/universities');
        const data = await res.json();
        setUniversities(data);
        setFilteredUnis(data);
      } catch (error) {
        console.error('Failed to load universities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUniversities();
  }, []);

  // 2. Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // 3. Filter list when typing
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUnis(universities);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = universities.filter(uni => 
        uni.name.toLowerCase().includes(lowerSearch)
      );
      setFilteredUnis(filtered);
    }
  }, [searchTerm, universities]);

  // 4. Handle Selection
  const handleSelect = (uni) => {
    setSearchTerm(uni.name);
    onSelect(uni); // Send data back to parent
    setIsOpen(false);
  };

  const handleCustom = () => {
    const customUni = { id: 'other', name: 'Other / Not Listed', type: 'custom' };
    setSearchTerm(customUni.name);
    onSelect(customUni);
    setIsOpen(false);
  };

  return (
    // Removed max-w-md constraints here so it fills the parent container from Onboarding
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select your University
      </label>
      
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          // UPDATED: 
          // 1. appearance-none: removes native mobile styles
          // 2. text-base: prevents iOS zoom on focus (Must be 16px+)
          // 3. sm:text-sm: scales back down for desktop
          className="appearance-none block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base sm:text-sm"
          placeholder={loading ? "Loading universities..." : "Type to search..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={loading}
        />
        
        {loading && (
          <div className="absolute right-3 top-3.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && !loading && (
        // UPDATED: Changed max-h-60 to max-h-[50vh] or 60 to allow better scrolling on small phones
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 sm:max-h-72 overflow-y-auto">
          {filteredUnis.length > 0 ? (
            filteredUnis.map((uni) => (
              <li 
                key={uni.id}
                onClick={() => handleSelect(uni)}
                // UPDATED: Added active:bg-blue-100 for better touch feedback
                className="px-4 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-gray-700 border-b border-gray-100 last:border-0 flex justify-between items-center text-sm sm:text-base"
              >
                <span>{uni.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                  uni.type === 'federal' ? 'bg-green-100 text-green-700' :
                  uni.type === 'state' ? 'bg-orange-100 text-orange-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {uni.type}
                </span>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-gray-500 italic text-sm">No universities found.</li>
          )}
          
          {/* Always show "Other" option at bottom */}
          <li 
            onClick={handleCustom}
            className="px-4 py-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 cursor-pointer text-blue-600 font-medium border-t-2 border-gray-100 text-sm sm:text-base"
          >
            My university is not listed
          </li>
        </ul>
      )}
    </div>
  );
}