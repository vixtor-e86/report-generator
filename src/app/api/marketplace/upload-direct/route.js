import { NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const folder = formData.get('folder') || 'admin_projects';

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    const fileName = file.name || 'document.docx';
    const fileExtension = fileName.split('.').pop();
    const key = `${folder}/${userId}_${Date.now()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { publicUrl } = await uploadFileToR2(key, buffer, file.type || 'application/octet-stream');

    return NextResponse.json({
      success: true,
      publicUrl,
      key
    });

  } catch (error) {
    console.error('Direct upload server error:', error);
    return NextResponse.json({ error: error.message || 'Direct upload failed' }, { status: 500 });
  }
}
