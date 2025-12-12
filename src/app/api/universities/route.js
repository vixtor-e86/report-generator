// src/app/api/universities/route.js

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Fetch ALL institutions from the database (universities + polytechnics)
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}