import { NextResponse } from 'next/server';

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
    const apiKey = process.env.STEALTHGPT_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Humanization engine configuration missing on server' }, { status: 500 });
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Word count check
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 2200) {
      return NextResponse.json({ error: 'Maximum 2000 words per request allowed.' }, { status: 400 });
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

    // --- 2. CONCURRENCY LIMITER & HUMANIZATION WITH STEALTHGPT ---
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

      const response = await fetch("https://stealthgpt.ai/api/stealthify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "api-token": apiKey
        },
        body: JSON.stringify({
          prompt: text,
          rephrase: true,
          tone: "College",
          mode: "Medium",
          qualityMode: "quality"
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
        console.error("StealthGPT Error:", data);
        throw new Error(data.message || data.error || `Humanizer failure: ${response.statusText || 'Engine returned status ' + response.status}`);
      }

      let result = data.result;
      if (!result) {
        console.error("StealthGPT response missing result:", data);
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

    return NextResponse.json({ 
      success: true, 
      result: finalOutput 
    });

  } catch (error) {
    console.error('Humanizer Tool API Error:', error);
    return NextResponse.json({ 
      error: error.message || "System under maintenance. Our engineers are working on it, please try again later." 
    }, { status: 500 });
  }
}
