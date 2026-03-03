// src/app/api/premium/scrape/route.js
import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { url, projectId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetch the website content
    console.log(`[Scraper] Fetching: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch website: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 2. Extract technical text
    // Remove scripts, styles, and non-content elements
    $('script, style, nav, footer, header, noscript, iframe').remove();
    
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    // Limit text to 10,000 chars for AI processing
    const textToAnalyze = `Title: ${title}\nDescription: ${metaDescription}\n\nContent: ${bodyText.substring(0, 10000)}`;

    // 3. Summarize with Premium AI
    const provider = process.env.PREMIUM_AI_PROVIDER || 'deepseek';
    const model = process.env.PREMIUM_AI_MODEL || 'deepseek-chat';

    const systemPrompt = `You are a technical research assistant. 
    Analyze the following scraped website content and extract valuable technical information, 
    methodologies, results, or data that can be used for an engineering research project.
    
    If it is a research paper or journal, extract the Authors, Year, Title, and Key Findings.
    Provide a professional technical summary (max 400 words) that can be directly used as research context.
    
    Output ONLY the summary.`;

    const aiRes = await callAI(textToAnalyze, {
      provider,
      model,
      system: systemPrompt,
      maxTokens: 1000,
      temperature: 0.3
    });

    // 4. Token Deduction for Scraping/Summarization
    const tokensUsed = aiRes.tokensUsed?.total || 0;
    if (tokensUsed > 0 && projectId) {
      const { data: project } = await supabaseAdmin
        .from('premium_projects')
        .select('tokens_used')
        .eq('id', projectId)
        .single();

      if (project) {
        await supabaseAdmin
          .from('premium_projects')
          .update({
            tokens_used: (project.tokens_used || 0) + tokensUsed,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      summary: aiRes.content,
      title: title,
      tokensUsed
    });

  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process URL' }, { status: 500 });
  }
}
