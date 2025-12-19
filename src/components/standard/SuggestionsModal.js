"use client";
import { useState, useEffect } from 'react';

export default function SuggestionsModal({ 
  isOpen, 
  onClose, 
  onApplyAndRegenerate,
  chapter,
  projectId,
  userId
}) {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen && chapter && !suggestions && !loading) {
      fetchSuggestions();
    }
  }, [isOpen, chapter]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/standard/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          chapterNumber: chapter.chapter_number,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data.suggestions);
      setTokensUsed(data.tokensUsed);

    } catch (err) {
      console.error('Suggestions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEdit = () => {
    // Close modal and let user edit manually
    handleClose();
    // Parent component should switch to edit mode
  };

  const handleApplyAndRegenerate = async () => {
    setRegenerating(true);
    
    // Build custom instruction from suggestions
    const instruction = `Apply these improvements:\n${suggestions}`;
    
    try {
      await onApplyAndRegenerate(instruction);
      handleClose();
    } catch (err) {
      console.error('Regeneration error:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleClose = () => {
    setSuggestions('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              💡 AI Suggestions
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Chapter {chapter?.chapter_number}: {chapter?.title}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing chapter...</p>
              <p className="text-xs text-gray-500 mt-2">This uses only ~1,000 tokens</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-900">Analysis Failed</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Content */}
          {suggestions && !loading && (
            <>
              {/* Token Savings Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">
                  <strong>Analysis cost: {tokensUsed} tokens</strong> · Saved ~9,000 tokens by not regenerating immediately
                </p>
              </div>

              {/* Suggestions Display */}
              <div className="bg-purple-50 rounded-lg p-4 sm:p-6 mb-4 border border-purple-200">
                <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Recommended Improvements:
                </h4>
                <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed space-y-2">
                  {suggestions.split('\n').map((line, idx) => (
                    <div key={idx} className={line.match(/^\d+\./) ? 'ml-0' : 'ml-4'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Options Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">Two options:</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white rounded p-2">
                        <p className="font-semibold text-green-700 mb-1">
                          ✅ Manual Edit (FREE - 0 tokens)
                        </p>
                        <p className="text-blue-700">
                          Make these changes yourself in the editor. Best for small tweaks and specific fixes.
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="font-semibold text-purple-700 mb-1">
                          🔄 AI Regeneration (~10,000 tokens)
                        </p>
                        <p className="text-blue-700">
                          Let AI apply all suggestions automatically. Use when major rewrites are needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleManualEdit}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manual Edit (0 tokens)
                </button>
                <button
                  onClick={handleApplyAndRegenerate}
                  disabled={regenerating}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {regenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      AI Regenerate (10k tokens)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}