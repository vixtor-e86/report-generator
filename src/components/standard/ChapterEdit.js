"use client";
import { useState } from 'react';

export default function ChapterEdit({ chapter, onSave, onCancel }) {
  const [content, setContent] = useState(chapter.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Chapter content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await onSave(content);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-t-xl border border-b-0 border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Editing Chapter {chapter.chapter_number}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Make your changes below. Use Markdown formatting if needed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-xs sm:text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            {charCount.toLocaleString()} characters
          </span>
          {/* <span className="hidden sm:flex items-center gap-1 text-indigo-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Manual edits don't use tokens
          </span> */}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[600px] sm:h-[700px] p-4 border border-gray-300 rounded-lg text-gray-900 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none font-mono"
          placeholder="Start typing your chapter content here..."
          spellCheck="true"
        />
      </div>

      {/* Footer Tips */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-4 sm:p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Editing Tips:
          </h4>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Use <code className="bg-blue-100 px-1 py-0.5 rounded">**bold**</code> for bold text</li>
            <li>• Use <code className="bg-blue-100 px-1 py-0.5 rounded">### Heading</code> for section headings</li>
            <li>• Use <code className="bg-blue-100 px-1 py-0.5 rounded">- item</code> for bullet points</li>
            <li>• Keep <code className="bg-blue-100 px-1 py-0.5 rounded">{'{{figureX.Y}}'}</code> placeholders as&apos;is for images</li>
            <li>• Manual edits are tracked but don't consume your token limit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}