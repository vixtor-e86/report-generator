"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

export default function ChapterView({ chapter, images, generating }) {
  const [processedContent, setProcessedContent] = useState('');
  const [template, setTemplate] = useState(null);

  // Fetch template to check if SIWES
  useEffect(() => {
    async function loadTemplate() {
      if (chapter?.project_id) {
        const { supabase } = await import('@/lib/supabase');
        const { data: project } = await supabase
          .from('standard_projects')
          .select('template_id')
          .eq('id', chapter.project_id)
          .single();

        if (project?.template_id) {
          const { data: templateData } = await supabase
            .from('templates')
            .select('name')
            .eq('id', project.template_id)
            .single();
          
          setTemplate(templateData);
        }
      }
    }
    loadTemplate();
  }, [chapter?.project_id]);

  const isSIWES = template?.name?.toLowerCase().includes('siwes') || 
                  template?.name?.toLowerCase().includes('industrial');
  const itemLabel = isSIWES ? 'Part' : 'Chapter';

  // Process content to replace figure placeholders with actual images
  useEffect(() => {
    if (chapter?.content && images) {
      let content = chapter.content;
      
      // Find all {{figureX.Y}} placeholders and replace with image components
      const figureRegex = /\{\{figure(\d+)\.(\d+)\}\}/g;
      
      // We'll mark where images should be for ReactMarkdown custom renderer
      setProcessedContent(content);
    } else {
      setProcessedContent(chapter?.content || '');
    }
  }, [chapter?.content, images]);

  // Custom renderer for ReactMarkdown to handle figure placeholders
  const components = {
    p: ({ children, ...props }) => {
      // Check if this paragraph contains a figure placeholder
      const text = String(children);
      const figureMatch = text.match(/\{\{figure(\d+)\.(\d+)\}\}/);
      
      if (figureMatch) {
        const figChapter = parseInt(figureMatch[1]);
        const figNumber = parseInt(figureMatch[2]);
        
        // Find the corresponding image
        const image = images?.find(img => 
          img.placeholder_id === `figure${figChapter}.${figNumber}`
        );

        if (image) {
          return (
            <div className="figure-container my-8 flex flex-col items-center print:my-6">
              <div className="relative w-full max-w-2xl h-[400px] border border-gray-200 rounded-lg overflow-hidden print:h-auto print:border-0">
                <Image
                  src={image.cloudinary_url}
                  alt={image.caption}
                  fill
                  className="object-contain print:!relative print:!w-full print:!h-auto print:max-w-[6in]"
                />
              </div>
              <p className="figure-caption mt-3 text-sm font-semibold text-gray-700 italic text-center print:text-black print:font-bold">
                Figure {figChapter}.{figNumber}: {image.caption}
              </p>
            </div>
          );
        } else {
          // Image not found, show placeholder
          return (
            <p className="my-4 text-center text-gray-500 italic" {...props}>
              [Figure {figChapter}.{figNumber} - Image not available]
            </p>
          );
        }
      }
      
      // Regular paragraph
      return <p {...props}>{children}</p>;
    },
  };

  // If chapter not generated yet
  if (!chapter || chapter.status === 'not_generated') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-16 text-center rounded-[40px] border border-slate-200 shadow-xl print:hidden">
        <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
          System Draft Not Initialized
        </h3>
        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
          The AI Architect is waiting for your signal to begin drafting this {itemLabel.toLowerCase()}.
        </p>
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-left max-w-lg mx-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Drafting Scope:</p>
          <ul className="text-sm font-bold text-slate-600 space-y-3">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> 2,000+ words of technical content</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Formal academic report structure</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Nigerian engineering standards</li>
            {images && images.length > 0 && (
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Smart figure referencing (Fig. 1.1)</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // If currently generating
  if (generating || chapter.status === 'generating') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-16 text-center rounded-[40px] border border-slate-200 shadow-xl print:hidden overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
          <div className="h-full bg-slate-900 animate-progress origin-left w-full"></div>
        </div>
        <div className="w-20 h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
          Drafting {itemLabel} {chapter.chapter_number}
        </h3>
        <p className="text-slate-500 font-medium mb-2 leading-relaxed">
          Our AI System Architect is compiling technical data...
        </p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Estimated time: 45s</p>
      </div>
    );
  }

  // Display generated content
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 lg:p-20 shadow-xl border border-slate-200 rounded-[40px] min-h-[800px] print:shadow-none print:border-0 print:p-0 print:rounded-none">
      {/* Chapter Header Info - Hidden on print */}
      <div className="mb-12 pb-8 border-b border-slate-100 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block">
              {itemLabel} {chapter.chapter_number}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {chapter.title}
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {chapter.generated_at ? new Date(chapter.generated_at).toLocaleDateString() : 'Draft'}
              </div>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                chapter.status === 'edited' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {chapter.status === 'edited' ? 'Manual Edit' : 'System Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="chapter-content prose prose-slate max-w-none 
        text-slate-900 
        prose-p:text-justify prose-p:leading-[1.8] prose-p:mb-8
        prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
        prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:uppercase prose-h2:mb-10 prose-h2:mt-0 prose-h2:text-left
        prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:border-b-2 prose-h3:border-slate-100 prose-h3:pb-2
        prose-h4:text-lg prose-h4:mt-8 prose-h4:mb-4
        prose-li:text-slate-700 prose-li:mb-3 prose-li:font-medium
        prose-strong:text-slate-900 prose-strong:font-black
        prose-table:border prose-table:border-slate-200 prose-table:rounded-xl prose-table:overflow-hidden
        prose-thead:bg-slate-50 prose-thead:text-slate-900
        prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:py-4 prose-blockquote:pr-4
        print:prose-p:font-serif print:prose-p:text-[12pt] print:prose-p:leading-[1.5]
        print:prose-headings:font-serif
        print:prose-h2:text-[14pt] print:prose-h2:font-bold
        print:prose-h3:text-[13pt] print:prose-h3:font-bold print:prose-h3:border-b-0
        print:prose-h4:text-[12pt] print:prose-h4:font-bold">
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
            <p>No content available. Try regenerating this {itemLabel.toLowerCase()}.</p>
          </div>
        )}
      </div>

      {/* Footer Info - Hidden on print */}
      {chapter.ai_model_used && (
        <div className="mt-8 pt-4 border-t border-gray-200 print:hidden">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {chapter.tokens_input && chapter.tokens_output && (
                <span>Tokens: {(chapter.tokens_input + chapter.tokens_output).toLocaleString()}</span>
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