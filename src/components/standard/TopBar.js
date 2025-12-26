"use client";
import { useState } from 'react';

export default function TopBar({
  chapter,
  isEditing,
  generating,
  project,
  chapters,
  onEdit,
  onSave,
  onGenerate,
  onRegenerate,
  onModifyRegenerate,
  onToggleSidebar,
  onPrintCurrentChapter,
  onPreviewBeforeGenerate,
  onSuggestImprovements
}) {
  const [exporting, setExporting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isGenerated = chapter && (chapter.status === 'draft' || chapter.status === 'edited' || chapter.status === 'approved');
  const canRegenerate = isGenerated && project.tokens_used < project.tokens_limit;

  const handlePrintCurrentChapter = () => {
    if (onPrintCurrentChapter) {
      onPrintCurrentChapter();
    } else {
      window.print();
    }
    setShowMobileMenu(false);
  };

  const handleExportDOCX = async () => {
    setExporting(true);
    setShowMobileMenu(false);

    try {
      const response = await fetch('/api/standard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          userId: project.user_id,
          format: 'docx'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Document exported successfully!');

    } catch (error) {
      console.error('Export error:', error);
      alert(error.message || 'Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 print:hidden">
      <div className="flex justify-between items-center gap-2">
        {/* Left: Chapter Info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
              {chapter ? (
                <>
                  <span className="hidden sm:inline">Chapter {chapter.chapter_number}</span>
                  <span className="sm:hidden">Ch. {chapter.chapter_number}</span>
                  {chapter.title && <span className="hidden md:inline"> - {chapter.title}</span>}
                </>
              ) : (
                'Select a Chapter'
              )}
            </h1>
            {chapter && isGenerated && (
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                Version {chapter.version} • {chapter.edit_count || 0} edits • {chapter.regeneration_count || 0} regens
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!chapter ? (
            <div className="text-xs sm:text-sm text-gray-500">Select a chapter</div>
          ) : isEditing ? (
            // EDITING MODE
            <>
              <button
                onClick={onSave}
                className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-xs sm:text-sm"
              >
                Discard
              </button>
              <button
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </>
          ) : !isGenerated ? (
            // NOT GENERATED - Show primary action + mobile menu
            <>
              {/* Generate Button - Always visible */}
              <button
                onClick={onGenerate}
                disabled={generating}
                className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">Gen...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">Generate Chapter</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </button>

              {/* Preview Button - Desktop only */}
              <button
                onClick={onPreviewBeforeGenerate}
                disabled={generating}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 items-center gap-2 text-sm hidden lg:flex"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </>
          ) : (
            // GENERATED - Show key buttons + more menu
            <>
              {/* Desktop: Show all buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={onEdit}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center gap-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>

                <button
                  onClick={onSuggestImprovements}
                  disabled={generating}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 transition flex items-center gap-1.5 disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Suggest
                </button>

                <button
                  onClick={onRegenerate}
                  disabled={!canRegenerate || generating}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regen
                </button>

                <button
                  onClick={onModifyRegenerate}
                  disabled={!canRegenerate || generating}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Modify
                </button>

                <button
                  onClick={handlePrintCurrentChapter}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>

                <button
                  onClick={handleExportDOCX}
                  disabled={exporting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-1.5 text-sm disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export
                    </>
                  )}
                </button>
              </div>

              {/* Mobile/Tablet: Show essential buttons + menu */}
              <div className="flex lg:hidden items-center gap-2">
                {/* Edit Button - Always show */}
                <button
                  onClick={onEdit}
                  className="bg-gray-900 text-white px-3 py-2 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center gap-1.5 text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>

                {/* Export Button - Always show */}
                <button
                  onClick={handleExportDOCX}
                  disabled={exporting}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden sm:inline">Export</span>
                    </>
                  )}
                </button>

                {/* More Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-gray-700 transition text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Mobile Menu Dropdown */}
                  {showMobileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMobileMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                        <button
                          onClick={() => {
                            onSuggestImprovements();
                            setShowMobileMenu(false);
                          }}
                          disabled={generating}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-3 text-sm disabled:opacity-50"
                        >
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="font-semibold text-gray-900">Suggestions</span>
                        </button>

                        <button
                          onClick={() => {
                            onRegenerate();
                            setShowMobileMenu(false);
                          }}
                          disabled={!canRegenerate || generating}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-3 text-sm disabled:opacity-50"
                        >
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="font-semibold text-gray-900">Regenerate</span>
                        </button>

                        <button
                          onClick={() => {
                            onModifyRegenerate();
                            setShowMobileMenu(false);
                          }}
                          disabled={!canRegenerate || generating}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-3 text-sm disabled:opacity-50"
                        >
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="font-semibold text-gray-900">Modify & Regen</span>
                        </button>

                        <button
                          onClick={handlePrintCurrentChapter}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span className="font-semibold text-gray-900">Print Chapter</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Token Limit Warning */}
      {chapter && isGenerated && !canRegenerate && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Token limit reached</p>
            <p className="text-xs text-red-700 mt-1">
              You've used all {project.tokens_limit.toLocaleString()} tokens. You can still edit manually or upgrade to Premium for unlimited regenerations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}