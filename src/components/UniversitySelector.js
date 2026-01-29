"use client";

import { useState, useEffect, useRef } from 'react';

export default function UniversitySelector({ onSelect }) {
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'uni', 'poly'
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const res = await fetch('/api/universities');
        const data = await res.json();
        // Sort alphabetically
        data.sort((a, b) => a.name.localeCompare(b.name));
        setAllInstitutions(data);
        setFilteredList(data);
      } catch (error) {
        console.error('Failed to load institutions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInstitutions();
  }, []);

  // Filter logic: Search Term + Category Tab
  useEffect(() => {
    let result = allInstitutions;

    // 1. Filter by Tab
    if (activeTab === 'uni') {
      result = result.filter(i => ['federal', 'state', 'private'].includes(i.type));
    } else if (activeTab === 'poly') {
      result = result.filter(i => ['federal_poly', 'state_poly', 'private_poly'].includes(i.type));
    }

    // 2. Filter by Search
    if (searchTerm !== '') {
      result = result.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.short_name && i.short_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredList(result);
  }, [searchTerm, activeTab, allInstitutions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item) => {
    setSearchTerm(item.name);
    onSelect(item);
    setIsOpen(false);
  };

  const getBadgeStyle = (type) => {
    if (type.includes('federal')) return 'bg-green-100 text-green-700 border-green-200';
    if (type.includes('state')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  const formatType = (type) => {
    const map = {
      federal: 'Fed Uni', state: 'State Uni', private: 'Private Uni',
      federal_poly: 'Fed Poly', state_poly: 'State Poly', private_poly: 'Pvt Poly'
    };
    return map[type] || type;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Institution
      </label>
      
      <div className="relative">
        <input
          type="text"
          className="appearance-none block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base sm:text-sm placeholder-gray-600"
          placeholder={loading ? "Loading..." : "Search University or Poly..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={loading}
        />
        
        {loading && (
          <div className="absolute right-3 top-3.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        )}
      </div>

      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          
          {/* CATEGORY TABS */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {['all', 'uni', 'poly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === tab 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'uni' ? 'Universities' : 'Polytechnics'}
              </button>
            ))}
          </div>

          <ul className="max-h-60 sm:max-h-72 overflow-y-auto">
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-gray-700 border-b border-gray-100 last:border-0 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.short_name && <span className="text-xs text-gray-400">{item.short_name}</span>}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getBadgeStyle(item.type)}`}>
                    {formatType(item.type)}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500 text-sm">
                No results found.
              </li>
            )}
            
            <li 
              onClick={() => {
                 onSelect({ id: 'other', name: 'Other / Not Listed', type: 'custom' });
                 setIsOpen(false);
              }}
              className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium border-t border-gray-100 text-sm cursor-pointer"
            >
              My institution is not listed
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}