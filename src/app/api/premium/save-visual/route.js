// src/app/api/premium/save-visual/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { imageUrl, projectId, userId, name, type } = await request.json();

    if (!imageUrl || !projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create asset record in premium_assets
    // In a real scenario, we would download the image and upload to our own S3/Cloudinary first.
    // For this implementation, we'll store the URL directly if it's external, 
    // or we'd need a buffer upload for base64.
    
    // For now, let's treat it as a remote asset.
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('premium_assets')
      .insert({
        project_id: projectId,
        user_id: userId,
        file_url: imageUrl, // This could be the mermaid.ink URL or the Flux base64 (though base64 in DB is bad)
        file_key: `visuals/${projectId}/${Date.now()}.png`,
        original_name: name || 'Generated Visual',
        file_type: 'image/png',
        size_bytes: 0, // Unknown
        purpose: 'project_image'
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
