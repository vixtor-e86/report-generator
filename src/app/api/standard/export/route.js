// /src/app/api/standard/export/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDocx, packDocx } from '@/lib/docxExport';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, userId, format } = await request.json();

    // Validate inputs
    if (!projectId || !userId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only support DOCX for now
    if (format !== 'docx') {
      return NextResponse.json(
        { error: 'Only DOCX format is supported via API' },
        { status: 400 }
      );
    }

    // 1. Fetch project (Try standard_projects first, then projects for Free tier)
    let { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    let projectTable = 'standard_projects';
    let chapterTable = 'standard_chapters';

    if (projectError || !project) {
      const { data: freeProject, error: freeProjectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (freeProjectError || !freeProject) {
        console.error('Project fetch error:', projectError || freeProjectError);
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      project = freeProject;
      projectTable = 'projects';
      chapterTable = 'chapters';
    }

    // 1.5 ✅ NEW: Check if Free project is unlocked
    if (projectTable === 'projects' && !project.is_unlocked && project.tier !== 'premium') {
        return NextResponse.json(
          { error: 'This project is locked. Please unlock it to export.' },
          { status: 402 }
        );
    }

    // 2. Verify ownership
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Fetch all chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from(chapterTable)
      .select('*')
      .eq('project_id', projectId)
      .order('chapter_number', { ascending: true });

    if (chaptersError) {
      console.error('Chapters fetch error:', chaptersError);
      return NextResponse.json(
        { error: 'Failed to fetch chapters' },
        { status: 500 }
      );
    }

    // 4. Check if all chapters are generated
    const allGenerated = chapters.every(ch => 
      ch.status === 'draft' || ch.status === 'edited' || ch.status === 'approved'
    );

    if (!allGenerated) {
      return NextResponse.json(
        { error: 'Please generate all chapters before exporting' },
        { status: 400 }
      );
    }

    // 5. ✅ IMPROVED: Fetch images with better logging
    const { data: images, error: imagesError } = await supabase
      .from(projectTable === 'projects' ? 'project_images' : 'standard_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    if (imagesError) {
      console.error('Images fetch error:', imagesError);
    }

    // Log image data for debugging
    console.log(`Found ${images?.length || 0} images for project ${projectId}`);
    
    // 6. Fetch user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*, universities(name)')
      .eq('id', userId)
      .single();

    // 6.5 ✅ NEW: Fetch template to get faculty and type
    const { data: template } = await supabase
      .from('templates')
      .select('faculty, template_type, name')
      .eq('id', project.template_id)
      .single();

    // 6.6 ✅ NEW: Generate Abstract using AI
    const { callAI } = await import('@/lib/aiProvider');
    console.log('Generating abstract...');
    let abstractText = '';
    
    try {
      const { getAbstractPrompt } = await import('@/lib/abstractGenerator');
      
      const abstractPrompt = getAbstractPrompt(
        project, 
        chapters, 
        template?.faculty || 'Engineering',
        template?.template_type
      );
      
      const aiResult = await callAI(abstractPrompt, {
        maxTokens: 500,
        temperature: 0.7
      });
      
      abstractText = aiResult.content;
      console.log('Abstract generated successfully');
    } catch (error) {
      console.error('Abstract generation failed:', error);
      abstractText = `This report presents the design and implementation of ${project.title}. The project was developed in the ${project.department} department and focuses on ${project.components?.join(', ')}. The report documents the complete development process, testing procedures, and results achieved.`;
    }

    // 6.7 ✅ NEW: Process References using AI (DeepSeek)
    console.log('Processing references with AI...');
    let finalReferences = [];
    try {
      // Collect raw references
      const rawRefsList = [];
      chapters.forEach(ch => {
        const parts = (ch.content || "").split(/## References|### References/i);
        if (parts.length > 1) {
          parts[parts.length - 1].split('\n').forEach(line => {
            const cleaned = line.trim().replace(/^(\[?\d+\]?\.?|\-|\*)\s+/, '').trim();
            if (cleaned.length > 20) rawRefsList.push(cleaned);
          });
        }
      });

      if (rawRefsList.length > 0) {
        const styleName = (project.reference_style || 'apa').toUpperCase();
        const refPrompt = `
          You are an expert academic editor. I will provide you with a list of raw references collected from various chapters of a technical report.
          Your task:
          1. Remove any exact or near-duplicate references.
          2. Structure them into a professional, consistent academic format matching the ${styleName} style guide.
          3. Format and sort them appropriately:
             - If ${styleName} is IEEE: Format as IEEE bibliography style, sort by appearance/usage order in text, and number them sequentially [1], [2], [3]...
             - If ${styleName} is APA, HARVARD, or MLA: Format them according to the ${styleName} style guide, and sort them alphabetically by the first author's last name. Number them sequentially (1, 2, 3...) for presentation.
          4. Ensure each reference is complete and properly formatted.
          5. Return ONLY the final numbered list of references, with no other text, commentary, or headers.

          Raw References:
          ${rawRefsList.join('\n')}
        `;

        const refResult = await callAI(refPrompt, {
          provider: 'deepseek',
          maxTokens: 1500,
          temperature: 0.3
        });

        // Split by lines and clean
        finalReferences = refResult.content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 5);
        
        console.log(`Refined ${finalReferences.length} references using AI`);
      }
    } catch (refError) {
      console.error('Reference refinement failed:', refError);
      // Fallback: use simple deduplication if AI fails
      const uniqueRefs = new Set();
      chapters.forEach(ch => {
        const parts = (ch.content || "").split(/## References|### References/i);
        if (parts.length > 1) {
          parts[parts.length - 1].split('\n').forEach(line => {
            const cleaned = line.trim().replace(/^(\[?\d+\]?\.?|\-|\*)\s+/, '').trim();
            if (cleaned.length > 30) uniqueRefs.add(cleaned);
          });
        }
      });
      finalReferences = Array.from(uniqueRefs).sort().map((ref, i) => `${i + 1}. ${ref}`);
    }

    // 7. Generate DOCX
    console.log('Starting DOCX generation...');
    const doc = await generateDocx({
      project,
      chapters,
      images: images || [],
      userProfile,
      abstract: abstractText,
      references: finalReferences // ✅ Pass refined references
    });

    // 8. Pack DOCX to blob
    console.log('Packing DOCX...');
    const blob = await packDocx(doc);
    
    // 9. Convert blob to base64
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');

    console.log('DOCX generation completed successfully');

    // 10. Return base64 data
    return NextResponse.json({
      success: true,
      filename: `${project.title.replace(/[^a-z0-9]/gi, '_')}_Report.docx`,
      data: base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export document' },
      { status: 500 }
    );
  }
}