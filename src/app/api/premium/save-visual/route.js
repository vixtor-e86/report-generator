// src/app/api/premium/save-visual/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { r2Client, getPublicUrl } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request) {
  try {
    const { imageUrl, projectId, userId, name, type, sizeBytes } = await request.json();

    if (!imageUrl || !projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalUrl = imageUrl;
    let fileKey = `visuals/${projectId}/${Date.now()}.png`;
    let fileType = 'image/png';
    let purpose = 'project_image';
    let finalSize = sizeBytes || 0;

    // 1. Handle Document Saves (Exports)
    if (type === 'general') {
      purpose = 'general';
      fileType = name.toLowerCase().endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';
    } 
    // 2. Handle Base64 Image Saves (Flux)
    else if (imageUrl.startsWith('data:image/')) {
      try {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const bucketName = process.env.R2_BUCKET_NAME;
        finalSize = buffer.length;
        
        await r2Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: buffer,
          ContentType: 'image/png',
        }));

        finalUrl = getPublicUrl(fileKey) || `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileKey}`;
      } catch (uploadError) {
        console.error('R2 Upload Error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload generated image to storage' }, { status: 500 });
      }
    }

    // 3. Create asset record
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('premium_assets')
      .insert({
        project_id: projectId,
        user_id: userId,
        file_url: finalUrl, 
        file_key: fileKey,
        original_name: name || 'Generated Asset',
        file_type: fileType,
        size_bytes: finalSize, 
        purpose: purpose,
        caption: name
      })
      .select()
      .single();

    if (assetError) throw assetError;

    // 4. Update Project Storage Meter
    if (finalSize > 0) {
      const { data: project } = await supabaseAdmin
        .from('premium_projects')
        .select('storage_used')
        .eq('id', projectId)
        .single();

      if (project) {
        await supabaseAdmin
          .from('premium_projects')
          .update({
            storage_used: (project.storage_used || 0) + finalSize
          })
          .eq('id', projectId);
      }
    }

    return NextResponse.json({ success: true, asset });

  } catch (error) {
    console.error('Save Visual Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save asset' }, { status: 500 });
  }
}
