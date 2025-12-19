"use client";
import { useState } from 'react';

export default function ModifyModal({ isOpen, onClose, onSubmit, chapter }) {
  const [instruction, setInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxChars = 500;
  const remaining = maxChars - instruction.length;

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      alert('Please enter an instruction');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(instruction.trim());
      setInstruction('');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setInstruction('');
    onClose();
  };

  // Quick suggestions
  const suggestions = [
    "Make it more technical with equations and formulas",
    "Add more detail to the methodology section",
    "Simplify the language for better readability",
    "Include more practical examples",
    "Expand the analysis with deeper insights",
    "Make it more concise and to the point"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Modify & Regenerate
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
          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-indigo-800">
                <p className="font-semibold mb-1">How this works:</p>
                <p className="text-xs">
                  Your instruction will be added to the AI prompt. The chapter will be regenerated 
                  with your specific requirements in mind. This uses tokens from your limit.
                </p>
              </div>
            </div>
          </div>

          {/* Instruction Input */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Your Instruction *
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, maxChars))}
              rows="4"
              placeholder="e.g., Make it more technical with equations and formulas..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Be specific about what you want changed
              </p>
              <p className={`text-xs font-medium ${remaining < 50 ? 'text-red-600' : 'text-gray-500'}`}>
                {remaining} / {maxChars}
              </p>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-2">Quick Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInstruction(suggestion)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> The current chapter content will be replaced. 
                Make sure you've saved any manual edits before regenerating.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!instruction.trim() || submitting}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Regenerating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate Chapter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}