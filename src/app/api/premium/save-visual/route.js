// src/app/api/premium/save-visual/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { r2Client, getPublicUrl } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request) {
  try {
    const { imageUrl, projectId, userId, name, type } = await request.json();

    if (!imageUrl || !projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalImageUrl = imageUrl;
    let fileKey = `visuals/${projectId}/${Date.now()}.png`;

    // 1. If it's a Base64 image (from Flux), upload it to R2
    if (imageUrl.startsWith('data:image/')) {
      try {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        await r2Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: 'image/png',
        }));

        // Get the public URL if configured, otherwise use the key
        const publicUrl = getPublicUrl(fileKey);
        finalImageUrl = publicUrl || fileKey;
      } catch (uploadError) {
        console.error('R2 Upload Error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload generated image to storage' }, { status: 500 });
      }
    }

    // 2. Create asset record in premium_assets
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('premium_assets')
      .insert({
        project_id: projectId,
        user_id: userId,
        file_url: finalImageUrl, 
        file_key: fileKey,
        original_name: name || 'Generated Visual',
        file_type: 'image/png',
        size_bytes: 0, 
        purpose: 'project_image',
        caption: name
      })
      .select()
      .single();

    if (assetError) throw assetError;

    return NextResponse.json({ success: true, asset });

  } catch (error) {
    console.error('Save Visual Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save visual' }, { status: 500 });
  }
}
