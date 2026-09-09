"use client";
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">View and manage registered users</p>
      </div>

      {/* Search & Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-xs font-bold text-slate-500 shrink-0">
          Showing <span className="text-slate-900 font-black">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="text-slate-900 font-black">{filteredUsers.length.toLocaleString()}</span> users
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-center">Date Joined</th>
                <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl flex items-center justify-center font-black">
                        {(user.username || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.full_name || user.username || 'No Name'}</div>
                        <div className="flex gap-2 mt-0.5">
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 text-red-700 border border-red-200 tracking-widest">
                                  Admin
                              </span>
                            )}
                            {user.role === 'support' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 tracking-widest">
                                  Support
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {user.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-indigo-600 select-all">{user.email}</span>
                      {user.email && user.email !== 'N/A' && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            alert('Email copied to clipboard!');
                          }}
                          title="Copy Email"
                          className="text-slate-400 hover:text-indigo-600 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {user.last_sign_in_at ? (
                      <div className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                        Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-[9px] text-amber-500 font-black uppercase mt-1 tracking-widest">Never logged in</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-tight line-clamp-1 max-w-[200px]">{user.institution_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-xs font-bold text-slate-900">{new Date(user.created_at).toLocaleDateString()}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <a
                      href={`/admin/email?recipient=${user.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No users found matching your search.
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
