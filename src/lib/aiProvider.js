// /src/lib/aiProvider.js
// Unified AI Provider - Switch between Gemini and Claude seamlessly

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Main function to call AI models
 * @param {string} prompt - The prompt to send
 * @param {object} options - Configuration options
 * @returns {Promise<object>} - Response with content, tokens, and model info
 */
export async function callAI(prompt, options = {}) {
  const {
    provider = process.env.AI_PROVIDER || 'gemini', // 'gemini' or 'claude'
    maxTokens = 4000,
    temperature = 0.7,
    stopSequences = null,
  } = options;

  if (provider === 'gemini') {
    return await callGemini(prompt, maxTokens, temperature);
  } else if (provider === 'claude') {
    return await callClaude(prompt, maxTokens, temperature, stopSequences);
  } else {
    throw new Error(`Invalid AI provider: ${provider}. Use 'gemini' or 'claude'`);
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, maxTokens, temperature) {
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Calculate tokens (Gemini doesn't always return token counts reliably)
    const tokensInput = estimateTokens(prompt);
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
export function calculateCost(inputTokens, outputTokens, provider = 'gemini') {
  const USD_TO_NGN = 1650; // Update this as needed

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