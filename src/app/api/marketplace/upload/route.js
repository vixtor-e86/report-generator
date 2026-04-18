// src/app/api/marketplace/upload/route.js
import { NextResponse } from 'next/server';
import { getUploadUrl, getPublicUrl } from '@/lib/r2';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { fileName, contentType, userId, folder = 'passports' } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fileExtension = fileName.split('.').pop();
    const key = `${folder}/${userId}_${Date.now()}.${fileExtension}`;

    const { url } = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl: url, publicUrl, key });

  } catch (error) {
    console.error('Upload init error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
