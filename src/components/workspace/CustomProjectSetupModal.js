"use client";
import React, { useState } from 'react';
import { 
  FileText, Check, AlertCircle, BookOpen, 
  Sparkles, Lock, Save, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomProjectSetupModal({
  isOpen,
  projectId,
  workspaceType = 'standard', // 'standard' or 'premium'
  selectedChapters = [4, 5],
  initialUploadedChapters = {},
  initialReferences = '',
  onSaveComplete
}) {
  // Determine which chapters must be provided by the student
  const chaptersToProvide = [1, 2, 3, 4, 5].filter(num => !selectedChapters.includes(num));

  // State for pasted chapters text: { 1: "...", 2: "..." }
  const [chaptersData, setChaptersData] = useState(() => {
    const init = {};
    chaptersToProvide.forEach(num => {
      init[num] = initialUploadedChapters[`chapter_${num}`]?.content || initialUploadedChapters[`chapter_${num}`] || '';
    });
    return init;
  });

  const [activeTab, setActiveTab] = useState(chaptersToProvide[0] || 1);
  const [referencesText, setReferencesText] = useState(initialReferences || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || chaptersToProvide.length === 0) return null;

  const handleTextChange = (chapterNum, text) => {
    setChaptersData(prev => ({ ...prev, [chapterNum]: text }));
  };

  const getWordCount = (str = '') => {
    const trimmed = str.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Mandatory validation: check that each chapter has substantial content
    for (const num of chaptersToProvide) {
      const content = (chaptersData[num] || '').trim();
      if (!content) {
        toast.error(`Please paste the content for Chapter ${num}. It is mandatory.`);
        setActiveTab(num);
        return;
      }
      if (getWordCount(content) < 30) {
        toast.error(`Chapter ${num} text is too short. Please paste the full chapter text.`);
        setActiveTab(num);
        return;
      }
    }

    setIsSaving(true);

    try {
      // Structure the uploaded_chapters payload
      const formattedChapters = {};
      chaptersToProvide.forEach(num => {
        formattedChapters[`chapter_${num}`] = {
          chapter_number: num,
          content: chaptersData[num].trim(),
          word_count: getWordCount(chaptersData[num]),
          provided_by_student: true,
          updated_at: new Date().toISOString()
        };
      });

      const tableName = workspaceType === 'premium' ? 'premium_projects' : 'standard_projects';

      const response = await fetch('/api/custom/save-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          tableName,
          uploadedChapters: formattedChapters,
          existingReferences: referencesText.trim() || null
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to save chapter context');

      toast.success('Existing chapter context saved! You can now generate your remaining chapters.');
      if (onSaveComplete) {
        onSaveComplete({
          uploadedChapters: formattedChapters,
          existingReferences: referencesText.trim() || null
        });
      }
    } catch (err) {
      console.error('Error saving custom chapters:', err);
      toast.error(err.message || 'Failed to save existing chapters. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl sm:rounded-[36px] max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (No close button: this step is mandatory) */}
        <div className="p-5 sm:p-7 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2 border border-indigo-200">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            Mandatory Workspace Context Setup
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Paste Your Existing Chapters
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            Before generating the remaining chapters ({selectedChapters.map(c => `Chapter ${c}`).join(', ')}), the AI requires the text of your previously written chapters to maintain exact academic consistency, methodology alignment, and style.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-700">
            
            {/* Chapter Selection Tabs */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-2">
                1. Select Chapter to Paste Content (Mandatory)
              </label>
              <div className="flex flex-wrap gap-2">
                {chaptersToProvide.map(num => {
                  const words = getWordCount(chaptersData[num]);
                  const isComplete = words >= 30;
                  const isActive = activeTab === num;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setActiveTab(num)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : isComplete
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>Chapter {num}</span>
                      {isComplete ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chapter Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 uppercase">
                  Paste Full Text for Chapter {activeTab}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {getWordCount(chaptersData[activeTab]).toLocaleString()} Words
                </span>
              </div>
              <textarea
                required
                rows={9}
                placeholder={`Copy and paste the entire body text of your Chapter ${activeTab} here (sections, headings, content)...`}
                value={chaptersData[activeTab] || ''}
                onChange={(e) => handleTextChange(activeTab, e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all leading-relaxed resize-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * Paste directly from your Word or Google doc. The AI extracts terminology, experimental setups, and scope from this chapter.
              </p>
            </div>

            {/* Optional Existing References Section */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-slate-900 uppercase">
                    Existing Bibliography / References (Optional)
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                If you already have citations or a reference list from your completed chapters, paste them below. The AI will continue from these sources and match their exact citation style (APA, IEEE, etc.). If left blank, new references will be generated.
              </p>
              <textarea
                rows={4}
                placeholder="e.g. 
[1] Adebayo, O. (2024). Autonomous Control Systems...
[2] Johnson, M. et al. (2025). Neural Architecture..."
                value={referencesText}
                onChange={(e) => setReferencesText(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-600 transition-all leading-relaxed resize-none"
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>All unselected chapters must be provided before generation unlocks.</span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Context...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Unlock Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
