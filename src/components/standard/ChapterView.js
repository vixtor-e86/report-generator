// src/components/standard/ChapterView.js
"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

export default function ChapterView({ chapter, images, project, onPrint }) {
  const [processedContent, setProcessedContent] = useState('');

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
      
      // Find image: either matches this chapter specifically, or use global order if chapter_number is null
      // We look for the Nth image associated with this chapter
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
      <div className="my-12 flex flex-col items-center justify-center figure-container">
        <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
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
      <div className="my-10 overflow-x-auto rounded-3xl border border-slate-200 shadow-xl bg-white">
        <table className="w-full text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-slate-900 text-white px-6 py-4 text-left font-black uppercase tracking-widest text-[10px]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <th className="px-6 py-4 border-t border-slate-100 text-slate-700 font-bold text-left bg-white">
        {children}
      </th>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-900 bg-slate-50 p-8 rounded-r-3xl my-10 italic text-slate-600 font-medium shadow-inner">
        {children}
      </blockquote>
    )
  };

  if (!chapter) return null;

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 min-h-[800px] flex flex-col overflow-hidden">
      {/* View Header */}
      <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              Chapter {chapter.chapter_number}
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {chapter.title}
            </h1>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Technical Research Draft • Standard Tier
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onPrint}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all active:scale-95 group"
            title="Print Report"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="flex-1 px-12 py-16 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-slate max-w-none 
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {processedContent}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-500 italic text-center py-12">
                Chapter content is currently empty. Use the tools to generate or write content.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {chapter.ai_model_used && (
        <div className="px-10 py-4 border-t border-slate-50 bg-slate-50/50 shrink-0">
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
