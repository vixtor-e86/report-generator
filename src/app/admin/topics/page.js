"use client";
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Single Topic Form State
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    faculty: 'Engineering',
    department: '',
    tags: ''
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/admin/topics');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTopic,
        tags: newTopic.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to add topic');
      
      toast.success('Topic added successfully');
      setIsAddModalOpen(false);
      setNewTopic({ title: '', description: '', faculty: 'Engineering', department: '', tags: '' });
      fetchTopics();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      const response = await fetch(`/api/admin/topics?id=${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Topic deleted');
      fetchTopics();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate data structure
        const validatedData = data.map(item => ({
          title: item.Title || item.title,
          description: item.Description || item.description || '',
          faculty: item.Faculty || item.faculty || 'Engineering',
          department: item.Department || item.department || '',
          tags: (item.Tags || item.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean)
        })).filter(item => item.title);

        if (validatedData.length === 0) {
          toast.error('No valid data found in file');
          return;
        }

        const response = await fetch('/api/admin/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData)
        });

        if (!response.ok) throw new Error('Bulk upload failed');
        
        const resData = await response.json();
        toast.success(`Successfully uploaded ${resData.count} topics`);
        setIsUploadModalOpen(false);
        fetchTopics();
      } catch (error) {
        console.error('XLS Upload Error:', error);
        toast.error('Error processing Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Topic Repository</h1>
          <p className="text-slate-500">Manage project topics for the Topic Finder tool</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
            Bulk Upload (XLS)
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-md shadow-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add New Topic
          </button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Topics</p>
          <p className="text-2xl font-black text-slate-900">{topics.length}</p>
        </div>
        <div className="md:col-span-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search by title or department..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">Topic Title</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">Dept / Faculty</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTopics.map((topic) => (
              <tr key={topic.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{topic.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{topic.description || 'No description'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-700 font-medium">{topic.department || 'General'}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{topic.faculty}</div>
                </td>
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {new Date(topic.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTopics.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">
            {loading ? 'Fetching topics...' : 'No topics found matching your criteria.'}
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add New Topic</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold text-2xl">×</button>
            </div>
            <form onSubmit={handleAddTopic} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Topic Title</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 font-medium"
                  value={newTopic.title}
                  onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                  placeholder="Enter project topic..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Faculty</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 font-medium"
                    value={newTopic.faculty}
                    onChange={e => setNewTopic({...newTopic, faculty: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 font-medium"
                    value={newTopic.department}
                    onChange={e => setNewTopic({...newTopic, department: e.target.value})}
                    placeholder="e.g. Civil Engineering"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description (Optional)</label>
                <textarea 
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 font-medium resize-none"
                  value={newTopic.description}
                  onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tags (Comma separated)</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 font-medium"
                  value={newTopic.tags}
                  onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
                  placeholder="AI, Software, IoT..."
                />
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-4">
                Save Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* XLS Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Bulk XLS Upload</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold text-2xl">×</button>
            </div>
            <div className="p-8">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Required XLS Columns:</h4>
                <ul className="text-[11px] text-amber-600 font-bold space-y-1">
                  <li>• <code className="bg-amber-100 px-1">Title</code> (Required)</li>
                  <li>• <code className="bg-amber-100 px-1">Description</code> (Optional)</li>
                  <li>• <code className="bg-amber-100 px-1">Faculty</code> (Optional)</li>
                  <li>• <code className="bg-amber-100 px-1">Department</code> (Optional)</li>
                  <li>• <code className="bg-amber-100 px-1">Tags</code> (Optional, comma separated)</li>
                </ul>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-sm font-bold text-slate-600">Click to upload Excel file</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-widest">Supports .xls, .xlsx</p>
                </div>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="w-full mt-6 py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
