import { NextResponse } from 'next/server';
import { getUploadUrl } from '@/lib/r2';
import { supabase } from '@/lib/supabaseAdmin'; // Use admin client to verify auth if needed, or standard

export async function POST(request) {
  try {
    // 1. Verify Authentication
    // Note: You should check for a valid session here using your Supabase client
    // const { data: { user }, error } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, contentType, folder } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
    }

    // 2. Generate a unique key (path) for the file
    // Structure: folder/timestamp-sanitized_filename
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder || 'uploads'}/${timestamp}-${sanitizedFilename}`;

    // 3. Get the pre-signed URL
    const { url, key: generatedKey } = await getUploadUrl(key, contentType);

    return NextResponse.json({ 
      url, 
      key: generatedKey,
      publicUrl: process.env.R2_PUBLIC_DOMAIN ? `${process.env.R2_PUBLIC_DOMAIN}/${generatedKey}` : null
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
