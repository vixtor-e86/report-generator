import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const faculty = searchParams.get('faculty');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('topic_repository')
      .select('*')
      .order('created_at', { ascending: false });

    if (faculty) query = query.eq('faculty', faculty);
    if (department) query = query.eq('department', department);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin Topics GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Check if it's bulk upload (array) or single item
    const isBulk = Array.isArray(body);
    
    if (isBulk) {
      // Bulk Insert
      const { data, error } = await supabaseAdmin
        .from('topic_repository')
        .insert(body.map(item => ({
          title: item.title,
          description: item.description || '',
          faculty: item.faculty || 'General',
          department: item.department || 'General',
          tags: item.tags || []
        })));
        
      if (error) throw error;
      return NextResponse.json({ success: true, count: body.length });
    } else {
      // Single Insert
      const { data, error } = await supabaseAdmin
        .from('topic_repository')
        .insert({
          title: body.title,
          description: body.description || '',
          faculty: body.faculty || 'General',
          department: body.department || 'General',
          tags: body.tags || []
        })
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Admin Topics POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('topic_repository')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Topics DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
