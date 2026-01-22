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

  if (loading) return <div className="p-8 text-center">Loading templates...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
        <p className="text-gray-600">Modify report structures and assign them to faculties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mt-1">
                  {template.faculty || 'All Faculties'}
                </span>
              </div>
              <button 
                onClick={() => handleEdit(template)}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {template.structure?.chapters?.length || 0} Chapters defined
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Template</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Assignment</label>
                  <input
                    type="text"
                    value={editingTemplate.faculty || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, faculty: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="e.g. Engineering"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for all faculties</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Structure (JSON) 
                  <span className="text-gray-500 font-normal ml-2">- Edit chapters and sections here</span>
                </label>
                <div className="relative">
                  <textarea
                    value={editingTemplate.structureString}
                    onChange={e => setEditingTemplate({...editingTemplate, structureString: e.target.value})}
                    className={`w-full border rounded-lg p-4 font-mono text-sm h-96 ${jsonError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
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
