"use client";
import { useState } from 'react';

export default function PreviewModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  chapter,
  loading = false 
}) {
  const [outline, setOutline] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  // Fetch preview when modal opens
  useState(() => {
    if (isOpen && chapter && !outline && !previewLoading) {
      fetchPreview();
    }
  }, [isOpen]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setError('');

    try {
      const response = await fetch('/api/standard/preview-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: chapter.project_id,
          chapterNumber: chapter.chapter_number,
          userId: chapter.user_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setOutline(data.outline);
      setTokensUsed(data.tokensUsed);
      setEstimatedTokens(data.estimatedFullGeneration);

    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleProceed = () => {
    setOutline('');
    setError('');
    onProceed();
  };

  const handleCancel = () => {
    setOutline('');
    setError('');
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
              📋 Chapter Preview
            </h3>
            <button
              onClick={handleCancel}
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
          {previewLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Generating preview...</p>
              <p className="text-xs text-gray-500 mt-2">This uses only ~500 tokens</p>
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
                  <p className="text-sm font-semibold text-red-900">Preview Failed</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Content */}
          {outline && !previewLoading && (
            <>
              {/* Token Savings Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">
                  <strong>Preview cost: {tokensUsed} tokens</strong> · Full generation would cost ~{estimatedTokens.toLocaleString()} tokens
                </p>
              </div>

              {/* Outline Display */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">
                  This chapter will cover:
                </h4>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {outline}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Next steps:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>If this outline looks good, proceed to generate the full chapter (~{estimatedTokens.toLocaleString()} tokens)</li>
                      <li>If not satisfied, cancel and adjust your project details or images</li>
                      <li>You can always regenerate later if needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceed}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Full Chapter ({estimatedTokens.toLocaleString()} tokens)
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