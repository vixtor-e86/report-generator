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
      if (editingTemplate.is_advanced) {
        if (!editingTemplate.school || !editingTemplate.faculty || !editingTemplate.department) {
          alert('School, Faculty, and Department are required for advanced templates.');
          return;
        }
      }

      // Validate JSON
      let structure;
      try {
        structure = JSON.parse(editingTemplate.structureString);
      } catch (e) {
        setJsonError('Invalid JSON format');
        return;
      }

      const payload = {
          name: editingTemplate.is_advanced ? editingTemplate.department : editingTemplate.name,
          description: editingTemplate.is_advanced ? '' : (editingTemplate.description || ''),
          template_type: editingTemplate.template_type,
          structure: structure,
          is_advanced: editingTemplate.is_advanced,
          school: editingTemplate.school,
          department: editingTemplate.department,
          faculty: editingTemplate.faculty,
          ai_instruction: editingTemplate.ai_instruction,
          referral_id: editingTemplate.referral_id
      };

      let response;
      if (editingTemplate.id) {
        response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
      
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Template Management</h1>
          <p className="text-slate-500 mt-1">Modify report structures and assign them to faculties.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTemplate({
              name: '',
              description: '',
              faculty: '',
              school: '',
              department: '',
              is_advanced: true,
              ai_instruction: '',
              referral_id: '',
              structureString: '{\n  "chapters": []\n}'
            });
            setJsonError(null);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
        >
          + Add Advanced Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{template.is_advanced ? template.department || template.name : template.name}</h3>
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full mt-2 font-medium">
                  {template.faculty || 'All Faculties'}
                </span>
                {template.is_advanced && (
                   <span className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full mt-2 ml-2 font-medium">
                     Advanced
                   </span>
                )}
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
            {!template.is_advanced && (
               <p className="text-sm text-slate-600 mb-6 line-clamp-2">{template.description}</p>
            )}
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
              <h2 className="text-xl font-bold text-slate-900">{editingTemplate.id ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {!editingTemplate.is_advanced && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name *</label>
                      <input
                        type="text"
                        value={editingTemplate.name || ''}
                        onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Faculty *</label>
                      <input
                        type="text"
                        value={editingTemplate.faculty || ''}
                        onChange={e => setEditingTemplate({...editingTemplate, faculty: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        placeholder="e.g. Engineering"
                        required
                      />
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
                  </>
                )}

                {editingTemplate.is_advanced && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">School *</label>
                      <input
                        type="text"
                        value={editingTemplate.school || ''}
                        onChange={e => setEditingTemplate({...editingTemplate, school: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        placeholder="e.g. Eksu"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Faculty *</label>
                      <input
                        type="text"
                        value={editingTemplate.faculty || ''}
                        onChange={e => setEditingTemplate({...editingTemplate, faculty: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        placeholder="e.g. Engineering"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department *</label>
                      <input
                        type="text"
                        value={editingTemplate.department || ''}
                        onChange={e => setEditingTemplate({...editingTemplate, department: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        placeholder="e.g. Computer Engineering"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">AI Instructions</label>
                  <textarea
                    value={editingTemplate.ai_instruction || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, ai_instruction: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    rows={3}
                    placeholder="e.g. Literature review should be in tabular form..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Instructions to pass to the AI when generating content using this template.</p>
                </div>
                
                {editingTemplate.is_advanced && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Provider Referral ID (Optional)</label>
                    <input
                      type="text"
                      value={editingTemplate.referral_id || ''}
                      onChange={e => setEditingTemplate({...editingTemplate, referral_id: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                      placeholder="e.g. A1B2C3D4"
                    />
                    <p className="text-xs text-slate-500 mt-1">If a student provided this template, enter their referral code here. They will earn 10% commission each time a premium project uses this template.</p>
                  </div>
                )}
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

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setEditingTemplate(null)}
                className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
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
