import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { query, mode, yearRange } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (mode === 'verify') {
      const { style = 'APA 7th' } = await request.json().catch(() => ({}));
      
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
        provider: 'claude',
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
      // 1. Paid Claude-powered DeepSearch (₦200)
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
      6. A simulated scholarly URL or DOI reference
      
      Structure the response as a valid JSON object with this structure:
      {
        "results": [
          {
            "title": "...",
            "authors": ["...", "..."],
            "year": "...",
            "venue": "...",
            "abstract": "...",
            "url": "..."
          }
        ]
      }
      
      Rules:
      - Be academically rigorous.
      - If specific real papers are known to you, prioritize them.
      - Return ONLY the JSON object. No markdown.`;

      const aiResponse = await callAI(systemPrompt, {
        provider: 'claude',
        maxTokens: 3000,
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

      return NextResponse.json({ 
        success: true, 
        data: deepData.results 
      });

    } else {
      // 2. Free Semantic Scholar Search
      const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
      const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
      
      url.searchParams.append('query', query);
      url.searchParams.append('limit', '10');
      url.searchParams.append('fields', 'title,authors,year,venue,abstract,url');
      if (yearRange) url.searchParams.append('year', yearRange);

      const response = await fetch(url.toString(), {
        headers: apiKey ? { 'x-api-key': apiKey } : {}
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Semantic Scholar API Error');
      }

      const data = await response.json();
      
      // Format to match our UI expectations
      const formattedResults = (data.data || []).map(paper => ({
        paperId: paper.paperId,
        title: paper.title,
        authors: paper.authors?.map(a => a.name) || [],
        year: paper.year,
        venue: paper.venue,
        abstract: paper.abstract,
        url: paper.url
      }));

      return NextResponse.json({ success: true, data: formattedResults });
    }

  } catch (error) {
    console.error('Reference Finder Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
