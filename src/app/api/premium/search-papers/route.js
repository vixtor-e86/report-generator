import { NextResponse } from 'next/server';

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        words[pos] = word;
      }
    }
  }
  return words.filter(Boolean).join(' ').trim();
}

function cleanXmlAbstract(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseYearBounds(yearRange) {
  if (!yearRange) return null;
  const match = String(yearRange).match(/(\d{4})\s*-\s*(\d{4})/);
  if (!match) return null;
  let start = parseInt(match[1], 10);
  let end = parseInt(match[2], 10);
  if (isNaN(start) || isNaN(end)) return null;
  if (start > end) [start, end] = [end, start];
  return { start, end };
}

async function searchOpenAlex(query, yearBounds, limit = 50) {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  url.searchParams.set('per-page', String(Math.min(limit, 50)));
  if (yearBounds) {
    url.searchParams.set('filter', `publication_year:${yearBounds.start}-${yearBounds.end}`);
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'W3WriteLab/1.0 (mailto:W3writelab@gmail.com)'
    }
  });

  if (!res.ok) {
    throw new Error(`OpenAlex error (${res.status})`);
  }

  const data = await res.json();
  const items = data.results || [];

  return items
    .filter(item => item && item.title)
    .map(item => {
      const authors = (item.authorships || [])
        .map(a => a.author?.display_name)
        .filter(Boolean)
        .map(name => ({ name }));

      const abstract = reconstructAbstract(item.abstract_inverted_index);
      const venue =
        item.primary_location?.source?.display_name ||
        item.host_venue?.display_name ||
        'Academic Publication';
      const paperUrl =
        item.doi ||
        item.primary_location?.landing_page_url ||
        item.open_access?.oa_url ||
        item.id;
      const pdfUrl =
        item.open_access?.oa_url ||
        item.primary_location?.pdf_url ||
        null;

      return {
        paperId: item.id || item.doi || `${item.title}-${item.publication_year}`,
        title: item.title,
        authors,
        year: item.publication_year || null,
        venue,
        abstract: abstract || null,
        url: paperUrl,
        pdfUrl,
        citationCount: item.cited_by_count || 0
      };
    });
}

async function searchCrossRef(query, yearBounds, limit = 30) {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query', query);
  url.searchParams.set('rows', String(Math.min(limit, 50)));
  if (yearBounds) {
    url.searchParams.set('filter', `from-pub-date:${yearBounds.start},until-pub-date:${yearBounds.end}`);
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'W3WriteLab/1.0 (mailto:W3writelab@gmail.com)'
    }
  });

  if (!res.ok) {
    throw new Error(`CrossRef error (${res.status})`);
  }

  const data = await res.json();
  const items = data.message?.items || [];

  return items
    .filter(item => item && Array.isArray(item.title) && item.title[0])
    .map(item => {
      const authors = (item.author || [])
        .map(a => [a.given, a.family].filter(Boolean).join(' '))
        .filter(Boolean)
        .map(name => ({ name }));

      const year =
        item.published?.['date-parts']?.[0]?.[0] ||
        item['published-print']?.['date-parts']?.[0]?.[0] ||
        item['published-online']?.['date-parts']?.[0]?.[0] ||
        item.created?.['date-parts']?.[0]?.[0] ||
        null;

      const venue =
        (Array.isArray(item['container-title']) && item['container-title'][0]) ||
        item.publisher ||
        'Academic Journal';

      const doiUrl = item.DOI ? `https://doi.org/${item.DOI}` : item.URL || null;

      return {
        paperId: item.DOI || item.URL || `${item.title[0]}-${year}`,
        title: item.title[0],
        authors,
        year,
        venue,
        abstract: cleanXmlAbstract(item.abstract) || null,
        url: doiUrl,
        pdfUrl: item.link?.find(l => l['content-type'] === 'application/pdf')?.URL || null,
        citationCount: item['is-referenced-by-count'] || 0
      };
    });
}

async function searchSemanticScholar(query, yearRange, apiKey, limit = 50) {
  const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
  url.searchParams.set('query', query);
  if (yearRange) url.searchParams.set('year', yearRange);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', 'title,authors,year,abstract,url,venue,citationCount,openAccessPdf');

  const response = await fetch(url.toString(), {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Semantic Scholar failed (${response.status})`);
  }

  return (data.data || []).map(paper => ({
    paperId: paper.paperId,
    title: paper.title,
    authors: paper.authors || [],
    year: paper.year,
    venue: paper.venue,
    abstract: paper.abstract,
    url: paper.url,
    pdfUrl: paper.openAccessPdf?.url || null,
    citationCount: paper.citationCount || 0
  }));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim();
  const yearRange = searchParams.get('year'); // e.g., "2020-2026"

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const yearBounds = parseYearBounds(yearRange);
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

  try {
    let papers = [];

    // 1. If a dedicated Semantic Scholar API key is configured, try it first
    if (apiKey) {
      try {
        papers = await searchSemanticScholar(query, yearRange, apiKey, 50);
      } catch (ssErr) {
        console.warn('Semantic Scholar with key failed, falling back to OpenAlex:', ssErr.message);
      }
    }

    // 2. Primary reliable search: OpenAlex (250M+ works, no key required, generous rate limits)
    if (!papers || papers.length === 0) {
      try {
        papers = await searchOpenAlex(query, yearBounds, 50);
        // If strict year bounds returned nothing, retry without year filter
        if (papers.length === 0 && yearBounds) {
          papers = await searchOpenAlex(query, null, 50);
        }
      } catch (oaErr) {
        console.warn('OpenAlex search failed, falling back to CrossRef:', oaErr.message);
      }
    }

    // 3. Secondary fallback: CrossRef
    if (!papers || papers.length === 0) {
      try {
        papers = await searchCrossRef(query, yearBounds, 30);
        if (papers.length === 0 && yearBounds) {
          papers = await searchCrossRef(query, null, 30);
        }
      } catch (crErr) {
        console.warn('CrossRef search failed:', crErr.message);
      }
    }

    // 4. Final fallback: Unauthenticated Semantic Scholar
    if (!papers || papers.length === 0) {
      try {
        papers = await searchSemanticScholar(query, yearRange, null, 30);
      } catch (ssFallbackErr) {
        console.warn('Semantic Scholar fallback failed:', ssFallbackErr.message);
      }
    }

    return NextResponse.json({ data: papers || [] });
  } catch (error) {
    console.error('Paper Search Error:', error);
    return NextResponse.json({ error: 'Failed to fetch research papers', data: [] }, { status: 500 });
  }
}
