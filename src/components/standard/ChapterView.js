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
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 text-center rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 print:hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          Ready to Generate
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Click "Generate {itemLabel}" in the top bar to create this {itemLabel.toLowerCase()} using AI.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm font-semibold text-blue-900 mb-2">What will be generated:</p>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>✓ 2000-3000 words of content</li>
            <li>✓ Properly structured sections</li>
            <li>✓ Based on your {isSIWES ? 'training experience' : 'project details'}</li>
            <li>✓ Professional academic tone</li>
            {images && images.length > 0 && (
              <li>✓ References to your {images.length} uploaded image{images.length > 1 ? 's' : ''}</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // If currently generating
  if (generating || chapter.status === 'generating') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 text-center rounded-xl sm:rounded-2xl border-2 border-blue-200 bg-blue-50 print:hidden">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-6"></div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Generating {itemLabel} {chapter.chapter_number}...
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          This may take 30-60 seconds. Please wait...
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Display generated content
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 lg:p-12 shadow-sm border border-gray-200 rounded-xl min-h-[600px] sm:min-h-[800px] print:shadow-none print:border-0 print:p-0 print:rounded-none">
      {/* Chapter Header Info - Hidden on print */}
      <div className="mb-6 pb-4 border-b border-gray-200 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {itemLabel} {chapter.chapter_number}: {chapter.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generated {chapter.generated_at ? new Date(chapter.generated_at).toLocaleDateString() : 'recently'}
              </span>
              <span>Version {chapter.version}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                chapter.status === 'edited' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {chapter.status === 'edited' ? 'Edited' : 'AI Generated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Content with Image Rendering - Print Friendly */}
      <div className="chapter-content prose prose-sm sm:prose-base lg:prose-lg max-w-none 
        text-gray-900 
        prose-p:text-justify prose-p:leading-relaxed prose-p:mb-4 sm:prose-p:mb-6
        prose-headings:font-bold prose-headings:text-gray-900 
        prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:text-center prose-h2:uppercase prose-h2:tracking-wide prose-h2:mb-6 sm:prose-h2:mb-10 prose-h2:mt-0
        prose-h3:text-base sm:prose-h3:text-lg lg:prose-h3:text-xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3 sm:prose-h3:mb-4 prose-h3:border-b prose-h3:border-gray-200 prose-h3:pb-2
        prose-h4:text-sm sm:prose-h4:text-base lg:prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2
        prose-li:text-gray-800 prose-li:mb-2
        prose-strong:text-black prose-strong:font-bold
        prose-table:text-xs sm:prose-table:text-sm lg:prose-table:text-base
        prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic
        print:prose-p:font-serif print:prose-p:text-[12pt] print:prose-p:leading-[1.5]
        print:prose-headings:font-serif
        print:prose-h2:text-[14pt] print:prose-h2:font-bold
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
            <p>No content available. Try regenerating this {itemLabel.toLowerCase()}.</p>
          </div>
        )}
      </div>

      {/* Footer Info - Hidden on print */}
      {chapter.ai_model_used && (
        <div className="mt-8 pt-4 border-t border-gray-200 print:hidden">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Model: {chapter.ai_model_used}</span>
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