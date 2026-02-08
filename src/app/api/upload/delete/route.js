import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { fileKey, assetId } = await request.json();

    if (!fileKey || !assetId) {
      return NextResponse.json({ error: 'File key and Asset ID are required' }, { status: 400 });
    }

    // 1. Delete from R2
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
      });
      await r2Client.send(command);
    } catch (r2Error) {
      console.error('R2 Deletion Error:', r2Error);
      // We continue even if R2 fails, to ensure DB consistency (orphan file is better than broken link)
      // Or we could stop. Usually better to try to clean up DB.
    }

    // 2. Delete from Supabase
    const { error: dbError } = await supabaseAdmin
      .from('premium_assets')
      .delete()
      .eq('id', assetId);

    if (dbError) {
      console.error('Database Deletion Error:', dbError);
      return NextResponse.json({ error: 'Failed to delete record from database' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
