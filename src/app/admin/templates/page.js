"use client";
import { useState, useEffect } from 'react';
import UniversitySelector from '@/components/UniversitySelector';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  
  const [universityData, setUniversityData] = useState({});
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setUniversityData(data);
      setFacultiesList(Object.keys(data));
    } catch (e) { console.error('Failed to load departments:', e); }
  };

  useEffect(() => {
    if (editingTemplate?.faculty && universityData[editingTemplate.faculty]) {
      setDepartmentsList(universityData[editingTemplate.faculty]);
    } else {
      setDepartmentsList([]);
    }
  }, [editingTemplate?.faculty, universityData]);

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

  const addChapter = () => {
    const newId = editingTemplate.chapters.length ? Math.max(...editingTemplate.chapters.map(c => c.id)) + 1 : 1;
    setEditingTemplate({
      ...editingTemplate,
      chapters: [...editingTemplate.chapters, { id: newId, title: '', sections: [''] }]
    });
  };

  const removeChapter = (id) => {
    setEditingTemplate({
      ...editingTemplate,
      chapters: editingTemplate.chapters.filter(ch => ch.id !== id)
    });
  };

  const addSection = (chapterId) => {
    setEditingTemplate({
      ...editingTemplate,
      chapters: editingTemplate.chapters.map(ch => 
        ch.id === chapterId ? { ...ch, sections: [...ch.sections, ''] } : ch
      )
    });
  };

  const removeSection = (chapterId, sectionIndex) => {
    setEditingTemplate({
      ...editingTemplate,
      chapters: editingTemplate.chapters.map(ch => 
        ch.id === chapterId 
          ? { ...ch, sections: ch.sections.filter((_, i) => i !== sectionIndex) }
          : ch
      )
    });
  };

  const updateChapterTitle = (id, title) => {
    setEditingTemplate({
      ...editingTemplate,
      chapters: editingTemplate.chapters.map(ch => ch.id === id ? { ...ch, title } : ch)
    });
  };

  const updateSection = (chapterId, sectionIndex, value) => {
    setEditingTemplate({
      ...editingTemplate,
      chapters: editingTemplate.chapters.map(ch => 
        ch.id === chapterId
          ? { ...ch, sections: ch.sections.map((s, i) => i === sectionIndex ? value : s) }
          : ch
      )
    });
  };

  const handleEdit = (template) => {
    let chapters = [];
    if (template.structure?.chapters) {
      chapters = template.structure.chapters;
    } else {
      chapters = [{ id: 1, title: '', sections: [''] }];
    }
    
    setEditingTemplate({
      ...template,
      chapters
    });
    setJsonError(null);
  };

  const handleSave = async () => {
    try {
      if (!editingTemplate.school || !editingTemplate.faculty || !editingTemplate.department) {
        alert('School, Faculty, and Department are required for advanced templates.');
        return;
      }

      // Format chapters back to structure
      const formattedChapters = editingTemplate.chapters.map((ch, idx) => ({
        id: idx + 1,
        number: idx + 1,
        chapter: idx + 1,
        title: ch.title.trim() || `Chapter ${idx + 1}`,
        sections: ch.sections.filter(s => s && s.trim())
      }));

      const structure = { chapters: formattedChapters };

      const payload = {
          name: editingTemplate.name,
          description: editingTemplate.description,
          structure: structure,
          faculty: editingTemplate.faculty,
          is_advanced: editingTemplate.is_advanced,
          school: editingTemplate.school,
          department: editingTemplate.department,
          ai_instruction: editingTemplate.ai_instruction,
          referral_id: editingTemplate.referral_id
      };

      let response;
      if (editingTemplate.id) {
        response = await fetch('/api/admin/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTemplate.id,
            ...payload
          })
        });
      } else {
        response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update list
      if (editingTemplate.id) {
        setTemplates(templates.map(t => t.id === data.id ? data : t));
      } else {
        setTemplates([...templates, data]);
      }
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
              chapters: [{ id: 1, title: '', sections: [''] }]
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name *</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">School *</label>
                  <UniversitySelector 
                    onSelect={(school) => setEditingTemplate({...editingTemplate, school: school.name})} 
                  />
                  {editingTemplate.school && (
                    <p className="text-sm font-medium text-indigo-600 mt-2">Selected: {editingTemplate.school}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Faculty *</label>
                  <select
                    value={editingTemplate.faculty || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, faculty: e.target.value, department: ''})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {facultiesList.map((fac, idx) => (
                      <option key={idx} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department *</label>
                  <select
                    value={editingTemplate.department || ''}
                    onChange={e => setEditingTemplate({...editingTemplate, department: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    required
                    disabled={!editingTemplate.faculty}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="mt-6 border-t pt-6">
                <label className="block text-lg font-bold text-slate-900 mb-4">
                  Template Structure Builder
                </label>
                <div className="space-y-4">
                  {editingTemplate.chapters.map((chapter, chIndex) => (
                    <div key={chapter.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm relative">
                      <div className="flex gap-4 items-start mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={`Chapter ${chIndex + 1} Title`}
                            value={chapter.title}
                            onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                            className="w-full border-b border-slate-300 py-2 focus:border-indigo-500 outline-none text-lg font-semibold text-slate-800"
                          />
                        </div>
                        {editingTemplate.chapters.length > 1 && (
                          <button onClick={() => removeChapter(chapter.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 pl-4 border-l-2 border-indigo-100 ml-2">
                        {chapter.sections.map((section, secIndex) => (
                          <div key={secIndex} className="flex gap-3 items-center">
                            <span className="text-sm font-bold text-slate-400 w-8">{chIndex + 1}.{secIndex + 1}</span>
                            <input
                              type="text"
                              placeholder="Section title"
                              value={section}
                              onChange={(e) => updateSection(chapter.id, secIndex, e.target.value)}
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none text-sm"
                            />
                            {chapter.sections.length > 1 && (
                              <button onClick={() => removeSection(chapter.id, secIndex)} className="text-red-400 hover:text-red-600 px-2 font-bold text-xl">
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addSection(chapter.id)} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 mt-2 flex items-center gap-1">
                          <span>+</span> Add Section
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addChapter} className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                  + Add Chapter
                </button>
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
