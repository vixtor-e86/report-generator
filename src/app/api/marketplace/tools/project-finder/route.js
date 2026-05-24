import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { query, department, level, researchType, industry, existingTopics = [] } = await request.json();

    if (!query) {
      // If no query, maybe they just opened the tool? Return recent topics from DB
      const { data: recentTopics } = await supabaseAdmin
        .from('topic_repository')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      return NextResponse.json({ 
        success: true, 
        data: (recentTopics || []).map(t => ({
          title: t.title,
          category: t.department || t.faculty || 'General',
          problem_gap: t.description || 'Verified research topic from our repository.',
          feasibility: 9,
          tools: t.tags || [],
          emoji: '📘',
          is_from_db: true
        }))
      });
    }

    // 1. Search Database First
    let dbTopics = [];
    try {
      // Search by title or department or tags
      const { data } = await supabaseAdmin
        .from('topic_repository')
        .select('*')
        .or(`title.ilike.%${query}%,department.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(30);
      
      if (data && data.length > 0) {
        dbTopics = data.map(t => ({
          title: t.title,
          category: t.department || t.faculty || 'General',
          problem_gap: t.description || 'Verified research topic from our repository.',
          feasibility: 9,
          tools: t.tags || [],
          emoji: '📘',
          is_from_db: true
        }));
      }
    } catch (dbErr) {
      console.error('DB Search Error:', dbErr);
    }

    // 2. If we need more (or for loadMore), call AI
    let aiTopics = [];
    if (dbTopics.length < 5 || existingTopics.length > 0) {
        const systemPrompt = `You are an expert academic advisor and research consultant. 
        Your task is to help a student find unique, trending, and highly relevant academic project topics.
        
        The student is interested in: "${query}"
        ${department ? `Department: ${department}` : ''}
        ${level ? `Academic Level: ${level}` : ''}
        ${researchType && researchType !== 'any' ? `Research Methodology: ${researchType}` : ''}
        ${industry ? `Industry/Sector Focus: ${industry}` : ''}
        
        ${[...dbTopics.map(t => t.title), ...existingTopics].length > 0 ? `IMPORTANT: The student has already seen these topics:
        ${[...dbTopics.map(t => t.title), ...existingTopics].join('\n')}
        Please generate NEW and COMPLETELY DIFFERENT topics that provide fresh perspectives and avoid repeating the ones listed above.` : ''}

        Instructions:
        1. Search your knowledge base for the latest trends and "low-hanging fruit" research gaps in this field.
        2. Provide 10 distinct, well-defined project topics.
        3. If a specific Research Methodology is requested (Quantitative, Qualitative, or Mixed), ensure the titles and problem statements reflect that approach.
        4. For EACH topic, include:
           - A catchy and professional Title.
           - A brief "Problem Statement" or "Gap" it addresses.
           - A "Feasibility" score (1-10).
           - Recommended "Key Tools/Technologies" to use.
        5. Use emojis and icons creatively.
        
        Structure the response as a valid JSON object with this structure:
        {
          "results": [
            {
              "title": "...",
              "category": "...",
              "problem_gap": "...",
              "feasibility": 8,
              "tools": ["...", "..."],
              "emoji": "..."
            }
          ]
        }
        
        Rules:
        - Return ONLY the JSON object. No markdown preamble or postamble.`;

        const aiResponse = await callAI(systemPrompt, {
          provider: 'claude',
          maxTokens: 4000,
          temperature: 0.8
        });

        try {
          const content = aiResponse.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiTopics = parsed.results.map(t => ({ ...t, is_from_db: false }));
          }
        } catch (parseError) {
          console.error('Project Finder Parse Error:', aiResponse.content);
        }
    }

    // Combine results (DB first, then AI)
    // Avoid exact title duplicates
    const allTitles = new Set();
    const finalResults = [];

    [...dbTopics, ...aiTopics].forEach(item => {
        const normalizedTitle = item.title.toLowerCase().trim();
        if (!allTitles.has(normalizedTitle)) {
            allTitles.add(normalizedTitle);
            finalResults.push(item);
        }
    });

    return NextResponse.json({ 
      success: true, 
      data: finalResults.slice(0, 50) 
    });

  } catch (error) {
    console.error('Project Finder Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
