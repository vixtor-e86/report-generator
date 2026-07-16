// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // --- AUTHENTICATION ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 1. Env Validation
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.RYNE_API_KEY; 
    if (isNaN(limit) || !apiKey) throw new Error('Server configuration error (Limit/API Key).');

    if (!content || !projectId) return NextResponse.json({ error: 'Missing content or projectId' }, { status: 400 });

    // --- 2. SEQUENTIAL STRUCTURAL PARSING ---
    const lines = content.split('\n');
    const blocks = [];
    let currentBody = [];
    let isReferenceSection = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Header Detection
      if (trimmedLine.startsWith('#')) {
        if (currentBody.length > 0) {
          blocks.push({ 
            type: isReferenceSection ? 'reference' : 'body', 
            content: currentBody.join('\n') 
          });
          currentBody = [];
        }
        
        const headerText = trimmedLine.replace(/^#+\s*/, '').trim().toLowerCase();
        const headerLevel = (trimmedLine.match(/^#+/) || ['#'])[0].length;
        
        const refIndicators = [
          'references', 'bibliography', 'works cited', 'reference list', 
          'list of references', 'selected bibliography', 'sources',
          'academic references', 'technical references', 'reference'
        ];
        
        if (refIndicators.some(indicator => headerText.includes(indicator))) {
          isReferenceSection = true;
        } else if (headerLevel <= 2) {
          isReferenceSection = false;
        }
        
        blocks.push({ type: 'header', content: line });
      } 
      // List Item Detection (Skip humanizing bullets themselves)
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine)) {
        if (currentBody.length > 0) {
          blocks.push({ 
            type: isReferenceSection ? 'reference' : 'body', 
            content: currentBody.join('\n') 
          });
          currentBody = [];
        }
        blocks.push({ type: 'list_item', content: line });
      }
      else {
        currentBody.push(line);
      }
    });
    
    if (currentBody.length > 0) {
      blocks.push({ 
        type: isReferenceSection ? 'reference' : 'body', 
        content: currentBody.join('\n') 
      });
    }

    // Calculate word count
    let wordCount = 0;
    blocks.forEach(block => {
      if (block.type === 'body' || block.type === 'list_item') {
        const count = block.content.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCount += count;
      }
    });
    
    // Fetch Usage & verify ownership
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used, user_id')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) throw new Error('Project not found');
    
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ error: `Limit reached. ${limit - currentUsed} words remaining.` }, { status: 403 });
    }

    // --- 3. CONCURRENCY LIMITER & HUMANIZATION WITH STEALTHGPT ---
    class ConcurrencyLimiter {
      constructor(limit) {
        this.limit = limit;
        this.active = 0;
        this.queue = [];
      }

      async run(fn) {
        if (this.active >= this.limit) {
          await new Promise(resolve => this.queue.push(resolve));
        }
        this.active++;
        try {
          return await fn();
        } finally {
          this.active--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
          }
        }
      }
    }

    const limiter = new ConcurrencyLimiter(3);

    const humanizeBlock = async (text) => {
      if (text.trim().length < 5) return text;

      const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          tone: "academic",
          purpose: "research paper",
          language: "english",
          user_id: apiKey,
          shouldStream: false,
          keepMarkdown: true,
          beast_mode: true,
          mode: "normal",
          enableRestructure: true,
          settings: {
            preserveFormatting: true,
            preserveQuotes: true
          }
        }),
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: `Engine returned non-JSON response: ${response.statusText}` };
      }

      if (!response.ok) {
        console.error("Ryne AI Error:", data);
        let errorMsg = data.message || data.error || data.code || `Humanizer failure: ${response.statusText || 'Engine returned status ' + response.status}`;
        if (errorMsg === 'INSUFFICIENT_COINS') {
          errorMsg = 'Insufficient humanizer API credits. Please contact admin.';
        } else if (errorMsg === 'INVALID_KEY') {
          errorMsg = 'Invalid humanizer API key configured.';
        }
        throw new Error(errorMsg);
      }

      let result = data.content;
      if (!result) {
        console.error("Ryne AI response missing content:", data);
        throw new Error("Humanization engine returned empty result.");
      }

      // Clean up any double quotes the AI might wrap the response in
      if (result.startsWith('"') && result.endsWith('"')) {
          result = result.substring(1, result.length - 1);
      }
      return result.replace(/\$/g, '₦');
    };

    const humanizeBlockLimited = (text) => limiter.run(() => humanizeBlock(text));

    const processedBlocks = await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'body') {
          // Split by paragraphs (double newlines / empty lines) to reduce API calls and preserve flow
          const paragraphs = block.content.split(/\n\s*\n/);
          const humanizedParagraphs = await Promise.all(
            paragraphs.map(async (p) => {
                if (!p.trim()) return ""; // Keep empty lines
                return await humanizeBlockLimited(p);
            })
          );
          return humanizedParagraphs.join('\n\n');
        }
        
        if (block.type === 'list_item') {
          const bulletMatch = block.content.match(/^(\s*[\-\*\d\.]+\s+)(.*)/);
          if (bulletMatch) {
            const bullet = bulletMatch[1];
            const textPart = bulletMatch[2];
            const humanizedText = await humanizeBlockLimited(textPart);
            return bullet + humanizedText;
          }
        }
        
        return block.content;
      })
    );


    // --- 4. REASSEMBLE ---
    // Use double newline for headers to ensure they are well spaced
    let finalOutput = "";
    processedBlocks.forEach((block, i) => {
        const isHeader = blocks[i].type === 'header';
        if (isHeader && i > 0) finalOutput += "\n\n";
        finalOutput += block;
        if (isHeader) finalOutput += "\n\n";
        else finalOutput += "\n";
    });

    finalOutput = finalOutput.replace(/\n{3,}/g, '\n\n').trim();

    // --- 5. PERSIST ---
    const newUsed = currentUsed + wordCount;
    await supabaseAdmin
      .from('premium_projects')
      .update({ humanizer_words_used: newUsed })
      .eq('id', projectId);

    return NextResponse.json({ 
      success: true, 
      humanized: finalOutput, 
      newUsed, 
      limit 
    });

  } catch (error) {
    console.error('System API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
