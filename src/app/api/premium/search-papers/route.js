import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const yearRange = searchParams.get('year'); // e.g., "2020-2024"
  
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  try {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    
    url.searchParams.set('query', query);
    if (yearRange) url.searchParams.set('year', yearRange);
    url.searchParams.set('limit', '10');
    url.searchParams.set('fields', 'title,authors,year,abstract,url,venue');

    const response = await fetch(url.toString(), {
      headers: apiKey ? { 'x-api-key': apiKey } : {}
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Search failed');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Semantic Scholar Error:', error);
    return NextResponse.json({ error: 'Failed to fetch research papers' }, { status: 500 });
  }
}
