"use client";
import { useState, useEffect } from 'react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate({
      ...template,
      structureString: JSON.stringify(template.structure, null, 2)
    });
    setJsonError(null);
  };

  const handleSave = async () => {
    try {
      // Validate JSON
      let structure;
      try {
        structure = JSON.parse(editingTemplate.structureString);
      } catch (e) {
        setJsonError('Invalid JSON format');
        return;
      }

      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate.id,
          name: editingTemplate.name,
          description: editingTemplate.description,
          structure: structure,
          faculty: editingTemplate.faculty,
          // Department field placeholder (requires DB column)
          // department: editingTemplate.department 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update list
      setTemplates(templates.map(t => t.id === data.id ? data : t));
      setEditingTemplate(null);
      alert('Template updated successfully!');

    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update template');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Template Management</h1>
        <p className="text-slate-500 mt-1">Modify report structures and assign them to faculties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full mt-2 font-medium">
                  {template.faculty || 'All Faculties'}
                </span>
              </div>
              <button 
                onClick={() => handleEdit(template)}
                className="text-slate-400 hover:text-indigo-600 transition p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6 line-clamp-2">{template.description}</p>
            <div className="flex items-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {template.structure?.chapters?.length || 0} Chapters defined
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900">Edit Template</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Faculty Assignment</label>
                  <input
                    type="text"
                    value={editingTemplate.faculty || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, faculty: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    placeholder="e.g. Engineering"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty for all faculties</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Structure (JSON) 
                  <span className="text-slate-400 font-normal ml-2 text-xs uppercase tracking-wide">Advanced Editor</span>
                </label>
                <div className="relative group">
                  <textarea
                    value={editingTemplate.structureString}
                    onChange={e => setEditingTemplate({...editingTemplate, structureString: e.target.value})}
                    className={`w-full border rounded-lg p-4 font-mono text-sm font-medium h-96 bg-slate-900 text-green-400 border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner ${jsonError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    style={{ lineHeight: '1.6' }}
                  />
                  {jsonError && (
                    <div className="absolute bottom-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium">
                      {jsonError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
