import { NextResponse } from 'next/server';
import { getAuthUserByEmail } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim()?.toLowerCase() || searchParams.get('q')?.trim()?.toLowerCase() || '';

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 });
    }

    const user = await getAuthUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: `No registered account found with email "${email}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error looking up user by email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
