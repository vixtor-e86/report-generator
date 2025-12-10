import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import universities from '@/data/nigerian-universities.json'; // Make sure this path is correct

export async function GET() {
  // Initialize Supabase Client with Service Role (needed for admin inserts)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if we already have data to avoid duplicates
    const { count, error: countError } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count > 0) {
      return NextResponse.json({ 
        message: 'Universities table already has data. Skipping seed.', 
        count 
      }, { status: 200 });
    }

    // 2. Insert the data
    // Supabase will automatically map the JSON keys (name, type, etc) to columns
    // and ignore missing columns like 'location' (leaving them null)
    const { data, error } = await supabase
      .from('universities')
      .insert(universities)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data.length} universities!`,
    }, { status: 200 });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}