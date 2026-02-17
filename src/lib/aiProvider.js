// /src/lib/aiProvider.js
// Unified AI Provider - Switch between Gemini, Claude, and DeepSeek seamlessly

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Main function to call AI models
 * @param {string|array} prompt - The prompt string or array of parts (for multimodal)
 * @param {object} options - Configuration options
 * @returns {Promise<object>} - Response with content, tokens, and model info
 */
export async function callAI(prompt, options = {}) {
  const {
    provider = process.env.AI_PROVIDER || 'deepseek', // Defaults to 'deepseek' as requested
    maxTokens = 4000,
    temperature = 0.7,
    stopSequences = null,
    fileParts = null, // Support for Gemini multimodal
  } = options;

  if (provider === 'gemini') {
    return await callGemini(prompt, maxTokens, temperature, fileParts);
  } else if (provider === 'claude') {
    return await callClaude(prompt, maxTokens, temperature, stopSequences);
  } else if (provider === 'deepseek') {
    return await callDeepSeek(prompt, maxTokens, temperature);
  } else {
    throw new Error(`Invalid AI provider: ${provider}. Use 'gemini', 'claude', or 'deepseek'`);
  }
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(prompt, maxTokens, temperature) {
  try {
    // If prompt is array, join it (DeepSeek is text-only for now)
    const textPrompt = Array.isArray(prompt) 
      ? prompt.filter(p => typeof p === 'string').join('\n')
      : prompt;

    // Check if API key exists
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [{ role: "user", content: textPrompt }],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return {
      content: text,
      tokensUsed: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens
      },
      model: data.model,
      provider: 'deepseek'
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw new Error(`DeepSeek generation failed: ${error.message}`);
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, maxTokens, temperature, fileParts = null) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get model from environment variable (defaults to flash)
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    });

    // Prepare content parts
    let contentParts = [];
    if (Array.isArray(prompt)) {
      contentParts = prompt;
    } else {
      contentParts.push(prompt);
    }

    // Add file parts if provided
    if (fileParts && Array.isArray(fileParts)) {
      contentParts = [...contentParts, ...fileParts];
    }

    const result = await model.generateContent(contentParts);
    const response = result.response;
    const text = response.text();

    // Calculate tokens
    const tokensInput = estimateTokens(JSON.stringify(contentParts));
    const tokensOutput = estimateTokens(text);

    return {
      content: text,
      tokensUsed: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      model: modelName,
      provider: 'gemini'
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini generation failed: ${error.message}`);
  }
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt, maxTokens, temperature, stopSequences) {
  try {
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [{ role: "user", content: prompt }],
        ...(stopSequences && { stop_sequences: stopSequences })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract text from response
    const text = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: text,
      tokensUsed: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
        total: data.usage.input_tokens + data.usage.output_tokens
      },
      model: data.model,
      provider: 'claude'
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude generation failed: ${error.message}`);
  }
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Get cost estimate in Naira
 * @param {number} inputTokens 
 * @param {number} outputTokens 
 * @param {string} provider 
 * @returns {number} Cost in Naira
 */
export function calculateCost(inputTokens, outputTokens, provider = 'deepseek') {
  const USD_TO_NGN = 1650; // Update this as needed

  if (provider === 'deepseek') {
    // DeepSeek pricing (approximate)
    // Chat (V3): $0.14 / 1M input, $0.28 / 1M output (cache miss prices)
    const inputCost = (inputTokens / 1_000_000) * 0.14;
    const outputCost = (outputTokens / 1_000_000) * 0.28;
    return (inputCost + outputCost) * USD_TO_NGN;
  }

  if (provider === 'gemini') {
    // Gemini pricing (as of Dec 2024)
    // Flash: Free tier (60 RPM)
    // Pro: $0.125 per 1M input tokens, $0.50 per 1M output tokens
    const inputCost = (inputTokens / 1_000_000) * 0.125;
    const outputCost = (outputTokens / 1_000_000) * 0.50;
    return (inputCost + outputCost) * USD_TO_NGN;
  } 
  
  if (provider === 'claude') {
    // Claude Sonnet 4 pricing
    // $3 per 1M input tokens, $15 per 1M output tokens
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    return (inputCost + outputCost) * USD_TO_NGN;
  }

  return 0;
}

/**
 * Check if we have enough tokens left in project limit
 * @param {number} tokensUsed 
 * @param {number} tokensLimit 
 * @param {number} estimatedNewTokens 
 * @returns {object} { allowed: boolean, remaining: number, percentage: number }
 */
export function checkTokenLimit(tokensUsed, tokensLimit, estimatedNewTokens = 0) {
  const remaining = tokensLimit - tokensUsed;
  const percentage = (tokensUsed / tokensLimit) * 100;
  const allowed = (tokensUsed + estimatedNewTokens) <= tokensLimit;

  return {
    allowed,
    remaining,
    percentage: Math.round(percentage),
    willExceed: !allowed,
    tokensNeeded: estimatedNewTokens,
    tokensAfter: tokensUsed + estimatedNewTokens
  };
}

/**
 * Get user-friendly warning level based on token usage
 * @param {number} percentage - Usage percentage (0-100)
 * @returns {object} { level: string, color: string, message: string }
 */
export function getTokenWarningLevel(percentage) {
  if (percentage >= 100) {
    return {
      level: 'critical',
      color: 'red',
      message: 'Token limit reached! You can still edit manually or top up token.'
    };
  } else if (percentage >= 90) {
    return {
      level: 'danger',
      color: 'red',
      message: 'Only 10% tokens remaining. Use them wisely!'
    };
  } else if (percentage >= 80) {
    return {
      level: 'warning',
      color: 'yellow',
      message: '80% tokens used. Consider saving some for final adjustments.'
    };
  } else if (percentage >= 70) {
    return {
      level: 'caution',
      color: 'yellow',
      message: '70% tokens used. You\'re doing great!'
    };
  } else {
    return {
      level: 'safe',
      color: 'green',
      message: 'Plenty of tokens available.'
    };
  }
}