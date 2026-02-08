import { NextResponse } from 'next/server';
import { getUploadUrl, getPublicUrl } from '@/lib/r2';

export async function POST(request) {
  try {
    const { filename, contentType, folder } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder || 'uploads'}/${timestamp}-${sanitizedFilename}`;

    const { url, key: generatedKey } = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(generatedKey);

    return NextResponse.json({ 
      url, 
      key: generatedKey,
      publicUrl: publicUrl
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
