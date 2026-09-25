// src/components/standard/ChapterView.js
"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

export default function ChapterView({ chapter, images, project, onPrint, onSavePastedChapter }) {
  const [processedContent, setProcessedContent] = useState('');
  const [pastedText, setPastedText] = useState(chapter?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPasted, setIsEditingPasted] = useState(false);

  const isStudentProvided = project?.is_custom && project?.selected_chapters && !project.selected_chapters.includes(chapter?.chapter_number);

  useEffect(() => {
    setPastedText(chapter?.content || '');
    setIsEditingPasted(false);
  }, [chapter?.id, chapter?.chapter_number, chapter?.content]);

  useEffect(() => {
    if (!chapter?.content) {
      setProcessedContent('');
      return;
    }

    // Process Figure Placeholders
    let content = chapter.content;
    const figureRegex = /\{\{figure(\d+)\.(\d+)\}\}/g;
    
    content = content.replace(figureRegex, (match, chNum, figNum) => {
      const chapterNumber = parseInt(chNum);
      const figureIndex = parseInt(figNum);
      
      const chapterImages = images?.filter(img => 
        img.chapter_number === chapterNumber || img.chapter_number === null
      ).sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

      const img = chapterImages?.[figureIndex - 1];
      
      if (img) {
        return `\n\n![Figure ${chNum}.${figNum}: ${img.caption}](${img.cloudinary_url})\n*Figure ${chNum}.${figNum}: ${img.caption}*\n\n`;
      }
      return `\n\n> **[Figure ${chNum}.${figNum} Placeholder]**\n\n`;
    });

    setProcessedContent(content);
  }, [chapter, images]);

  const components = {
    img: ({ src, alt }) => (
      <div className="my-12 flex flex-col items-center justify-center figure-container print:my-8">
        <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-100 print:shadow-none print:border-none print:max-w-none">
          <img
            src={src}
            alt={alt}
            className="object-contain w-full h-full bg-slate-50"
          />
        </div>
        {alt && (
          <p className="mt-4 text-sm font-bold text-slate-500 italic text-center max-w-xl">
            {alt}
          </p>
        )}
      </div>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-black text-slate-900 mt-16 mb-8 border-b-2 border-slate-100 pb-4 flex items-center gap-3">
        <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-black text-slate-800 mt-12 mb-6 flex items-center gap-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-slate-700 leading-[1.8] mb-8 text-justify font-medium">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-8 mb-8 space-y-4 text-slate-700 font-medium">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-8 mb-8 space-y-4 text-slate-700 font-medium">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed pl-2 marker:text-slate-900 marker:font-black">
        {children}
      </li>
    ),
    table: ({ children }) => (
      <div className="my-10 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-slate-50 text-slate-900 border-b border-slate-200 px-6 py-4 text-left font-black uppercase tracking-widest text-[10px]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-6 py-4 border-t border-slate-100 text-slate-700 font-medium text-left">
        {children}
      </td>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-900 bg-slate-50 p-8 rounded-r-3xl my-10 italic text-slate-600 font-medium shadow-inner">
        {children}
      </blockquote>
    )
  };

  if (!chapter) return null;

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 min-h-[800px] flex flex-col overflow-hidden print:shadow-none print:border-none print:rounded-none print:min-h-0 print:h-auto print:overflow-visible print:block">
      {/* View Header */}
      <div className="px-4 sm:px-10 py-4 sm:py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10 print:hidden gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1">
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-white text-[8px] sm:text-[10px] font-black rounded-full uppercase tracking-widest w-fit shrink-0 ${
              isStudentProvided ? 'bg-amber-600' : 'bg-slate-900'
            }`}>
              Chapter {chapter.chapter_number} {isStudentProvided ? '• I Have This' : ''}
            </span>
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
              {chapter.title}
            </h1>
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] truncate">
            {isStudentProvided ? 'Baseline Technical Draft (Student Provided)' : 'Technical Research Draft • Standard Tier'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={onPrint}
            className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl transition-all active:scale-95 group"
            title="Print Report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="flex-1 px-6 sm:px-12 py-10 sm:py-16 overflow-y-auto custom-scrollbar print:p-0 print:overflow-visible print:min-h-0 print:h-auto print:block">
        <div className="max-w-4xl mx-auto print:max-w-none print:mx-0 print:w-full print:block">
          
          {/* Student-Provided Interactive Paste Card */}
          {isStudentProvided && (!chapter.content || isEditingPasted) ? (
            <div className="bg-slate-50/90 border-2 border-dashed border-indigo-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm print:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-2 border border-amber-200">
                    <span>Student Baseline Chapter (I Have This)</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    Paste Your Written Chapter {chapter.chapter_number}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Paste your existing {chapter.title} content below. The AI will analyze this baseline to match your exact citations, technical vocabulary, and structure in future generated chapters.
                  </p>
                </div>
                {isEditingPasted && chapter.content && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPasted(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shrink-0 shadow-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={14}
                placeholder={`Paste your complete Chapter ${chapter.chapter_number} text here...`}
                className="w-full p-4 sm:p-5 text-sm sm:text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 leading-relaxed font-sans placeholder-slate-400 shadow-inner"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs font-bold text-slate-500">
                  Word Count: {pastedText ? pastedText.trim().split(/\s+/).filter(Boolean).length : 0} words
                </span>

                <button
                  type="button"
                  onClick={async () => {
                    if (!pastedText.trim()) return;
                    setIsSaving(true);
                    await onSavePastedChapter?.(chapter.chapter_number, pastedText);
                    setIsSaving(false);
                    setIsEditingPasted(false);
                  }}
                  disabled={isSaving || !pastedText.trim()}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Saving...' : `Save Chapter ${chapter.chapter_number} Text`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {isStudentProvided && chapter.content && !isEditingPasted && (
                <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between print:hidden">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Student Baseline
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Provided by you • {chapter.content.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText(chapter.content);
                      setIsEditingPasted(true);
                    }}
                    className="text-xs font-black text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm transition-all"
                  >
                    Edit / Update Pasted Text
                  </button>
                </div>
              )}

              <div className="prose prose-slate max-w-none print:max-w-none print:w-full print:block
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                prose-p:text-justify prose-p:text-slate-700 prose-p:leading-[1.8]
                prose-li:text-slate-700 prose-li:mb-4 prose-li:font-medium
                prose-ol:pl-6 prose-ul:pl-6
                prose-strong:text-slate-900 prose-strong:font-black
                print:prose-p:font-serif print:prose-p:text-[12pt] print:prose-p:leading-[1.5]
                print:prose-headings:font-serif print:prose-h2:text-[14pt] print:prose-h2:font-bold
                print:prose-h3:text-[13pt] print:prose-h3:font-bold print:prose-h3:border-b-0
                print:prose-h4:text-[12pt] print:prose-h4:font-bold
                print:prose-li:font-serif print:prose-li:text-[12pt]
                print:prose-strong:font-bold print:prose-strong:text-black
                print:prose-table:text-[11pt]">
                
                {processedContent ? (
                  isStudentProvided ? (
                    <div className="whitespace-pre-wrap font-serif text-slate-800 text-base leading-[1.8] text-justify select-text">
                      {processedContent}
                    </div>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {processedContent}
                    </ReactMarkdown>
                  )
                ) : (
                  <div className="text-gray-500 italic text-center py-12">
                    Chapter content is currently empty. Use the tools to generate or write content.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      {chapter.ai_model_used && (
        <div className="px-10 py-4 border-t border-slate-50 bg-slate-50/50 shrink-0 print:hidden">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-4">
              {chapter.tokens_output && (
                <span>Word Count: {Math.round(chapter.tokens_output * 0.75)} words</span>
              )}
            </div>
            {chapter.generation_time_seconds && (
              <span>Generated in {chapter.generation_time_seconds}s</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
