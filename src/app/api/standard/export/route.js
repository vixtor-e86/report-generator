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

    // 1. Fetch project
    const { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Project fetch error:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
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
      .from('standard_chapters')
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
      .from('standard_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    if (imagesError) {
      console.error('Images fetch error:', imagesError);
    }

    // Log image data for debugging
    console.log(`Found ${images?.length || 0} images for project ${projectId}`);
    if (images && images.length > 0) {
      images.forEach(img => {
        console.log(`Image: ${img.placeholder_id} - ${img.cloudinary_url}`);
      });
    }

  
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
    console.log('Generating abstract...');
    let abstractText = '';
    
    try {
      const { getAbstractPrompt } = await import('@/lib/abstractGenerator');
      const { callAI } = await import('@/lib/aiProvider');
      
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
      // Fallback abstract if AI fails
      abstractText = `This report presents the design and implementation of ${project.title}. The project was developed in the ${project.department} department and focuses on ${project.components?.join(', ')}. The report documents the complete development process, testing procedures, and results achieved.`;
    }

    // 7. Generate DOCX
    console.log('Starting DOCX generation...');
    const doc = await generateDocx({
      project,
      chapters,
      images: images || [],
      userProfile,
      abstract: abstractText // ✅ Pass abstract to DOCX generator
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