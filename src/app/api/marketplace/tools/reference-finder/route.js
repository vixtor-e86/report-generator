import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

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

function formatApaAuthorName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map(p => (p[0] ? `${p[0].toUpperCase()}.` : ''))
    .filter(Boolean)
    .join(' ');
  return `${lastName}, ${initials}`;
}

function buildApaCitation({ authors, year, title, venue, url }) {
  const rawAuthors = Array.isArray(authors)
    ? authors.map(a => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
    : typeof authors === 'string' && authors.trim()
      ? authors.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  let authorStr = 'Unknown Author';
  if (rawAuthors.length === 1) {
    authorStr = formatApaAuthorName(rawAuthors[0]);
  } else if (rawAuthors.length === 2) {
    authorStr = `${formatApaAuthorName(rawAuthors[0])}, & ${formatApaAuthorName(rawAuthors[1])}`;
  } else if (rawAuthors.length > 2) {
    const firstFew = rawAuthors.slice(0, 6).map(formatApaAuthorName);
    authorStr =
      rawAuthors.length <= 6
        ? `${firstFew.slice(0, -1).join(', ')}, & ${firstFew[firstFew.length - 1]}`
        : `${firstFew.join(', ')}, ... ${formatApaAuthorName(rawAuthors[rawAuthors.length - 1])}`;
  }

  const yearStr = year ? `(${year}).` : '(n.d.).';
  const titleStr = title ? `${title.replace(/\.$/, '')}.` : 'Untitled work.';
  const venueStr = venue ? ` ${venue}.` : '';
  const urlStr = url ? ` ${url}` : '';

  return `${authorStr} ${yearStr} ${titleStr}${venueStr}${urlStr}`.replace(/\s+/g, ' ').trim();
}

async function fetchScholarlyPapers(query, yearRange, limit = 16) {
  const yearBounds = parseYearBounds(yearRange);
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  let papers = [];

  // 1. Try Semantic Scholar if API key is configured
  if (apiKey) {
    try {
      const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
      url.searchParams.set('query', query);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('fields', 'title,authors,year,venue,abstract,url,citationCount,openAccessPdf');
      if (yearRange) url.searchParams.set('year', yearRange);

      const response = await fetch(url.toString(), {
        headers: { 'x-api-key': apiKey }
      });

      if (response.ok) {
        const data = await response.json();
        papers = (data.data || []).map(paper => {
          const authorList = paper.authors?.map(a => a.name).filter(Boolean) || [];
          return {
            paperId: paper.paperId,
            title: paper.title,
            authors: authorList,
            year: paper.year,
            venue: paper.venue || 'Academic Journal',
            abstract: paper.abstract,
            url: paper.url,
            pdfUrl: paper.openAccessPdf?.url || null,
            citationCount: paper.citationCount || 0,
            citation: buildApaCitation({
              authors: authorList,
              year: paper.year,
              title: paper.title,
              venue: paper.venue,
              url: paper.url
            })
          };
        });
      }
    } catch (e) {
      console.warn('Semantic Scholar key search failed:', e.message);
    }
  }

  // 2. Primary free search: OpenAlex
  if (!papers || papers.length === 0) {
    try {
      const fetchOpenAlex = async (bounds) => {
        const url = new URL('https://api.openalex.org/works');
        url.searchParams.set('search', query);
        url.searchParams.set('per-page', String(Math.min(limit, 50)));
        if (bounds) {
          url.searchParams.set('filter', `publication_year:${bounds.start}-${bounds.end}`);
        }
        const res = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'W3WriteLab/1.0 (mailto:W3writelab@gmail.com)'
          }
        });
        if (!res.ok) throw new Error(`OpenAlex status ${res.status}`);
        const data = await res.json();
        return (data.results || [])
          .filter(item => item && item.title)
          .map(item => {
            const authorList = (item.authorships || [])
              .map(a => a.author?.display_name)
              .filter(Boolean);
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
              authors: authorList,
              year: item.publication_year || null,
              venue,
              abstract: reconstructAbstract(item.abstract_inverted_index) || null,
              url: paperUrl,
              pdfUrl,
              citationCount: item.cited_by_count || 0,
              citation: buildApaCitation({
                authors: authorList,
                year: item.publication_year,
                title: item.title,
                venue,
                url: item.doi || paperUrl
              })
            };
          });
      };

      papers = await fetchOpenAlex(yearBounds);
      if (papers.length === 0 && yearBounds) {
        papers = await fetchOpenAlex(null);
      }
    } catch (oaErr) {
      console.warn('OpenAlex search failed, falling back to CrossRef:', oaErr.message);
    }
  }

  // 3. Fallback: CrossRef
  if (!papers || papers.length === 0) {
    try {
      const url = new URL('https://api.crossref.org/works');
      url.searchParams.set('query', query);
      url.searchParams.set('rows', String(Math.min(limit, 30)));
      if (yearBounds) {
        url.searchParams.set('filter', `from-pub-date:${yearBounds.start},until-pub-date:${yearBounds.end}`);
      }
      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'W3WriteLab/1.0 (mailto:W3writelab@gmail.com)'
        }
      });
      if (res.ok) {
        const data = await res.json();
        papers = (data.message?.items || [])
          .filter(item => item && Array.isArray(item.title) && item.title[0])
          .map(item => {
            const authorList = (item.author || [])
              .map(a => [a.given, a.family].filter(Boolean).join(' '))
              .filter(Boolean);
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
              authors: authorList,
              year,
              venue,
              abstract: cleanXmlAbstract(item.abstract) || null,
              url: doiUrl,
              pdfUrl: item.link?.find(l => l['content-type'] === 'application/pdf')?.URL || null,
              citationCount: item['is-referenced-by-count'] || 0,
              citation: buildApaCitation({
                authors: authorList,
                year,
                title: item.title[0],
                venue,
                url: doiUrl
              })
            };
          });
      }
    } catch (crErr) {
      console.warn('CrossRef search failed:', crErr.message);
    }
  }

  return papers || [];
}

export async function POST(request) {
  try {
    const { query, mode, yearRange, style = 'APA 7th' } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const activeProvider = process.env.AI_PROVIDER || 'deepseek';

    if (mode === 'verify') {
      const systemPrompt = `You are an expert academic citation verifier and scholarly bibliographer.
      The user has provided a list of references/citations to audit and verify for academic authenticity.
      
      Target Citation Style: ${style}
      Input Text:
      ${query}
      
      Your task:
      1. Split the input text into distinct individual references.
      2. For EACH reference:
         - Determine if it represents a REAL, authentic published academic paper/book/conference OR if it appears hallucinated/fake/unverifiable.
         - Extract Title, Authors, Year, Journal/Venue, and DOI (if available).
         - Reformat the citation perfectly into the requested style: ${style}.
         - Provide a brief verification assessment explaining whether metadata matches known literature or if formatting errors/hallucinations were detected.
      
      Return a valid JSON object with this EXACT structure:
      {
        "auditedReferences": [
          {
            "id": 1,
            "originalText": "Raw text pasted",
            "status": "verified | unverified | corrected",
            "confidenceScore": 95,
            "title": "Paper Title",
            "authors": ["Author 1", "Author 2"],
            "year": "2023",
            "journal": "Journal Name",
            "doi": "10.xxxx/xxxx",
            "standardizedCitation": "Perfectly formatted citation string in ${style}",
            "notes": "Clear verification notes on authenticity, DOI validity, and formatting changes."
          }
        ]
      }
      
      Rules:
      - Return ONLY the JSON object. No extra text or markdown.`;

      const aiResponse = await callAI(systemPrompt, {
        provider: activeProvider,
        maxTokens: 3500,
        temperature: 0.2
      });

      let verifyData;
      try {
        const jsonString = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
        verifyData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Verify Parse Error:', aiResponse.content);
        throw new Error('AI failed to audit references. Please check the text format and try again.');
      }

      return NextResponse.json({ 
        success: true, 
        data: verifyData.auditedReferences || []
      });

    } else if (mode === 'deep') {
      // Paid AI-powered DeepSearch (₦200)
      const systemPrompt = `You are an advanced academic research assistant. 
      The user is performing a "DeepSearch" for high-quality, relevant academic references and journals.
      
      Query: ${query}
      Preferred Year Range: ${yearRange || 'Recent'}
      
      Your task is to provide a list of 10-15 highly relevant academic papers, journals, or technical reports.
      For EACH reference, provide:
      1. Title of the work
      2. Authors (Full list)
      3. Year of publication
      4. Venue/Journal name
      5. A brief summary of why this is relevant to the query
      6. A scholarly URL or DOI reference
      7. Formatted APA 7th citation
      
      Structure the response as a valid JSON object with this structure:
      {
        "results": [
          {
            "title": "...",
            "authors": ["...", "..."],
            "year": "...",
            "venue": "...",
            "abstract": "...",
            "url": "...",
            "citation": "..."
          }
        ]
      }
      
      Rules:
      - Be academically rigorous.
      - If specific real papers are known to you, prioritize them.
      - Return ONLY the JSON object. No markdown.`;

      const aiResponse = await callAI(systemPrompt, {
        provider: activeProvider,
        maxTokens: 3500,
        temperature: 0.3
      });

      let deepData;
      try {
        const jsonString = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
        deepData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('DeepSearch Parse Error:', aiResponse.content);
        throw new Error('AI failed to structure research data. Please try again.');
      }

      const formattedDeep = (deepData.results || []).map(paper => ({
        ...paper,
        authors: Array.isArray(paper.authors) ? paper.authors : [paper.authors].filter(Boolean),
        citation: paper.citation || buildApaCitation(paper)
      }));

      return NextResponse.json({ 
        success: true, 
        data: formattedDeep 
      });

    } else {
      // Free Scholarly Search (OpenAlex + CrossRef + Semantic Scholar)
      const formattedResults = await fetchScholarlyPapers(query.trim(), yearRange, 16);
      return NextResponse.json({ success: true, data: formattedResults });
    }

  } catch (error) {
    console.error('Reference Finder Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
