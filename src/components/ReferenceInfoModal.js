// /src/components/ReferenceInfoModal.js
"use client";
import { REFERENCE_STYLES } from '@/lib/referenceStyles';

export default function ReferenceInfoModal({ isOpen, onClose, selectedStyle }) {
  if (!isOpen) return null;

  const style = REFERENCE_STYLES[selectedStyle] || REFERENCE_STYLES.apa;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{style.icon}</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {style.name}
              </h3>
              <p className="text-sm text-gray-600">{style.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Best For */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Best For
            </h4>
            <p className="text-gray-700 bg-indigo-50 p-3 rounded-lg">{style.bestFor}</p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">Description</h4>
            <p className="text-gray-700">{style.description}</p>
          </div>

          {/* Format Guide */}
          {style.id !== 'none' && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Format Examples</h4>

                {/* In-Text Citation */}
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      In-Text Citation
                    </span>
                  </h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-mono text-sm text-gray-800">{style.inTextFormat}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    {style.examples.inText}
                  </p>
                </div>

                {/* Reference List Format */}
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      Reference List Format
                    </span>
                  </h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-mono text-xs sm:text-sm text-gray-800 break-words">
                      {style.referenceFormat}
                    </p>
                  </div>
                </div>

                {/* Book Example */}
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-2">📚 Book Example</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-800 break-words">
                      {style.examples.book}
                    </p>
                  </div>
                </div>

                {/* Journal Example */}
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-2">📄 Journal Article Example</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-800 break-words">
                      {style.examples.journal}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Important Note</p>
                    <p>
                      The AI will generate references in this format. These are realistic but <strong>fictional</strong> references. 
                      You should replace them with actual sources during your research and editing phase.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No References Message */}
          {style.id === 'none' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h4 className="text-lg font-bold text-gray-900 mb-2">No References</h4>
              <p className="text-gray-600 mb-4">
                Your report will be generated without any references or citations. 
                This gives you full control to add your own references manually during editing.
              </p>
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Best for:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Custom citation requirements</li>
                  <li>• Projects with specific reference formats</li>
                  <li>• When you prefer to add references manually</li>
                  <li>• Quick draft generation without citations</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}