import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Get search query from URL (optional, for server-side filtering)
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let dbQuery = supabase
      .from('universities')
      .select('id, name, type')
      .order('name');

    // If there's a search term, filter by it
    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}