import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { content } = payload;
    const apiKey = process.env.WRITEHUMAN_API_KEY || process.env.HUMANIZER_API_KEY || process.env.STEALTHGPT_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Humanization engine configuration missing on server (WRITEHUMAN_API_KEY)' }, { status: 500 });
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // --- AUTHENTICATION & CREDIT CHECK ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Word count check (Strict max 2000 words restriction for WriteHuman Standard Plan)
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    if (wordCount > 2000) {
      return NextResponse.json({ 
        error: `Maximum 2,000 words per request allowed. This selection contains ${wordCount} words. Please humanize section by section.` 
      }, { status: 400 });
    }

    // Check balance
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('tool_word_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('tool_id', 'ai-humanizer')
      .maybeSingle();

    const currentBalance = balanceData?.balance || 0;
    if (currentBalance < wordCount) {
      return NextResponse.json({ 
        error: `Insufficient credits. This request requires ${wordCount} words, but you only have ${currentBalance} credits.` 
      }, { status: 403 });
    }

    // --- 1. SEQUENTIAL STRUCTURAL PARSING ---
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

    // --- 2. CONCURRENCY LIMITER & HUMANIZATION WITH WRITEHUMAN ENGINE ---
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

    const limiter = new ConcurrencyLimiter(2);

    const humanizeBlock = async (text) => {
      if (text.trim().length < 5) return text;

      const authHeaderVal = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": authHeaderVal,
        "x-api-key": apiKey
      };

      const requestPayload = {
        text: text,
        content: text,
        tone: "academic",
        language: "en"
      };

      let response;
      try {
        response = await fetch("https://api.writehuman.ai/v1/humanize", {
          method: "POST",
          headers,
          body: JSON.stringify(requestPayload),
        });
      } catch (err) {
        // Fallback domain attempt
        response = await fetch("https://writehuman.ai/api/v1/humanize", {
          method: "POST",
          headers,
          body: JSON.stringify(requestPayload),
        });
      }

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: `Engine returned non-JSON response (${response.status}): ${responseText || response.statusText}` };
      }

      if (!response.ok) {
        console.error("WriteHuman API Error:", response.status, data);
        throw new Error(data.message || data.error || data.detail || `Humanizer failure: HTTP ${response.status}`);
      }

      // Extract result (WriteHuman V1 returns array in 'results', e.g. data.results[0])
      let result = (Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null) || 
                   data.result || 
                   data.text || 
                   data.humanized_text || 
                   data.output || 
                   data.outputText || 
                   (Array.isArray(data.data?.results) ? data.data.results[0] : null) || 
                   data.data?.result || 
                   data.data?.text || 
                   data.data?.output;

      if (!result) {
        console.error("WriteHuman response missing result key:", data);
        throw new Error("Humanization engine returned empty result.");
      }

      // Clean up any double quotes the AI might wrap the response in
      if (typeof result === 'string' && result.startsWith('"') && result.endsWith('"')) {
          result = result.substring(1, result.length - 1);
      }
      return String(result).replace(/\$/g, '₦');
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

    // --- 3. REASSEMBLE ---
    let finalOutput = "";
    processedBlocks.forEach((block, i) => {
        const isHeader = blocks[i].type === 'header';
        if (isHeader && i > 0) finalOutput += "\n\n";
        finalOutput += block;
        if (isHeader) finalOutput += "\n\n";
        else finalOutput += "\n";
    });

    finalOutput = finalOutput.replace(/\n{3,}/g, '\n\n').trim();

    // --- DEDUCT CREDITS ---
    const newBalance = Math.max(0, currentBalance - wordCount);
    const { error: updateError } = await supabaseAdmin
      .from('tool_word_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('tool_id', 'ai-humanizer');

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      result: finalOutput,
      newBalance
    });

  } catch (error) {
    console.error('Humanizer Tool API Error:', error);
    return NextResponse.json({ 
      error: error.message || "System under maintenance. Our engineers are working on it, please try again later." 
    }, { status: 500 });
  }
}
